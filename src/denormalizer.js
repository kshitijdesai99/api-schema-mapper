/**
 * Form-to-API mapping functions.
 *
 * Handles explicit reverse mappings, nested objects and arrays, nullish-value
 * policies, and the `toApi` side of directional transforms.
 */
'use strict';

const { MapperTransformError } = require('./errors');
const { deepClone, getNestedValue, invertMapping, isPlainObject, setNestedValue } = require('./utils');

function applyToApi(transform, value, source, details) {
  const fn = typeof transform === 'function'
    ? transform
    : transform && transform.toApi;
  if (!fn) return value;

  try {
    return fn(value, source);
  } catch (cause) {
    throw new MapperTransformError(
      `toApi transform failed for field "${details.formPath}"`,
      { ...details, value, cause }
    );
  }
}

function denormalizeDirect(formData, formToApi, options = {}) {
  const {
    omitUndefined = true,
    omitNull = false,
    transform = {},
    transforms = transform,
    operation = 'denormalize'
  } = options;
  const payload = {};

  // Recursion creates a fresh target for every array item to avoid cross-item writes.
  function process(source, schema, target) {
    for (const formKey of Object.keys(schema)) {
      const mappingValue = schema[formKey];
      const sourceValue = getNestedValue(source, formKey);
      if (typeof mappingValue === 'string') {
        let value = sourceValue;
        if (value === undefined && omitUndefined) continue;
        if (value === null && omitNull) continue;
        value = applyToApi(transforms[formKey], value, source, {
          formPath: formKey,
          apiPath: mappingValue,
          operation
        });
        setNestedValue(target, mappingValue, deepClone(value));
      } else if (Array.isArray(mappingValue)) {
        if (sourceValue === undefined && omitUndefined) continue;
        if (sourceValue === null) {
          if (!omitNull) setNestedValue(target, formKey, null);
          continue;
        }
        if (!Array.isArray(sourceValue)) {
          setNestedValue(target, formKey, deepClone(sourceValue));
          continue;
        }
        const itemMapping = mappingValue[0];
        const values = sourceValue.map(item => {
          if (isPlainObject(itemMapping) && isPlainObject(item)) {
            const apiItem = {};
            process(item, itemMapping, apiItem);
            return apiItem;
          }
          if (Array.isArray(itemMapping) && Array.isArray(item)) {
            const wrapper = {};
            process({ value: item }, { value: itemMapping }, wrapper);
            return wrapper.value;
          }
          return deepClone(item);
        });
        setNestedValue(target, formKey, values);
      } else if (isPlainObject(mappingValue)) {
        const nestedTarget = {};
        process(sourceValue || source, mappingValue, nestedTarget);
        if (Object.keys(nestedTarget).length) setNestedValue(target, formKey, nestedTarget);
      }
    }
  }
  process(formData, formToApi, payload);
  return payload;
}

function denormalize(formData, mapping, options = {}) {
  const direct = options.mappingIsFormToApi ? mapping : invertMapping(mapping);
  return denormalizeDirect(formData, direct, options);
}

function denormalizeFlat(formData, formToApiMapping, options = {}) {
  return denormalizeDirect(formData, formToApiMapping, options);
}

function denormalizeForPost(formData, mapping, options = {}) {
  return denormalize(formData, mapping, {
    omitUndefined: false,
    omitNull: false,
    ...options,
    operation: 'post'
  });
}

function denormalizeForPatch(formData, mapping, options = {}) {
  return denormalize(formData, mapping, {
    omitUndefined: true,
    omitNull: false,
    ...options,
    operation: 'patch'
  });
}

module.exports = { denormalize, denormalizeDirect, denormalizeFlat, denormalizeForPost, denormalizeForPatch };

'use strict';

const { MapperTransformError } = require('./errors');
const { deepClone, getNestedValue, isPlainObject, setNestedValue } = require('./utils');

function coerceType(value, type, field = '') {
  if (typeof type === 'function') {
    try { return type(value); } catch (cause) {
      throw new MapperTransformError(`Could not coerce field "${field}"`, { operation: 'normalize', formPath: field, value, cause });
    }
  }
  if (type === 'number') {
    if ((typeof value !== 'string' && typeof value !== 'number') || value === '' || !Number.isFinite(Number(value))) {
      throw new MapperTransformError(`Could not convert field "${field}" value "${String(value)}" to number`, { operation: 'normalize', formPath: field, value });
    }
    return Number(value);
  }
  if (type === 'boolean') {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    throw new MapperTransformError(`Could not convert field "${field}" value "${String(value)}" to boolean`, { operation: 'normalize', formPath: field, value });
  }
  if (type === 'date') {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) throw new MapperTransformError(`Could not convert field "${field}" value "${String(value)}" to date`, { operation: 'normalize', formPath: field, value });
    return date;
  }
  if (type === 'string') return String(value);
  throw new MapperTransformError(`Unknown coercion "${String(type)}" for field "${field}"`, { operation: 'normalize', formPath: field, value });
}

function applyFromApi(transform, value, source, details) {
  const fn = typeof transform === 'function' ? transform : transform && transform.fromApi;
  if (!fn) return value;
  try { return fn(value, source); } catch (cause) {
    throw new MapperTransformError(`fromApi transform failed for field "${details.formPath}"`, { ...details, operation: 'normalize', value, cause });
  }
}

function normalize(apiData, mapping, options = {}) {
  const { defaultValues = {}, transform = {}, transforms = transform, coerce = {}, typeCoercion = false } = options;
  const formData = deepClone(defaultValues);

  function process(source, schema, target) {
    for (const apiKey of Object.keys(schema)) {
      const mappingValue = schema[apiKey];
      const sourceValue = getNestedValue(source, apiKey);
      if (typeof mappingValue === 'string') {
        const formPath = mappingValue;
        let value = applyFromApi(transforms[formPath], sourceValue, source, { formPath, apiPath: apiKey });
        const coercion = coerce[formPath];
        if (coercion && value !== null && value !== undefined) value = coerceType(value, coercion, formPath);
        // typeCoercion is retained as an option but deliberately performs no unsafe guessing.
        if (value !== undefined) setNestedValue(target, formPath, deepClone(value));
      } else if (Array.isArray(mappingValue)) {
        if (sourceValue === undefined) continue;
        if (!Array.isArray(sourceValue)) {
          setNestedValue(target, apiKey, deepClone(sourceValue));
          continue;
        }
        const itemMapping = mappingValue[0];
        const values = sourceValue.map(item => {
          if (isPlainObject(itemMapping) && isPlainObject(item)) {
            const normalizedItem = {};
            process(item, itemMapping, normalizedItem);
            return normalizedItem;
          }
          if (Array.isArray(itemMapping) && Array.isArray(item)) {
            const wrapper = {};
            process({ value: item }, { value: itemMapping }, wrapper);
            return wrapper.value;
          }
          return deepClone(item);
        });
        setNestedValue(target, apiKey, values);
      } else if (isPlainObject(mappingValue) && isPlainObject(sourceValue)) {
        process(sourceValue, mappingValue, target);
      }
    }
  }
  process(apiData, mapping, formData);
  return formData;
}

function normalizeFlat(apiData, flatMapping, options = {}) {
  const output = {};
  for (const apiPath of Object.keys(flatMapping)) {
    const value = getNestedValue(apiData, apiPath);
    if (value !== undefined) setNestedValue(output, flatMapping[apiPath], deepClone(value));
  }
  return output;
}

module.exports = { normalize, normalizeFlat, coerceType };

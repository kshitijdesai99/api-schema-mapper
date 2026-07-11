/**
 * Standalone payload-builder functions.
 *
 * Mapper uses its own coordinated methods, while these exports support callers
 * who prefer stateless helpers with a mapping supplied per call.
 */
'use strict';

const { diff, hasChanges } = require('./differ');
const { denormalize } = require('./denormalizer');
const {
  deepMerge,
  getNestedValue,
  omitNestedPaths,
  setNestedValue
} = require('./utils');
const { runValidation } = require('./validation');

function buildPatchPayload(initialForm, currentForm, mapping, options = {}) {
  if (!hasChanges(initialForm, currentForm, options)) return null;
  const data = options.includeUnchanged
    ? omitNestedPaths(currentForm, options.ignoreFields || [])
    : diff(initialForm, currentForm, options);
  runValidation(options.validation, data, { operation: 'patch', phase: 'form' });
  const payload = denormalize(data, mapping, { ...options, operation: 'patch' });
  if (!Object.keys(payload).length) return null;
  runValidation(options.validation, payload, { operation: 'patch', phase: 'payload' });
  return payload;
}

function buildPostPayload(formData, mapping, options = {}) {
  const operation = options.operation || 'post';
  const complete = deepMerge(options.defaults || {}, formData);
  runValidation(options.validation, complete, { operation, phase: 'form' });
  const payload = denormalize(complete, mapping, { ...options, operation });
  runValidation(options.validation, payload, { operation, phase: 'payload' });
  return payload;
}

function buildPutPayload(formData, mapping, options = {}) {
  return buildPostPayload(formData, mapping, { ...options, operation: 'put' });
}

function buildPartialPayload(formData, fields, mapping, options = {}) {
  const operation = options.operation || 'partial';
  const partial = {};
  for (const field of fields) {
    const value = getNestedValue(formData, field);
    const fieldExists = Object.prototype.hasOwnProperty.call(formData, field);
    if (value !== undefined || fieldExists) {
      setNestedValue(partial, field, value);
    }
  }
  runValidation(options.validation, partial, { operation, phase: 'form' });
  const payload = denormalize(partial, mapping, { ...options, operation });
  runValidation(options.validation, payload, { operation, phase: 'payload' });
  return payload;
}

function createPayloadBuilder(mapping, defaultOptions = {}) {
  return {
    buildPatch: (initial, current, options = {}) => buildPatchPayload(
      initial,
      current,
      mapping,
      { ...defaultOptions, ...options }
    ),
    buildPost: (data, options = {}) => buildPostPayload(
      data,
      mapping,
      { ...defaultOptions, ...options }
    ),
    buildPut: (data, options = {}) => buildPutPayload(
      data,
      mapping,
      { ...defaultOptions, ...options }
    ),
    buildPartial: (data, fields, options = {}) => buildPartialPayload(
      data,
      fields,
      mapping,
      { ...defaultOptions, ...options }
    )
  };
}

module.exports = { buildPatchPayload, buildPostPayload, buildPutPayload, buildPartialPayload, createPayloadBuilder };

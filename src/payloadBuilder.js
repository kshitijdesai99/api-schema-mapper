/**
 * Standalone payload-builder functions.
 *
 * Mapper uses its own coordinated methods, while these exports support callers
 * who prefer stateless helpers with a mapping supplied per call.
 */
'use strict';

const { diff, hasChanges } = require('./differ');
const { denormalize } = require('./denormalizer');
const { deepClone, getNestedValue, setNestedValue } = require('./utils');

function validate(data, operation, validation) {
  if (!validation) return;
  const result = validation(data, { operation });
  if (result && (result.valid === false || result.success === false)) {
    const errors = result.errors || (result.error && result.error.issues) || [];
    const message = errors.map(error => error.message || error).join(', ');
    throw new Error(`Validation failed: ${message}`);
  }
}

function buildPatchPayload(initialForm, currentForm, mapping, options = {}) {
  if (!hasChanges(initialForm, currentForm)) return null;
  const data = options.includeUnchanged
    ? deepClone(currentForm)
    : diff(initialForm, currentForm, options);
  validate(data, 'patch', options.validation);
  const payload = denormalize(data, mapping, { ...options, operation: 'patch' });
  return Object.keys(payload).length ? payload : null;
}

function buildPostPayload(formData, mapping, options = {}) {
  const complete = { ...(options.defaults || {}), ...formData };
  validate(complete, options.operation || 'post', options.validation);
  return denormalize(complete, mapping, { ...options, operation: options.operation || 'post' });
}

function buildPutPayload(formData, mapping, options = {}) {
  return buildPostPayload(formData, mapping, { ...options, operation: 'put' });
}

function buildPartialPayload(formData, fields, mapping, options = {}) {
  const partial = {};
  for (const field of fields) {
    const value = getNestedValue(formData, field);
    const fieldExists = Object.prototype.hasOwnProperty.call(formData, field);
    if (value !== undefined || fieldExists) {
      setNestedValue(partial, field, value);
    }
  }
  return denormalize(partial, mapping, { ...options, operation: options.operation || 'partial' });
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

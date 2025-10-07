/**
 * Payload Builder - Generate API payloads for POST/PATCH
 */

const { diff, hasChanges } = require('./differ');
const { denormalize, denormalizeForPost, denormalizeForPatch } = require('./denormalizer');
const { deepClone } = require('./utils');

/**
 * Build PATCH payload with only changed fields
 * @param {Object} initialForm - Original form state (after normalization)
 * @param {Object} currentForm - Current form state
 * @param {Object} mapping - API to form mapping
 * @param {Object} options - Builder options
 * @returns {Object|null} PATCH payload or null if no changes
 */
function buildPatchPayload(initialForm, currentForm, mapping, options = {}) {
  const {
    includeUnchanged = false,
    transform = {},
    validation = null
  } = options;

  // Check if there are any changes
  if (!hasChanges(initialForm, currentForm)) {
    return null;
  }

  // Get only changed fields
  const changes = diff(initialForm, currentForm);

  // Validate if validator provided
  if (validation) {
    const validationResult = validation(changes);
    if (!validationResult.valid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }
  }

  // Denormalize only the changes to API format
  const payload = denormalizeForPatch(changes, mapping, {
    transform,
    omitUndefined: true
  });

  return Object.keys(payload).length > 0 ? payload : null;
}

/**
 * Build POST payload with all fields
 * @param {Object} formData - Complete form data
 * @param {Object} mapping - API to form mapping
 * @param {Object} options - Builder options
 * @returns {Object} POST payload
 */
function buildPostPayload(formData, mapping, options = {}) {
  const {
    transform = {},
    validation = null,
    defaults = {}
  } = options;

  // Merge with defaults
  const completeData = { ...defaults, ...formData };

  // Validate if validator provided
  if (validation) {
    const validationResult = validation(completeData);
    if (!validationResult.valid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }
  }

  // Denormalize to API format
  const payload = denormalizeForPost(completeData, mapping, {
    transform,
    omitUndefined: false,
    omitNull: false
  });

  return payload;
}

/**
 * Build PUT payload (complete replacement)
 * Similar to POST but may have different validation rules
 */
function buildPutPayload(formData, mapping, options = {}) {
  return buildPostPayload(formData, mapping, options);
}

/**
 * Build partial update payload (only specified fields)
 * @param {Object} formData - Form data
 * @param {Array<string>} fields - Fields to include
 * @param {Object} mapping - API to form mapping
 * @returns {Object} Partial payload
 */
function buildPartialPayload(formData, fields, mapping, options = {}) {
  const partialData = {};
  
  // Extract only specified fields
  for (const field of fields) {
    if (field in formData) {
      partialData[field] = formData[field];
    }
  }

  return denormalize(partialData, mapping, options);
}

/**
 * Create a payload builder factory with pre-configured mapping
 */
function createPayloadBuilder(mapping, defaultOptions = {}) {
  return {
    buildPatch: (initial, current, options = {}) => 
      buildPatchPayload(initial, current, mapping, { ...defaultOptions, ...options }),
    
    buildPost: (formData, options = {}) => 
      buildPostPayload(formData, mapping, { ...defaultOptions, ...options }),
    
    buildPut: (formData, options = {}) => 
      buildPutPayload(formData, mapping, { ...defaultOptions, ...options }),
    
    buildPartial: (formData, fields, options = {}) => 
      buildPartialPayload(formData, fields, mapping, { ...defaultOptions, ...options })
  };
}

module.exports = {
  buildPatchPayload,
  buildPostPayload,
  buildPutPayload,
  buildPartialPayload,
  createPayloadBuilder
};

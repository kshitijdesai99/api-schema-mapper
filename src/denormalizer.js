/**
 * Denormalizer - Transform form schema to API payload
 */

const { isPlainObject, getNestedValue, setNestedValue, invertMapping } = require('./utils');

/**
 * Denormalize form data to API payload using mapping
 * @param {Object} formData - Form state data
 * @param {Object} mapping - API to form field mapping (will be inverted)
 * @param {Object} options - Transformation options
 * @returns {Object} API payload
 */
function denormalize(formData, mapping, options = {}) {
  const {
    omitUndefined = true,
    omitNull = false,
    transform = {}
  } = options;

  // Invert the mapping: form -> api
  const formToApi = invertMapping(mapping);
  const apiPayload = {};

  function processFormData(source, invertedMapping) {
    for (const formKey in invertedMapping) {
      if (!invertedMapping.hasOwnProperty(formKey)) continue;

      const apiPath = invertedMapping[formKey];
      let value = getNestedValue(source, formKey);

      // Skip undefined/null based on options
      if (omitUndefined && value === undefined) continue;
      if (omitNull && value === null) continue;

      // Apply custom transform if provided
      const transformKey = formKey;
      if (transform[transformKey]) {
        value = transform[transformKey](value, source);
      }

      // Handle nested paths in API (e.g., 'contact.email_address')
      if (apiPath.includes('.')) {
        setNestedValue(apiPayload, apiPath, value);
      } else {
        apiPayload[apiPath] = value;
      }
    }
  }

  processFormData(formData, formToApi);

  return apiPayload;
}

/**
 * Denormalize with explicit form-to-api mapping
 * @param {Object} formData - Form data
 * @param {Object} formToApiMapping - Direct form->api mapping
 * @returns {Object} API payload
 */
function denormalizeFlat(formData, formToApiMapping, options = {}) {
  const {
    omitUndefined = true,
    omitNull = false
  } = options;

  const apiPayload = {};

  for (const formPath in formToApiMapping) {
    if (!formToApiMapping.hasOwnProperty(formPath)) continue;

    const apiPath = formToApiMapping[formPath];
    const value = getNestedValue(formData, formPath);

    if (omitUndefined && value === undefined) continue;
    if (omitNull && value === null) continue;

    if (apiPath.includes('.')) {
      setNestedValue(apiPayload, apiPath, value);
    } else {
      apiPayload[apiPath] = value;
    }
  }

  return apiPayload;
}

/**
 * Transform form data for POST request
 * Includes all fields with defaults
 */
function denormalizeForPost(formData, mapping, options = {}) {
  return denormalize(formData, mapping, {
    ...options,
    omitUndefined: false,
    omitNull: false
  });
}

/**
 * Transform form data for PATCH request
 * Only includes changed fields (non-undefined)
 */
function denormalizeForPatch(formData, mapping, options = {}) {
  return denormalize(formData, mapping, {
    ...options,
    omitUndefined: true,
    omitNull: false
  });
}

module.exports = {
  denormalize,
  denormalizeFlat,
  denormalizeForPost,
  denormalizeForPatch
};

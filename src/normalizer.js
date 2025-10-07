/**
 * Normalizer - Transform API data to form schema
 */

const { isPlainObject, getNestedValue, setNestedValue } = require('./utils');

/**
 * Normalize API data to form schema using mapping
 * @param {Object} apiData - Raw API response data
 * @param {Object} mapping - API to form field mapping
 * @param {Object} options - Transformation options
 * @returns {Object} Normalized form data
 */
function normalize(apiData, mapping, options = {}) {
  const {
    typeCoercion = true,
    defaultValues = {},
    transform = {}
  } = options;

  const formData = { ...defaultValues };

  function processMapping(source, mappingSchema, targetPath = '') {
    for (const apiKey in mappingSchema) {
      if (!mappingSchema.hasOwnProperty(apiKey)) continue;

      const mappingValue = mappingSchema[apiKey];
      const sourceValue = source?.[apiKey];

      if (typeof mappingValue === 'string') {
        // Simple mapping: api_field -> formField
        const formKey = mappingValue;
        let value = sourceValue;

        // Apply custom transform if provided
        if (transform[formKey]) {
          value = transform[formKey](value, source);
        }

        // Type coercion
        if (typeCoercion && value !== null && value !== undefined) {
          value = coerceType(value);
        }

        // Only set if value is not undefined, to preserve defaults
        if (value !== undefined) {
          setNestedValue(formData, formKey, value);
        }

      } else if (isPlainObject(mappingValue)) {
        // Nested mapping: { contact: { email_address: 'email' } }
        if (isPlainObject(sourceValue)) {
          processMapping(sourceValue, mappingValue, apiKey);
        }
      } else if (Array.isArray(mappingValue) && Array.isArray(sourceValue)) {
        // Array mapping
        const [itemMapping] = mappingValue;
        const formKey = apiKey;
        
        formData[formKey] = sourceValue.map(item => {
          if (isPlainObject(itemMapping)) {
            const normalized = {};
            processMapping(item, itemMapping);
            return normalized;
          }
          return item;
        });
      }
    }
  }

  processMapping(apiData, mapping);

  return formData;
}

/**
 * Coerce values to appropriate types
 */
function coerceType(value) {
  // String to number
  if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return num;
    }
  }

  // String to boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // ISO date string to Date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return value;
}

/**
 * Normalize with flattened mapping (for simpler use cases)
 * @param {Object} apiData - API response
 * @param {Object} flatMapping - Flat key-value mapping
 * @returns {Object} Form data
 */
function normalizeFlat(apiData, flatMapping) {
  const formData = {};

  for (const apiPath in flatMapping) {
    if (!flatMapping.hasOwnProperty(apiPath)) continue;

    const formPath = flatMapping[apiPath];
    const value = getNestedValue(apiData, apiPath);

    if (value !== undefined) {
      setNestedValue(formData, formPath, value);
    }
  }

  return formData;
}

module.exports = {
  normalize,
  normalizeFlat,
  coerceType
};

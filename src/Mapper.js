/**
 * Mapper - Main class for API schema mapping and transformation
 */

const { normalize } = require('./normalizer');
const { denormalize, denormalizeForPost, denormalizeForPatch } = require('./denormalizer');
const { diff, hasChanges, getChangedPaths, isEqual } = require('./differ');
const { 
  buildPatchPayload, 
  buildPostPayload, 
  buildPutPayload,
  buildPartialPayload 
} = require('./payloadBuilder');
const { deepClone, invertMapping } = require('./utils');

/**
 * Mapper class - Unified API for schema mapping and payload generation
 */
class Mapper {
  /**
   * Create a new Mapper instance
   * @param {Object} config - Configuration object
   * @param {Object} config.apiToForm - API to form field mapping
   * @param {Object} config.formToApi - (Optional) Explicit form to API mapping
   * @param {Object} config.transforms - Field transformation functions
   * @param {Object} config.defaults - Default values for form fields
   * @param {Function} config.validator - Validation function
   */
  constructor(config = {}) {
    const {
      apiToForm = {},
      formToApi = null,
      transforms = {},
      defaults = {},
      validator = null,
      options = {}
    } = config;

    if (!apiToForm || Object.keys(apiToForm).length === 0) {
      throw new Error('Mapper requires apiToForm mapping configuration');
    }

    this.apiToFormMapping = apiToForm;
    this.formToApiMapping = formToApi || invertMapping(apiToForm);
    this.transforms = transforms;
    this.defaults = defaults;
    this.validator = validator;
    this.options = {
      typeCoercion: true,
      omitUndefined: true,
      omitNull: false,
      compareArrays: true,
      ...options
    };
  }

  /**
   * Normalize API data to form schema
   * @param {Object} apiData - Raw API response
   * @returns {Object} Normalized form data
   */
  normalize(apiData) {
    return normalize(apiData, this.apiToFormMapping, {
      typeCoercion: this.options.typeCoercion,
      defaultValues: this.defaults,
      transform: this.transforms
    });
  }

  /**
   * Denormalize form data to API payload
   * @param {Object} formData - Form state
   * @returns {Object} API payload
   */
  denormalize(formData) {
    return denormalize(formData, this.apiToFormMapping, {
      omitUndefined: this.options.omitUndefined,
      omitNull: this.options.omitNull,
      transform: this.transforms
    });
  }

  /**
   * Compute diff between two form states
   * @param {Object} original - Original state
   * @param {Object} current - Current state
   * @returns {Object} Changed fields only
   */
  diff(original, current) {
    return diff(original, current, {
      compareArrays: this.options.compareArrays
    });
  }

  /**
   * Check if form has changes
   * @param {Object} original - Original state
   * @param {Object} current - Current state
   * @returns {boolean}
   */
  hasChanges(original, current) {
    return hasChanges(original, current);
  }

  /**
   * Get list of changed field paths
   * @param {Object} original - Original state
   * @param {Object} current - Current state
   * @returns {Array<string>}
   */
  getChangedPaths(original, current) {
    return getChangedPaths(original, current);
  }

  /**
   * Build PATCH payload with minimal changes
   * @param {Object} initialForm - Original form state
   * @param {Object} currentForm - Current form state
   * @param {Object} options - Additional options
   * @returns {Object|null} PATCH payload or null if no changes
   */
  buildPatch(initialForm, currentForm, options = {}) {
    return buildPatchPayload(initialForm, currentForm, this.apiToFormMapping, {
      transform: this.transforms,
      validation: this.validator,
      ...options
    });
  }

  /**
   * Build POST payload with all fields
   * @param {Object} formData - Form data
   * @param {Object} options - Additional options
   * @returns {Object} POST payload
   */
  buildPost(formData, options = {}) {
    return buildPostPayload(formData, this.apiToFormMapping, {
      transform: this.transforms,
      validation: this.validator,
      defaults: this.defaults,
      ...options
    });
  }

  /**
   * Build PUT payload (complete replacement)
   * @param {Object} formData - Form data
   * @param {Object} options - Additional options
   * @returns {Object} PUT payload
   */
  buildPut(formData, options = {}) {
    return buildPutPayload(formData, this.apiToFormMapping, {
      transform: this.transforms,
      validation: this.validator,
      defaults: this.defaults,
      ...options
    });
  }

  /**
   * Build partial payload with specific fields
   * @param {Object} formData - Form data
   * @param {Array<string>} fields - Fields to include
   * @param {Object} options - Additional options
   * @returns {Object} Partial payload
   */
  buildPartial(formData, fields, options = {}) {
    return buildPartialPayload(formData, fields, this.apiToFormMapping, {
      transform: this.transforms,
      ...options
    });
  }

  /**
   * Complete workflow: GET -> normalize -> edit -> PATCH
   * @param {Object} apiData - Original API response
   * @param {Object} editedForm - User-edited form data
   * @returns {Object|null} PATCH payload or null
   */
  createPatchFromApi(apiData, editedForm) {
    const initialForm = this.normalize(apiData);
    return this.buildPatch(initialForm, editedForm);
  }

  /**
   * Clone the mapper with modified configuration
   * @param {Object} config - Configuration overrides
   * @returns {Mapper} New mapper instance
   */
  clone(config = {}) {
    return new Mapper({
      apiToForm: this.apiToFormMapping,
      formToApi: this.formToApiMapping,
      transforms: this.transforms,
      defaults: this.defaults,
      validator: this.validator,
      options: this.options,
      ...config
    });
  }

  /**
   * Export mapping configuration
   * @returns {Object} Mapper configuration
   */
  getConfig() {
    return {
      apiToForm: deepClone(this.apiToFormMapping),
      formToApi: deepClone(this.formToApiMapping),
      transforms: { ...this.transforms },
      defaults: deepClone(this.defaults),
      options: { ...this.options }
    };
  }
}

module.exports = Mapper;

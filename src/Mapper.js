'use strict';

const { normalize, coerceType } = require('./normalizer');
const { denormalizeDirect } = require('./denormalizer');
const { diff, hasChanges, getChangedPaths } = require('./differ');
const { deepClone, getNestedValue, invertMapping, isPlainObject, pathSegments, setNestedValue, validateMapping } = require('./utils');
const { MapperConfigurationError, MapperTransformError, MapperValidationError } = require('./errors');

const DEFAULT_OPTIONS = Object.freeze({
  typeCoercion: false,
  omitUndefined: true,
  omitNull: false,
  deletedValue: null,
  deep: true,
  includeUnchanged: false,
  ignoreFields: []
});

function normalizeValidationErrors(result) {
  if (result === null || result === undefined || result === true || result.valid === true || result.success === true) return null;
  if (result === false) return [{ path: '', code: 'invalid', message: 'Validation failed' }];
  const raw = result.errors || (result.error && (result.error.issues || result.error.errors)) || [];
  return raw.map(error => typeof error === 'string'
    ? { path: '', code: 'invalid', message: error }
    : { path: Array.isArray(error.path) ? error.path.join('.') : (error.path || ''), code: error.code || 'invalid', message: error.message || String(error) });
}

function assertFields(fields) {
  if (!isPlainObject(fields) || Object.keys(fields).length === 0) throw new MapperConfigurationError('fields must be a non-empty plain object');
  const fromPaths = new Set();
  const toPaths = new Set();
  for (const [formPath, raw] of Object.entries(fields)) {
    pathSegments(formPath);
    const field = typeof raw === 'string' ? { from: raw, to: raw } : raw;
    if (!isPlainObject(field)) throw new MapperConfigurationError(`Invalid field configuration at "${formPath}"`);
    if (!field.from && !field.to) throw new MapperConfigurationError(`Field "${formPath}" must define from or to`);
    for (const [kind, paths] of [['from', fromPaths], ['to', toPaths]]) {
      if (!field[kind]) continue;
      pathSegments(field[kind]);
      if (paths.has(field[kind])) throw new MapperConfigurationError(`Duplicate ${kind} path "${field[kind]}"`);
      paths.add(field[kind]);
    }
    if (field.operations && (!Array.isArray(field.operations) || field.operations.some(value => !['get', 'normalize', 'post', 'put', 'patch', 'partial'].includes(value)))) {
      throw new MapperConfigurationError(`Invalid operations for field "${formPath}"`);
    }
  }
}

class Mapper {
  constructor(config = {}) {
    const { apiToForm, formToApi, fields, transforms = {}, defaults = {}, coerce = {}, validator = null, validate = null, options = {} } = config;
    if (options.typeCoercion === true) throw new MapperConfigurationError('Global typeCoercion was removed because it can corrupt identifiers; use the field-specific coerce option');
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.transforms = transforms;
    this.defaults = deepClone(defaults);
    this.coerce = coerce;
    this.validator = validator;
    this.validators = validate;
    this.fields = fields ? deepClone(fields) : null;

    if (fields) {
      assertFields(fields);
      this.apiToFormMapping = null;
      this.formToApiMapping = null;
    } else {
      if (!apiToForm || !Object.keys(apiToForm).length) throw new MapperConfigurationError('Mapper requires apiToForm or fields configuration');
      validateMapping(apiToForm, 'apiToForm');
      if (formToApi) validateMapping(formToApi, 'formToApi');
      this.apiToFormMapping = deepClone(apiToForm);
      this.formToApiMapping = deepClone(formToApi || invertMapping(apiToForm));
    }
  }

  _options(overrides = {}) { return { ...this.options, ...overrides }; }

  _fieldConfig(formPath, raw) {
    const field = typeof raw === 'string' ? { from: raw, to: raw } : raw;
    return {
      ...field,
      fromApi: field.fromApi || (this.transforms[formPath] && this.transforms[formPath].fromApi) || (typeof this.transforms[formPath] === 'function' ? this.transforms[formPath] : null),
      toApi: field.toApi || (this.transforms[formPath] && this.transforms[formPath].toApi) || (typeof this.transforms[formPath] === 'function' ? this.transforms[formPath] : null),
      coerce: field.coerce || this.coerce[formPath]
    };
  }

  _validate(data, operation, phase) {
    let validator = this.validator;
    if (this.validators) {
      if (phase === 'payload') validator = this.validators.payload;
      else if (operation === 'patch') validator = this.validators.patch;
      else validator = this.validators.form;
    }
    if (!validator) return;
    let result;
    try { result = validator(data, { operation, phase, mapper: this }); }
    catch (cause) { throw new MapperValidationError(`Validation failed during ${operation}`, { operation, phase, errors: [{ path: '', code: 'exception', message: cause.message }], cause }); }
    const errors = normalizeValidationErrors(result);
    if (errors) throw new MapperValidationError(`Validation failed during ${operation}`, { operation, phase, errors });
  }

  normalize(apiData, options = {}) {
    let output;
    if (!this.fields) {
      output = normalize(apiData, this.apiToFormMapping, { ...this._options(options), defaultValues: this.defaults, transforms: this.transforms, coerce: this.coerce });
    } else {
      output = deepClone(this.defaults);
      for (const [formPath, raw] of Object.entries(this.fields)) {
        const field = this._fieldConfig(formPath, raw);
        if (!field.from || (field.operations && !field.operations.some(op => op === 'get' || op === 'normalize'))) continue;
        let value = getNestedValue(apiData, field.from);
        if (field.fromApi) {
          try { value = field.fromApi(value, apiData); }
          catch (cause) { throw new MapperTransformError(`fromApi transform failed for field "${formPath}"`, { operation: 'normalize', formPath, apiPath: field.from, value, cause }); }
        }
        if (field.coerce && value !== null && value !== undefined) value = coerceType(value, field.coerce, formPath);
        if (value !== undefined) setNestedValue(output, formPath, deepClone(value));
        else if (Object.prototype.hasOwnProperty.call(field, 'default')) setNestedValue(output, formPath, deepClone(field.default));
      }
    }
    this._validate(output, 'normalize', 'form');
    return output;
  }

  _denormalizeFields(formData, operation, options = {}) {
    const settings = this._options(options);
    const payload = {};
    for (const [formPath, raw] of Object.entries(this.fields)) {
      const field = this._fieldConfig(formPath, raw);
      if (!field.to || field.readOnly || (field.operations && !field.operations.includes(operation))) continue;
      let value = getNestedValue(formData, formPath);
      if (value === undefined && settings.omitUndefined) continue;
      if (value === null && settings.omitNull) continue;
      if (field.toApi) {
        try { value = field.toApi(value, formData); }
        catch (cause) { throw new MapperTransformError(`toApi transform failed for field "${formPath}"`, { operation, formPath, apiPath: field.to, value, cause }); }
      }
      setNestedValue(payload, field.to, deepClone(value));
    }
    return payload;
  }

  _denormalize(formData, operation, options = {}) {
    return this.fields
      ? this._denormalizeFields(formData, operation, options)
      : denormalizeDirect(formData, this.formToApiMapping, { ...this._options(options), transforms: this.transforms, operation });
  }

  denormalize(formData, options = {}) { return this._denormalize(formData, options.operation || 'denormalize', options); }
  diff(original, current, options = {}) { return diff(original, current, this._options(options)); }
  hasChanges(original, current) { return hasChanges(original, current); }
  getChangedPaths(original, current, options = {}) { return getChangedPaths(original, current, this._options(options)); }

  buildPatch(initialForm, currentForm, options = {}) {
    if (!this.hasChanges(initialForm, currentForm)) return null;
    const settings = this._options(options);
    const changes = settings.includeUnchanged ? deepClone(currentForm) : diff(initialForm, currentForm, settings);
    this._validate(changes, 'patch', 'form');
    const payload = this._denormalize(changes, 'patch', settings);
    if (!Object.keys(payload).length) return null;
    this._validate(payload, 'patch', 'payload');
    return payload;
  }

  _buildComplete(formData, operation, options = {}) {
    const complete = { ...deepClone(this.defaults), ...deepClone(formData) };
    this._validate(complete, operation, 'form');
    const payload = this._denormalize(complete, operation, { ...options, omitUndefined: options.omitUndefined ?? this.options.omitUndefined });
    this._validate(payload, operation, 'payload');
    return payload;
  }

  buildPost(formData, options = {}) { return this._buildComplete(formData, 'post', options); }
  buildPut(formData, options = {}) { return this._buildComplete(formData, 'put', options); }
  buildPartial(formData, fields, options = {}) {
    const partial = {};
    for (const path of fields) {
      const value = getNestedValue(formData, path);
      if (value !== undefined) setNestedValue(partial, path, value);
    }
    return this._denormalize(partial, 'partial', options);
  }

  createPatchFromApi(apiData, editedForm, options = {}) { return this.buildPatch(this.normalize(apiData), editedForm, options); }

  clone(config = {}) { return new Mapper({ ...this.getConfig(), validator: this.validator, validate: this.validators, ...config }); }

  getConfig() {
    return {
      ...(this.fields ? { fields: deepClone(this.fields) } : { apiToForm: deepClone(this.apiToFormMapping), formToApi: deepClone(this.formToApiMapping) }),
      transforms: { ...this.transforms }, defaults: deepClone(this.defaults), coerce: { ...this.coerce }, options: { ...this.options }
    };
  }

  static compose(...mappers) {
    if (!mappers.length || mappers.some(mapper => !(mapper instanceof Mapper) || !mapper.fields)) {
      throw new MapperConfigurationError('Mapper.compose requires one or more field-based Mapper instances');
    }
    return new Mapper({ fields: Object.assign({}, ...mappers.map(mapper => mapper.fields)), defaults: Object.assign({}, ...mappers.map(mapper => mapper.defaults)) });
  }
}

Mapper.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
module.exports = Mapper;

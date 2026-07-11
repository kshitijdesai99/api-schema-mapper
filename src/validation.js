/**
 * Shared validation result handling.
 *
 * Mapper methods and standalone payload builders both use these functions so a
 * boolean, Mapper-style result, or safe-parse result has identical semantics.
 */
'use strict';

const { MapperValidationError } = require('./errors');

function normalizeValidationErrors(result) {
  const passed = result === null
    || result === undefined
    || result === true
    || result.valid === true
    || result.success === true;

  if (passed) return null;
  if (result === false) {
    return [{ path: '', code: 'invalid', message: 'Validation failed' }];
  }

  const schemaErrors = result.error
    && (result.error.issues || result.error.errors);
  const rawErrors = result.errors || schemaErrors || [];

  return rawErrors.map(error => {
    if (typeof error === 'string') {
      return { path: '', code: 'invalid', message: error };
    }

    return {
      path: Array.isArray(error.path) ? error.path.join('.') : (error.path || ''),
      code: error.code || 'invalid',
      message: error.message || String(error)
    };
  });
}

function runValidation(validator, data, context) {
  if (!validator) return;

  let result;
  try {
    result = validator(data, context);
  } catch (cause) {
    throw new MapperValidationError(`Validation failed during ${context.operation}`, {
      ...context,
      errors: [{ path: '', code: 'exception', message: cause.message }],
      cause
    });
  }

  const errors = normalizeValidationErrors(result);
  if (errors) {
    throw new MapperValidationError(`Validation failed during ${context.operation}`, {
      ...context,
      errors
    });
  }
}

module.exports = { normalizeValidationErrors, runValidation };

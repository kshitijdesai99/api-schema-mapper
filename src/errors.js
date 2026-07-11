/**
 * Structured public error types.
 *
 * Error instances retain operation, field paths, values, and original causes so
 * applications can report failures without parsing error-message strings.
 */
'use strict';

class MapperError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = new.target.name;
    Object.assign(this, details);
    if (Error.captureStackTrace) Error.captureStackTrace(this, new.target);
  }
}

class MapperConfigurationError extends MapperError {}

class MapperValidationError extends MapperError {
  constructor(message, details = {}) {
    super(message, details);
    this.errors = details.errors || [];
  }
}

class MapperTransformError extends MapperError {}

module.exports = {
  MapperError,
  MapperConfigurationError,
  MapperValidationError,
  MapperTransformError
};

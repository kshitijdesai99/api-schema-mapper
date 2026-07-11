'use strict';

const { MapperConfigurationError } = require('./errors');

function schemaValidator(schema) {
  if (!schema || (typeof schema.safeParse !== 'function' && typeof schema.parse !== 'function')) {
    throw new MapperConfigurationError('Schema adapter requires a schema with safeParse() or parse()');
  }
  return data => {
    if (typeof schema.safeParse === 'function') return schema.safeParse(data);
    try { schema.parse(data); return { valid: true }; }
    catch (error) { return { valid: false, errors: error.issues || error.errors || [{ message: error.message }] }; }
  };
}

function valibotValidator(schema, safeParse) {
  if (typeof safeParse !== 'function') throw new MapperConfigurationError('valibotValidator requires Valibot safeParse as its second argument');
  return data => safeParse(schema, data);
}

module.exports = { schemaValidator, zodValidator: schemaValidator, valibotValidator };

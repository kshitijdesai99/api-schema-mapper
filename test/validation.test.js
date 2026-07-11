'use strict';

const Mapper = require('../src');
const { MapperValidationError, schemaValidator, valibotValidator } = require('../src');

describe('operation-aware validation', () => {
  test('uses full-form, patch, and payload validators with context', () => {
    const calls = [];
    const mapper = new Mapper({
      apiToForm: { email_address: 'email', user_name: 'name' },
      validate: {
        form: (data, context) => { calls.push([context.operation, context.phase, data]); return { valid: true }; },
        patch: (data, context) => { calls.push([context.operation, context.phase, data]); return { valid: true }; },
        payload: (data, context) => { calls.push([context.operation, context.phase, data]); return { valid: true }; }
      }
    });
    mapper.normalize({ email_address: 'a@x', user_name: 'A' });
    mapper.buildPost({ email: 'a@x', name: 'A' });
    mapper.buildPut({ email: 'a@x', name: 'A' });
    mapper.buildPatch({ email: 'a@x', name: 'A' }, { email: 'a@x', name: 'B' });
    expect(calls.find(call => call[0] === 'patch' && call[1] === 'form')[2]).toEqual({ name: 'B' });
    expect(calls.map(call => call[0])).toEqual(expect.arrayContaining(['normalize', 'post', 'put', 'patch']));
  });

  test('throws structured validation errors with field paths', () => {
    const mapper = new Mapper({ apiToForm: { email: 'email' }, validate: { form: () => ({ valid: false, errors: [{ path: 'email', code: 'invalid_email', message: 'Email address is invalid' }] }) } });
    try { mapper.buildPost({ email: 'bad' }); throw new Error('expected failure'); }
    catch (error) {
      expect(error).toBeInstanceOf(MapperValidationError);
      expect(error.operation).toBe('post');
      expect(error.errors).toEqual([{ path: 'email', code: 'invalid_email', message: 'Email address is invalid' }]);
    }
  });

  test('supports schema adapters without runtime dependencies', () => {
    expect(schemaValidator({ safeParse: data => ({ success: Boolean(data.ok) }) })({ ok: true })).toEqual({ success: true });
    const safeParse = (schema, data) => ({ success: data === schema });
    expect(valibotValidator(3, safeParse)(3)).toEqual({ success: true });
    expect(schemaValidator({ parse: () => ({}) })({ ok: true })).toEqual({ valid: true });
    expect(schemaValidator({ parse: () => { const error = new Error('bad'); error.issues = [{ path: ['name'], message: 'bad' }]; throw error; } })({})).toEqual({ valid: false, errors: [{ path: ['name'], message: 'bad' }] });
    expect(() => schemaValidator({})).toThrow('safeParse');
    expect(() => valibotValidator({}, null)).toThrow('safeParse');
  });
});

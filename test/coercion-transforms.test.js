'use strict';

const Mapper = require('../src');
const { MapperConfigurationError, MapperTransformError } = require('../src/errors');

describe('coercion and transform errors', () => {
  test('preserves numeric-looking identifiers unless fields opt in', () => {
    const safe = new Mapper({ apiToForm: { postcode: 'postcode', phone: 'phone' } });
    expect(safe.normalize({ postcode: '00123', phone: '0123456789' })).toEqual({ postcode: '00123', phone: '0123456789' });
    const explicit = new Mapper({ apiToForm: { age: 'age', active: 'active', created_at: 'createdAt' }, coerce: { age: 'number', active: 'boolean', createdAt: 'date' } });
    const result = explicit.normalize({ age: '27', active: 'false', created_at: '2020-01-01T00:00:00Z' });
    expect(result).toEqual({ age: 27, active: false, createdAt: new Date('2020-01-01T00:00:00Z') });
  });

  test('supports custom coercion and helpful invalid coercion errors', () => {
    const custom = new Mapper({ fields: { code: { from: 'code', to: 'code', coerce: value => value.trim() } } });
    expect(custom.normalize({ code: ' X ' })).toEqual({ code: 'X' });
    const invalid = new Mapper({ apiToForm: { age: 'age' }, coerce: { age: 'number' } });
    expect(() => invalid.normalize({ age: 'abc' })).toThrow('Could not convert field "age" value "abc" to number');
  });

  test('rejects unsafe global coercion and wraps transform failures', () => {
    expect(() => new Mapper({ apiToForm: { value: 'value' }, options: { typeCoercion: true } })).toThrow(MapperConfigurationError);
    const from = new Mapper({ apiToForm: { value: 'value' }, transforms: { value: { fromApi: () => { throw new Error('bad'); } } } });
    expect(() => from.normalize({ value: 1 })).toThrow(MapperTransformError);
    const to = new Mapper({ fields: { value: { from: 'value', to: 'value', toApi: () => { throw new Error('bad'); } } } });
    expect(() => to.denormalize({ value: 1 })).toThrow(MapperTransformError);
  });
});

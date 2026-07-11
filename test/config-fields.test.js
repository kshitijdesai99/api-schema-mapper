/** Verifies configuration errors and advanced field-based mapping features. */
'use strict';

const Mapper = require('../src');
const { MapperConfigurationError } = require('../src');
const { setNestedValue } = require('../src/utils');

describe('configuration and field features', () => {
  test.each([
    [{ apiToForm: { name: 123 } }, 'Invalid mapping'],
    [{ apiToForm: { a: 'name', b: 'name' } }, 'Duplicate mapping destination'],
    [{ apiToForm: { a: '' } }, 'non-empty'],
    [{ apiToForm: { items: [] } }, 'exactly one'],
    [{ apiToForm: { '__proto__.polluted': 'value' } }, 'Unsafe'],
    [{ fields: { name: {} } }, 'must define from or to']
  ])('rejects invalid configuration %#', (config, message) => {
    expect(() => new Mapper(config)).toThrow(message);
  });

  test('rejects circular mappings and protected setter paths', () => {
    const circular = {}; circular.child = circular;
    expect(() => new Mapper({ apiToForm: circular })).toThrow(MapperConfigurationError);
    expect(() => setNestedValue({}, 'safe.__proto__.bad', true)).toThrow(MapperConfigurationError);
    expect({}.bad).toBeUndefined();
  });

  test('supports read-only and operation-specific fields', () => {
    const mapper = new Mapper({ fields: {
      id: { from: 'user_id', readOnly: true },
      email: { from: 'email_address', to: 'email' },
      password: { to: 'password', operations: ['post'] },
      updatedAt: { from: 'updated_at', operations: ['get'] }
    } });
    const form = mapper.normalize({ user_id: 1, email_address: 'a@x', updated_at: 'today' });
    expect(form).toEqual({ id: 1, email: 'a@x', updatedAt: 'today' });
    expect(mapper.buildPost({ ...form, password: 'secret' })).toEqual({ email: 'a@x', password: 'secret' });
    expect(mapper.buildPatch(form, { ...form, email: 'b@x' })).toEqual({ email: 'b@x' });
  });

  test('composes field mappers and rejects ambiguous composition', () => {
    const identity = new Mapper({ fields: { name: { from: 'name', to: 'name' } } });
    const address = new Mapper({ fields: { street: { from: 'address.street_name', to: 'address.street_name' } } });
    const composed = Mapper.compose(identity, address);
    expect(composed.normalize({ name: 'Ada', address: { street_name: 'Main' } })).toEqual({ name: 'Ada', street: 'Main' });
    const conflict = new Mapper({ fields: { alias: { from: 'name', to: 'alias' } } });
    expect(() => Mapper.compose(identity, conflict)).toThrow('Duplicate from path');
  });

  test('composition preserves transforms, coercion, options, defaults, and validators', () => {
    const validator = jest.fn(() => ({ valid: true }));
    const price = new Mapper({
      fields: { price: { from: 'price_cents', to: 'price_cents' } },
      transforms: {
        price: {
          fromApi: value => value / 100,
          toApi: value => Math.round(value * 100)
        }
      },
      defaults: { preferences: { currency: 'AUD' } },
      options: { omitNull: true, ignoreFields: ['audit'] },
      validator
    });
    const age = new Mapper({
      fields: { age: { from: 'age', to: 'age' } },
      coerce: { age: 'number' },
      defaults: { preferences: { locale: 'en-AU' } }
    });
    const composed = Mapper.compose(price, age);

    expect(composed.normalize({ price_cents: 1299, age: '27' })).toEqual({
      preferences: { currency: 'AUD', locale: 'en-AU' },
      price: 12.99,
      age: 27
    });
    expect(composed.denormalize({ price: 12.99, age: 27 })).toEqual({
      price_cents: 1299,
      age: 27
    });
    expect(composed.options).toMatchObject({ omitNull: true, ignoreFields: ['audit'] });
    expect(validator).toHaveBeenCalled();
  });

  test('composition rejects duplicate form paths before they can be overwritten', () => {
    const first = new Mapper({ fields: { name: { from: 'first_name' } } });
    const second = new Mapper({ fields: { name: { from: 'display_name' } } });
    expect(() => Mapper.compose(first, second)).toThrow('Duplicate form path "name"');
  });
});

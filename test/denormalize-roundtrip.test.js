/** Verifies form-to-API mapping and complete bidirectional round trips. */
'use strict';

const Mapper = require('../src');
const { denormalizeFlat } = require('../src/denormalizer');

describe('denormalization and round trips', () => {
  test('round-trips nested objects and arrays without mutation', () => {
    const mapper = new Mapper({ apiToForm: { user_name: 'name', contacts: [{ email_address: 'email' }] } });
    const api = { user_name: 'Ada', contacts: [{ email_address: 'a@x' }] };
    const form = mapper.normalize(api);
    const snapshot = structuredClone(form);
    expect(mapper.denormalize(form)).toEqual(api);
    expect(form).toEqual(snapshot);
  });

  test('uses explicit asymmetric formToApi mapping', () => {
    const mapper = new Mapper({ apiToForm: { user_name: 'name' }, formToApi: { name: 'displayName' } });
    expect(mapper.normalize({ user_name: 'Kshitij' })).toEqual({ name: 'Kshitij' });
    expect(mapper.denormalize({ name: 'Kshitij' })).toEqual({ displayName: 'Kshitij' });
  });

  test('supports directional and one-way transforms', () => {
    const mapper = new Mapper({
      apiToForm: { price_cents: 'price', nickname: 'nickname' },
      transforms: {
        price: { fromApi: value => value / 100, toApi: value => Math.round(value * 100) },
        nickname: { fromApi: value => value ?? '' }
      }
    });
    expect(mapper.normalize({ price_cents: 1299, nickname: null })).toEqual({ price: 12.99, nickname: '' });
    expect(mapper.denormalize({ price: 12.99, nickname: 'A' })).toEqual({ price_cents: 1299, nickname: 'A' });
  });

  test('supports denormalizeFlat and omit options in both states', () => {
    const mapping = { name: 'profile.name', nick: 'profile.nick' };
    expect(denormalizeFlat({ name: 'Ada', nick: null }, mapping, { omitNull: true })).toEqual({ profile: { name: 'Ada' } });
    expect(denormalizeFlat({ name: undefined }, mapping, { omitUndefined: false })).toEqual({ profile: { name: undefined } });
  });
});

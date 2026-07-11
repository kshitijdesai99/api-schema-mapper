/** Verifies API-to-form mapping for flat, nested, array, and field syntax. */
'use strict';

const Mapper = require('../src');
const { normalizeFlat } = require('../src/normalizer');

describe('normalization', () => {
  test('maps flat and nested API fields without mutating input', () => {
    const mapper = new Mapper({ apiToForm: { user_name: 'name', profile: { email_address: 'email' } } });
    const api = { user_name: 'Ada', profile: { email_address: 'ada@example.test' } };
    const snapshot = structuredClone(api);
    expect(mapper.normalize(api)).toEqual({ name: 'Ada', email: 'ada@example.test' });
    expect(api).toEqual(snapshot);
  });

  test('normalizes primitive arrays, arrays of objects, and nested arrays', () => {
    const primitive = new Mapper({ apiToForm: { tags: [null] } });
    expect(primitive.normalize({ tags: ['a', 'b'] })).toEqual({ tags: ['a', 'b'] });

    const objects = new Mapper({ apiToForm: { contacts: [{ email_address: 'email', phone_number: 'phone' }] } });
    expect(objects.normalize({ contacts: [{ email_address: 'a@x', phone_number: '1' }, { email_address: 'b@x', phone_number: '2' }] })).toEqual({
      contacts: [{ email: 'a@x', phone: '1' }, { email: 'b@x', phone: '2' }]
    });

    const nested = new Mapper({ apiToForm: { groups: [[{ item_id: 'id' }]] } });
    expect(nested.normalize({ groups: [[{ item_id: 1 }], [{ item_id: 2 }]] })).toEqual({ groups: [[{ id: 1 }], [{ id: 2 }]] });
  });

  test('preserves defaults when API values are missing', () => {
    const mapper = new Mapper({ apiToForm: { role_name: 'role' }, defaults: { role: 'user' } });
    expect(mapper.normalize({})).toEqual({ role: 'user' });
  });

  test('supports flat mappings and field syntax', () => {
    expect(normalizeFlat({ profile: { name: 'Ada' } }, { 'profile.name': 'user.name' })).toEqual({ user: { name: 'Ada' } });
    const mapper = new Mapper({ fields: { name: { from: 'profile.user_name', to: 'displayName' }, id: { from: 'user_id', readOnly: true } } });
    expect(mapper.normalize({ profile: { user_name: 'Ada' }, user_id: 7 })).toEqual({ name: 'Ada', id: 7 });
  });
});

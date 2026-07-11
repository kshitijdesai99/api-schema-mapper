/** Verifies complete and partial payload helpers plus nullish-value options. */
'use strict';

const Mapper = require('../src');

describe('payload helpers and nullish options', () => {
  test('POST, PUT, partial, and createPatchFromApi use the same mappings', () => {
    const mapper = new Mapper({ apiToForm: { user_name: 'name', role_name: 'role' }, defaults: { role: 'user' } });
    expect(mapper.buildPost({ name: 'Ada' })).toEqual({ user_name: 'Ada', role_name: 'user' });
    expect(mapper.buildPut({ name: 'Ada', role: 'admin' })).toEqual({ user_name: 'Ada', role_name: 'admin' });
    expect(mapper.buildPartial({ name: 'Ada', role: 'admin' }, ['role'])).toEqual({ role_name: 'admin' });
    expect(mapper.createPatchFromApi({ user_name: 'Ada', role_name: 'user' }, { name: 'Grace', role: 'user' })).toEqual({ user_name: 'Grace' });
  });

  test('deep-merges nested defaults for complete payloads', () => {
    const mapper = new Mapper({
      fields: {
        'address.country': { to: 'address.country' },
        'address.city': { to: 'address.city' }
      },
      defaults: { address: { country: 'AU', city: 'Adelaide' } }
    });
    expect(mapper.buildPost({ address: { city: 'Sydney' } })).toEqual({
      address: { country: 'AU', city: 'Sydney' }
    });
  });

  test('omitNull and omitUndefined each work enabled and disabled', () => {
    const mapping = { apiToForm: { a: 'a', b: 'b' } };
    expect(new Mapper({ ...mapping, options: { omitNull: true } }).denormalize({ a: null, b: 1 })).toEqual({ b: 1 });
    expect(new Mapper({ ...mapping, options: { omitNull: false } }).denormalize({ a: null, b: 1 })).toEqual({ a: null, b: 1 });
    expect(new Mapper({ ...mapping, options: { omitUndefined: true } }).denormalize({ a: undefined })).toEqual({});
    expect(new Mapper({ ...mapping, options: { omitUndefined: false } }).denormalize({ a: undefined })).toEqual({ a: undefined, b: undefined });
  });

  test('returns null only when a PATCH has no effective mapped changes', () => {
    const mapper = new Mapper({ fields: { id: { from: 'id', readOnly: true }, name: { from: 'name', to: 'name' } } });
    expect(mapper.buildPatch({ id: 1, name: 'A' }, { id: 2, name: 'A' })).toBeNull();
    expect(mapper.buildPatch({ id: 1, name: 'A' }, { id: 1, name: 'B' })).toEqual({ name: 'B' });
  });
});

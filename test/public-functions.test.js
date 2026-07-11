/** Verifies stateless payload builders and denormalization helper exports. */
'use strict';

const {
  buildPatchPayload, buildPostPayload, buildPutPayload, buildPartialPayload, createPayloadBuilder,
  denormalize, denormalizeForPost, denormalizeForPatch
} = require('../src');

describe('standalone payload and denormalization APIs', () => {
  const mapping = { user_name: 'name', role_name: 'role' };

  test('builds every standalone payload kind', () => {
    expect(buildPatchPayload({ name: 'A' }, { name: 'A' }, mapping)).toBeNull();
    expect(buildPatchPayload({ name: 'A', role: 'user' }, { name: 'B', role: 'user' }, mapping)).toEqual({ user_name: 'B' });
    expect(buildPatchPayload({ name: 'A', role: 'user' }, { name: 'B', role: 'user' }, mapping, { includeUnchanged: true })).toEqual({ user_name: 'B', role_name: 'user' });
    expect(buildPostPayload({ name: 'A' }, mapping, { defaults: { role: 'user' } })).toEqual({ user_name: 'A', role_name: 'user' });
    expect(buildPutPayload({ name: 'A', role: 'admin' }, mapping)).toEqual({ user_name: 'A', role_name: 'admin' });
    expect(buildPartialPayload({ name: 'A', role: 'admin' }, ['role'], mapping)).toEqual({ role_name: 'admin' });
    expect(buildPartialPayload({ name: undefined }, ['name'], mapping, { omitUndefined: false })).toEqual({ user_name: undefined });
  });

  test('validates standalone POST and PATCH data', () => {
    const invalid = () => ({ valid: false, errors: ['not allowed'] });
    expect(() => buildPatchPayload({ name: 'A' }, { name: 'B' }, mapping, { validation: invalid })).toThrow('Validation failed: not allowed');
    expect(() => buildPostPayload({ name: 'A' }, mapping, { validation: () => ({ success: false, error: { issues: [{ message: 'bad name' }] } }) })).toThrow('Validation failed: bad name');
    expect(buildPostPayload({ name: 'A' }, mapping, { validation: () => ({ valid: true }) })).toEqual({ user_name: 'A' });
  });

  test('factory binds mappings and default options', () => {
    const builder = createPayloadBuilder(mapping, { defaults: { role: 'user' } });
    expect(builder.buildPatch({ name: 'A' }, { name: 'B' })).toEqual({ user_name: 'B' });
    expect(builder.buildPost({ name: 'A' })).toEqual({ user_name: 'A', role_name: 'user' });
    expect(builder.buildPut({ name: 'A' })).toEqual({ user_name: 'A', role_name: 'user' });
    expect(builder.buildPartial({ name: 'A' }, ['name'])).toEqual({ user_name: 'A' });
  });

  test('supports direct mappings, helpers, null arrays, non-arrays, and nested arrays', () => {
    expect(denormalize({ name: 'A' }, { name: 'display_name' }, { mappingIsFormToApi: true })).toEqual({ display_name: 'A' });
    expect(denormalizeForPost({ name: undefined }, { user_name: 'name' })).toEqual({ user_name: undefined });
    expect(denormalizeForPatch({ name: undefined }, { user_name: 'name' })).toEqual({});
    const arrays = { groups: [[{ item_id: 'id' }]] };
    expect(denormalize({ groups: [[{ id: 1 }]] }, arrays)).toEqual({ groups: [[{ item_id: 1 }]] });
    expect(denormalize({ groups: null }, arrays)).toEqual({ groups: null });
    expect(denormalize({ groups: null }, arrays, { omitNull: true })).toEqual({});
    expect(denormalize({ groups: 'other' }, arrays)).toEqual({ groups: 'other' });
  });
});

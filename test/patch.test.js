/** Verifies deletion semantics, atomic arrays, deep equality, and PATCH options. */
'use strict';

const Mapper = require('../src');
const { diff, getChangedPaths, isEqual } = require('../src/differ');

describe('diffing and PATCH', () => {
  const mapper = new Mapper({ apiToForm: { name: 'name', nickname: 'nickname', tags: [null], contacts: [{ email_address: 'email' }] } });

  test('distinguishes changed, null, undefined, and deleted fields', () => {
    expect(mapper.buildPatch({ name: 'A' }, { name: 'B' })).toEqual({ name: 'B' });
    expect(mapper.buildPatch({ nickname: 'A' }, { nickname: null })).toEqual({ nickname: null });
    expect(mapper.buildPatch({ nickname: 'A' }, { nickname: undefined })).toBeNull();
    expect(mapper.buildPatch({ nickname: 'A' }, {})).toEqual({ nickname: null });
    expect(new Mapper({ apiToForm: { nickname: 'nickname' }, options: { deletedValue: '' } }).buildPatch({ nickname: 'A' }, {})).toEqual({ nickname: '' });
  });

  test.each([
    [['a', 'b'], ['a', 'c']],
    [['a'], ['a', 'b']],
    [['a', 'b'], ['a']],
    [['a', 'b'], ['b', 'a']],
    [['a'], null],
    [['a'], 'replacement']
  ])('treats arrays as atomic values: %j -> %j', (before, after) => {
    expect(mapper.buildPatch({ tags: before }, { tags: after })).toEqual({ tags: after });
  });

  test('sends a complete updated object array', () => {
    const before = { contacts: [{ email: 'old@x' }, { email: 'same@x' }] };
    const after = { contacts: [{ email: 'new@x' }, { email: 'same@x' }] };
    expect(mapper.buildPatch(before, after)).toEqual({ contacts: [{ email_address: 'new@x' }, { email_address: 'same@x' }] });
  });

  test('supports includeUnchanged, deep, and ignoreFields enabled and disabled', () => {
    const base = new Mapper({ apiToForm: { name: 'name', nickname: 'nickname' } });
    expect(base.buildPatch({ name: 'A', nickname: 'N' }, { name: 'B', nickname: 'N' })).toEqual({ name: 'B' });
    expect(base.buildPatch({ name: 'A', nickname: 'N' }, { name: 'B', nickname: 'N' }, { includeUnchanged: true })).toEqual({ name: 'B', nickname: 'N' });
    expect(diff({ user: { name: 'A', age: 1 } }, { user: { name: 'B', age: 1 } }, { deep: true })).toEqual({ user: { name: 'B' } });
    expect(diff({ user: { name: 'A', age: 1 } }, { user: { name: 'B', age: 1 } }, { deep: false })).toEqual({ user: { name: 'B', age: 1 } });
    expect(diff({ name: 'A' }, { name: 'B' }, { ignoreFields: ['name'] })).toEqual({});
    expect(diff({ name: 'A' }, { name: 'B' }, { ignoreFields: [] })).toEqual({ name: 'B' });
  });

  test('deep equality handles ordering, dates, NaN, undefined, and arrays', () => {
    expect(isEqual({ name: 'K', age: 27 }, { age: 27, name: 'K' })).toBe(true);
    expect(isEqual({ at: new Date(0), value: NaN, missing: undefined }, { missing: undefined, value: NaN, at: new Date(0) })).toBe(true);
    expect(isEqual([1, 2], [2, 1])).toBe(false);
    expect(getChangedPaths({ a: 1, list: [1] }, { a: 2, list: [2] })).toEqual(['a', 'list']);
  });
});

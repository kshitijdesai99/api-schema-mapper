'use strict';

const { deepClone, deepMerge, flattenObject, getNestedValue, hasOwn, invertMapping, isPlainObject, pathSegments, setNestedValue, unflattenObject, validateMapping } = require('../src/utils');

describe('utilities', () => {
  test('identifies only plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(hasOwn({ a: 1 }, 'a')).toBe(true);
  });

  test('deep-clones dates, arrays, and circular values', () => {
    const source = { date: new Date(1), list: [{ value: 1 }] };
    source.self = source;
    const clone = deepClone(source);
    expect(clone).not.toBe(source);
    expect(clone.date).toEqual(source.date);
    expect(clone.date).not.toBe(source.date);
    expect(clone.list[0]).not.toBe(source.list[0]);
    expect(clone.self).toBe(clone);
    expect(deepClone(3)).toBe(3);
    expect(() => deepClone(new Map())).toThrow('Unsupported value type');
  });

  test('gets and sets nested values safely, including overwritten primitives', () => {
    const object = { a: 'old' };
    expect(setNestedValue(object, 'a.b', 2)).toBe(object);
    expect(getNestedValue(object, 'a.b')).toBe(2);
    expect(getNestedValue(object, 'missing.value')).toBeUndefined();
    expect(pathSegments('a.b')).toEqual(['a', 'b']);
    expect(() => pathSegments(3)).toThrow('non-empty');
    expect(() => pathSegments('a..b')).toThrow('empty');
  });

  test('validates and inverts primitive, nested, primitive-array, and object-array mappings', () => {
    expect(validateMapping({ profile: { user_name: 'name' }, tags: [null], contacts: [{ email_address: 'email' }] })).toBeDefined();
    expect(invertMapping({ profile: { user_name: 'name' }, tags: [null], contacts: [{ email_address: 'email' }] })).toEqual({
      name: 'profile.user_name', tags: [null], contacts: [{ email: 'email_address' }]
    });
    expect(() => validateMapping(null, 'custom')).toThrow('custom must be a plain object');
    expect(() => validateMapping({ items: [[null, null]] })).toThrow('Nested array mapping');
    expect(() => validateMapping({ items: [2] })).toThrow('Invalid array item');
    expect(() => validateMapping({ first: [{ id: 'id' }], second: [{ id: 'id' }] })).not.toThrow();
  });

  test('merges, flattens, and unflattens objects', () => {
    expect(deepMerge({ a: { b: 1 }, keep: true }, { a: { c: 2 }, replace: 3 })).toEqual({ a: { b: 1, c: 2 }, keep: true, replace: 3 });
    const flat = flattenObject({ a: { b: 1 }, list: [1], value: 2 });
    expect(flat).toEqual({ 'a.b': 1, list: [1], value: 2 });
    expect(unflattenObject(flat)).toEqual({ a: { b: 1 }, list: [1], value: 2 });
  });
});

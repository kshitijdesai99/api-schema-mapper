'use strict';

const Mapper = require('../src');
const { MapperError, MapperTransformError } = require('../src');
const { coerceType, normalize, normalizeFlat } = require('../src/normalizer');
const { denormalizeDirect } = require('../src/denormalizer');
const { diff, getChangedPaths, isEqual } = require('../src/differ');
const { buildPostPayload } = require('../src/payloadBuilder');
const { schemaValidator } = require('../src/adapters');
const { invertMapping } = require('../src/utils');

describe('explicit edge contracts', () => {
  test('deep equality rejects mismatched dates, object kinds, keys, and values', () => {
    expect(isEqual(new Date(1), new Date(2))).toBe(false);
    expect(isEqual(new Date(1), {})).toBe(false);
    expect(isEqual(null, {})).toBe(false);
    expect(isEqual([], {})).toBe(false);
    expect(isEqual(new Map(), new Map())).toBe(false);
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    const first = {}; first.self = first;
    const second = {}; second.self = second;
    expect(isEqual(first, second)).toBe(true);
  });

  test('diff paths cover root deletion, type replacement, and ignored paths', () => {
    expect(diff({ a: 1 }, {})).toEqual({ a: undefined });
    expect(diff({ a: {} }, { a: [] })).toEqual({ a: [] });
    expect(getChangedPaths({ a: 1 }, {})).toEqual(['a']);
    expect(getChangedPaths({ a: 1 }, { a: 2 }, { ignoreFields: ['a'] })).toEqual([]);
    expect(getChangedPaths({ a: { b: 1 } }, { a: { b: 2 } }, { deep: false })).toEqual(['a']);
  });

  test('coercion rejects empty and non-scalar numbers and covers native false', () => {
    expect(coerceType(false, 'boolean', 'flag')).toBe(false);
    expect(() => coerceType('', 'number', 'age')).toThrow(MapperTransformError);
    expect(() => coerceType({}, 'number', 'age')).toThrow(MapperTransformError);
  });

  test('normalizer skips absent flat and invalid nested values and accepts function transforms', () => {
    expect(normalizeFlat({}, { missing: 'value' })).toEqual({});
    expect(normalize({ nested: null }, { nested: { value: 'value' } })).toEqual({});
    expect(normalize({ value: 2 }, { value: 'value' }, { transforms: { value: value => value * 2 } })).toEqual({ value: 4 });
  });

  test('field transforms and direct transform functions expose structured failures', () => {
    const fieldMapper = new Mapper({ fields: { value: { from: 'value', to: 'value', fromApi: () => { throw new Error('no'); } } } });
    expect(() => fieldMapper.normalize({ value: 1 })).toThrow(MapperTransformError);
    expect(() => denormalizeDirect({ value: 1 }, { value: 'value' }, { transforms: { value: () => { throw new Error('no'); } } })).toThrow(MapperTransformError);
  });

  test('direct nested mappings omit empty branches and retain undefined arrays when configured', () => {
    expect(denormalizeDirect({}, { profile: { name: 'display_name' } })).toEqual({});
    expect(denormalizeDirect({ profile: { name: 'Ada' } }, { profile: { name: 'display_name' } })).toEqual({ profile: { display_name: 'Ada' } });
    expect(denormalizeDirect({}, { items: [null] }, { omitUndefined: false })).toEqual({ items: undefined });
  });

  test('schema parse adapters support errors and plain messages', () => {
    const withErrors = schemaValidator({ parse: () => { const error = new Error('bad'); error.errors = [{ message: 'specific' }]; throw error; } });
    expect(withErrors({})).toEqual({ valid: false, errors: [{ message: 'specific' }] });
    const plain = schemaValidator({ parse: () => { throw new Error('plain'); } });
    expect(plain({})).toEqual({ valid: false, errors: [{ message: 'plain' }] });
  });

  test('standalone validation formats object errors and empty error sets', () => {
    expect(() => buildPostPayload({ name: 'A' }, { name: 'name' }, { validation: () => ({ valid: false, errors: [{ message: 'object error' }] }) })).toThrow('object error');
    expect(() => buildPostPayload({ name: 'A' }, { name: 'name' }, { validation: () => ({ valid: false }) })).toThrow('Validation failed: ');
  });

  test('inverts nested primitive arrays and error construction works without captureStackTrace', () => {
    expect(invertMapping({ groups: [[null]] })).toEqual({ groups: [[null]] });
    const original = Error.captureStackTrace;
    Error.captureStackTrace = undefined;
    try { expect(new MapperError('message').message).toBe('message'); }
    finally { Error.captureStackTrace = original; }
  });
});

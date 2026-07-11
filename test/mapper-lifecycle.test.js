'use strict';

const Mapper = require('../src');
const { MapperConfigurationError, MapperTransformError, MapperValidationError } = require('../src');

describe('Mapper lifecycle and edge behavior', () => {
  test('supports string fields, field defaults, transforms map, clone, config export, and instance helpers', () => {
    const mapper = new Mapper({
      fields: { name: 'user_name', count: { from: 'count', to: 'count', default: 2 }, skip: { to: 'skip' } },
      transforms: { name: value => value.toUpperCase() }
    });
    expect(mapper.normalize({ user_name: 'ada' })).toEqual({ name: 'ADA', count: 2 });
    expect(mapper.denormalize({ name: 'ada', count: 3 })).toEqual({ user_name: 'ADA', count: 3 });
    expect(mapper.diff({ name: 'A' }, { name: 'B' })).toEqual({ name: 'B' });
    expect(mapper.hasChanges({ name: 'A' }, { name: 'A' })).toBe(false);
    expect(mapper.getChangedPaths({ name: 'A' }, { name: 'B' })).toEqual(['name']);
    const config = mapper.getConfig();
    config.fields.name = 'changed';
    expect(mapper.getConfig().fields.name).toBe('user_name');
    expect(mapper.clone({ fields: { name: 'user_name', count: { from: 'count', to: 'count' } }, defaults: { count: 4 } }).normalize({ user_name: 'ada' }).count).toBe(4);
  });

  test('supports legacy validator results and thrown validator errors', () => {
    expect(() => new Mapper({ apiToForm: { name: 'name' }, validator: () => false }).buildPost({ name: 'A' })).toThrow(MapperValidationError);
    expect(() => new Mapper({ apiToForm: { name: 'name' }, validator: () => ({ valid: false, errors: ['bad'] }) }).buildPost({ name: 'A' })).toThrow(MapperValidationError);
    expect(() => new Mapper({ apiToForm: { name: 'name' }, validator: () => { throw new Error('explode'); } }).buildPost({ name: 'A' })).toThrow('Validation failed during post');
  });

  test('normalizes unusual array source values predictably', () => {
    const mapper = new Mapper({ apiToForm: { items: [{ item_id: 'id' }] } });
    expect(mapper.normalize({})).toEqual({});
    expect(mapper.normalize({ items: 'not-array' })).toEqual({ items: 'not-array' });
    expect(mapper.normalize({ items: [3, { item_id: 2 }] })).toEqual({ items: [3, { id: 2 }] });
  });

  test('covers every explicit coercion outcome', () => {
    const mapper = new Mapper({ fields: {
      truthy: { from: 'truthy', coerce: 'boolean' },
      bool: { from: 'bool', coerce: 'boolean' },
      text: { from: 'text', coerce: 'string' },
      date: { from: 'date', coerce: 'date' }
    } });
    expect(mapper.normalize({ truthy: true, bool: 'true', text: 3, date: new Date(2) })).toEqual({ truthy: true, bool: true, text: '3', date: new Date(2) });
    expect(() => new Mapper({ fields: { value: { from: 'value', coerce: 'boolean' } } }).normalize({ value: 'yes' })).toThrow(MapperTransformError);
    expect(() => new Mapper({ fields: { value: { from: 'value', coerce: 'date' } } }).normalize({ value: 'bad' })).toThrow(MapperTransformError);
    expect(() => new Mapper({ fields: { value: { from: 'value', coerce: 'unknown' } } }).normalize({ value: 1 })).toThrow(MapperTransformError);
    expect(() => new Mapper({ fields: { value: { from: 'value', coerce: () => { throw new Error('bad'); } } } }).normalize({ value: 1 })).toThrow(MapperTransformError);
  });

  test('rejects invalid field shapes, operations, duplicate to paths, and invalid compose calls', () => {
    expect(() => new Mapper({ fields: [] })).toThrow(MapperConfigurationError);
    expect(() => new Mapper({ fields: { value: 2 } })).toThrow('Invalid field configuration');
    expect(() => new Mapper({ fields: { value: { from: 'value', operations: 'post' } } })).toThrow('Invalid operations');
    expect(() => new Mapper({ fields: { a: { to: 'same' }, b: { to: 'same' } } })).toThrow('Duplicate to path');
    expect(() => Mapper.compose()).toThrow(MapperConfigurationError);
    expect(() => Mapper.compose(new Mapper({ apiToForm: { a: 'a' } }))).toThrow(MapperConfigurationError);
  });
});

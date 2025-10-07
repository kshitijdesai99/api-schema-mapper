/**
 * Additional tests to achieve 100% code coverage
 */

const Mapper = require('../src/Mapper');
const { normalize, normalizeFlat, coerceType } = require('../src/normalizer');
const { denormalize, denormalizeFlat, denormalizeForPost, denormalizeForPatch } = require('../src/denormalizer');
const { diff, getChangedPaths, isEqual, hasChanges } = require('../src/differ');
const { buildPatchPayload, buildPostPayload, buildPutPayload, buildPartialPayload, createPayloadBuilder } = require('../src/payloadBuilder');
const { isPlainObject, deepClone, getNestedValue, setNestedValue, invertMapping, deepMerge, flattenObject, unflattenObject } = require('../src/utils');
const index = require('../src/index');

describe('Coverage Tests', () => {
  describe('index.js exports', () => {
    test('should export all named functions', () => {
      expect(index.Mapper).toBe(Mapper);
      expect(index.normalize).toBe(normalize);
      expect(index.normalizeFlat).toBe(normalizeFlat);
      expect(index.denormalize).toBe(denormalize);
      expect(index.denormalizeFlat).toBe(denormalizeFlat);
      expect(index.denormalizeForPost).toBe(denormalizeForPost);
      expect(index.denormalizeForPatch).toBe(denormalizeForPatch);
      expect(index.diff).toBe(diff);
      expect(index.getChangedPaths).toBe(getChangedPaths);
      expect(index.hasChanges).toBe(hasChanges);
      expect(index.isEqual).toBe(isEqual);
      expect(index.buildPatchPayload).toBe(buildPatchPayload);
      expect(index.buildPostPayload).toBe(buildPostPayload);
      expect(index.buildPutPayload).toBe(buildPutPayload);
      expect(index.buildPartialPayload).toBe(buildPartialPayload);
      expect(index.createPayloadBuilder).toBe(createPayloadBuilder);
    });

    test('should export utils object', () => {
      expect(index.utils.isPlainObject).toBe(isPlainObject);
      expect(index.utils.deepClone).toBe(deepClone);
      expect(index.utils.getNestedValue).toBe(getNestedValue);
      expect(index.utils.setNestedValue).toBe(setNestedValue);
      expect(index.utils.invertMapping).toBe(invertMapping);
      expect(index.utils.deepMerge).toBe(deepMerge);
      expect(index.utils.flattenObject).toBe(flattenObject);
      expect(index.utils.unflattenObject).toBe(unflattenObject);
    });

    test('should export version', () => {
      expect(index.version).toBe('1.0.0');
    });
  });

  describe('normalizer.js - uncovered paths', () => {
    test('should handle custom transforms', () => {
      const mapper = new Mapper({
        apiToForm: {
          birth_date: 'birthDate'
        },
        transforms: {
          birthDate: (value) => value ? new Date(value) : null
        }
      });

      const apiData = { birth_date: '1990-01-01' };
      const formData = mapper.normalize(apiData);
      
      expect(formData.birthDate).toBeInstanceOf(Date);
    });

    test('should handle array mapping', () => {
      const apiData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      };

      const mapping = {
        items: [{ id: 'id', name: 'name' }]
      };

      const formData = normalize(apiData, mapping);
      expect(formData.items).toHaveLength(2);
    });

    test('should handle nested null/undefined values', () => {
      const mapper = new Mapper({
        apiToForm: {
          contact: {
            email: 'email'
          }
        }
      });

      const apiData = { contact: null };
      const formData = mapper.normalize(apiData);
      
      expect(formData.email).toBeUndefined();
    });

    test('should use normalizeFlat', () => {
      const apiData = {
        user: {
          name: 'John'
        }
      };

      const flatMapping = {
        'user.name': 'userName'
      };

      const formData = normalizeFlat(apiData, flatMapping);
      expect(formData.userName).toBe('John');
    });
  });

  describe('denormalizer.js - uncovered paths', () => {
    test('should handle omitNull option', () => {
      const mapping = {
        user_name: 'username',
        email: 'email'
      };

      const formData = {
        username: 'john',
        email: null
      };

      const payload = denormalize(formData, mapping, {
        omitNull: true
      });

      expect(payload).toEqual({ user_name: 'john' });
      expect(payload.email).toBeUndefined();
    });

    test('should handle custom transforms in denormalize', () => {
      const formData = {
        birthDate: new Date('1990-01-01')
      };

      const mapping = {
        birth_date: 'birthDate'
      };

      const payload = denormalize(formData, mapping, {
        transform: {
          birthDate: (value) => value.toISOString()
        }
      });

      expect(typeof payload.birth_date).toBe('string');
    });

    test('should use denormalizeFlat with nested paths', () => {
      const formData = {
        userName: 'John',
        userEmail: 'john@example.com'
      };

      const formToApiMapping = {
        userName: 'user.name',
        userEmail: 'user.email'
      };

      const payload = denormalizeFlat(formData, formToApiMapping);
      expect(payload.user.name).toBe('John');
      expect(payload.user.email).toBe('john@example.com');
    });

    test('should use denormalizeForPost', () => {
      const formData = {
        username: 'john',
        email: undefined
      };

      const mapping = {
        user_name: 'username',
        email_address: 'email'
      };

      const payload = denormalizeForPost(formData, mapping);
      expect(payload.email_address).toBeUndefined();
    });

    test('should use denormalizeForPatch', () => {
      const formData = {
        username: 'john',
        email: undefined
      };

      const mapping = {
        user_name: 'username',
        email_address: 'email'
      };

      const payload = denormalizeForPatch(formData, mapping);
      expect(payload.email_address).toBeUndefined();
    });
  });

  describe('differ.js - uncovered paths', () => {
    test('should handle ignoreFields option', () => {
      const original = { id: 1, name: 'John', email: 'old@example.com' };
      const current = { id: 2, name: 'John', email: 'new@example.com' };

      const changes = diff(original, current, {
        ignoreFields: ['id']
      });

      expect(changes.id).toBeUndefined();
      expect(changes.email).toBe('new@example.com');
    });

    test('should detect type changes', () => {
      const original = { value: '123' };
      const current = { value: 123 };

      const changes = diff(original, current);
      expect(changes.value).toBe(123);
    });

    test('should handle array comparison without deep compare', () => {
      const original = { items: [1, 2, 3] };
      const current = { items: [1, 2, 4] };

      const changes = diff(original, current, {
        compareArrays: false
      });

      expect(changes.items).toEqual([1, 2, 4]);
    });

    test('should detect array length changes', () => {
      const original = { items: [1, 2] };
      const current = { items: [1, 2, 3] };

      const changes = diff(original, current);
      expect(changes.items).toEqual([1, 2, 3]);
    });

    test('should detect deleted keys', () => {
      const original = { name: 'John', email: 'john@example.com' };
      const current = { name: 'John' };

      const changes = diff(original, current);
      expect(changes.email).toBeUndefined();
    });

    test('should handle object to non-object changes', () => {
      const original = { value: { nested: 'object' } };
      const current = { value: 'string' };

      const changes = diff(original, current);
      expect(changes.value).toBe('string');
    });

    test('should handle array item changes', () => {
      const original = { items: [{ id: 1 }, { id: 2 }] };
      const current = { items: [{ id: 1 }, { id: 3 }] };

      const changes = diff(original, current);
      expect(changes).toBeDefined();
    });

    test('should handle setChangePath with empty path', () => {
      const original = { a: 1 };
      const current = { a: 1, b: 2 };

      const changes = diff(original, current);
      expect(changes.b).toBe(2);
    });

    test('should handle getChangedPaths with arrays', () => {
      const original = { items: [1, 2] };
      const current = { items: [1, 3] };

      const paths = getChangedPaths(original, current);
      expect(paths).toContain('items');
    });

    test('should handle getChangedPaths with deleted keys', () => {
      const original = { a: 1, b: 2 };
      const current = { a: 1 };

      const paths = getChangedPaths(original, current);
      expect(paths).toContain('b');
    });
  });

  describe('payloadBuilder.js - uncovered paths', () => {
    test('should handle validation in buildPatchPayload', () => {
      const mapping = {
        user_name: 'username'
      };

      const initial = { username: 'john' };
      const current = { username: 'jane' };

      const validation = (data) => ({
        valid: false,
        errors: ['Username cannot be changed']
      });

      expect(() => {
        buildPatchPayload(initial, current, mapping, {
          validation
        });
      }).toThrow('Validation failed: Username cannot be changed');
    });

    test('should handle validation in buildPostPayload', () => {
      const mapping = {
        user_name: 'username'
      };

      const formData = { username: '' };

      const validation = (data) => ({
        valid: false,
        errors: ['Username is required']
      });

      expect(() => {
        buildPostPayload(formData, mapping, {
          validation
        });
      }).toThrow('Validation failed: Username is required');
    });

    test('should merge defaults in buildPostPayload', () => {
      const mapping = {
        user_name: 'username',
        role: 'role'
      };

      const formData = { username: 'john' };

      const payload = buildPostPayload(formData, mapping, {
        defaults: { role: 'user' }
      });

      expect(payload.role).toBe('user');
    });

    test('should use buildPutPayload', () => {
      const mapping = {
        user_name: 'username'
      };

      const formData = { username: 'john' };
      const payload = buildPutPayload(formData, mapping);

      expect(payload.user_name).toBe('john');
    });

    test('should use buildPartialPayload', () => {
      const mapping = {
        user_name: 'username',
        email_address: 'email'
      };

      const formData = {
        username: 'john',
        email: 'john@example.com'
      };

      const payload = buildPartialPayload(formData, ['email'], mapping);

      expect(payload.email_address).toBe('john@example.com');
      expect(payload.user_name).toBeUndefined();
    });

    test('should use createPayloadBuilder factory', () => {
      const mapping = {
        user_name: 'username'
      };

      const builder = createPayloadBuilder(mapping);

      const initial = { username: 'john' };
      const current = { username: 'jane' };

      const patchPayload = builder.buildPatch(initial, current);
      expect(patchPayload.user_name).toBe('jane');

      const postPayload = builder.buildPost({ username: 'new_user' });
      expect(postPayload.user_name).toBe('new_user');

      const putPayload = builder.buildPut({ username: 'updated_user' });
      expect(putPayload.user_name).toBe('updated_user');

      const partialPayload = builder.buildPartial({ username: 'john', email: 'john@example.com' }, ['username']);
      expect(partialPayload.user_name).toBe('john');
    });
  });

  describe('utils.js - uncovered paths', () => {
    test('should handle deepClone with null', () => {
      const result = deepClone(null);
      expect(result).toBeNull();
    });

    test('should handle deepClone with primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
    });

    test('should handle deepClone with arrays', () => {
      const arr = [1, { a: 2 }, [3, 4]];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });

    test('should handle getNestedValue with null path', () => {
      const obj = { a: { b: null } };
      const value = getNestedValue(obj, 'a.b.c');
      
      expect(value).toBeUndefined();
    });

    test('should handle setNestedValue overwriting non-objects', () => {
      const obj = { a: 'string' };
      setNestedValue(obj, 'a.b.c', 'value');
      
      expect(obj.a.b.c).toBe('value');
    });

    test('should handle invertMapping with deep nesting', () => {
      const mapping = {
        user: {
          profile: {
            name: 'userName'
          }
        }
      };

      const inverted = invertMapping(mapping);
      expect(inverted.userName).toBeDefined();
    });

    test('should handle deepMerge with nested objects', () => {
      const target = {
        a: 1,
        b: { c: 2, d: 3 }
      };

      const source = {
        b: { c: 4, e: 5 },
        f: 6
      };

      const result = deepMerge(target, source);

      expect(result.a).toBe(1);
      expect(result.b.c).toBe(4);
      expect(result.b.d).toBe(3);
      expect(result.b.e).toBe(5);
      expect(result.f).toBe(6);
    });

    test('should handle deepMerge with non-object values', () => {
      const target = { a: { b: 1 } };
      const source = { a: 'string' };

      const result = deepMerge(target, source);
      expect(result.a).toBe('string');
    });

    test('should handle flattenObject with nested structures', () => {
      const obj = {
        a: {
          b: {
            c: 1
          }
        },
        d: 2
      };

      const flattened = flattenObject(obj);
      expect(flattened['a.b.c']).toBe(1);
      expect(flattened.d).toBe(2);
    });
  });

  describe('Mapper.js - uncovered paths', () => {
    test('should handle transforms in normalize', () => {
      const mapper = new Mapper({
        apiToForm: {
          created_at: 'createdAt'
        },
        transforms: {
          createdAt: (value) => new Date(value)
        }
      });

      const apiData = { created_at: '2020-01-01T00:00:00Z' };
      const formData = mapper.normalize(apiData);

      expect(formData.createdAt).toBeInstanceOf(Date);
    });

    test('should handle validation in Mapper methods', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        },
        validator: (data) => ({
          valid: false,
          errors: ['Invalid data']
        })
      });

      const initial = { username: 'john' };
      const current = { username: 'jane' };

      expect(() => {
        mapper.buildPatch(initial, current);
      }).toThrow('Validation failed');
    });

    test('should handle buildPost with defaults', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        },
        defaults: {
          username: 'anonymous'
        }
      });

      const formData = {};
      const payload = mapper.buildPost(formData);

      expect(payload.user_name).toBe('anonymous');
    });

    test('should handle buildPartial', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email'
        }
      });

      const formData = {
        username: 'john',
        email: 'john@example.com'
      };

      const payload = mapper.buildPartial(formData, ['username']);
      expect(payload.user_name).toBe('john');
      expect(payload.email_address).toBeUndefined();
    });

    test('should handle createPatchFromApi', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        }
      });

      const apiData = { user_name: 'john' };
      const editedForm = { username: 'jane' };

      const payload = mapper.createPatchFromApi(apiData, editedForm);
      expect(payload.user_name).toBe('jane');
    });

    test('should handle getConfig', () => {
      const config = {
        apiToForm: {
          user_name: 'username'
        }
      };

      const mapper = new Mapper(config);
      const exportedConfig = mapper.getConfig();

      expect(exportedConfig.apiToForm).toEqual(config.apiToForm);
    });

    test('should handle buildPut', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        }
      });

      const formData = { username: 'john' };
      const payload = mapper.buildPut(formData);

      expect(payload.user_name).toBe('john');
    });

    test('should handle diff method', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        }
      });

      const original = { username: 'john' };
      const current = { username: 'jane' };

      const changes = mapper.diff(original, current);
      expect(changes.username).toBe('jane');
    });

    test('should handle getChangedPaths method', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        }
      });

      const original = { username: 'john', email: 'john@example.com' };
      const current = { username: 'jane', email: 'john@example.com' };

      const paths = mapper.getChangedPaths(original, current);
      expect(paths).toContain('username');
      expect(paths).not.toContain('email');
    });

    test('should handle hasChanges method', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        }
      });

      const obj1 = { username: 'john' };
      const obj2 = { username: 'jane' };
      const obj3 = { username: 'john' };

      expect(mapper.hasChanges(obj1, obj2)).toBe(true);
      expect(mapper.hasChanges(obj1, obj3)).toBe(false);
    });

    test('should handle clone method', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        },
        defaults: {
          username: 'anonymous'
        }
      });

      const cloned = mapper.clone({
        defaults: {
          username: 'guest'
        }
      });

      const formData = cloned.normalize({});
      expect(formData.username).toBe('guest');
    });

    test('should use isEqual from differ', () => {
      const obj1 = { username: 'john' };
      const obj2 = { username: 'jane' };
      const obj3 = { username: 'john' };

      expect(isEqual(obj1, obj2)).toBe(false);
      expect(isEqual(obj1, obj3)).toBe(true);
    });
  });

  describe('Additional edge cases', () => {
    test('should handle normalizeFlat with undefined values', () => {
      const apiData = {
        user: {
          name: undefined
        }
      };

      const flatMapping = {
        'user.name': 'userName'
      };

      const formData = normalizeFlat(apiData, flatMapping);
      expect(formData.userName).toBeUndefined();
    });

    test('should handle denormalizeFlat with omitNull and omitUndefined', () => {
      const formData = {
        userName: 'John',
        userEmail: null,
        userPhone: undefined
      };

      const formToApiMapping = {
        userName: 'user.name',
        userEmail: 'user.email',
        userPhone: 'user.phone'
      };

      const payload = denormalizeFlat(formData, formToApiMapping, {
        omitNull: true,
        omitUndefined: true
      });

      expect(payload.user.name).toBe('John');
      expect(payload.user.email).toBeUndefined();
      expect(payload.user.phone).toBeUndefined();
    });

    test('should handle diff with empty path in setChangePath', () => {
      const original = {};
      const current = { a: 1, b: 2 };

      const changes = diff(original, current);
      expect(changes.a).toBe(1);
      expect(changes.b).toBe(2);
    });

    test('should handle coerceType with various types', () => {
      const mapper = new Mapper({
        apiToForm: {
          count: 'count',
          flag: 'flag',
          date: 'date'
        }
      });

      const apiData = {
        count: '42',
        flag: 'true',
        date: '2020-01-01T00:00:00Z'
      };

      const formData = mapper.normalize(apiData);
      expect(typeof formData.count).toBe('number');
      expect(formData.flag).toBe(true);
      expect(formData.date).toBeInstanceOf(Date);
    });

    test('should handle array mapping with non-object items', () => {
      const apiData = {
        tags: ['tag1', 'tag2', 'tag3']
      };

      const mapping = {
        tags: ['string']
      };

      const formData = normalize(apiData, mapping);
      expect(formData.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should handle differ with object becoming non-object', () => {
      const original = { value: { nested: 'data' } };
      const current = { value: null };

      const changes = diff(original, current);
      expect(changes.value).toBeNull();
    });

    test('should handle differ with non-array becoming array', () => {
      const original = { items: 'string' };
      const current = { items: [1, 2, 3] };

      const changes = diff(original, current);
      expect(changes.items).toEqual([1, 2, 3]);
    });

    test('should handle getChangedPaths with non-plain object in original', () => {
      const original = { value: 'string' };
      const current = { value: { nested: 'object' } };

      const paths = getChangedPaths(original, current);
      expect(paths).toContain('value.nested');
    });

    test('should handle coerceType with false string', () => {
      const mapper = new Mapper({
        apiToForm: {
          flag: 'flag'
        }
      });

      const apiData = { flag: 'false' };
      const formData = mapper.normalize(apiData);
      
      expect(formData.flag).toBe(false);
    });

    test('should handle coerceType with invalid number string', () => {
      const mapper = new Mapper({
        apiToForm: {
          value: 'value'
        }
      });

      const apiData = { value: 'not a number' };
      const formData = mapper.normalize(apiData);
      
      expect(formData.value).toBe('not a number');
    });

    test('should handle coerceType with whitespace string', () => {
      const mapper = new Mapper({
        apiToForm: {
          value: 'value'
        }
      });

      const apiData = { value: '   ' };
      const formData = mapper.normalize(apiData);
      
      expect(formData.value).toBe('   ');
    });

    test('should handle coerceType with invalid date string', () => {
      const mapper = new Mapper({
        apiToForm: {
          date: 'date'
        }
      });

      const apiData = { date: '2020-99-99T00:00:00Z' };
      const formData = mapper.normalize(apiData);
      
      expect(typeof formData.date).toBe('string');
    });

    test('should handle invertMapping with deeply nested objects', () => {
      const mapping = {
        level1: {
          level2: {
            level3: 'deepValue'
          }
        }
      };

      const inverted = invertMapping(mapping);
      expect(inverted.deepValue).toBeDefined();
    });

    test('should handle diff with setChangePath and array indices', () => {
      const original = { items: [{ id: 1, name: 'a' }] };
      const current = { items: [{ id: 1, name: 'b' }] };

      const changes = diff(original, current);
      expect(changes).toBeDefined();
    });

    test('should handle denormalizer with nested path containing dots', () => {
      const formData = {
        email: 'test@example.com'
      };

      const mapping = {
        'contact.email_address': 'email'
      };

      const payload = denormalize(formData, mapping);
      expect(payload.contact.email_address).toBe('test@example.com');
    });

    test('should handle denormalizeFlat without nested paths', () => {
      const formData = {
        userName: 'John',
        userEmail: 'john@example.com'
      };

      const formToApiMapping = {
        userName: 'user_name',
        userEmail: 'user_email'
      };

      const payload = denormalizeFlat(formData, formToApiMapping);
      expect(payload.user_name).toBe('John');
      expect(payload.user_email).toBe('john@example.com');
    });

    test('should handle normalizer with typeCoercion disabled', () => {
      const apiData = {
        count: '42',
        flag: 'true'
      };

      const mapping = {
        count: 'count',
        flag: 'flag'
      };

      const formData = normalize(apiData, mapping, { typeCoercion: false });
      expect(formData.count).toBe('42');
      expect(formData.flag).toBe('true');
    });

    test('should handle differ with empty path assignment', () => {
      const original = { a: 1 };
      const current = { a: 1, b: 2, c: 3 };

      const changes = diff(original, current);
      expect(changes.b).toBe(2);
      expect(changes.c).toBe(3);
    });

    test('should handle utils deepMerge with non-object source', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: null };

      const result = deepMerge(target, source);
      expect(result.b).toBeNull();
    });

    test('should handle invertMapping with nested plain object values', () => {
      const mapping = {
        user: {
          profile: {
            details: {
              name: 'userName'
            }
          }
        }
      };

      const inverted = invertMapping(mapping);
      expect(inverted.userName).toBeDefined();
    });

    test('should handle coerceType with NaN result', () => {
      const mapper = new Mapper({
        apiToForm: {
          value: 'value'
        }
      });

      const apiData = { value: 'NaN' };
      const formData = mapper.normalize(apiData);
      
      expect(formData.value).toBe('NaN');
    });

    test('should handle normalizer with null value and typeCoercion', () => {
      const mapper = new Mapper({
        apiToForm: {
          value: 'value'
        }
      });

      const apiData = { value: null };
      const formData = mapper.normalize(apiData);
      
      expect(formData.value).toBeNull();
    });

    test('should handle differ with object not being plain object', () => {
      const original = { value: { nested: 'data' } };
      const current = { value: 'string' };

      const changes = diff(original, current);
      expect(changes.value).toBe('string');
    });

    test('should handle differ setChangePath with array creation', () => {
      // This tests the array index handling in setChangePath
      const original = {};
      const current = { items: [{ id: 1 }, { id: 2 }] };

      const changes = diff(original, current);
      expect(changes.items).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test('should handle getChangedPaths with primitive to object', () => {
      const original = { value: null };
      const current = { value: { nested: 'data' } };

      const paths = getChangedPaths(original, current);
      expect(paths.length).toBeGreaterThan(0);
    });

    test('should handle denormalizer with transform returning undefined', () => {
      const formData = {
        value: 'test'
      };

      const mapping = {
        api_value: 'value'
      };

      const payload = denormalize(formData, mapping, {
        transform: {
          value: () => undefined
        },
        omitUndefined: true
      });

      expect(payload.api_value).toBeUndefined();
    });

    test('should handle normalizer with array and non-array source', () => {
      const apiData = {
        items: 'not an array'
      };

      const mapping = {
        items: [{ id: 'id' }]
      };

      const formData = normalize(apiData, mapping);
      expect(formData.items).toBeUndefined();
    });
  });
});

/**
 * Comprehensive tests for API Schema Mapper
 */

const Mapper = require('../src/Mapper');
const { normalize } = require('../src/normalizer');
const { denormalize } = require('../src/denormalizer');
const { diff, hasChanges } = require('../src/differ');
const { invertMapping, flattenObject, unflattenObject } = require('../src/utils');

describe('Mapper', () => {
  describe('Basic mapping', () => {
    test('should normalize simple API data to form schema', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email'
        }
      });

      const apiData = {
        user_name: 'john_doe',
        email_address: 'john@example.com'
      };

      const formData = mapper.normalize(apiData);

      expect(formData).toEqual({
        username: 'john_doe',
        email: 'john@example.com'
      });
    });

    test('should denormalize form data to API payload', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email'
        }
      });

      const formData = {
        username: 'john_doe',
        email: 'john@example.com'
      };

      const apiPayload = mapper.denormalize(formData);

      expect(apiPayload).toEqual({
        user_name: 'john_doe',
        email_address: 'john@example.com'
      });
    });
  });

  describe('Nested mapping', () => {
    test('should handle nested object mapping', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          contact: {
            email_address: 'email',
            phone_number: 'phone'
          }
        }
      });

      const apiData = {
        user_name: 'john_doe',
        contact: {
          email_address: 'john@example.com',
          phone_number: '555-1234'
        }
      };

      const formData = mapper.normalize(apiData);

      expect(formData).toEqual({
        username: 'john_doe',
        email: 'john@example.com',
        phone: '555-1234'
      });
    });

    test('should denormalize nested data correctly', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          contact: {
            email_address: 'email',
            phone_number: 'phone'
          }
        }
      });

      const formData = {
        username: 'john_doe',
        email: 'john@example.com',
        phone: '555-1234'
      };

      const apiPayload = mapper.denormalize(formData);

      expect(apiPayload).toEqual({
        user_name: 'john_doe',
        contact: {
          email_address: 'john@example.com',
          phone_number: '555-1234'
        }
      });
    });
  });

  describe('Diffing', () => {
    test('should detect changes between objects', () => {
      const original = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 30
      };

      const current = {
        username: 'john_doe',
        email: 'newemail@example.com',
        age: 31
      };

      const changes = diff(original, current);

      expect(changes).toEqual({
        email: 'newemail@example.com',
        age: 31
      });
    });

    test('should return empty object when no changes', () => {
      const original = { username: 'john_doe', email: 'john@example.com' };
      const current = { username: 'john_doe', email: 'john@example.com' };

      const changes = diff(original, current);

      expect(changes).toEqual({});
    });

    test('should detect nested changes', () => {
      const original = {
        user: {
          name: 'John',
          contact: {
            email: 'john@example.com'
          }
        }
      };

      const current = {
        user: {
          name: 'John',
          contact: {
            email: 'newemail@example.com'
          }
        }
      };

      const changes = diff(original, current);

      expect(changes).toEqual({
        user: {
          contact: {
            email: 'newemail@example.com'
          }
        }
      });
    });

    test('should check if objects have changes', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      const obj3 = { a: 1, b: 2 };

      expect(hasChanges(obj1, obj2)).toBe(true);
      expect(hasChanges(obj1, obj3)).toBe(false);
    });
  });

  describe('Payload building', () => {
    test('should build PATCH payload with only changes', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email',
          age: 'age'
        }
      });

      const initialForm = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 30
      };

      const currentForm = {
        username: 'john_doe',
        email: 'newemail@example.com',
        age: 31
      };

      const patchPayload = mapper.buildPatch(initialForm, currentForm);

      expect(patchPayload).toEqual({
        email_address: 'newemail@example.com',
        age: 31
      });
    });

    test('should return null when no changes for PATCH', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email'
        }
      });

      const formData = {
        username: 'john_doe',
        email: 'john@example.com'
      };

      const patchPayload = mapper.buildPatch(formData, formData);

      expect(patchPayload).toBeNull();
    });

    test('should build POST payload with all fields', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email',
          age: 'age'
        }
      });

      const formData = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 30
      };

      const postPayload = mapper.buildPost(formData);

      expect(postPayload).toEqual({
        user_name: 'john_doe',
        email_address: 'john@example.com',
        age: 30
      });
    });
  });

  describe('Complete workflow', () => {
    test('should handle GET -> normalize -> edit -> PATCH workflow', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          contact_info: {
            email_address: 'email',
            phone_number: 'phone'
          },
          metadata: {
            age: 'age'
          }
        }
      });

      // Simulate API GET response
      const apiResponse = {
        user_name: 'john_doe',
        contact_info: {
          email_address: 'john@example.com',
          phone_number: '555-1234'
        },
        metadata: {
          age: 30
        }
      };

      // Normalize to form
      const initialForm = mapper.normalize(apiResponse);

      expect(initialForm).toEqual({
        username: 'john_doe',
        email: 'john@example.com',
        phone: '555-1234',
        age: 30
      });

      // User edits form
      const editedForm = {
        ...initialForm,
        email: 'newemail@example.com',
        age: 31
      };

      // Build PATCH payload
      const patchPayload = mapper.buildPatch(initialForm, editedForm);

      expect(patchPayload).toEqual({
        contact_info: {
          email_address: 'newemail@example.com'
        },
        metadata: {
          age: 31
        }
      });
    });

    test('should use createPatchFromApi helper method', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email'
        }
      });

      const apiData = {
        user_name: 'john_doe',
        email_address: 'john@example.com'
      };

      const editedForm = {
        username: 'john_doe',
        email: 'newemail@example.com'
      };

      const patchPayload = mapper.createPatchFromApi(apiData, editedForm);

      expect(patchPayload).toEqual({
        email_address: 'newemail@example.com'
      });
    });
  });

  describe('Utilities', () => {
    test('should invert mapping correctly', () => {
      const mapping = {
        api_field: 'formField',
        nested: {
          api_nested: 'formNested'
        }
      };

      const inverted = invertMapping(mapping);

      expect(inverted).toEqual({
        formField: 'api_field',
        formNested: 'nested.api_nested'
      });
    });

    test('should flatten nested objects', () => {
      const nested = {
        a: {
          b: {
            c: 1
          },
          d: 2
        },
        e: 3
      };

      const flattened = flattenObject(nested);

      expect(flattened).toEqual({
        'a.b.c': 1,
        'a.d': 2,
        'e': 3
      });
    });

    test('should unflatten objects', () => {
      const flattened = {
        'a.b.c': 1,
        'a.d': 2,
        'e': 3
      };

      const nested = unflattenObject(flattened);

      expect(nested).toEqual({
        a: {
          b: {
            c: 1
          },
          d: 2
        },
        e: 3
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined values', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email'
        }
      });

      const apiData = {
        user_name: 'john_doe'
        // email_address is undefined
      };

      const formData = mapper.normalize(apiData);

      expect(formData).toEqual({
        username: 'john_doe',
        email: undefined
      });
    });

    test('should handle null values', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username',
          email_address: 'email'
        }
      });

      const apiData = {
        user_name: 'john_doe',
        email_address: null
      };

      const formData = mapper.normalize(apiData);

      expect(formData).toEqual({
        username: 'john_doe',
        email: null
      });
    });

    test('should handle empty objects', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        }
      });

      const apiData = {};
      const formData = mapper.normalize(apiData);

      expect(formData).toEqual({
        username: undefined
      });
    });
  });

  describe('Configuration', () => {
    test('should throw error without mapping config', () => {
      expect(() => {
        new Mapper({});
      }).toThrow('Mapper requires apiToForm mapping configuration');
    });

    test('should accept default values', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        },
        defaults: {
          username: 'anonymous'
        }
      });

      const apiData = {};
      const formData = mapper.normalize(apiData);

      expect(formData).toEqual({
        username: 'anonymous'
      });
    });

    test('should export configuration', () => {
      const mapper = new Mapper({
        apiToForm: {
          user_name: 'username'
        },
        defaults: {
          username: 'anonymous'
        }
      });

      const config = mapper.getConfig();

      expect(config.apiToForm).toEqual({
        user_name: 'username'
      });
      expect(config.defaults).toEqual({
        username: 'anonymous'
      });
    });
  });
});

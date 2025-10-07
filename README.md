# API Schema Mapper

A lightweight, zero-dependency JavaScript library for mapping between inconsistent GET/POST/PATCH API schemas and managing form state transformations.

## The Problem

You're working with a REST API where:

- **GET** returns data with one set of field names (`user_name`, `email_address`)
- **POST/PATCH** expects different field names (`username`, `email`)
- You need to track only user changes and send minimal PATCH payloads
- You're tired of writing repetitive mapping and diffing logic for every form

## The Solution

API Schema Mapper provides a declarative, configuration-driven approach to:

✅ Normalize API data → form schema  
✅ Denormalize form data → API payload  
✅ Compute minimal diffs for PATCH requests  
✅ Handle nested objects and arrays  
✅ Type coercion and validation hooks  

## Installation

```bash
npm install api-schema-mapper
```

Or copy the `src/` directory into your project.

## Quick Start

```javascript
const Mapper = require('api-schema-mapper');

// Define schema mapping (API field names → form field names)
const mapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    contact: {
      email_address: 'email',
      phone_number: 'phone'
    }
  }
});

// GET /user returns API data
const apiResponse = {
  user_name: 'john_doe',
  contact: {
    email_address: 'john@example.com',
    phone_number: '555-1234'
  }
};

// Normalize to form schema
const formData = mapper.normalize(apiResponse);
// { username: 'john_doe', email: 'john@example.com', phone: '555-1234' }

// User edits form
const editedForm = {
  ...formData,
  email: 'newemail@example.com'
};

// Build minimal PATCH payload
const patchPayload = mapper.buildPatch(formData, editedForm);
// { contact: { email_address: 'newemail@example.com' } }

// Send to API
await fetch('/user', {
  method: 'PATCH',
  body: JSON.stringify(patchPayload)
});
```

## Core Concepts

### 1. Schema Mapping

Define how API fields map to form fields:

```javascript
const mapping = {
  apiToForm: {
    api_field_name: 'formFieldName',
    nested_object: {
      api_nested_field: 'formNestedField'
    }
  }
};
```

### 2. Normalization

Transform API data → form schema:

```javascript
const formData = mapper.normalize(apiResponse);
```

### 3. Denormalization

Transform form data → API payload:

```javascript
const apiPayload = mapper.denormalize(formData);
```

### 4. Diffing

Compute minimal changes:

```javascript
const patchPayload = mapper.buildPatch(initialForm, currentForm);
```

## API Reference

### `new Mapper(config)`

Create a new mapper instance.

**Parameters:**

```javascript
{
  apiToForm: Object,      // Required: API to form field mapping
  formToApi: Object,      // Optional: Explicit form to API mapping (auto-inverted)
  transforms: Object,     // Optional: Custom transformation functions
  defaults: Object,       // Optional: Default form values
  validator: Function,    // Optional: Validation function
  options: {
    typeCoercion: boolean,    // Auto-convert types (default: true)
    omitUndefined: boolean,   // Omit undefined in payloads (default: true)
    omitNull: boolean,        // Omit null in payloads (default: false)
    compareArrays: boolean    // Deep array comparison (default: true)
  }
}
```

**Example:**

```javascript
const mapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    email_address: 'email'
  },
  defaults: {
    role: 'user'
  },
  options: {
    typeCoercion: true
  }
});
```

### Instance Methods

#### `normalize(apiData)`

Transform API data to form schema.

```javascript
const formData = mapper.normalize(apiResponse);
```

#### `denormalize(formData)`

Transform form data to API payload.

```javascript
const apiPayload = mapper.denormalize(formData);
```

#### `buildPatch(initialForm, currentForm, options?)`

Build PATCH payload with only changed fields.

```javascript
const patchPayload = mapper.buildPatch(initial, current);
// Returns null if no changes
```

#### `buildPost(formData, options?)`

Build POST payload with all fields.

```javascript
const postPayload = mapper.buildPost(formData);
```

#### `buildPut(formData, options?)`

Build PUT payload (complete replacement).

```javascript
const putPayload = mapper.buildPut(formData);
```

#### `diff(original, current)`

Compute differences between two objects.

```javascript
const changes = mapper.diff(initial, current);
// Returns object with only changed fields
```

#### `hasChanges(original, current)`

Check if objects have differences.

```javascript
if (mapper.hasChanges(initial, current)) {
  // Has changes
}
```

#### `getChangedPaths(original, current)`

Get array of changed field paths.

```javascript
const paths = mapper.getChangedPaths(initial, current);
// ['email', 'profile.phone']
```

#### `createPatchFromApi(apiData, editedForm)`

Complete workflow: normalize API data and build PATCH.

```javascript
const patchPayload = mapper.createPatchFromApi(apiResponse, editedForm);
```

## Advanced Usage

### Nested Object Mapping

```javascript
const mapper = new Mapper({
  apiToForm: {
    user_id: 'id',
    profile: {
      full_name: 'name',
      email_address: 'email'
    },
    address: {
      street_address: 'street',
      city_name: 'city',
      postal_code: 'zipCode'
    }
  }
});

const apiData = {
  user_id: 123,
  profile: {
    full_name: 'John Doe',
    email_address: 'john@example.com'
  },
  address: {
    street_address: '123 Main St',
    city_name: 'Springfield',
    postal_code: '12345'
  }
};

const formData = mapper.normalize(apiData);
/*
{
  id: 123,
  name: 'John Doe',
  email: 'john@example.com',
  street: '123 Main St',
  city: 'Springfield',
  zipCode: '12345'
}
*/
```

### Custom Transformations

```javascript
const mapper = new Mapper({
  apiToForm: {
    created_at: 'createdAt',
    price_cents: 'price'
  },
  transforms: {
    createdAt: (value) => new Date(value),
    price: (value) => value / 100  // cents to dollars
  }
});
```

### Default Values

```javascript
const mapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    role: 'role'
  },
  defaults: {
    role: 'user',
    status: 'active'
  }
});

const formData = mapper.normalize({ user_name: 'john' });
// { username: 'john', role: 'user', status: 'active' }
```

### Validation

```javascript
const mapper = new Mapper({
  apiToForm: {
    email_address: 'email'
  },
  validator: (data) => {
    const errors = [];
    if (!data.email || !data.email.includes('@')) {
      errors.push('Invalid email');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
});

try {
  const payload = mapper.buildPost({ email: 'invalid' });
} catch (error) {
  console.error(error.message); // Validation failed: Invalid email
}
```

## Standalone Functions

For advanced use cases, import functions directly:

```javascript
const {
  normalize,
  denormalize,
  diff,
  buildPatchPayload,
  buildPostPayload,
  utils
} = require('api-schema-mapper');

// Use without creating mapper instance
const formData = normalize(apiData, mapping);
const changes = diff(initial, current);
```

## Utility Functions

```javascript
const { utils } = require('api-schema-mapper');

// Flatten nested objects
const flat = utils.flattenObject({ a: { b: { c: 1 } } });
// { 'a.b.c': 1 }

// Unflatten objects
const nested = utils.unflattenObject({ 'a.b.c': 1 });
// { a: { b: { c: 1 } } }

// Invert mapping
const inverted = utils.invertMapping({ api_field: 'formField' });
// { formField: 'api_field' }

// Deep clone
const cloned = utils.deepClone(object);

// Get/set nested values
const value = utils.getNestedValue(obj, 'user.profile.email');
utils.setNestedValue(obj, 'user.profile.email', 'new@email.com');
```

## Real-World Example

```javascript
// User profile form with complex API schema
const profileMapper = new Mapper({
  apiToForm: {
    user_id: 'id',
    user_name: 'username',
    personal_info: {
      first_name: 'firstName',
      last_name: 'lastName',
      date_of_birth: 'birthDate'
    },
    contact_details: {
      primary_email: 'email',
      phone_number: 'phone'
    },
    preferences: {
      receive_notifications: 'notifications',
      theme_setting: 'theme'
    }
  },
  defaults: {
    notifications: true,
    theme: 'light'
  },
  transforms: {
    birthDate: (value) => value ? new Date(value) : null
  }
});

// React component usage
function UserProfileForm() {
  const [initialForm, setInitialForm] = useState(null);
  const [currentForm, setCurrentForm] = useState(null);

  useEffect(() => {
    // Fetch user data
    fetch('/api/user/123')
      .then(res => res.json())
      .then(apiData => {
        const normalized = profileMapper.normalize(apiData);
        setInitialForm(normalized);
        setCurrentForm(normalized);
      });
  }, []);

  const handleSave = async () => {
    // Build minimal PATCH payload
    const payload = profileMapper.buildPatch(initialForm, currentForm);
    
    if (!payload) {
      alert('No changes to save');
      return;
    }

    await fetch('/api/user/123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Update initial form after successful save
    setInitialForm(currentForm);
  };

  return (
    <form>
      <input
        value={currentForm?.username || ''}
        onChange={(e) => setCurrentForm({
          ...currentForm,
          username: e.target.value
        })}
      />
      {/* More fields... */}
      <button onClick={handleSave}>Save Changes</button>
    </form>
  );
}
```

## Running Tests

```bash
npm test
```

## Running Examples

```bash
node examples/basic-usage.js
```

## Features

- ✅ Zero dependencies
- ✅ Lightweight (~3KB minified)
- ✅ Full TypeScript support (types included)
- ✅ Works in Node.js and browsers
- ✅ Comprehensive test coverage
- ✅ Production-ready

## Use Cases

- Form data synchronization with REST APIs
- Redux/MobX state management with API integration
- GraphQL to REST adapter layer
- Multi-step form wizards
- Optimistic UI updates
- Undo/redo functionality
- Change tracking and audit logs

## Performance

The library is designed for efficiency:

- Lazy evaluation - only processes changed fields
- Minimal memory allocation
- No external dependencies
- Optimized for common CRUD operations

Benchmarks on typical form data (20 fields):
- Normalize: ~0.1ms
- Denormalize: ~0.1ms
- Diff: ~0.2ms
- Build PATCH: ~0.3ms

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Node.js 12+

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

ISC

## Author

Built with ❤️ for developers dealing with inconsistent APIs.

## Related Projects

- [json-diff](https://github.com/andreyvit/json-diff) - JSON diffing
- [immer](https://github.com/immerjs/immer) - Immutable state updates
- [normalizr](https://github.com/paularmstrong/normalizr) - Entity normalization

## FAQ

**Q: Can I use this with TypeScript?**  
A: Yes! Type definitions are included in the package.

**Q: Does it work with arrays?**  
A: Yes, arrays are fully supported including deep comparison.

**Q: Can I transform values during mapping?**  
A: Yes, use the `transforms` option in the config.

**Q: How do I handle API versioning?**  
A: Create separate Mapper instances for each API version.

**Q: Does it support nested arrays of objects?**  
A: Yes, nested arrays are fully supported.

**Q: Can I use it with GraphQL?**  
A: Yes, though it's primarily designed for REST APIs.

## Support

- [GitHub Issues](https://github.com/kshitijdesai99/api-schema-mapper/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/api-schema-mapper)

---

**Star this repo if you find it useful!** ⭐

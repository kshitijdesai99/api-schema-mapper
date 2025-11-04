# API Schema Mapper

A JavaScript library that solves the REST API field name inconsistency problem.

## Core Problem

Your API returns data with one set of field names (GET), but expects different names when you submit changes (POST/PATCH):
```javascript
// GET response
{
  user_name: "john",
  email_address: "john@example.com",
  contact_info: {
    phone_number: "555-1234"
  }
}

// Your form needs
{
  username: "john",
  email: "john@example.com", 
  phone: "555-1234"
}

// PATCH expects (only changed fields)
{
  email_address: "newemail@example.com"
}
```

## What It Does

**1. Normalize (API → Form)**
```javascript
const mapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    contact_info: {
      email_address: 'email',
      phone_number: 'phone'
    }
  }
});

const formData = mapper.normalize(apiResponse);
// { username: "john", email: "john@example.com", phone: "555-1234" }
```

**2. Denormalize (Form → API)**
```javascript
const apiPayload = mapper.denormalize(formData);
// Converts back to API format
```

**3. Diff & Build Minimal PATCH**
```javascript
const patchPayload = mapper.buildPatch(initialForm, editedForm);
// Only includes changed fields in API format
```

## Key Features

- **Nested object mapping** - Flattens/unflattens complex structures
- **Change tracking** - Computes minimal diffs
- **Type coercion** - Auto-converts strings to numbers, booleans, dates
- **Validation hooks** - Optional validation functions
- **Zero dependencies** - ~3KB minified

## Use Case

Perfect for React/Vue forms that need to:
- Sync with REST APIs having inconsistent schemas
- Send minimal PATCH payloads (bandwidth optimization)
- Track form changes for "unsaved changes" warnings
- Avoid writing repetitive mapping logic

## Implementation Details

- **Mapper class**: Main interface with pre-configured mappings
- **Standalone functions**: `normalize()`, `denormalize()`, `diff()` for advanced use
- **Payload builders**: `buildPatch()`, `buildPost()`, `buildPut()`
- **Utilities**: Deep clone, nested value get/set, flatten/unflatten objects

The library is production-ready with comprehensive test coverage and works in both Node.js and browsers.

/**
 * Basic usage examples for API Schema Mapper
 */

const Mapper = require('../src/index');

console.log('=== API Schema Mapper Examples ===\n');

// ============================================================================
// Example 1: Simple field mapping
// ============================================================================
console.log('--- Example 1: Simple Field Mapping ---');

const simpleMapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    email_address: 'email',
    phone_number: 'phone'
  }
});

// API GET response
const apiResponse = {
  user_name: 'john_doe',
  email_address: 'john@example.com',
  phone_number: '555-1234'
};

// Normalize to form
const formData = simpleMapper.normalize(apiResponse);
console.log('Normalized form data:', formData);

// Denormalize back to API format
const apiPayload = simpleMapper.denormalize(formData);
console.log('Denormalized API payload:', apiPayload);
console.log();

// ============================================================================
// Example 2: Nested object mapping
// ============================================================================
console.log('--- Example 2: Nested Object Mapping ---');

const nestedMapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    contact: {
      email_address: 'email',
      phone_number: 'phone'
    },
    address: {
      street_address: 'street',
      city_name: 'city',
      postal_code: 'zipCode'
    }
  }
});

const nestedApiResponse = {
  user_name: 'jane_smith',
  contact: {
    email_address: 'jane@example.com',
    phone_number: '555-5678'
  },
  address: {
    street_address: '123 Main St',
    city_name: 'Springfield',
    postal_code: '12345'
  }
};

const nestedFormData = nestedMapper.normalize(nestedApiResponse);
console.log('Normalized nested data:', JSON.stringify(nestedFormData, null, 2));
console.log();

// ============================================================================
// Example 3: PATCH payload with minimal changes
// ============================================================================
console.log('--- Example 3: PATCH Payload Generation ---');

const patchMapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    email_address: 'email',
    age: 'age',
    status: 'status'
  }
});

const initialData = {
  username: 'john_doe',
  email: 'john@example.com',
  age: 30,
  status: 'active'
};

// User edits only email and age
const editedData = {
  username: 'john_doe',
  email: 'newemail@example.com',
  age: 31,
  status: 'active'
};

const patchPayload = patchMapper.buildPatch(initialData, editedData);
console.log('PATCH payload (only changes):', patchPayload);
console.log();

// ============================================================================
// Example 4: POST payload with all fields
// ============================================================================
console.log('--- Example 4: POST Payload Generation ---');

const postMapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    email_address: 'email',
    password_hash: 'password'
  },
  defaults: {
    role: 'user',
    status: 'pending'
  }
});

const newUserForm = {
  username: 'new_user',
  email: 'newuser@example.com',
  password: 'hashed_password_123',
  role: 'admin'
};

const postPayload = postMapper.buildPost(newUserForm);
console.log('POST payload:', postPayload);
console.log();

// ============================================================================
// Example 5: Complete GET -> PATCH workflow
// ============================================================================
console.log('--- Example 5: Complete GET -> PATCH Workflow ---');

const workflowMapper = new Mapper({
  apiToForm: {
    user_id: 'id',
    user_name: 'username',
    profile: {
      full_name: 'name',
      email_address: 'email',
      phone_number: 'phone'
    },
    settings: {
      notifications_enabled: 'notifications',
      theme_preference: 'theme'
    }
  }
});

// Step 1: GET request returns API data
const getUserResponse = {
  user_id: 123,
  user_name: 'john_doe',
  profile: {
    full_name: 'John Doe',
    email_address: 'john@example.com',
    phone_number: '555-1234'
  },
  settings: {
    notifications_enabled: true,
    theme_preference: 'dark'
  }
};

// Step 2: Normalize to form schema
const initialForm = workflowMapper.normalize(getUserResponse);
console.log('Initial form (from GET):', JSON.stringify(initialForm, null, 2));

// Step 3: User edits form
const editedForm = {
  ...initialForm,
  email: 'newemail@example.com',
  phone: '555-9999',
  theme: 'light'
};

// Step 4: Generate minimal PATCH payload
const minimalPatch = workflowMapper.buildPatch(initialForm, editedForm);
console.log('\nMinimal PATCH payload:', JSON.stringify(minimalPatch, null, 2));
console.log();

// Alternative: Use helper method
const quickPatch = workflowMapper.createPatchFromApi(getUserResponse, editedForm);
console.log('Using createPatchFromApi:', JSON.stringify(quickPatch, null, 2));
console.log();

// ============================================================================
// Example 6: Checking for changes
// ============================================================================
console.log('--- Example 6: Change Detection ---');

const form1 = { username: 'john', email: 'john@example.com' };
const form2 = { username: 'john', email: 'newemail@example.com' };
const form3 = { username: 'john', email: 'john@example.com' };

console.log('Has changes (form1 vs form2):', simpleMapper.hasChanges(form1, form2));
console.log('Has changes (form1 vs form3):', simpleMapper.hasChanges(form1, form3));

const changedPaths = simpleMapper.getChangedPaths(form1, form2);
console.log('Changed paths:', changedPaths);
console.log();

// ============================================================================
// Example 7: Using standalone functions
// ============================================================================
console.log('--- Example 7: Standalone Functions ---');

const { normalize, denormalize, diff } = require('../src/index');

const mapping = {
  api_field: 'formField',
  another_field: 'anotherField'
};

const apiData = {
  api_field: 'value1',
  another_field: 'value2'
};

const normalized = normalize(apiData, mapping);
console.log('Normalized:', normalized);

const denormalized = denormalize(normalized, mapping);
console.log('Denormalized:', denormalized);

const changes = diff(
  { formField: 'value1', anotherField: 'value2' },
  { formField: 'value1', anotherField: 'new_value' }
);
console.log('Diff:', changes);
console.log();

// ============================================================================
// Example 8: Utility functions
// ============================================================================
console.log('--- Example 8: Utility Functions ---');

const { utils } = require('../src/index');

const nestedObj = {
  user: {
    profile: {
      name: 'John',
      email: 'john@example.com'
    }
  }
};

const flattened = utils.flattenObject(nestedObj);
console.log('Flattened:', flattened);

const unflattened = utils.unflattenObject(flattened);
console.log('Unflattened:', unflattened);

const inverted = utils.invertMapping({
  api_field: 'formField',
  nested: { api_nested: 'formNested' }
});
console.log('Inverted mapping:', inverted);

console.log('\n=== All examples completed ===');

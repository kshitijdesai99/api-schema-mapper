# API Schema Mapper - Complete Walkthrough

## What Problem Does This Solve?

When building web applications, you often face this frustrating situation:

**Your API returns data like this:**
```javascript
{
  user_name: "john_doe",
  email_address: "john@example.com",
  contact_info: {
    phone_number: "555-1234"
  }
}
```

**But your form needs data like this:**
```javascript
{
  username: "john_doe",
  email: "john@example.com",
  phone: "555-1234"
}
```

And when you submit changes, you need to convert it back! This library automates all of that.

---

## Real-World Example: User Profile Editor

Let's say you're building a user profile page. Here's the complete workflow:

### Step 1: Install and Setup

```javascript
const Mapper = require('./src/index');

// Define how API fields map to your form fields
const mapper = new Mapper({
  apiToForm: {
    // API field: 'form field'
    user_name: 'username',
    email_address: 'email',
    contact_info: {
      phone_number: 'phone',
      address_line1: 'street'
    },
    preferences: {
      receive_emails: 'notifications',
      theme_setting: 'theme'
    }
  },
  // Optional: default values
  defaults: {
    notifications: true,
    theme: 'light'
  }
});
```

### Step 2: Fetch Data from API (GET Request)

```javascript
// Your API returns this messy structure
const apiResponse = await fetch('/api/users/123').then(r => r.json());
// {
//   user_name: "john_doe",
//   email_address: "john@example.com",
//   contact_info: {
//     phone_number: "555-1234",
//     address_line1: "123 Main St"
//   },
//   preferences: {
//     receive_emails: true,
//     theme_setting: "dark"
//   }
// }

// Transform it to clean form data
const formData = mapper.normalize(apiResponse);
// {
//   username: "john_doe",
//   email: "john@example.com",
//   phone: "555-1234",
//   street: "123 Main St",
//   notifications: true,
//   theme: "dark"
// }

// Now you can use this in your form!
```

### Step 3: User Edits the Form

```javascript
// User changes some fields in your form
const editedForm = {
  username: "john_doe",        // unchanged
  email: "newemail@example.com", // CHANGED
  phone: "555-9999",           // CHANGED
  street: "123 Main St",       // unchanged
  notifications: true,         // unchanged
  theme: "light"               // CHANGED
};
```

### Step 4: Send Only Changes (PATCH Request)

```javascript
// Build a minimal PATCH payload with ONLY the changed fields
const patchPayload = mapper.buildPatch(formData, editedForm);

// Result: Only changed fields in API format!
// {
//   email_address: "newemail@example.com",
//   contact_info: {
//     phone_number: "555-9999"
//   },
//   preferences: {
//     theme_setting: "light"
//   }
// }

// Send to API
await fetch('/api/users/123', {
  method: 'PATCH',
  body: JSON.stringify(patchPayload)
});
```

### Step 5: Create New User (POST Request)

```javascript
// For creating a new user, send ALL fields
const newUserForm = {
  username: "jane_smith",
  email: "jane@example.com",
  phone: "555-0000",
  street: "456 Oak Ave"
};

const postPayload = mapper.buildPost(newUserForm);
// {
//   user_name: "jane_smith",
//   email_address: "jane@example.com",
//   contact_info: {
//     phone_number: "555-0000",
//     address_line1: "456 Oak Ave"
//   },
//   preferences: {
//     receive_emails: true,  // from defaults
//     theme_setting: "light" // from defaults
//   }
// }

await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(postPayload)
});
```

---

## React Example

Here's how you'd use it in a React component:

```javascript
import { useState, useEffect } from 'react';
const Mapper = require('./src/index');

const mapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    email_address: 'email',
    contact_info: {
      phone_number: 'phone'
    }
  }
});

function UserProfileForm({ userId }) {
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user data
  useEffect(() => {
    async function loadUser() {
      const apiData = await fetch(`/api/users/${userId}`).then(r => r.json());
      const normalized = mapper.normalize(apiData);
      setInitialData(normalized);
      setFormData(normalized);
    }
    loadUser();
  }, [userId]);

  // Save changes
  async function handleSave() {
    setLoading(true);
    
    // Only send changed fields!
    const patchPayload = mapper.buildPatch(initialData, formData);
    
    if (patchPayload) {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload)
      });
      
      // Update initial data after successful save
      setInitialData(formData);
    }
    
    setLoading(false);
  }

  // Check if form has unsaved changes
  const hasChanges = mapper.hasChanges(initialData, formData);

  return (
    <form>
      <input
        value={formData?.username || ''}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
      />
      <input
        value={formData?.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        value={formData?.phone || ''}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      
      <button 
        onClick={handleSave} 
        disabled={!hasChanges || loading}
      >
        {hasChanges ? 'Save Changes' : 'No Changes'}
      </button>
    </form>
  );
}
```

---

## Key Features Explained

### 1. **Automatic Type Conversion**
```javascript
// API returns strings, library converts them
const apiData = {
  age: "25",           // string
  active: "true",      // string
  created: "2020-01-01T00:00:00Z" // ISO date string
};

const formData = mapper.normalize(apiData);
// {
//   age: 25,           // number
//   active: true,      // boolean
//   created: Date      // Date object
// }
```

### 2. **Custom Transformations**
```javascript
const mapper = new Mapper({
  apiToForm: {
    birth_date: 'birthDate',
    salary: 'salary'
  },
  transforms: {
    birthDate: (value) => value ? new Date(value) : null,
    salary: (value) => value / 100 // API stores cents, form shows dollars
  }
});
```

### 3. **Validation**
```javascript
const mapper = new Mapper({
  apiToForm: {
    user_name: 'username',
    email_address: 'email'
  },
  validator: (data) => {
    const errors = [];
    if (!data.username) errors.push('Username required');
    if (!data.email?.includes('@')) errors.push('Invalid email');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
});

// Throws error if validation fails
const payload = mapper.buildPost(formData);
```

### 4. **Detect Changes**
```javascript
const original = { username: 'john', email: 'john@example.com' };
const current = { username: 'john', email: 'newemail@example.com' };

// Check if anything changed
mapper.hasChanges(original, current); // true

// Get list of changed fields
mapper.getChangedPaths(original, current); // ['email']

// Get the actual changes
mapper.diff(original, current); // { email: 'newemail@example.com' }
```

---

## When Should You Use This?

✅ **Use it when:**
- Your API schema doesn't match your form structure
- You need to send minimal PATCH payloads (save bandwidth)
- You have nested API responses that need flattening
- You want to track form changes easily
- You need type conversion (strings → numbers, dates, etc.)

❌ **Don't need it when:**
- Your API already returns data in the exact format you need
- You're building a simple CRUD app with matching schemas
- You don't care about sending full objects on every update

---

## Quick Reference

```javascript
// Setup
const mapper = new Mapper({ apiToForm: { api_field: 'formField' } });

// GET: API → Form
const formData = mapper.normalize(apiResponse);

// POST: Form → API (all fields)
const postPayload = mapper.buildPost(formData);

// PATCH: Form → API (only changes)
const patchPayload = mapper.buildPatch(initialForm, editedForm);

// Check for changes
const hasChanges = mapper.hasChanges(initial, current);

// Get changed field paths
const changedPaths = mapper.getChangedPaths(initial, current);
```

---

That's it! The library handles all the tedious mapping, diffing, and payload building so you can focus on building your UI.

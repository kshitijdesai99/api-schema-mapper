# API Schema Mapper — walkthrough

The library keeps API field names out of your form code and turns edited forms back into API payloads.

```js
const Mapper = require('api-schema-mapper');

const mapper = new Mapper({
  fields: {
    name: { from: 'user_name', to: 'displayName' },
    email: { from: 'contact.email_address', to: 'email' },
    id: { from: 'user_id', readOnly: true }
  }
});

const initialForm = mapper.normalize({
  user_name: 'Ada',
  contact: { email_address: 'ada@example.test' },
  user_id: 7
});

const editedForm = { ...initialForm, name: 'Grace' };
const patch = mapper.buildPatch(initialForm, editedForm);
// { displayName: 'Grace' }
```

Use `buildPost(form)` to create a new record, `buildPut(form)` for a complete replacement, and `buildPatch(initial, current)` for changed fields. Deleted properties become `null` by default. Arrays are sent in full whenever any item changes.

Transforms have separate directions:

```js
price: {
  from: 'price_cents',
  to: 'price_cents',
  fromApi: cents => cents / 100,
  toApi: dollars => Math.round(dollars * 100)
}
```

Coercion is opt-in, so values such as `00123` stay strings:

```js
age: { from: 'age', to: 'age', coerce: 'number' }
```

See [README.md](README.md) for validation, TypeScript, React, composition, legacy syntax, every option, and migration details.

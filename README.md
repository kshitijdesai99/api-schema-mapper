# API Schema Mapper

Predictable, bidirectional mapping between API payloads and form state.

```text
API response -> normalize -> form data -> edit -> API payload
```

Version 2 focuses on making every supported value round-trip deliberately: nested objects and arrays, asymmetric schemas, directional transforms, deletion-aware PATCH payloads, explicit coercion, and operation-aware validation.

## Requirements and installation

Node.js 20, 22, and 24 are tested in CI.

```bash
npm install api-schema-mapper
```

Both module systems are exported:

```js
const Mapper = require('api-schema-mapper');
```

```js
import Mapper, { MapperValidationError } from 'api-schema-mapper';
```

## Recommended field configuration

```js
const mapper = new Mapper({
  fields: {
    name: {
      from: 'profile.user_name',
      to: 'displayName'
    },
    price: {
      from: 'price_cents',
      to: 'price_cents',
      fromApi: value => value / 100,
      toApi: value => Math.round(value * 100)
    },
    id: {
      from: 'user_id',
      readOnly: true
    },
    password: {
      to: 'password',
      operations: ['post']
    }
  }
});

const form = mapper.normalize({
  profile: { user_name: 'Ada' },
  price_cents: 1299,
  user_id: 7
});
// { name: 'Ada', price: 12.99, id: 7 }

mapper.buildPost({ ...form, password: 'secret' });
// { displayName: 'Ada', price_cents: 1299, password: 'secret' }
```

Each form field can define:

- `from`: API response path.
- `to`: API request path. It may differ from `from`.
- `fromApi` and `toApi`: directional transforms.
- `default`: field default when the response value is absent.
- `coerce`: `number`, `boolean`, `date`, `string`, or a function.
- `readOnly`: normalize the field but never send it.
- `operations`: any of `get`, `normalize`, `post`, `put`, `patch`, or `partial`.

## Legacy mapping shorthand

The original syntax remains supported:

```js
const mapper = new Mapper({
  apiToForm: {
    user_name: 'name',
    contacts: [{
      email_address: 'email',
      phone_number: 'phone'
    }]
  },
  formToApi: {
    name: 'displayName',
    contacts: [{
      email: 'email_address',
      phone: 'phone_number'
    }]
  },
  transforms: {
    name: {
      fromApi: value => value ?? '',
      toApi: value => value.trim()
    }
  }
});
```

When `formToApi` is absent, it is generated from `apiToForm`. An explicit reverse mapping always wins, which supports different GET and POST schemas.

## PATCH behavior

```js
const initial = { name: 'Ada', nickname: 'A', tags: ['js'] };
const current = { name: 'Grace', tags: ['js', 'api'] };

mapper.buildPatch(initial, current);
// mapped equivalent of:
// { name: 'Grace', nickname: null, tags: ['js', 'api'] }
```

Arrays are atomic: editing, inserting, deleting, or reordering any item sends the complete current array. A deleted property uses `options.deletedValue`, which defaults to `null`. This is distinct from setting a property to `undefined`; `undefined` is omitted by default.

## Options

| Option | Default | Effect |
| --- | --- | --- |
| `omitUndefined` | `true` | Exclude fields whose value is `undefined`. |
| `omitNull` | `false` | Exclude fields whose value is `null`. |
| `deletedValue` | `null` | Value used when a property is removed from the current form. |
| `deep` | `true` | Diff plain objects recursively. Arrays remain atomic. |
| `includeUnchanged` | `false` | Include the complete current form in PATCH payload generation. |
| `ignoreFields` | `[]` | Form paths ignored by diff and changed-path operations. |
| `typeCoercion` | `false` | Kept as a safe marker only; setting it to `true` throws. Use `coerce`. |

Options configured on the mapper are used consistently by `diff`, `getChangedPaths`, `buildPatch`, `buildPost`, `buildPut`, and `buildPartial`. Per-call options override mapper options.

## Explicit coercion

Global guessing is intentionally disabled, so postcodes, phone numbers, and identifiers retain leading zeroes.

```js
const mapper = new Mapper({
  apiToForm: { age: 'age', active: 'active', postcode: 'postcode' },
  coerce: { age: 'number', active: 'boolean' }
});

mapper.normalize({ age: '27', active: 'false', postcode: '00123' });
// { age: 27, active: false, postcode: '00123' }
```

Invalid conversion throws `MapperTransformError` with `formPath`, `value`, and operation details.

## Validation

```js
const mapper = new Mapper({
  apiToForm: { email_address: 'email', user_name: 'name' },
  validate: {
    form: (data, context) => validateCompleteForm(data, context),
    patch: (changes, context) => validatePatch(changes, context),
    payload: (payload, context) => validateApiPayload(payload, context)
  }
});
```

The context contains `operation` (`normalize`, `post`, `put`, or `patch`) and `phase` (`form` or `payload`). Validators may return a boolean, `{ valid, errors }`, or a safe-parse-style `{ success, error }` result. Invalid results throw `MapperValidationError`:

```js
try {
  mapper.buildPost(form);
} catch (error) {
  if (error instanceof MapperValidationError) {
    console.log(error.operation, error.errors);
    // [{ path: 'email', code: 'invalid_email', message: '...' }]
  }
}
```

Optional adapters do not add runtime dependencies:

```js
import { zodValidator } from 'api-schema-mapper/zod';
import { valibotValidator } from 'api-schema-mapper/valibot';

const validateZod = zodValidator(UserSchema);
const validateValibot = valibotValidator(UserSchema, safeParse);
```

## Composition

Field-based mappers can be composed. Conflicting source or destination paths fail at construction time.

```js
const userMapper = Mapper.compose(identityMapper, addressMapper, preferencesMapper);
```

## React helper

React is an optional peer dependency and is only loaded by this subpath:

```js
import { useMappedForm } from 'api-schema-mapper/react';

const {
  initialForm,
  form,
  setForm,
  setField,
  changedPaths,
  hasChanges,
  createPatch,
  reset
} = useMappedForm({ mapper, apiData });
```

## TypeScript

Declarations are bundled and checked during CI. Mapper result types follow the supplied API and form generics:

```ts
type ApiUser = { user_name: string; price_cents: number };
type UserForm = { name: string; price: number };

const mapper = new Mapper<ApiUser, UserForm>({
  fields: {
    name: { from: 'user_name', to: 'displayName' },
    price: { from: 'price_cents', to: 'price_cents' }
  }
});

const form: UserForm = mapper.normalize(apiUser);
const patch: Partial<ApiUser> | null = mapper.buildPatch(form, editedForm);
```

## Public methods

- `normalize(apiData)`
- `denormalize(formData)`
- `diff(original, current)`
- `hasChanges(original, current)`
- `getChangedPaths(original, current)`
- `buildPatch(initialForm, currentForm)`
- `buildPost(formData)`
- `buildPut(formData)`
- `buildPartial(formData, fields)`
- `createPatchFromApi(apiData, editedForm)`
- `clone(overrides)` and `getConfig()`

Equivalent standalone functions are exported for advanced use.

## Errors and configuration safety

The package exports `MapperConfigurationError`, `MapperValidationError`, and `MapperTransformError`. Invalid, duplicate, empty, malformed, circular, and unsafe mapping paths are rejected during construction. The path segments `__proto__`, `prototype`, and `constructor` are blocked.

The mapper supports primitives, `null`, `undefined`, plain objects, arrays, `Date`, and `NaN` in comparisons. Unsupported object types such as `Map` and `Set` are rejected when payload values are cloned instead of being converted accidentally.

## Verification commands

```bash
npm test                 # behavior suites
npm run test:coverage    # enforced 90% global thresholds
npm run typecheck        # declaration consumer check
npm run test:package     # npm pack + clean CJS and ESM consumers
npm run benchmark        # reproducible local 20-field normalization benchmark
npm run check            # complete CI gate
```

Package size, performance, and coverage are intentionally not stated as fixed marketing numbers; use the commands above to measure the checked-out version and environment.

## Migrating from v1

Version 2 requires Node 20+. Automatic type guessing is removed: replace `options.typeCoercion: true` with `coerce` entries. Arrays in PATCH are now whole-value replacements, removed fields map to `null` by default, transforms may be directional, and explicit `formToApi` mappings are honored. Existing `apiToForm` shorthand continues to work.

## Maintainers

See the [publishing guide](docs/publishing.md) for the release gate, package inspection, and publication workflow.

## License

ISC. See [LICENSE](LICENSE).

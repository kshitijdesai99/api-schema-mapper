# Repository notes

API Schema Mapper converts API responses to editable form data and converts complete or changed form data back into request payloads.

The supported public contracts are documented in [README.md](README.md). Important implementation rules:

- arrays are normalized recursively and treated as atomic PATCH values;
- absent properties, explicit `undefined`, and `null` are distinct;
- `deletedValue` defaults to `null`;
- transforms use `fromApi` and `toApi` directions;
- coercion is field-specific; global type guessing is rejected;
- explicit `formToApi` mappings override automatic inversion;
- both legacy nested mappings and field-based mappings are supported;
- unsafe path segments and malformed mappings fail during construction.

Run the full gate before changing package claims or publishing:

```bash
npm run check
```

This runs behavior tests with enforced coverage thresholds, checks TypeScript declarations, builds the CommonJS and ESM distributions, packs the package, and executes clean consumer smoke tests. Use `npm run benchmark` for locally reproducible performance data. Do not state fixed bundle-size or performance figures unless they are measured and committed by an automated process.

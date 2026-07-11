# Publishing guide

## Release gate

Use a supported Node version and a clean checkout:

```bash
npm ci
npm run check
npm pack --dry-run
```

The gate must pass all of the following:

- behavior-focused Jest suites and 90% global coverage thresholds;
- TypeScript declaration consumer compilation;
- generated CommonJS and browser-compatible ESM entry points;
- an actual `npm pack` tarball installed and tested through CommonJS, Node ESM,
  browser-core, and browser-React consumers.

Inspect the dry-run file list. The package should contain `dist/`, `README.md`, and `LICENSE`; it should not contain source tests, coverage output, or maintainer documents.

## Versioning

Version 2 is a breaking release because Node 20 is the minimum, automatic coercion is disabled, arrays are atomic in PATCH, and deletion defaults to `null`. Use normal semantic versioning after that:

```bash
npm version patch
npm version minor
npm version major
```

Run the release gate again after changing the version so the generated exports and package smoke test reflect the release metadata.

## Publish

```bash
npm login
npm whoami
npm publish
```

For scoped packages, add `--access public` when appropriate. Publishing changes external state and should only be done after explicit maintainer approval.

## Verify

Install the published version in a new directory and repeat the CommonJS and ESM examples from [README.md](../README.md). Confirm the npm package page shows the intended README, version, license, repository, and Node requirement.

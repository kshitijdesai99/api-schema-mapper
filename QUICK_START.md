# Maintainer quick start

Before publishing:

```bash
npm ci
npm run check
npm pack --dry-run
```

`npm run check` enforces behavior coverage, checks the bundled declarations, builds the package, packs it, installs it into a clean temporary project, and executes both CommonJS and ESM consumers.

Version 2 requires Node 20+ and intentionally changes coercion, array PATCH, and deletion defaults. Read the migration section in [README.md](README.md) before publishing.

To publish after the clean gate:

```bash
npm login
npm publish
```

Do not publish from a dirty tree. Confirm the generated tarball contains `dist/index.cjs`, `dist/index.js`, declarations, and the React/Zod/Valibot subpath files.

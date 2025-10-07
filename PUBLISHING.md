# Publishing to NPM - Step by Step Guide

## Prerequisites

### 1. Create NPM Account
If you don't have one:
- Go to https://www.npmjs.com/signup
- Create an account
- Verify your email

### 2. Check Package Name Availability
Before publishing, check if the name is available:
```bash
npm search api-schema-mapper
```

**Note:** The name `api-schema-mapper` might be taken. You may need to:
- Use a scoped package: `@kshitijdesai99/api-schema-mapper`
- Choose a different name: `form-api-mapper`, `api-form-bridge`, etc.

---

## Step-by-Step Publishing Process

### Step 1: Update Package.json

Update these fields in `package.json`:

```json
{
  "name": "api-schema-mapper",  // or @kshitijdesai99/api-schema-mapper
  "version": "1.0.0",
  "author": "kshitijdesai99 <kshitijdesai99@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/kshitijdesai99/api-schema-mapper.git"
  }
}
```

### Step 2: Create .npmignore (Optional)

Create `.npmignore` to exclude files from the package:

```
node_modules/
test/
coverage/
examples/
.git/
.gitignore
*.test.js
READMEforDummies.md
PUBLISHING.md
```

### Step 3: Test Your Package Locally

```bash
# Run all tests
npm test

# Check what will be published
npm pack --dry-run

# This shows all files that will be included
```

### Step 4: Login to NPM

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

Verify you're logged in:
```bash
npm whoami
```

### Step 5: Publish!

```bash
# For public package
npm publish

# For scoped package (first time)
npm publish --access public
```

---

## If Package Name is Taken

### Option 1: Use Scoped Package

Update `package.json`:
```json
{
  "name": "@kshitijdesai99/api-schema-mapper"
}
```

Then publish:
```bash
npm publish --access public
```

Users will install it as:
```bash
npm install @kshitijdesai99/api-schema-mapper
```

### Option 2: Choose Different Name

Some alternatives:
- `form-api-mapper`
- `api-form-bridge`
- `schema-form-mapper`
- `rest-form-mapper`
- `api-normalizer`

---

## After Publishing

### 1. Verify on NPM
Visit: `https://www.npmjs.com/package/api-schema-mapper`

### 2. Test Installation
In a new directory:
```bash
mkdir test-install
cd test-install
npm init -y
npm install api-schema-mapper

# Test it works
node -e "const Mapper = require('api-schema-mapper'); console.log('Works!');"
```

### 3. Add NPM Badge to README
Add this to your README.md:
```markdown
[![npm version](https://badge.fury.io/js/api-schema-mapper.svg)](https://www.npmjs.com/package/api-schema-mapper)
[![npm downloads](https://img.shields.io/npm/dm/api-schema-mapper.svg)](https://www.npmjs.com/package/api-schema-mapper)
```

---

## Publishing Updates

### Patch Release (1.0.0 → 1.0.1)
Bug fixes, minor changes:
```bash
npm version patch
npm publish
```

### Minor Release (1.0.0 → 1.1.0)
New features, backward compatible:
```bash
npm version minor
npm publish
```

### Major Release (1.0.0 → 2.0.0)
Breaking changes:
```bash
npm version major
npm publish
```

---

## Optional: Setup GitHub Repository

### 1. Create GitHub Repo
```bash
# Initialize git (if not already)
git init

# Create .gitignore
echo "node_modules/
coverage/
.DS_Store" > .gitignore

# Commit everything
git add .
git commit -m "Initial commit: API Schema Mapper v1.0.0"

# Create repo on GitHub, then:
git remote add origin https://github.com/kshitijdesai99/api-schema-mapper.git
git branch -M main
git push -u origin main
```

### 2. Add GitHub Actions (CI/CD)

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

---

## Troubleshooting

### "Package name already exists"
- Use scoped package: `@kshitijdesai99/api-schema-mapper`
- Choose different name

### "You must be logged in"
```bash
npm login
```

### "403 Forbidden"
- Check if you're logged in: `npm whoami`
- Verify email is confirmed
- Check package name isn't taken

### "402 Payment Required"
- Scoped packages need `--access public` flag

---

## Quick Command Reference

```bash
# Check what will be published
npm pack --dry-run

# Login
npm login

# Publish
npm publish

# Publish scoped package
npm publish --access public

# Update version
npm version patch|minor|major

# Unpublish (within 72 hours)
npm unpublish api-schema-mapper@1.0.0
```

---

## Next Steps After Publishing

1. ✅ Add to GitHub
2. ✅ Add badges to README
3. ✅ Share on social media
4. ✅ Add to awesome lists
5. ✅ Write blog post
6. ✅ Monitor issues/PRs

Good luck! 🚀

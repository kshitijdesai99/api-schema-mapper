# Quick Start - Publishing Your Package

## 🚀 Ready to Publish? Follow These Steps:

### 1. Choose Your Package Name

**Option A: Check if name is available**
```bash
npm search api-schema-mapper
```

**Option B: Use scoped package (recommended)**
Update `package.json`:
```json
{
  "name": "@kshitijdesai99/api-schema-mapper"
}
```

### 2. Update Your Info

Edit `package.json`:
```json
{
  "author": "Kshitij Desai <kshitijdesai99@gmail.com>",
  "repository": {
    "url": "https://github.com/kshitijdesai99/api-schema-mapper.git"
  }
}
```

### 3. Run Final Tests

```bash
npm test
```

### 4. Login to NPM

```bash
npm login
```

### 5. Publish!

```bash
# For scoped package
npm publish --access public

# For regular package (if name is available)
npm publish
```

### 6. Verify

Visit: `https://www.npmjs.com/package/@kshitijdesai99/api-schema-mapper`

---

## 📝 Complete Checklist

- [ ] NPM account created and verified
- [ ] Package name chosen (available or scoped)
- [ ] `package.json` updated with your info
- [ ] All tests passing (`npm test`)
- [ ] Logged into NPM (`npm login`)
- [ ] Published successfully
- [ ] Verified on npmjs.com
- [ ] Tested installation in new project

---

## 🔄 Publishing Updates Later

```bash
# Bug fix (1.0.0 → 1.0.1)
npm version patch && npm publish

# New feature (1.0.0 → 1.1.0)
npm version minor && npm publish

# Breaking change (1.0.0 → 2.0.0)
npm version major && npm publish
```

---

## 📚 Full Documentation

See `PUBLISHING.md` for detailed instructions and troubleshooting.

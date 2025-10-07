/**
 * Differ - Compute minimal differences between objects
 */

const { isPlainObject, deepClone } = require('./utils');

/**
 * Compute diff between two objects
 * @param {Object} original - Original state
 * @param {Object} current - Current state
 * @param {Object} options - Diff options
 * @returns {Object} Object containing only changed fields
 */
function diff(original, current, options = {}) {
  const {
    compareArrays = true,
    deep = true,
    ignoreFields = []
  } = options;

  const changes = {};

  function computeDiff(oldVal, newVal, path = '') {
    // Skip ignored fields
    if (ignoreFields.includes(path)) {
      return;
    }

    // Both undefined/null - no change
    if (oldVal === newVal) {
      return;
    }

    // Type changed
    if (typeof oldVal !== typeof newVal) {
      setChangePath(changes, path, newVal);
      return;
    }

    // Primitive value changed
    if (typeof newVal !== 'object' || newVal === null) {
      if (oldVal !== newVal) {
        setChangePath(changes, path, newVal);
      }
      return;
    }

    // Array comparison
    if (Array.isArray(newVal)) {
      if (!compareArrays) {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          setChangePath(changes, path, newVal);
        }
        return;
      }

      // Detailed array diff
      if (!Array.isArray(oldVal) || oldVal.length !== newVal.length) {
        setChangePath(changes, path, newVal);
        return;
      }

      for (let i = 0; i < newVal.length; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`;
        computeDiff(oldVal[i], newVal[i], itemPath);
      }
      return;
    }

    // Object comparison
    if (isPlainObject(newVal)) {
      if (!isPlainObject(oldVal)) {
        setChangePath(changes, path, newVal);
        return;
      }

      // Check all keys in new object
      for (const key in newVal) {
        if (!newVal.hasOwnProperty(key)) continue;
        const newPath = path ? `${path}.${key}` : key;
        computeDiff(oldVal?.[key], newVal[key], newPath);
      }

      // Check for deleted keys (present in old but not in new)
      for (const key in oldVal) {
        if (!oldVal.hasOwnProperty(key)) continue;
        if (!(key in newVal)) {
          const newPath = path ? `${path}.${key}` : key;
          setChangePath(changes, newPath, undefined);
        }
      }
    }
  }

  computeDiff(original, current);

  return changes;
}

/**
 * Set value at path in changes object
 */
function setChangePath(obj, path, value) {
  if (!path) {
    return Object.assign(obj, value);
  }

  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    // Handle array indices
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = parseInt(arrayMatch[2]);
      
      if (!current[arrayKey]) {
        current[arrayKey] = [];
      }
      if (!current[arrayKey][index]) {
        current[arrayKey][index] = {};
      }
      current = current[arrayKey][index];
    } else {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * Get list of changed paths
 * @returns {Array<string>} Array of dot-notation paths
 */
function getChangedPaths(original, current) {
  const paths = [];

  function traverse(oldVal, newVal, path = '') {
    if (oldVal === newVal) return;

    if (typeof newVal !== 'object' || newVal === null) {
      if (oldVal !== newVal) {
        paths.push(path);
      }
      return;
    }

    if (Array.isArray(newVal)) {
      if (!Array.isArray(oldVal) || JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        paths.push(path);
      }
      return;
    }

    if (isPlainObject(newVal)) {
      for (const key in newVal) {
        if (!newVal.hasOwnProperty(key)) continue;
        const newPath = path ? `${path}.${key}` : key;
        traverse(oldVal?.[key], newVal[key], newPath);
      }

      // Check for deleted keys
      if (isPlainObject(oldVal)) {
        for (const key in oldVal) {
          if (!oldVal.hasOwnProperty(key)) continue;
          if (!(key in newVal)) {
            const newPath = path ? `${path}.${key}` : key;
            paths.push(newPath);
          }
        }
      }
    }
  }

  traverse(original, current);
  return paths;
}

/**
 * Check if two objects are deeply equal
 */
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Check if object has any changes from original
 */
function hasChanges(original, current) {
  return !isEqual(original, current);
}

module.exports = {
  diff,
  getChangedPaths,
  isEqual,
  hasChanges
};

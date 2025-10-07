/**
 * Utility functions for schema mapping and transformation
 */

/**
 * Check if value is a plain object
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep clone an object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Get value at nested path
 * @param {Object} obj - Source object
 * @param {string} path - Dot-notation path (e.g., 'user.name')
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Set value at nested path
 * @param {Object} obj - Target object
 * @param {string} path - Dot-notation path
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const key of keys) {
    if (!current[key] || !isPlainObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * Invert a mapping schema (swap keys and values)
 * Handles nested objects recursively
 */
function invertMapping(mapping) {
  const inverted = {};
  
  function invert(source, target) {
    for (const key in source) {
      if (!source.hasOwnProperty(key)) continue;
      
      const value = source[key];
      
      if (isPlainObject(value)) {
        // Nested object - recurse
        for (const nestedKey in value) {
          if (!value.hasOwnProperty(nestedKey)) continue;
          const nestedValue = value[nestedKey];
          
          if (typeof nestedValue === 'string') {
            // Map nested value back to parent.child format
            const targetPath = `${key}.${nestedKey}`;
            target[nestedValue] = targetPath;
          } else if (isPlainObject(nestedValue)) {
            // Deeper nesting
            if (!target[nestedKey]) {
              target[nestedKey] = {};
            }
            invert({ [nestedKey]: nestedValue }, target);
          }
        }
      } else if (typeof value === 'string') {
        // Simple mapping
        target[value] = key;
      }
    }
  }
  
  invert(mapping, inverted);
  return inverted;
}

/**
 * Merge two objects deeply
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (!source.hasOwnProperty(key)) continue;
    
    if (isPlainObject(source[key]) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Flatten nested object to dot notation
 * { a: { b: 1 } } -> { 'a.b': 1 }
 */
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (isPlainObject(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Unflatten dot notation to nested object
 * { 'a.b': 1 } -> { a: { b: 1 } }
 */
function unflattenObject(obj) {
  const result = {};
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    setNestedValue(result, key, obj[key]);
  }
  
  return result;
}

module.exports = {
  isPlainObject,
  deepClone,
  getNestedValue,
  setNestedValue,
  invertMapping,
  deepMerge,
  flattenObject,
  unflattenObject
};

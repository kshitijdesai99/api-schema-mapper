/**
 * Shared object, path, cloning, and mapping utilities.
 *
 * Path helpers reject prototype-related keys because configuration can come from
 * outside the package and must never mutate an object's prototype chain.
 */
'use strict';

const { MapperConfigurationError } = require('./errors');

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const hasOwn = (object, key) => (
  Object.prototype.hasOwnProperty.call(object, key)
);

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function pathSegments(path) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new MapperConfigurationError('Mapping paths must be non-empty strings');
  }
  const keys = path.split('.');
  for (const key of keys) {
    if (!key || BLOCKED_KEYS.has(key)) {
      throw new MapperConfigurationError(
        `Unsafe or empty mapping path segment: ${key || '<empty>'}`,
        { path }
      );
    }
  }
  return keys;
}

function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (!Array.isArray(value) && !isPlainObject(value)) {
    const type = Object.prototype.toString.call(value);
    throw new TypeError(
      `Unsupported value type ${type}; expected a plain object, array, Date, or primitive`
    );
  }
  if (seen.has(value)) return seen.get(value);
  const cloned = Array.isArray(value) ? [] : {};
  seen.set(value, cloned);
  for (const key of Object.keys(value)) cloned[key] = deepClone(value[key], seen);
  return cloned;
}

function getNestedValue(object, path) {
  const keys = pathSegments(path);
  let current = object;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

function setNestedValue(object, path, value) {
  const keys = pathSegments(path);
  const lastKey = keys.pop();
  let current = object;
  for (const key of keys) {
    if (!hasOwn(current, key) || !isPlainObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  current[lastKey] = value;
  return object;
}

function validateMapping(mapping, direction = 'apiToForm') {
  if (!isPlainObject(mapping)) {
    throw new MapperConfigurationError(`${direction} must be a plain object`);
  }
  const seen = new WeakSet();
  const destinations = new Set();

  // Array-item destinations use their own scope because `id` may validly appear
  // inside more than one independent array mapping.
  function visit(schema, path, scopedDestinations = destinations) {
    if (seen.has(schema)) {
      throw new MapperConfigurationError(
        `Circular mapping configuration at "${path || direction}"`,
        { path }
      );
    }
    seen.add(schema);
    for (const key of Object.keys(schema)) {
      pathSegments(key);
      const value = schema[key];
      const currentPath = path ? `${path}.${key}` : key;
      if (typeof value === 'string') {
        pathSegments(value);
        if (scopedDestinations.has(value)) {
          throw new MapperConfigurationError(
            `Duplicate mapping destination "${value}" at "${currentPath}"`,
            { path: currentPath }
          );
        }
        scopedDestinations.add(value);
      } else if (Array.isArray(value)) {
        if (value.length !== 1) {
          throw new MapperConfigurationError(
            `Array mapping at "${currentPath}" must contain exactly one item mapping`,
            { path: currentPath }
          );
        }
        if (isPlainObject(value[0])) visit(value[0], `${currentPath}[]`, new Set());
        else if (Array.isArray(value[0])) {
          if (value[0].length !== 1) {
            throw new MapperConfigurationError(
              `Nested array mapping at "${currentPath}" must contain exactly one item mapping`,
              { path: currentPath }
            );
          }
        } else if (value[0] !== null && typeof value[0] !== 'string') {
          throw new MapperConfigurationError(
            `Invalid array item mapping at "${currentPath}"`,
            { path: currentPath }
          );
        }
      } else if (isPlainObject(value)) {
        visit(value, currentPath, scopedDestinations);
      } else {
        throw new MapperConfigurationError(
          `Invalid mapping at "${currentPath}": expected a path string, nested mapping, `
          + `or array item mapping. Received ${typeof value}.`,
          { path: currentPath }
        );
      }
    }
    seen.delete(schema);
  }
  visit(mapping, '');
  return mapping;
}

function invertMapping(mapping) {
  validateMapping(mapping);
  const inverted = {};

  function invert(schema, apiPrefix = '', target = inverted) {
    for (const key of Object.keys(schema)) {
      const value = schema[key];
      const apiPath = apiPrefix ? `${apiPrefix}.${key}` : key;
      if (typeof value === 'string') {
        setNestedValue(target, value, apiPath);
      } else if (Array.isArray(value)) {
        const item = value[0];
        if (isPlainObject(item)) {
          const itemTarget = {};
          invert(item, '', itemTarget);
          target[key] = [itemTarget];
        } else if (Array.isArray(item)) {
          const nestedItem = item[0];
          if (isPlainObject(nestedItem)) {
            const nestedTarget = {};
            invert(nestedItem, '', nestedTarget);
            target[key] = [[nestedTarget]];
          } else {
            target[key] = [[nestedItem]];
          }
        } else {
          target[key] = [item];
        }
      } else {
        invert(value, apiPath, target);
      }
    }
  }
  invert(mapping);
  return inverted;
}

function deepMerge(target, source) {
  const result = deepClone(target);
  for (const key of Object.keys(source)) {
    result[key] = isPlainObject(source[key]) && isPlainObject(result[key])
      ? deepMerge(result[key], source[key])
      : deepClone(source[key]);
  }
  return result;
}

function flattenObject(object, prefix = '') {
  const flattened = {};
  for (const key of Object.keys(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(object[key])) {
      Object.assign(flattened, flattenObject(object[key], path));
    } else {
      flattened[path] = object[key];
    }
  }
  return flattened;
}

function unflattenObject(object) {
  const result = {};
  for (const key of Object.keys(object)) {
    setNestedValue(result, key, object[key]);
  }
  return result;
}

module.exports = {
  BLOCKED_KEYS,
  hasOwn,
  isPlainObject,
  pathSegments,
  deepClone,
  getNestedValue,
  setNestedValue,
  validateMapping,
  invertMapping,
  deepMerge,
  flattenObject,
  unflattenObject
};

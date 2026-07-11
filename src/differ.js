/**
 * Change detection for form state.
 *
 * Plain objects are compared recursively, while arrays are deliberately atomic
 * so PATCH payloads always contain a complete updated array.
 */
'use strict';

const { deepClone, isPlainObject, setNestedValue } = require('./utils');

function isEqual(first, second, seen = new WeakMap()) {
  if (Object.is(first, second)) return true;
  if (first instanceof Date || second instanceof Date) {
    return first instanceof Date && second instanceof Date && first.getTime() === second.getTime();
  }
  const eitherIsNotAnObject = first === null
    || second === null
    || typeof first !== 'object'
    || typeof second !== 'object';
  if (eitherIsNotAnObject) return false;
  if (Array.isArray(first) !== Array.isArray(second)) return false;
  if (!Array.isArray(first) && (!isPlainObject(first) || !isPlainObject(second))) return false;
  if (seen.get(first) === second) return true;
  seen.set(first, second);
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);
  if (firstKeys.length !== secondKeys.length) return false;
  return firstKeys.every(key => (
    Object.prototype.hasOwnProperty.call(second, key)
    && isEqual(first[key], second[key], seen)
  ));
}

function diff(original, current, options = {}) {
  const { deep = true, ignoreFields = [], deletedValue = undefined } = options;
  const ignored = new Set(ignoreFields);
  const changes = {};

  function walk(oldValue, newValue, path) {
    if (ignored.has(path) || isEqual(oldValue, newValue)) return;
    if (!path && isPlainObject(oldValue) && isPlainObject(newValue)) {
      const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(newValue, key)) {
          setNestedValue(changes, key, deletedValue);
        } else {
          walk(oldValue[key], newValue[key], key);
        }
      }
      return;
    }
    const replaceWholeValue = !deep
      || Array.isArray(oldValue)
      || Array.isArray(newValue)
      || !isPlainObject(oldValue)
      || !isPlainObject(newValue);
    if (replaceWholeValue) {
      if (path) setNestedValue(changes, path, deepClone(newValue));
      return;
    }
    const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    for (const key of keys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!Object.prototype.hasOwnProperty.call(newValue, key)) {
        setNestedValue(changes, childPath, deletedValue);
      } else {
        walk(oldValue[key], newValue[key], childPath);
      }
    }
  }
  walk(original, current, '');
  return changes;
}

function getChangedPaths(original, current, options = {}) {
  const paths = [];
  const { deep = true, ignoreFields = [] } = options;
  const ignored = new Set(ignoreFields);
  function walk(oldValue, newValue, path) {
    if (ignored.has(path) || isEqual(oldValue, newValue)) return;
    if (!path && isPlainObject(oldValue) && isPlainObject(newValue)) {
      const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
      for (const key of keys) walk(oldValue[key], newValue[key], key);
      return;
    }
    const reportWholePath = !deep
      || Array.isArray(oldValue)
      || Array.isArray(newValue)
      || !isPlainObject(oldValue)
      || !isPlainObject(newValue);
    if (reportWholePath) {
      if (path) paths.push(path);
      return;
    }
    for (const key of new Set([...Object.keys(oldValue), ...Object.keys(newValue)])) {
      walk(oldValue[key], newValue[key], path ? `${path}.${key}` : key);
    }
  }
  walk(original, current, '');
  return paths;
}

function hasChanges(original, current, options = {}) {
  return getChangedPaths(original, current, options).length > 0;
}

module.exports = { diff, getChangedPaths, isEqual, hasChanges };

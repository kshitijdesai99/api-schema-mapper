/**
 * Optional React form-state helper.
 *
 * This module is exposed through `api-schema-mapper/react`, keeping React out of
 * the core runtime unless an application explicitly imports the hook.
 */
'use strict';

const React = require('react');
const { pathSegments } = require('./utils');

function useMappedForm({ mapper, apiData }) {
  const initialForm = React.useMemo(() => mapper.normalize(apiData), [mapper, apiData]);
  const [form, setForm] = React.useState(initialForm);

  React.useEffect(() => setForm(initialForm), [initialForm]);

  const setField = React.useCallback((path, value) => {
    setForm(current => {
      // Clone only objects along the edited path, preserving React immutability.
      const next = { ...current };
      const keys = pathSegments(path);
      let target = next;
      for (let index = 0; index < keys.length - 1; index += 1) {
        target[keys[index]] = { ...(target[keys[index]] || {}) };
        target = target[keys[index]];
      }
      target[keys[keys.length - 1]] = typeof value === 'function' ? value(target[keys[keys.length - 1]]) : value;
      return next;
    });
  }, []);

  const reset = React.useCallback(() => setForm(initialForm), [initialForm]);
  const changedPaths = mapper.getChangedPaths(initialForm, form);
  return {
    initialForm,
    form,
    setForm,
    setField,
    changedPaths,
    hasChanges: changedPaths.length > 0,
    createPatch: () => mapper.buildPatch(initialForm, form),
    reset
  };
}

module.exports = { useMappedForm };

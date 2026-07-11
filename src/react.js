'use strict';

const React = require('react');
const { pathSegments } = require('./utils');

function useMappedForm({ mapper, apiData }) {
  const initialForm = React.useMemo(() => mapper.normalize(apiData), [mapper, apiData]);
  const [form, setForm] = React.useState(initialForm);

  React.useEffect(() => setForm(initialForm), [initialForm]);

  const setField = React.useCallback((path, value) => {
    setForm(current => {
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

/** Verifies the stable public CommonJS export surface. */
'use strict';

const api = require('../src');

test('exports the public API and structured errors', () => {
  expect(api).toBe(api.Mapper);
  expect(api.version).toBe('2.0.0');
  expect(api.diff).toBeInstanceOf(Function);
  expect(api.MapperConfigurationError.prototype).toBeInstanceOf(Error);
  expect(api.utils.setNestedValue).toBeInstanceOf(Function);
});

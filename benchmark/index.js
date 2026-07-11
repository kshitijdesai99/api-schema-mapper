/**
 * Reproducible local normalization benchmark.
 *
 * Reports raw measurements instead of committing environment-dependent
 * performance claims to the README.
 */
'use strict';

const { performance } = require('node:perf_hooks');
const Mapper = require('../src');

const fields = Object.fromEntries(
  Array.from({ length: 20 }, (_, index) => [
    `field${index}`,
    { from: `api_field_${index}`, to: `api_field_${index}` }
  ])
);
const api = Object.fromEntries(
  Array.from({ length: 20 }, (_, index) => [`api_field_${index}`, index])
);
const mapper = new Mapper({ fields });
const iterations = 100000;

// Keep setup outside the timed region so only normalization work is measured.
const start = performance.now();
for (let index = 0; index < iterations; index += 1) {
  mapper.normalize(api);
}
const elapsed = performance.now() - start;
const result = {
  operation: 'normalize',
  fields: 20,
  iterations,
  elapsedMs: Number(elapsed.toFixed(2)),
  operationsPerSecond: Math.round(iterations / elapsed * 1000)
};

console.log(JSON.stringify(result, null, 2));

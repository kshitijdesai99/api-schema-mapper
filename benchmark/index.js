'use strict';

const { performance } = require('node:perf_hooks');
const Mapper = require('../src');
const fields = Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`field${index}`, { from: `api_field_${index}`, to: `api_field_${index}` }]));
const api = Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`api_field_${index}`, index]));
const mapper = new Mapper({ fields });
const iterations = 100000;
const start = performance.now();
for (let index = 0; index < iterations; index += 1) mapper.normalize(api);
const elapsed = performance.now() - start;
console.log(JSON.stringify({ operation: 'normalize', fields: 20, iterations, elapsedMs: Number(elapsed.toFixed(2)), operationsPerSecond: Math.round(iterations / elapsed * 1000) }, null, 2));

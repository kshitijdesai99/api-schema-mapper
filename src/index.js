/**
 * CommonJS package entry point.
 *
 * Exports Mapper as the default-compatible value and attaches every supported
 * named helper for destructuring and generated ESM wrappers.
 */
'use strict';

const Mapper = require('./Mapper');
const normalizer = require('./normalizer');
const denormalizer = require('./denormalizer');
const differ = require('./differ');
const payloadBuilder = require('./payloadBuilder');
const utils = require('./utils');
const errors = require('./errors');
const adapters = require('./adapters');
const validation = require('./validation');

module.exports = Mapper;
Object.assign(module.exports, {
  Mapper,
  ...normalizer,
  ...denormalizer,
  ...differ,
  ...payloadBuilder,
  ...errors,
  ...adapters,
  ...validation,
  utils,
  version: '2.1.0'
});

'use strict';

const Mapper = require('./Mapper');
const normalizer = require('./normalizer');
const denormalizer = require('./denormalizer');
const differ = require('./differ');
const payloadBuilder = require('./payloadBuilder');
const utils = require('./utils');
const errors = require('./errors');
const adapters = require('./adapters');

module.exports = Mapper;
Object.assign(module.exports, {
  Mapper,
  ...normalizer,
  ...denormalizer,
  ...differ,
  ...payloadBuilder,
  ...errors,
  ...adapters,
  utils,
  version: '2.0.0'
});

/**
 * API Schema Mapper - Main export
 * 
 * A lightweight library for mapping between inconsistent GET/POST/PATCH API schemas
 * and managing form state transformations.
 */

const Mapper = require('./Mapper');
const { normalize, normalizeFlat } = require('./normalizer');
const { denormalize, denormalizeFlat, denormalizeForPost, denormalizeForPatch } = require('./denormalizer');
const { diff, getChangedPaths, hasChanges, isEqual } = require('./differ');
const { 
  buildPatchPayload, 
  buildPostPayload, 
  buildPutPayload,
  buildPartialPayload,
  createPayloadBuilder 
} = require('./payloadBuilder');
const {
  isPlainObject,
  deepClone,
  getNestedValue,
  setNestedValue,
  invertMapping,
  deepMerge,
  flattenObject,
  unflattenObject
} = require('./utils');

// Main export
module.exports = Mapper;

// Named exports for advanced usage
module.exports.Mapper = Mapper;

// Normalizers
module.exports.normalize = normalize;
module.exports.normalizeFlat = normalizeFlat;

// Denormalizers
module.exports.denormalize = denormalize;
module.exports.denormalizeFlat = denormalizeFlat;
module.exports.denormalizeForPost = denormalizeForPost;
module.exports.denormalizeForPatch = denormalizeForPatch;

// Differ
module.exports.diff = diff;
module.exports.getChangedPaths = getChangedPaths;
module.exports.hasChanges = hasChanges;
module.exports.isEqual = isEqual;

// Payload builders
module.exports.buildPatchPayload = buildPatchPayload;
module.exports.buildPostPayload = buildPostPayload;
module.exports.buildPutPayload = buildPutPayload;
module.exports.buildPartialPayload = buildPartialPayload;
module.exports.createPayloadBuilder = createPayloadBuilder;

// Utilities
module.exports.utils = {
  isPlainObject,
  deepClone,
  getNestedValue,
  setNestedValue,
  invertMapping,
  deepMerge,
  flattenObject,
  unflattenObject
};

// Version
module.exports.version = '1.0.0';

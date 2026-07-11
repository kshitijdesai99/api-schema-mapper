/** Native ESM entry used by esbuild for Node.js and browser consumers. */
import api from '../../src/index.js';

export default api;
export const {
  Mapper,
  normalize,
  normalizeFlat,
  coerceType,
  denormalize,
  denormalizeDirect,
  denormalizeFlat,
  denormalizeForPost,
  denormalizeForPatch,
  diff,
  getChangedPaths,
  hasChanges,
  isEqual,
  buildPatchPayload,
  buildPostPayload,
  buildPutPayload,
  buildPartialPayload,
  createPayloadBuilder,
  MapperError,
  MapperConfigurationError,
  MapperValidationError,
  MapperTransformError,
  schemaValidator,
  zodValidator,
  valibotValidator,
  normalizeValidationErrors,
  runValidation,
  utils,
  version
} = api;

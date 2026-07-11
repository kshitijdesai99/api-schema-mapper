export type Operation = 'get' | 'normalize' | 'post' | 'put' | 'patch' | 'partial' | 'denormalize';
export type Coercion = 'string' | 'number' | 'boolean' | 'date' | ((value: unknown) => unknown);
export interface ValidationError { path: string; code: string; message: string }
export type ValidationResult = boolean | { valid: boolean; errors?: Array<string | Partial<ValidationError>> } | { success: boolean; error?: { issues?: Array<Partial<ValidationError>> } };
export type Validator<T = unknown> = (data: T, context: { operation: Operation; phase: 'form' | 'payload'; mapper: Mapper<any, any> }) => ValidationResult;
export interface DirectionalTransform<T = unknown, U = unknown> { fromApi?: (value: T, source: unknown) => U; toApi?: (value: U, source: unknown) => T }
export interface FieldConfig {
  from?: string;
  to?: string;
  fromApi?: (value: any, source: any) => any;
  toApi?: (value: any, source: any) => any;
  default?: any;
  coerce?: Coercion;
  readOnly?: boolean;
  operations?: Operation[];
}
export interface MapperOptions {
  typeCoercion?: false;
  omitUndefined?: boolean;
  omitNull?: boolean;
  deletedValue?: unknown;
  deep?: boolean;
  includeUnchanged?: boolean;
  ignoreFields?: string[];
}
export interface MapperConfig<Api, Form> {
  apiToForm?: Record<string, any>;
  formToApi?: Record<string, any>;
  fields?: { [Path in keyof Form]?: FieldConfig | string } & Record<string, FieldConfig | string>;
  transforms?: Partial<Record<keyof Form | string, DirectionalTransform | ((value: any, source: any) => any)>>;
  defaults?: Partial<Form>;
  coerce?: Partial<Record<keyof Form | string, Coercion>>;
  validator?: Validator;
  validate?: { form?: Validator<Form>; patch?: Validator<Partial<Form>>; payload?: Validator<Partial<Api>> };
  options?: MapperOptions;
}
export default class Mapper<Api extends object = Record<string, any>, Form extends object = Record<string, any>> {
  static readonly DEFAULT_OPTIONS: Readonly<Required<MapperOptions>>;
  constructor(config: MapperConfig<Api, Form>);
  normalize(data: Api, options?: MapperOptions): Form;
  denormalize(data: Form | Partial<Form>, options?: MapperOptions & { operation?: Operation }): Api;
  diff(original: Form, current: Form, options?: MapperOptions): Partial<Form>;
  hasChanges(original: Form, current: Form): boolean;
  getChangedPaths(original: Form, current: Form, options?: MapperOptions): string[];
  buildPatch(original: Form, current: Form, options?: MapperOptions): Partial<Api> | null;
  buildPost(data: Form, options?: MapperOptions): Api;
  buildPut(data: Form, options?: MapperOptions): Api;
  buildPartial(data: Form, fields: string[], options?: MapperOptions): Partial<Api>;
  createPatchFromApi(apiData: Api, editedForm: Form, options?: MapperOptions): Partial<Api> | null;
  clone(config?: Partial<MapperConfig<Api, Form>>): Mapper<Api, Form>;
  getConfig(): MapperConfig<Api, Form>;
  static compose<A extends object, F extends object>(...mappers: Mapper<A, F>[]): Mapper<A, F>;
}
export { Mapper };
export class MapperError extends Error { operation?: Operation; formPath?: string; apiPath?: string; value?: unknown; cause?: unknown }
export class MapperConfigurationError extends MapperError {}
export class MapperValidationError extends MapperError { errors: ValidationError[] }
export class MapperTransformError extends MapperError {}
export function normalize<Api extends object, Form extends object>(data: Api, mapping: object, options?: object): Form;
export function normalizeFlat<Api extends object, Form extends object>(data: Api, mapping: Record<string, string>, options?: object): Form;
export function coerceType(value: unknown, coercion: Coercion, field?: string): unknown;
export function denormalize<Form extends object, Api extends object>(data: Form, mapping: object, options?: object): Api;
export function denormalizeDirect<Form extends object, Api extends object>(data: Form, mapping: object, options?: object): Api;
export function denormalizeFlat<Form extends object, Api extends object>(data: Form, mapping: Record<string, string>, options?: object): Api;
export function denormalizeForPost<Form extends object, Api extends object>(data: Form, mapping: object, options?: object): Api;
export function denormalizeForPatch<Form extends object, Api extends object>(data: Partial<Form>, mapping: object, options?: object): Partial<Api>;
export function diff<T extends object>(original: T, current: T, options?: MapperOptions): Partial<T>;
export function isEqual(first: unknown, second: unknown): boolean;
export function hasChanges(first: unknown, second: unknown): boolean;
export function getChangedPaths(first: object, second: object, options?: MapperOptions): string[];
export function buildPatchPayload<Form extends object, Api extends object>(original: Form, current: Form, mapping: object, options?: MapperOptions & Record<string, unknown>): Partial<Api> | null;
export function buildPostPayload<Form extends object, Api extends object>(data: Form, mapping: object, options?: MapperOptions & Record<string, unknown>): Api;
export function buildPutPayload<Form extends object, Api extends object>(data: Form, mapping: object, options?: MapperOptions & Record<string, unknown>): Api;
export function buildPartialPayload<Form extends object, Api extends object>(data: Form, fields: string[], mapping: object, options?: MapperOptions & Record<string, unknown>): Partial<Api>;
export function createPayloadBuilder<Form extends object, Api extends object>(mapping: object, options?: MapperOptions & Record<string, unknown>): {
  buildPatch(original: Form, current: Form, options?: MapperOptions): Partial<Api> | null;
  buildPost(data: Form, options?: MapperOptions): Api;
  buildPut(data: Form, options?: MapperOptions): Api;
  buildPartial(data: Form, fields: string[], options?: MapperOptions): Partial<Api>;
};
export function schemaValidator(schema: { safeParse?(data: unknown): unknown; parse?(data: unknown): unknown }): Validator;
export const zodValidator: typeof schemaValidator;
export function valibotValidator(schema: unknown, safeParse: (schema: unknown, data: unknown) => ValidationResult): Validator;
export const version: string;
export const utils: Record<string, Function>;

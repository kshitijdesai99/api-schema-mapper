/** TypeScript declarations for the optional `api-schema-mapper/react` entry. */
import type Mapper from './index';
export interface MappedFormState<Form, ApiRequest> {
  initialForm: Form;
  form: Form;
  setForm: (value: Form | ((current: Form) => Form)) => void;
  setField: (path: string, value: unknown | ((current: unknown) => unknown)) => void;
  changedPaths: string[];
  hasChanges: boolean;
  createPatch: () => Partial<ApiRequest> | null;
  reset: () => void;
}
export function useMappedForm<ApiResponse extends object, Form extends object, ApiRequest extends object = ApiResponse>(input: { mapper: Mapper<ApiResponse, Form, ApiRequest>; apiData: ApiResponse }): MappedFormState<Form, ApiRequest>;

/** TypeScript declarations for the optional `api-schema-mapper/react` entry. */
import type Mapper from './index';
export interface MappedFormState<Form, Api> {
  initialForm: Form;
  form: Form;
  setForm: (value: Form | ((current: Form) => Form)) => void;
  setField: (path: string, value: unknown | ((current: unknown) => unknown)) => void;
  changedPaths: string[];
  hasChanges: boolean;
  createPatch: () => Partial<Api> | null;
  reset: () => void;
}
export function useMappedForm<Api extends object, Form extends object>(input: { mapper: Mapper<Api, Form>; apiData: Api }): MappedFormState<Form, Api>;

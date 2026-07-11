/** Compile-only consumer test for bundled generic TypeScript declarations. */
import Mapper from '../../types';

type ApiResponse = { user_name: string; price_cents: number };
type UserForm = { name: string; price: number };
type ApiRequest = { displayName: string; price_cents: number };
const mapper = new Mapper<ApiResponse, UserForm, ApiRequest>({ fields: {
  name: { from: 'user_name', to: 'displayName' },
  price: { from: 'price_cents', to: 'price_cents', fromApi: value => value / 100, toApi: value => Math.round(value * 100) }
} });
const form: UserForm = mapper.normalize({ user_name: 'Ada', price_cents: 100 });
const patch: Partial<ApiRequest> | null = mapper.buildPatch(form, { ...form, price: 2 });
const post: ApiRequest = mapper.buildPost(form);

// Two generics remain backwards compatible: ApiRequest defaults to ApiResponse.
const symmetric = new Mapper<ApiResponse, UserForm>({
  apiToForm: { user_name: 'name', price_cents: 'price' }
});
const symmetricPost: ApiResponse = symmetric.buildPost(form);
void patch;
void post;
void symmetricPost;

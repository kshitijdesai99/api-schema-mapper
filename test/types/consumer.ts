/** Compile-only consumer test for bundled generic TypeScript declarations. */
import Mapper from '../../types';

type ApiUser = { user_name: string; price_cents: number };
type UserForm = { name: string; price: number };
const mapper = new Mapper<ApiUser, UserForm>({ fields: {
  name: { from: 'user_name', to: 'displayName' },
  price: { from: 'price_cents', to: 'price_cents', fromApi: value => value / 100, toApi: value => Math.round(value * 100) }
} });
const form: UserForm = mapper.normalize({ user_name: 'Ada', price_cents: 100 });
const patch: Partial<ApiUser> | null = mapper.buildPatch(form, { ...form, price: 2 });
void patch;

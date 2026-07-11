/** Verifies the optional React hook without requiring React as a test dependency. */
'use strict';

let mockUpdater;
const mockSetter = jest.fn(value => { mockUpdater = value; });
jest.mock('react', () => ({
  useMemo: factory => factory(),
  useState: initial => [initial, mockSetter],
  useEffect: effect => effect(),
  useCallback: callback => callback
}), { virtual: true });

const { useMappedForm } = require('../src/react');

test('React helper exposes mapped form controls and immutable nested field updates', () => {
  const mapper = {
    normalize: data => ({ profile: { name: data.user_name } }),
    getChangedPaths: () => [],
    buildPatch: jest.fn(() => ({ user_name: 'Grace' }))
  };
  const state = useMappedForm({ mapper, apiData: { user_name: 'Ada' } });
  expect(state.initialForm).toEqual({ profile: { name: 'Ada' } });
  expect(state.hasChanges).toBe(false);
  state.setField('profile.name', 'Grace');
  const current = { profile: { name: 'Ada' } };
  const next = mockUpdater(current);
  expect(next).toEqual({ profile: { name: 'Grace' } });
  expect(next.profile).not.toBe(current.profile);
  expect(state.createPatch()).toEqual({ user_name: 'Grace' });
  state.reset();
  expect(mockSetter).toHaveBeenCalled();
  expect(() => state.setField('__proto__.bad', true)).not.toThrow();
  expect(() => mockUpdater({})).toThrow('Unsafe');
});

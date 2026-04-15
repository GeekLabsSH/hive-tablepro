/**
 * Stub mínimo para imports que apontavam para `@mui/x-data-grid/internals`
 * ou `core/x-data-grid/src/internals` no fork antigo.
 * Remover quando não houver consumidores no ProtonWeb (major semver).
 */
export function createSelector<TState, TResult>(
  _inputSelectors: unknown,
  _combiner: (...args: unknown[]) => TResult
) {
  return (state: TState): TResult => state as unknown as TResult;
}

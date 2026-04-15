import type {
  GridColumnVisibilityModel,
  GridDensity,
  GridFilterModel,
  GridPaginationModel,
  GridPinnedColumns,
  GridRowGroupingModel,
  GridSortModel
} from "./types";

/** Versão do JSON em `localStorage` (incrementar se o formato mudar). */
export const GRID_PREFERENCES_STORAGE_VERSION = 1 as const;

/** Subconjunto do estado da grelha adequado a persistir entre sessões. */
export type PersistedGridPreferences = {
  v: typeof GRID_PREFERENCES_STORAGE_VERSION;
  sortModel?: GridSortModel;
  filterModel?: GridFilterModel;
  paginationModel?: GridPaginationModel;
  columnVisibilityModel?: GridColumnVisibilityModel;
  pinnedColumns?: GridPinnedColumns;
  /** Densidade da grelha (opcional; compatível com JSON antigo sem o campo). */
  density?: GridDensity;
  /** Ordem de colunas (ids TanStack: `field` e prefixos `__select__`, `__tree__`, …). */
  columnOrder?: string[];
  /** Modelo de agrupamento (só persistido quando `rowGroupingModel` não é controlado por prop). */
  rowGroupingModel?: GridRowGroupingModel;
  /** Larguras (px) por id de coluna; exclui `__select__` / `__tree__` / `__detail__` na serialização. */
  columnSizing?: Record<string, number>;
};

/**
 * Funde uma ordem guardada com a ordem canónica atual (novas colunas passam a seguir `baseOrder`).
 */
export function mergePersistedColumnOrder(
  baseOrder: readonly string[],
  stored: string[] | undefined
): string[] {
  if (!stored?.length) return [...baseOrder];
  const baseSet = new Set(baseOrder);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of stored) {
    if (baseSet.has(id) && !seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const id of baseOrder) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

/**
 * Remove colunas meta e valores inválidos antes de gravar ou expor no snapshot.
 */
export function pickPersistableColumnSizing(sizing: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(sizing)) {
    if (k === "__select__" || k === "__detail__" || k === "__tree__") continue;
    if (typeof v === "number" && Number.isFinite(v) && v >= 8) out[k] = v;
  }
  return out;
}

/** Aplica larguras guardadas só para ids ainda presentes na grelha (`baseOrder`). */
export function mergePersistedColumnSizing(
  validColumnIds: readonly string[],
  stored: Record<string, number> | undefined
): Record<string, number> {
  if (!stored || typeof stored !== "object") return {};
  const set = new Set(validColumnIds);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(stored)) {
    if (!set.has(k)) continue;
    if (typeof v === "number" && Number.isFinite(v) && v >= 8) out[k] = v;
  }
  return out;
}

export function parsePersistedGridPreferences(json: string): PersistedGridPreferences | null {
  try {
    const o = JSON.parse(json) as PersistedGridPreferences;
    if (!o || typeof o !== "object" || o.v !== GRID_PREFERENCES_STORAGE_VERSION) return null;
    return o;
  } catch {
    return null;
  }
}

export function stringifyPersistedGridPreferences(
  partial: Omit<PersistedGridPreferences, "v">
): string {
  return JSON.stringify({ v: GRID_PREFERENCES_STORAGE_VERSION, ...partial });
}

/**
 * Lê preferências JSON (ex.: `localStorage.getItem(key)`).
 * Em SSR ou `storage` indisponível, devolve `null`.
 */
export function readGridPreferencesFromStorage(
  key: string,
  storage?: Storage | null
): PersistedGridPreferences | null {
  const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  if (!s) return null;
  const raw = s.getItem(key);
  if (raw == null) return null;
  return parsePersistedGridPreferences(raw);
}

/**
 * Grava preferências. Falhas silenciosas (quota, modo privado).
 */
export function writeGridPreferencesToStorage(
  key: string,
  partial: Omit<PersistedGridPreferences, "v">,
  storage?: Storage | null
): void {
  const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  if (!s) return;
  try {
    s.setItem(key, stringifyPersistedGridPreferences(partial));
  } catch {
    /* ignore */
  }
}

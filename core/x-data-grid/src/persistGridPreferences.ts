import type {
  GridColumnVisibilityModel,
  GridDensity,
  GridFilterItem,
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
  /**
   * Com filtros de coluna «servidor» / botão Buscar: último conjunto **aplicado** à pesquisa.
   * `filterModel.items` pode estar só em rascunho; ao refiltrar um dataset após GET, usar isto.
   */
  appliedColumnFilterItems?: GridFilterItem[];
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

/** Primeira ocorrência ganha (ordem estável). */
function dedupeColumnOrderIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Funde uma ordem guardada com a ordem canónica atual (novas colunas passam a seguir `baseOrder`).
 */
export function mergePersistedColumnOrder(
  baseOrder: readonly string[],
  stored: string[] | undefined
): string[] {
  const baseDeduped = dedupeColumnOrderIds(baseOrder);
  if (!stored?.length) return [...baseDeduped];
  const baseSet = new Set(baseDeduped);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of dedupeColumnOrderIds(stored)) {
    if (baseSet.has(id) && !seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const id of baseDeduped) {
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
 * Modelo a usar para filtrar em memória as linhas após um GET, alinhado a `DataGrid` com `serverDrivenColumnFilters`:
 * mantém quick filter / operadores em `filterModel`, mas substitui `items` pelo último conjunto aplicado
 * guardado em `appliedColumnFilterItems` (retrocompat: campo ausente → `filterModel.items`).
 */
export function filterModelForRowDatasetAfterFetch(
  stored: PersistedGridPreferences | null | undefined
): GridFilterModel | undefined | null {
  if (stored?.filterModel == null) return stored?.filterModel ?? null;
  const items =
    stored.appliedColumnFilterItems != null
      ? stored.appliedColumnFilterItems
      : (stored.filterModel.items ?? []);
  return { ...stored.filterModel, items };
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

const FILTER_MODEL_STORAGE_PREFIX = "hive.dtpro.filterModel.v1:";

function filterModelStorageKey(persistenceKey: string): string {
  return `${FILTER_MODEL_STORAGE_PREFIX}${persistenceKey}`;
}

/** Lê só o modelo de filtro por coluna / rápido (JSON em `localStorage`). */
export function readPersistedFilterModel(
  persistenceKey: string,
  storage?: Storage | null
): GridFilterModel | null {
  const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  if (!s) return null;
  try {
    const raw = s.getItem(filterModelStorageKey(persistenceKey));
    if (raw == null || raw === "") return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const x = o as Record<string, unknown>;
    const items = Array.isArray(x.items) ? (x.items as GridFilterModel["items"]) : [];
    const logicOperator = x.logicOperator === "Or" || x.logicOperator === "And" ? x.logicOperator : undefined;
    const groupLogicOperator =
      x.groupLogicOperator === "Or" || x.groupLogicOperator === "And" ? x.groupLogicOperator : undefined;
    const quickFilterLogicOperator =
      x.quickFilterLogicOperator === "Or" || x.quickFilterLogicOperator === "And"
        ? x.quickFilterLogicOperator
        : undefined;
    const quickFilterValues = Array.isArray(x.quickFilterValues)
      ? x.quickFilterValues.map((v) => String(v))
      : undefined;
    return {
      items,
      logicOperator,
      groupLogicOperator,
      quickFilterLogicOperator,
      quickFilterValues
    };
  } catch {
    return null;
  }
}

/** Grava o modelo de filtro (falhas silenciosas). */
export function writePersistedFilterModel(
  persistenceKey: string,
  model: GridFilterModel,
  storage?: Storage | null
): void {
  const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  if (!s) return;
  try {
    s.setItem(filterModelStorageKey(persistenceKey), JSON.stringify(model));
  } catch {
    /* ignore */
  }
}

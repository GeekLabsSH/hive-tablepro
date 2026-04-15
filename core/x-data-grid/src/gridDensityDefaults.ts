import type { GridDensity } from "./types";

/**
 * Dimensões por densidade — valores predefinidos editáveis neste ficheiro.
 * Sobrescrevem-se por `densityDimensions` no `DataGrid` (por chave de densidade).
 */
export type GridDensityResolved = {
  /** Fator aplicado a `rowHeight` quando definido, e a `baseRowPx` quando não há `rowHeight`. */
  rowFactor: number;
  /** Altura de referência em modo “standard” antes do fator (px). */
  baseRowPx: number;
  /** Cabeçalho quando `columnHeaderHeight` / `initialState.columnHeaderHeight` não são definidos (px). */
  defaultHeaderPx: number;
};

export type GridDensityDimensionsProp = Partial<
  Record<GridDensity, Partial<Pick<GridDensityResolved, "rowFactor" | "baseRowPx" | "defaultHeaderPx">>>
>;

export const GRID_DENSITY_DEFAULTS: Record<GridDensity, GridDensityResolved> = {
  /** `0.68` + altura explícita nas células: com `rowHeight` baixo (ex. 23) a diferença face ao confortável torna-se perceptível. */
  compact: { rowFactor: 0.68, baseRowPx: 44, defaultHeaderPx: 32 },
  standard: { rowFactor: 1, baseRowPx: 44, defaultHeaderPx: 40 },
  comfortable: { rowFactor: 1.48, baseRowPx: 44, defaultHeaderPx: 48 }
};

export function resolveDensityDimensions(
  density: GridDensity,
  overrides?: GridDensityDimensionsProp | null
): GridDensityResolved {
  const base = GRID_DENSITY_DEFAULTS[density] ?? GRID_DENSITY_DEFAULTS.standard;
  const o = overrides?.[density];
  return {
    rowFactor: o?.rowFactor ?? base.rowFactor,
    baseRowPx: o?.baseRowPx ?? base.baseRowPx,
    defaultHeaderPx: o?.defaultHeaderPx ?? base.defaultHeaderPx
  };
}

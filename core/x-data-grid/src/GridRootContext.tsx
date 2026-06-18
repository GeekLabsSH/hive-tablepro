import * as React from "react";
import type { GridApiCommunity, GridDensity, GridValidRowModel, GridVisualization } from "./types";

export type { GridDensity, GridVisualization };

/** Paridade MUI / ProtonWeb `EditToolbar`: suprimir chrome quando os três estão desligados. */
export type GridEditToolbarCompatProps = {
  disableColumnFilter: boolean;
  disableColumnSelector: boolean;
  disableDensitySelector: boolean;
  disableVisualizationSelector: boolean;
};

export type GridRootContextValue<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R> | null;
  /** Ref do contentor principal da grelha (scroll). */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  density: GridDensity;
  /** Atualiza densidade (estado interno + `onDensityChange`). */
  setDensity?: (d: GridDensity) => void;
  /** Escala horizontal da grelha (`Visualização` na toolbar). */
  visualization: GridVisualization;
  setVisualization?: (v: GridVisualization) => void;
  /** Valor atual do filtro rápido (painel cliente). */
  quickFilterValue: string;
  setQuickFilterValue: (v: string) => void;
  /** Número de regras de filtro activas (painel + filtro rápido) para badge na toolbar. */
  activeFilterCount: number;
  /** Segunda linha de filtros no cabeçalho de colunas. */
  headerFiltersEnabled: boolean;
  setHeaderFiltersEnabled: (v: boolean) => void;
  /** Limpa `filterModel.items`, `quickFilterValues` e texto de pesquisa rápida. */
  clearAllFilters: () => void;
  /** Integração de gráficos activa (`chartsIntegration` na grelha). */
  chartsIntegrationEnabled?: boolean;
  /** Abre o painel de gráficos (slot predefinido ou custom). */
  openChartsPanel?: () => void;
  /** `pivoting` na grelha — mostrar alternância de vista pivotada na toolbar. */
  pivotFeatureEnabled?: boolean;
  pivotActive?: boolean;
  setPivotActive?: (active: boolean) => void;
  /** Abre o painel lateral de configuração do pivot (Filas / Colunas / Valores). */
  openPivotPanel?: () => void;
  /** Último elemento que abriu o painel global de filtros (âncora do popover). */
  filterPanelAnchorRef: React.MutableRefObject<HTMLElement | null>;
  /** Último elemento que abriu o painel de colunas (âncora do popover). */
  columnsPanelAnchorRef: React.MutableRefObject<HTMLElement | null>;
  /** Props que o `EditToolbar` do ProtonWeb lê via `useGridRootProps` / contexto. */
  editToolbarCompat?: GridEditToolbarCompatProps;
  /** Filtros de coluna só por servidor (`DataGrid.serverDrivenColumnFilters`). */
  serverDrivenColumnFilters?: boolean;
  /** Filtros de coluna editados ainda não aplicados à última pesquisa. */
  columnFiltersSearchPending?: boolean;
  /**
   * Destaque visual do botão «Pesquisar» (anelo âmbar): inclui `columnFiltersSearchPending` e, com
   * `highlightApplyColumnFiltersUntilSearch`, até ao primeiro `applyColumnFiltersSearch`.
   */
  applyColumnFiltersSearchHighlighted?: boolean;
  /** Confirma e dispara `onServerColumnFiltersSearch`. */
  applyColumnFiltersSearch?: () => void;
  /** Rótulo do botão «Aplicar filtros» (i18n). */
  applyColumnFiltersSearchLabel?: string;
  /** Tooltip quando há alterações por aplicar. */
  applyColumnFiltersSearchPendingTooltip?: string;
  /** Tooltip quando só o destaque «carregar dados» está activo (antes do primeiro clique em pesquisar). */
  applyColumnFiltersSearchInitialHighlightTooltip?: string;
  /** Zona à direita da toolbar (ex.: select de modelos de filtro). */
  toolbarEndSlot?: React.ReactNode;
  /** Modo da pesquisa rápida na toolbar integrada / `EditToolbar`. */
  toolbarQuickFilterMode?: "global" | "columnContains";
  /** Rótulos do filtro coluna + valor (`toolbarQuickFilterMode="columnContains"`). */
  toolbarColumnContainsFilterColumnLabel?: string;
  toolbarColumnContainsFilterValuePlaceholder?: string;
  toolbarColumnContainsFilterAddLabel?: string;
};

const Ctx = React.createContext<GridRootContextValue | null>(null);

export function GridRootProvider<R extends GridValidRowModel>({
  children,
  value
}: {
  children: React.ReactNode;
  value: GridRootContextValue<R>;
}) {
  return <Ctx.Provider value={value as GridRootContextValue}>{children}</Ctx.Provider>;
}

/** Contexto da API + densidade + filtro rápido (toolbar e hooks). */
export function useGridApiContext<R extends GridValidRowModel = GridValidRowModel>(): {
  api: GridApiCommunity<R> | null;
} {
  const v = React.useContext(Ctx);
  if (!v) {
    return { api: null };
  }
  return { api: v.api as GridApiCommunity<R> | null };
}

/** Props para o elemento raiz da grelha (subconjunto MUI `useGridRootProps`). */
export function useGridRootProps(): React.HTMLAttributes<HTMLDivElement> {
  const v = React.useContext(Ctx);
  return React.useMemo(
    () => ({
      role: "grid" as const,
      className: "hive-data-grid-root",
      "data-density": v?.density ?? "standard",
      "data-visualization": v?.visualization ?? "compact",
      ...(v?.editToolbarCompat != null
        ? {
            disableColumnFilter: v.editToolbarCompat.disableColumnFilter,
            disableColumnSelector: v.editToolbarCompat.disableColumnSelector,
            disableDensitySelector: v.editToolbarCompat.disableDensitySelector
          }
        : {})
    }),
    [v?.density, v?.visualization, v?.editToolbarCompat]
  );
}

export function useGridRootContext(): GridRootContextValue | null {
  return React.useContext(Ctx);
}

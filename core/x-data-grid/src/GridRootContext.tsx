import * as React from "react";
import type { GridApiCommunity, GridDensity, GridValidRowModel } from "./types";

export type { GridDensity };

/** Paridade MUI / ProtonWeb `EditToolbar`: suprimir chrome quando os três estão desligados. */
export type GridEditToolbarCompatProps = {
  disableColumnFilter: boolean;
  disableColumnSelector: boolean;
  disableDensitySelector: boolean;
};

export type GridRootContextValue<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R> | null;
  /** Ref do contentor principal da grelha (scroll). */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  density: GridDensity;
  /** Atualiza densidade (estado interno + `onDensityChange`). */
  setDensity?: (d: GridDensity) => void;
  /** Valor atual do filtro rápido (painel cliente). */
  quickFilterValue: string;
  setQuickFilterValue: (v: string) => void;
  /** Último elemento que abriu o painel global de filtros (âncora do popover). */
  filterPanelAnchorRef: React.MutableRefObject<HTMLElement | null>;
  /** Último elemento que abriu o painel de colunas (âncora do popover). */
  columnsPanelAnchorRef: React.MutableRefObject<HTMLElement | null>;
  /** Props que o `EditToolbar` do ProtonWeb lê via `useGridRootProps` / contexto. */
  editToolbarCompat?: GridEditToolbarCompatProps;
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
      ...(v?.editToolbarCompat != null
        ? {
            disableColumnFilter: v.editToolbarCompat.disableColumnFilter,
            disableColumnSelector: v.editToolbarCompat.disableColumnSelector,
            disableDensitySelector: v.editToolbarCompat.disableDensitySelector
          }
        : {})
    }),
    [v?.density, v?.editToolbarCompat]
  );
}

export function useGridRootContext(): GridRootContextValue | null {
  return React.useContext(Ctx);
}

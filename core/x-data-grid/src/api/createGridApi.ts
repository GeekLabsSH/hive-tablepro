import type { Table } from "@tanstack/react-table";
import { exportRowsToCsv, exportRowsToExcel } from "../../../../src/export/csv-excel";
import { openGridPrintPreview } from "../../../../src/export/print-html";
import { gridColumnsToExportColumns, tsvFromSelectedRows } from "../gridExport";
import type {
  GridApiCommunity,
  GridColDef,
  GridColumnVisibilityModel,
  GridCsvExportOptions,
  GridDensity,
  GridExcelExportOptions,
  GridPrintExportOptions,
  GridFilterModel,
  GridPaginationModel,
  GridPinnedColumns,
  GridRowGroupingModel,
  GridRowId,
  GridRowModesModel,
  GridRowSelectionModel,
  GridRowTransaction,
  GridRowUpdate,
  GridScrollPosition,
  GridScrollToIndexesOptions,
  GridSortModel,
  GridStateSnapshot,
  GridSubscriptionEvent,
  GridValidRowModel
} from "../types";

export type CreateGridApiOptions<R extends GridValidRowModel> = {
  /** Colunas atuais (getter) para a API não ficar com lista stale quando `gridApi` é memoizado com identidade estável. */
  getColumns: () => GridColDef<R>[];
  getRowId: (row: R) => GridRowId;
  setSortModel: (m: GridSortModel) => void;
  setFilterModel: (m: GridFilterModel) => void;
  setPaginationModel: (m: GridPaginationModel) => void;
  setColumnVisibility: (m: GridColumnVisibilityModel) => void;
  setRowSelectionModel: (m: GridRowSelectionModel) => void;
  getRowSelectionModel: () => GridRowSelectionModel;
  getSortModel: () => GridSortModel;
  getFilterModel: () => GridFilterModel;
  getPaginationModel: () => GridPaginationModel;
  getColumnVisibilityModel: () => GridColumnVisibilityModel;
  setPinnedColumns: (m: GridPinnedColumns) => void;
  getPinnedColumns: () => GridPinnedColumns;
  csvFileName?: string;
  /** Predefinição de BOM UTF-8 em `exportDataAsCsv` (sobrescrito por `GridCsvExportOptions.utf8WithBom`). */
  csvUtf8WithBomDefault?: boolean;
  excelFileName?: string;
  excelSheetName?: string;
  getScrollContainer: () => HTMLElement | null;
  getEstimatedRowHeight: () => number;
  /** Soma das alturas das linhas de cabeçalho no contentor de scroll (para `scrollToIndexes`). */
  getHeaderBlockHeight: () => number;
  getStateSnapshot: () => GridStateSnapshot;
  /**
   * Registo de subscrições por tipo de evento (inclui `stateChange`).
   * Se omitido, `subscribeEvent` na API é no-op.
   */
  subscribeEventDispatch?: (
    event: GridSubscriptionEvent,
    handler: (snapshot: GridStateSnapshot) => void
  ) => () => void;
  focusQuickFilter: () => void;
  /** Fecha diálogos de filtro (coluna + painel global). */
  closeFilterPanel?: () => void;
  /** Abre o painel global de filtros. */
  openFilterPanel?: (anchor?: HTMLElement | null) => void;
  openColumnsPanel?: (anchor?: HTMLElement | null) => void;
  closeColumnsPanel?: () => void;
  startCellEditMode?: (params: { id: GridRowId; field: string }) => boolean;
  stopCellEditMode?: () => void;
  onRowsChange?: (updates: GridRowUpdate<R>[]) => void;
  onRowTransaction?: (transaction: GridRowTransaction<R>) => void;
  getCellMode?: (params: { id: GridRowId; field: string }) => "edit" | "view";
  setEditCellValue?: (params: { id: GridRowId; field: string; value: unknown }) => boolean;
  getRowModesModel: () => GridRowModesModel;
  setRowModesModel: (
    model: GridRowModesModel | ((prev: GridRowModesModel) => GridRowModesModel)
  ) => void;
  /** Gravação explícita em modo linha (botões fora do slot predefinido). */
  commitRowEditSave?: (rowId: GridRowId) => void | Promise<void>;
  getDensity: () => GridDensity;
  setDensity: (d: GridDensity) => void;
  getColumnFiltersSearchPending?: () => boolean;
  applyColumnFiltersSearch?: () => void;
};

/**
 * Lista ascendentes com scroll horizontal visível (`overflow-x` scrollável e conteúdo mais largo que o cliente).
 * O `scrollLeft` efetivo pode viver num destes nós em vez de (ou além de) `getScrollContainer()` — usar com
 * {@link restoreHorizontalScrollSnapshots} antes de focar células após mudanças de layout (ex.: edição de linha).
 */
export function snapshotHorizontalScrollAncestors(
  start: HTMLElement | null,
  maxDepth = 24
): Array<{ el: HTMLElement; left: number }> {
  const out: Array<{ el: HTMLElement; left: number }> = [];
  let cur: Element | null = start;
  let depth = 0;
  while (cur && depth < maxDepth && cur !== document.documentElement) {
    if (cur instanceof HTMLElement) {
      const ox = getComputedStyle(cur).overflowX;
      if (
        (ox === "auto" || ox === "scroll" || ox === "overlay") &&
        cur.scrollWidth > cur.clientWidth + 1
      ) {
        out.push({ el: cur, left: cur.scrollLeft });
      }
    }
    cur = cur.parentElement;
    depth++;
  }
  return out;
}

/** Repõe `scrollLeft` nos elementos da snapshot (ignora nós desligados do DOM). */
export function restoreHorizontalScrollSnapshots(
  snap: ReadonlyArray<{ el: HTMLElement; left: number }>
) {
  for (const { el, left } of snap) {
    if (el.isConnected && el.scrollLeft !== left) {
      el.scrollLeft = left;
    }
  }
}

/**
 * Fábrica central da API imperativa da grelha (compatível com `useGridApiRef` / MUI X).
 * Mantém um único sítio para leitura de estado e ações (sort, filtros, export, etc.).
 *
 * Paridade MUI: ver `GridApiCommunity` em `types.ts` e [`docs/DATA_GRID_BACKLOG.md`](../../../docs/DATA_GRID_BACKLOG.md) (secção API).
 */
export function createGridApi<R extends GridValidRowModel>(
  getTable: () => Table<R>,
  opts: CreateGridApiOptions<R>
): GridApiCommunity<R> {
  function visibleColumnsForExport(t: ReturnType<typeof getTable>): GridColDef<R>[] {
    const all = opts.getColumns();
    const vis = all.filter((c) => t.getColumn(c.field)?.getIsVisible() !== false);
    return vis.length > 0 ? vis : all;
  }

  function scrollToRowIndex(rowIndex: number, colIndex?: number) {
    const el = opts.getScrollContainer();
    if (!el) return;
    const t = getTable();
    const displayRows = t.getRowModel().flatRows;
    const n = displayRows.length;
    if (n === 0) return;
    const idx = Math.max(0, Math.min(rowIndex, n - 1));
    const rh = opts.getEstimatedRowHeight();
    const headerPad = opts.getHeaderBlockHeight();
    el.scrollTop = headerPad + idx * rh;
    if (colIndex != null) {
      const leaf = [
        ...t.getLeftLeafColumns(),
        ...t.getCenterLeafColumns(),
        ...t.getRightLeafColumns()
      ];
      if (leaf.length === 0) return;
      const ci = Math.max(0, Math.min(colIndex, leaf.length - 1));
      let left = 0;
      for (let i = 0; i < ci; i++) left += leaf[i].getSize();
      el.scrollLeft = left;
    }
  }

  return {
    getRow(id) {
      const t = getTable();
      const row = t.getRow(String(id));
      return row?.original;
    },
    getRowId: opts.getRowId,
    getAllColumns: () => opts.getColumns(),
    getVisibleColumns: () => {
      const t = getTable();
      return opts.getColumns().filter((c) => t.getColumn(c.field)?.getIsVisible() !== false);
    },
    getColumn(field) {
      return opts.getColumns().find((c) => c.field === field);
    },
    setColumnVisibility: opts.setColumnVisibility,
    setSortModel: opts.setSortModel,
    setFilterModel: opts.setFilterModel,
    setPaginationModel: opts.setPaginationModel,
    setRowSelectionModel: opts.setRowSelectionModel,
    getRowSelectionModel: () => opts.getRowSelectionModel(),
    getSortModel: opts.getSortModel,
    getFilterModel: opts.getFilterModel,
    getPaginationModel: opts.getPaginationModel,
    getColumnVisibilityModel: opts.getColumnVisibilityModel,
    setPinnedColumns: opts.setPinnedColumns,
    getPinnedColumns: opts.getPinnedColumns,
    setDetailPanelExpandedRowIds(ids) {
      const rec: Record<string, boolean> = {};
      for (const id of ids) rec[String(id)] = true;
      getTable().setExpanded(rec);
    },
    getDetailPanelExpandedRowIds() {
      const e = getTable().getState().expanded;
      if (e === true) return [];
      return Object.keys(e).filter((k) => (e as Record<string, boolean>)[k]) as GridRowId[];
    },
    setTreeExpandedRowIds(ids) {
      const rec: Record<string, boolean> = {};
      for (const id of ids) rec[String(id)] = true;
      getTable().setExpanded(rec);
    },
    getTreeExpandedRowIds() {
      const e = getTable().getState().expanded;
      if (e === true) return [];
      return Object.keys(e).filter((k) => (e as Record<string, boolean>)[k]) as GridRowId[];
    },
    setRowGroupingModel(model: GridRowGroupingModel) {
      getTable().setGrouping(model);
    },
    getRowGroupingModel(): GridRowGroupingModel {
      return [...getTable().getState().grouping];
    },
    exportDataAsCsv(options?: GridCsvExportOptions) {
      const t = getTable();
      const rows = t
        .getFilteredRowModel()
        .flatRows.filter((r) => !r.getIsGrouped())
        .map((r) => r.original);
      const cols = gridColumnsToExportColumns(opts.getColumns());
      const baseBom = opts.csvUtf8WithBomDefault !== false;
      const withBom = options?.utf8WithBom ?? baseBom;
      exportRowsToCsv(
        rows as (R & object)[],
        cols,
        options?.fileName ?? opts.csvFileName ?? "export",
        withBom
      );
    },
    async exportDataAsExcel(options?: GridExcelExportOptions) {
      const t = getTable();
      const rows = t
        .getFilteredRowModel()
        .flatRows.filter((r) => !r.getIsGrouped())
        .map((r) => r.original);
      const cols = gridColumnsToExportColumns(opts.getColumns());
      await exportRowsToExcel(
        rows as (R & object)[],
        cols,
        options?.fileName ?? opts.excelFileName ?? "export",
        options?.sheetName ?? opts.excelSheetName ?? "Dados"
      );
    },
    exportDataAsPrint(options?: GridPrintExportOptions) {
      const t = getTable();
      const rows = t
        .getFilteredRowModel()
        .flatRows.filter((r) => !r.getIsGrouped())
        .map((r) => r.original);
      const cols = gridColumnsToExportColumns(opts.getColumns());
      const baseName = opts.csvFileName?.replace(/\.csv$/i, "") ?? "export";
      const title = options?.title ?? baseName;
      openGridPrintPreview(rows as (R & object)[], cols, title);
    },
    async copySelectedRowsToClipboard() {
      const t = getTable();
      const selected = t
        .getFilteredSelectedRowModel()
        .flatRows.filter((r) => !r.getIsGrouped());
      if (!selected.length) return;
      const cols = visibleColumnsForExport(t);
      const originals = selected.map((r) => r.original as R & object);
      const tsv = tsvFromSelectedRows(originals, cols);
      await navigator.clipboard.writeText(tsv);
    },
    getStateSnapshot() {
      return opts.getStateSnapshot();
    },
    subscribeEvent(event: GridSubscriptionEvent, handler: (snapshot: GridStateSnapshot) => void) {
      return opts.subscribeEventDispatch?.(event, handler) ?? (() => {});
    },
    scroll(position: GridScrollPosition) {
      const el = opts.getScrollContainer();
      if (!el) return;
      if (position.top != null) el.scrollTop = position.top;
      if (position.left != null) el.scrollLeft = position.left;
    },
    scrollToIndexes(options: GridScrollToIndexesOptions) {
      scrollToRowIndex(options.rowIndex, options.colIndex);
    },
    scrollToRow(id: GridRowId, colIndex?: number) {
      const t = getTable();
      const displayRows = t.getRowModel().flatRows;
      const idx = displayRows.findIndex(
        (r) => !r.getIsGrouped() && String(opts.getRowId(r.original)) === String(id)
      );
      if (idx < 0) return;
      scrollToRowIndex(idx, colIndex);
    },
    setCellFocus(params: {
      id: GridRowId;
      field: string;
      horizontalScrollSnapshots?: ReadonlyArray<{ el: HTMLElement; left: number }>;
    }) {
      const rid = encodeURIComponent(String(params.id));
      const fld = encodeURIComponent(String(params.field));
      const horizontalScrollSnapshots = params.horizontalScrollSnapshots;
      const tryFocus = (attempt: number): boolean => {
        const cell = document.querySelector(
          `[data-hive-cell][data-row-id="${rid}"][data-field="${fld}"]`
        ) as HTMLElement | null;
        if (!cell) return false;
        const scrollEl = opts.getScrollContainer();
        const scrollLeft0 = scrollEl?.scrollLeft ?? 0;
        const scrollTop0 = scrollEl?.scrollTop ?? 0;
        const wrapped = [
          "[data-hive-edit-root] input[type='checkbox']",
          "[data-hive-edit-root] input:not([type='hidden'])",
          "[data-hive-edit-root] textarea",
          "[data-hive-edit-root] select",
          "[data-hive-edit-root] button[role='combobox']",
          "[data-hive-edit-root] [role='combobox']"
        ].join(", ");
        let inner = cell.querySelector<HTMLElement>(wrapped);
        if (!inner) {
          inner = cell.querySelector<HTMLElement>(
            [
              "input:not([type='hidden']):not([disabled])",
              "textarea:not([disabled])",
              "select:not([disabled])",
              "[role='combobox']",
              "[role='searchbox']",
              "button[aria-haspopup='listbox']",
              "button[aria-haspopup='dialog']"
            ].join(", ")
          );
        }
        const target = inner ?? cell;
        target.focus({ preventScroll: true });
        /** Não chamar `input.select()` aqui: o browser pode alterar `scrollLeft` ao mostrar a seleção. */
        if (scrollEl) {
          if (scrollEl.scrollLeft !== scrollLeft0) scrollEl.scrollLeft = scrollLeft0;
          if (scrollEl.scrollTop !== scrollTop0) scrollEl.scrollTop = scrollTop0;
        }
        if (horizontalScrollSnapshots != null && horizontalScrollSnapshots.length > 0) {
          restoreHorizontalScrollSnapshots(horizontalScrollSnapshots);
          requestAnimationFrame(() => {
            restoreHorizontalScrollSnapshots(horizontalScrollSnapshots);
          });
        }
        const ae = document.activeElement;
        return ae === target || (ae != null && target.contains(ae));
      };
      const schedule = (attempt: number) => {
        requestAnimationFrame(() => {
          if (tryFocus(attempt) || attempt >= 18) return;
          schedule(attempt + 1);
        });
      };
      queueMicrotask(() => schedule(0));
    },
    startCellEditMode(params: { id: GridRowId; field: string }) {
      return opts.startCellEditMode?.(params) ?? false;
    },
    stopCellEditMode() {
      opts.stopCellEditMode?.();
    },
    getCellMode(params: { id: GridRowId; field: string }) {
      return opts.getCellMode?.(params) ?? "view";
    },
    setEditCellValue(params: { id: GridRowId; field: string; value: unknown }) {
      return opts.setEditCellValue?.(params) ?? false;
    },
    showFilterPanel(anchor?: HTMLElement | null) {
      opts.openFilterPanel?.(anchor);
    },
    hideFilterPanel() {
      opts.closeFilterPanel?.();
    },
    showColumnsPanel(anchor?: HTMLElement | null) {
      opts.openColumnsPanel?.(anchor);
    },
    hideColumnsPanel() {
      opts.closeColumnsPanel?.();
    },
    updateRows(updates: GridRowUpdate<R>[]) {
      if (!updates?.length) return;
      opts.onRowsChange?.(updates);
    },
    applyTransaction(transaction: GridRowTransaction<R>) {
      const add = transaction?.add;
      const update = transaction?.update;
      const remove = transaction?.remove;
      if (!add?.length && !update?.length && !remove?.length) return;
      opts.onRowTransaction?.({ add, update, remove });
    },
    getRowModesModel() {
      return opts.getRowModesModel();
    },
    setRowModesModel(model) {
      const prev = opts.getRowModesModel();
      const next = typeof model === "function" ? model(prev) : model;
      opts.setRowModesModel(next);
    },
    async commitRowEditSave(rowId: GridRowId) {
      await Promise.resolve(opts.commitRowEditSave?.(rowId));
    },
    getDensity() {
      return opts.getDensity();
    },
    setDensity(d) {
      opts.setDensity(d);
    },
    getColumnFiltersSearchPending() {
      return opts.getColumnFiltersSearchPending?.() ?? false;
    },
    applyColumnFiltersSearch() {
      opts.applyColumnFiltersSearch?.();
    }
  };
}

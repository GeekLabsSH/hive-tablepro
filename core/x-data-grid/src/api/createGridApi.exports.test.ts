import { describe, expect, it, vi, beforeEach } from "vitest";
import type { GridStateSnapshot } from "../types";

const exportRowsToCsv = vi.fn();
const exportRowsToExcel = vi.fn().mockResolvedValue(undefined);
const openGridPrintPreview = vi.fn();

vi.mock("../../../../src/export/csv-excel", () => ({
  exportRowsToCsv: (...args: unknown[]) => exportRowsToCsv(...args),
  exportRowsToExcel: (...args: unknown[]) => exportRowsToExcel(...args)
}));

vi.mock("../../../../src/export/print-html", () => ({
  openGridPrintPreview: (...args: unknown[]) => openGridPrintPreview(...args)
}));

import { createGridApi } from "./createGridApi";

const snap: GridStateSnapshot = {
  sortModel: [],
  filterModel: { items: [] },
  paginationModel: { page: 0, pageSize: 10 },
  columnVisibilityModel: {},
  pinnedColumns: { left: [], right: [] },
  columnOrder: [],
  columnSizing: {},
  selectedRowIds: [],
  rowGroupingModel: [],
  density: "standard",
  editMode: "cell",
  rowModesModel: {}
};

function baseOpts(): Parameters<typeof createGridApi<Record<string, unknown>>>[1] {
  return {
    getColumns: () => [{ field: "name", headerName: "Nome" }],
    getRowId: (r) => String((r as { id?: number }).id ?? ""),
    setSortModel: vi.fn(),
    setFilterModel: vi.fn(),
    setPaginationModel: vi.fn(),
    setColumnVisibility: vi.fn(),
    setRowSelectionModel: vi.fn(),
    getRowSelectionModel: () => ({ type: "include" as const, ids: [] }),
    getSortModel: () => [],
    getFilterModel: () => ({ items: [] }),
    getPaginationModel: () => ({ page: 0, pageSize: 10 }),
    getColumnVisibilityModel: () => ({}),
    setPinnedColumns: vi.fn(),
    getPinnedColumns: () => ({ left: [], right: [] }),
    getScrollContainer: () => null,
    getEstimatedRowHeight: () => 40,
    getHeaderBlockHeight: () => 10,
    getStateSnapshot: () => snap,
    subscribeEventDispatch: () => () => {},
    focusQuickFilter: vi.fn(),
    getRowModesModel: () => ({}),
    setRowModesModel: vi.fn(),
    getDensity: () => "standard",
    setDensity: vi.fn()
  };
}

describe("createGridApi — export (mocks csv-excel / print-html)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exportDataAsCsv chama exportRowsToCsv com linhas filtradas e nome de ficheiro", () => {
    const dataRow = { original: { id: 1, name: "Z" }, getIsGrouped: () => false };
    const groupedRow = { original: {}, getIsGrouped: () => true };
    const table = {
      getFilteredRowModel: () => ({ flatRows: [dataRow, groupedRow] }),
      getRow: () => undefined,
      getState: () => ({
        rowSelection: {},
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnPinning: { left: [], right: [] },
        grouping: []
      }),
      getColumn: () => undefined,
      setExpanded: vi.fn(),
      setGrouping: vi.fn()
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;

    const api = createGridApi(() => table, {
      ...baseOpts(),
      csvFileName: "relatorio",
      csvUtf8WithBomDefault: true
    });

    api.exportDataAsCsv({ fileName: "custom.csv", utf8WithBom: false });

    expect(exportRowsToCsv).toHaveBeenCalledTimes(1);
    expect(exportRowsToCsv.mock.calls[0]![0]).toEqual([{ id: 1, name: "Z" }]);
    expect(exportRowsToCsv.mock.calls[0]![2]).toBe("custom.csv");
    expect(exportRowsToCsv.mock.calls[0]![3]).toBe(false);
  });

  it("exportDataAsExcel chama exportRowsToExcel com sheetName", async () => {
    const dataRow = { original: { id: 1, name: "Z" }, getIsGrouped: () => false };
    const table = {
      getFilteredRowModel: () => ({ flatRows: [dataRow] }),
      getRow: () => undefined,
      getState: () => ({
        rowSelection: {},
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnPinning: { left: [], right: [] },
        grouping: []
      }),
      getColumn: () => undefined,
      setExpanded: vi.fn(),
      setGrouping: vi.fn()
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;

    const api = createGridApi(() => table, {
      ...baseOpts(),
      excelFileName: "padrao",
      excelSheetName: "Folha1"
    });

    await api.exportDataAsExcel({ fileName: "x.xlsx", sheetName: "Dados2" });

    expect(exportRowsToExcel).toHaveBeenCalledTimes(1);
    expect(exportRowsToExcel.mock.calls[0]![0]).toEqual([{ id: 1, name: "Z" }]);
    expect(exportRowsToExcel.mock.calls[0]![2]).toBe("x.xlsx");
    expect(exportRowsToExcel.mock.calls[0]![3]).toBe("Dados2");
  });

  it("exportDataAsPrint chama openGridPrintPreview", () => {
    const dataRow = { original: { id: 1, name: "Z" }, getIsGrouped: () => false };
    const table = {
      getFilteredRowModel: () => ({ flatRows: [dataRow] }),
      getRow: () => undefined,
      getState: () => ({
        rowSelection: {},
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnPinning: { left: [], right: [] },
        grouping: []
      }),
      getColumn: () => undefined,
      setExpanded: vi.fn(),
      setGrouping: vi.fn()
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;

    const api = createGridApi(() => table, {
      ...baseOpts(),
      csvFileName: "export.csv"
    });

    api.exportDataAsPrint({ title: "TituloX" });

    expect(openGridPrintPreview).toHaveBeenCalledTimes(1);
    expect(openGridPrintPreview.mock.calls[0]![0]).toEqual([{ id: 1, name: "Z" }]);
    expect(openGridPrintPreview.mock.calls[0]![2]).toBe("TituloX");
  });
});

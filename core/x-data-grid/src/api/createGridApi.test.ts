import { describe, expect, it, vi } from "vitest";
import { createGridApi } from "./createGridApi";
import type { GridStateSnapshot } from "../types";

function mockTable() {
  return {
    getRowModel: () => ({ flatRows: [] }),
    getFilteredRowModel: () => ({ flatRows: [] }),
    getFilteredSelectedRowModel: () => ({ flatRows: [] }),
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
}

describe("createGridApi", () => {
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

  function buildApi(overrides: Partial<Parameters<typeof createGridApi<Record<string, unknown>>>[1]> = {}) {
    return createGridApi(() => mockTable(), {
      getColumns: () => [],
      getRowId: (r) => (r as { id?: string }).id ?? "",
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
      setDensity: vi.fn(),
      ...overrides
    });
  }

  it("getCellMode e setEditCellValue vêm das opções", () => {
    const getCellMode = vi.fn(() => "edit" as const);
    const setEditCellValue = vi.fn(() => true);
    const api = buildApi({ getCellMode, setEditCellValue });
    expect(api.getCellMode({ id: 1, field: "a" })).toBe("edit");
    expect(getCellMode).toHaveBeenCalledWith({ id: 1, field: "a" });
    expect(api.setEditCellValue({ id: 1, field: "a", value: "x" })).toBe(true);
    expect(setEditCellValue).toHaveBeenCalledWith({ id: 1, field: "a", value: "x" });
  });

  it("startCellEditMode e stopCellEditMode delegam para callbacks", () => {
    const startCellEditMode = vi.fn(() => true);
    const stopCellEditMode = vi.fn();
    const api = buildApi({ startCellEditMode, stopCellEditMode });

    expect(api.startCellEditMode({ id: "r1", field: "name" })).toBe(true);
    api.stopCellEditMode();

    expect(startCellEditMode).toHaveBeenCalledWith({ id: "r1", field: "name" });
    expect(stopCellEditMode).toHaveBeenCalledTimes(1);
  });

  it("scroll e scrollToIndexes ajustam top/left no contentor", () => {
    const el = { scrollTop: 0, scrollLeft: 0 } as HTMLElement;
    const table = {
      ...mockTable(),
      getRowModel: () => ({ flatRows: [{ getIsGrouped: () => false }] }),
      getLeftLeafColumns: () => [{ getSize: () => 100 }],
      getCenterLeafColumns: () => [{ getSize: () => 80 }, { getSize: () => 120 }],
      getRightLeafColumns: () => []
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;
    const api = createGridApi(() => table, {
      ...{
        getColumns: () => [],
        getRowId: (r) => (r as { id?: string }).id ?? "",
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
        getScrollContainer: () => el,
        getEstimatedRowHeight: () => 30,
        getHeaderBlockHeight: () => 12,
        getStateSnapshot: () => snap,
        subscribeEventDispatch: () => () => {},
        focusQuickFilter: vi.fn(),
        getRowModesModel: () => ({}),
        setRowModesModel: vi.fn(),
        getDensity: () => "standard" as const,
        setDensity: vi.fn()
      }
    });

    api.scroll({ top: 45, left: 20 });
    expect(el.scrollTop).toBe(45);
    expect(el.scrollLeft).toBe(20);

    api.scrollToIndexes({ rowIndex: 2, colIndex: 2 });
    expect(el.scrollTop).toBe(12);
    expect(el.scrollLeft).toBe(180);
  });

  it("scrollToRow encontra o id visivel e reposiciona", () => {
    const el = { scrollTop: 0, scrollLeft: 0 } as HTMLElement;
    const table = {
      ...mockTable(),
      getRowModel: () => ({
        flatRows: [
          { getIsGrouped: () => false, original: { id: "a" } },
          { getIsGrouped: () => false, original: { id: "b" } },
          { getIsGrouped: () => true, original: { id: "g" } }
        ]
      }),
      getLeftLeafColumns: () => [],
      getCenterLeafColumns: () => [],
      getRightLeafColumns: () => []
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;
    const api = createGridApi(() => table, {
      ...{
        getColumns: () => [],
        getRowId: (r) => (r as { id?: string }).id ?? "",
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
        getScrollContainer: () => el,
        getEstimatedRowHeight: () => 25,
        getHeaderBlockHeight: () => 5,
        getStateSnapshot: () => snap,
        subscribeEventDispatch: () => () => {},
        focusQuickFilter: vi.fn(),
        getRowModesModel: () => ({}),
        setRowModesModel: vi.fn(),
        getDensity: () => "standard" as const,
        setDensity: vi.fn()
      }
    });

    api.scrollToRow("b");
    expect(el.scrollTop).toBe(30);
  });

  it("updateRows ignora vazio e encaminha updates", () => {
    const onRowsChange = vi.fn();
    const api = buildApi({ onRowsChange });

    api.updateRows([]);
    expect(onRowsChange).not.toHaveBeenCalled();

    api.updateRows([{ id: 1, name: "Novo" }]);
    expect(onRowsChange).toHaveBeenCalledWith([{ id: 1, name: "Novo" }]);
  });

  it("applyTransaction ignora vazio e encaminha add/update/remove", () => {
    const onRowTransaction = vi.fn();
    const api = buildApi({ onRowTransaction });

    api.applyTransaction({});
    expect(onRowTransaction).not.toHaveBeenCalled();

    api.applyTransaction({
      add: [{ id: 1 }],
      update: [{ id: 2 }],
      remove: [3]
    });
    expect(onRowTransaction).toHaveBeenCalledWith({
      add: [{ id: 1 }],
      update: [{ id: 2 }],
      remove: [3]
    });
  });

  it("setRowModesModel aceita objeto e callback", () => {
    let model = { "1": { mode: "view" as const } };
    const setRowModesModel = vi.fn((next) => {
      model = next;
    });
    const api = buildApi({
      getRowModesModel: () => model,
      setRowModesModel
    });

    api.setRowModesModel({ "1": { mode: "edit" } });
    expect(model).toEqual({ "1": { mode: "edit" } });

    api.setRowModesModel((prev) => ({ ...prev, "2": { mode: "view" } }));
    expect(model).toEqual({ "1": { mode: "edit" }, "2": { mode: "view" } });
    expect(setRowModesModel).toHaveBeenCalledTimes(2);
  });

  it("copySelectedRowsToClipboard não escreve quando não há linhas selecionadas", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true
    });
    const api = buildApi();
    await api.copySelectedRowsToClipboard();
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copySelectedRowsToClipboard escreve TSV só com colunas visíveis", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true
    });

    const flatRow = {
      original: { id: 1, name: "RowA" },
      getIsGrouped: () => false
    };
    const table = {
      ...mockTable(),
      getFilteredSelectedRowModel: () => ({ flatRows: [flatRow] }),
      getColumn: (field: string) => ({
        getIsVisible: () => field === "name"
      })
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;

    const api = createGridApi(() => table, {
      getColumns: () => [
        { field: "id", headerName: "ID" },
        { field: "name", headerName: "Nome" }
      ],
      getRowId: (r) => (r as { id?: number }).id ?? "",
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
    });

    await api.copySelectedRowsToClipboard();
    expect(writeText).toHaveBeenCalledTimes(1);
    const tsv = writeText.mock.calls[0]![0] as string;
    expect(tsv).toContain("Nome");
    expect(tsv).toContain("RowA");
    expect(tsv).not.toMatch(/\b1\b/);
  });

  it("showFilterPanel e hideFilterPanel delegam para openFilterPanel / closeFilterPanel", () => {
    const openFilterPanel = vi.fn();
    const closeFilterPanel = vi.fn();
    const api = buildApi({ openFilterPanel, closeFilterPanel });
    const anchor = { tagName: "BUTTON" } as unknown as HTMLElement;
    api.showFilterPanel(anchor);
    api.hideFilterPanel();
    expect(openFilterPanel).toHaveBeenCalledTimes(1);
    expect(openFilterPanel).toHaveBeenCalledWith(anchor);
    expect(closeFilterPanel).toHaveBeenCalledTimes(1);
  });

  it("showColumnsPanel e hideColumnsPanel delegam para as opções", () => {
    const openColumnsPanel = vi.fn();
    const closeColumnsPanel = vi.fn();
    const api = buildApi({ openColumnsPanel, closeColumnsPanel });
    const anchor = { tagName: "BUTTON" } as unknown as HTMLElement;
    api.showColumnsPanel(anchor);
    api.hideColumnsPanel();
    expect(openColumnsPanel).toHaveBeenCalledTimes(1);
    expect(openColumnsPanel).toHaveBeenCalledWith(anchor);
    expect(closeColumnsPanel).toHaveBeenCalledTimes(1);
  });

  it("getDensity e setDensity delegam às opções", () => {
    const setDensity = vi.fn();
    const api = buildApi({
      getDensity: () => "compact",
      setDensity
    });
    expect(api.getDensity()).toBe("compact");
    api.setDensity("comfortable");
    expect(setDensity).toHaveBeenCalledWith("comfortable");
  });

  it("setPinnedColumns e getPinnedColumns delegam às opções", () => {
    const setPinnedColumns = vi.fn();
    const getPinnedColumns = vi.fn(() => ({ left: ["id"], right: [] as string[] }));
    const api = buildApi({ setPinnedColumns, getPinnedColumns });
    api.setPinnedColumns({ left: ["name"], right: [] });
    expect(setPinnedColumns).toHaveBeenCalledWith({ left: ["name"], right: [] });
    expect(api.getPinnedColumns()).toEqual({ left: ["id"], right: [] });
  });

  it("setRowGroupingModel e getRowGroupingModel usam TanStack setGrouping / estado", () => {
    const state = { grouping: ["a"] as string[] };
    const setGrouping = vi.fn((g: string[]) => {
      state.grouping = [...g];
    });
    const table = {
      ...mockTable(),
      getState: () => ({
        rowSelection: {},
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnPinning: { left: [], right: [] },
        grouping: state.grouping
      }),
      setGrouping
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;

    const api = createGridApi(() => table, {
      getColumns: () => [],
      getRowId: (r) => (r as { id?: string }).id ?? "",
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
    });

    expect(api.getRowGroupingModel()).toEqual(["a"]);
    api.setRowGroupingModel(["x", "y"]);
    expect(setGrouping).toHaveBeenCalledWith(["x", "y"]);
  });

  it("setDetailPanelExpandedRowIds e getDetailPanelExpandedRowIds mapeiam estado expanded", () => {
    const state = { expanded: {} as Record<string, boolean> };
    const setExpanded = vi.fn((e: boolean | Record<string, boolean>) => {
      if (typeof e === "object" && e !== null) state.expanded = { ...e };
    });
    const table = {
      ...mockTable(),
      getState: () => ({
        rowSelection: {},
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnPinning: { left: [], right: [] },
        grouping: [],
        expanded: state.expanded
      }),
      setExpanded
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;

    const api = createGridApi(() => table, {
      getColumns: () => [],
      getRowId: (r) => (r as { id?: string }).id ?? "",
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
    });

    api.setDetailPanelExpandedRowIds([1, 2]);
    expect(setExpanded).toHaveBeenCalledWith({ "1": true, "2": true });
    state.expanded = { "1": true, "3": false };
    expect(api.getDetailPanelExpandedRowIds()).toEqual(["1"]);
  });

  it("setTreeExpandedRowIds e getTreeExpandedRowIds usam o mesmo expanded", () => {
    const state = { expanded: {} as Record<string, boolean> };
    const setExpanded = vi.fn((e: boolean | Record<string, boolean>) => {
      if (typeof e === "object" && e !== null) state.expanded = { ...e };
    });
    const table = {
      ...mockTable(),
      getState: () => ({
        rowSelection: {},
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnPinning: { left: [], right: [] },
        grouping: [],
        expanded: state.expanded
      }),
      setExpanded
    } as unknown as import("@tanstack/react-table").Table<Record<string, unknown>>;

    const api = createGridApi(() => table, {
      getColumns: () => [],
      getRowId: (r) => (r as { id?: string }).id ?? "",
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
    });

    api.setTreeExpandedRowIds(["a"]);
    expect(setExpanded).toHaveBeenCalledWith({ a: true });
    state.expanded = { a: true, b: true };
    expect(api.getTreeExpandedRowIds()).toEqual(["a", "b"]);
  });
});

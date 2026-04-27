/**
 * Testes de integração para detetar:
 * - loops de re-render (Profiler `onRender`);
 * - trabalho síncrono infinito (timeout do Vitest).
 *
 * Correr: `npx vitest run core/x-data-grid/src/DataGrid.interaction.test.tsx`
 *
 * @vitest-environment jsdom
 */
import * as React from "react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GridApiCommunity } from "./types";
import type { GridColDef } from "./types";
import { GridRowModes } from "./types";
import { DataGrid } from "./DataGrid";

type Row = { id: number; name: string; amount: number };

const rows: Row[] = [
  { id: 1, name: "Alpha", amount: 100 },
  { id: 2, name: "Beta", amount: 250 },
  { id: 3, name: "Gamma", amount: 30 }
];

const columns: GridColDef<Row>[] = [
  { field: "id", headerName: "ID", width: 80 },
  { field: "name", headerName: "Nome", flex: 1, minWidth: 120 },
  { field: "amount", headerName: "Valor", type: "number", width: 100 }
];

const defaultProps = {
  rows,
  columns,
  getRowId: (r: Row) => r.id,
  pagination: true as const,
  checkboxSelection: true as const,
  disableVirtualization: true as const,
  disableColumnReorder: true as const
};

/** Commits de render do subtree; um loop infinito dispara centenas/milhares em segundos. */
const MAX_PROFILER_COMMITS = 250;

function renderGrid(
  extra?: Partial<React.ComponentProps<typeof DataGrid<Row>>> & {
    apiRef?: React.MutableRefObject<GridApiCommunity<Row> | null>;
  }
) {
  let profilerCommits = 0;
  const onRender: ProfilerOnRenderCallback = (
    _id,
    _phase,
    _actualDuration,
    _baseDuration,
    _startTime,
    _commitTime
  ) => {
    profilerCommits += 1;
    if (profilerCommits > 2000) {
      throw new Error(
        `Possível loop de render: ${profilerCommits} commits no Profiler (interromper teste).`
      );
    }
  };

  const { apiRef, ...gridProps } = extra ?? {};
  const view = render(
    <Profiler id="hive-datagrid-test" onRender={onRender}>
      <DataGrid<Row> {...defaultProps} {...gridProps} {...(apiRef ? { apiRef } : {})} />
    </Profiler>
  );

  return {
    ...view,
    getProfilerCommits: () => profilerCommits
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DataGrid — interações não devem explodir commits de render", () => {
  it("API: ocultar coluna via setColumnVisibility", async () => {
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = {
      current: null
    };
    const { getProfilerCommits } = renderGrid({ apiRef });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    apiRef.current!.setColumnVisibility({ name: false });
    await waitFor(() => expect(screen.queryByText("Nome")).not.toBeInTheDocument(), { timeout: 3000 });
    expect(getProfilerCommits()).toBeLessThan(MAX_PROFILER_COMMITS);
  });

  it("clique: checkbox da primeira linha (seleção)", async () => {
    const user = userEvent.setup();
    const { getProfilerCommits } = renderGrid();

    const rowChecks = await screen.findAllByRole("checkbox", { name: /selecionar linha/i });
    expect(rowChecks.length).toBeGreaterThan(0);
    await user.click(rowChecks[0]!);
    await waitFor(() => expect(rowChecks[0]).toBeChecked());
    expect(getProfilerCommits()).toBeLessThan(MAX_PROFILER_COMMITS);
  });

  it("select: linhas por página", async () => {
    const user = userEvent.setup();
    const { getProfilerCommits } = renderGrid();

    const select = await screen.findByLabelText(/linhas por página/i);
    await user.selectOptions(select, "10");
    await waitFor(() => {
      expect((select as HTMLSelectElement).value).toBe("10");
    });
    expect(getProfilerCommits()).toBeLessThan(MAX_PROFILER_COMMITS);
  });

  it("subscribeEvent: paginationChange ao mudar página (após subscrição)", async () => {
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = {
      current: null
    };
    const onPagination = vi.fn();
    renderGrid({
      apiRef,
      initialState: {
        pagination: { paginationModel: { page: 0, pageSize: 1 } }
      }
    });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    const unsub = apiRef.current!.subscribeEvent("paginationChange", onPagination);
    onPagination.mockClear();
    apiRef.current!.setPaginationModel({ page: 1, pageSize: 1 });
    await waitFor(() => expect(onPagination).toHaveBeenCalled(), { timeout: 3000 });
    expect(onPagination.mock.calls[0]![0]!.paginationModel).toEqual({ page: 1, pageSize: 1 });
    unsub();
  });

  it("subscribeEvent: columnVisibilityChange ao ocultar coluna", async () => {
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = {
      current: null
    };
    const onVis = vi.fn();
    const { getProfilerCommits } = renderGrid({ apiRef });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    const unsub = apiRef.current!.subscribeEvent("columnVisibilityChange", onVis);
    onVis.mockClear();
    apiRef.current!.setColumnVisibility({ name: false });
    await waitFor(() => expect(onVis).toHaveBeenCalled(), { timeout: 3000 });
    expect(onVis.mock.calls[0]![0]!.columnVisibilityModel).toMatchObject({ name: false });
    unsub();
    expect(getProfilerCommits()).toBeLessThan(MAX_PROFILER_COMMITS);
  });

  it("subscribeEvent: rowGroupingModelChange ao definir agrupamento via API", async () => {
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = {
      current: null
    };
    const onGroup = vi.fn();
    const { getProfilerCommits } = renderGrid({ apiRef });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    const unsub = apiRef.current!.subscribeEvent("rowGroupingModelChange", onGroup);
    onGroup.mockClear();
    apiRef.current!.setRowGroupingModel(["name"]);
    await waitFor(() => expect(onGroup).toHaveBeenCalled(), { timeout: 3000 });
    expect(onGroup.mock.calls[0]![0]!.rowGroupingModel).toEqual(["name"]);
    unsub();
    expect(getProfilerCommits()).toBeLessThan(MAX_PROFILER_COMMITS);
  });

  it("subscribeEvent: pinnedColumnsChange ao fixar coluna à esquerda", async () => {
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = {
      current: null
    };
    const onPin = vi.fn();
    renderGrid({ apiRef });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    const unsub = apiRef.current!.subscribeEvent("pinnedColumnsChange", onPin);
    onPin.mockClear();
    apiRef.current!.setPinnedColumns({ left: ["id"], right: [] });
    await waitFor(() => expect(onPin).toHaveBeenCalled(), { timeout: 3000 });
    expect(onPin.mock.calls[0]![0]!.pinnedColumns.left).toEqual(["id"]);
    unsub();
  });

  it("paginação: mudar de página via API (3 linhas, 1 por página → página 2 de 3)", async () => {
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = {
      current: null
    };
    const { getProfilerCommits } = renderGrid({
      apiRef,
      initialState: {
        pagination: { paginationModel: { page: 0, pageSize: 1 } }
      }
    });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    apiRef.current!.setPaginationModel({ page: 1, pageSize: 1 });
    await waitFor(() => {
      expect(screen.getByText(/Página\s+2\s+de\s+3/i)).toBeInTheDocument();
    });
    expect(getProfilerCommits()).toBeLessThan(MAX_PROFILER_COMMITS);
  });

  it("painel colunas: ocultar coluna pelo checkbox da lista", async () => {
    const user = userEvent.setup({ delay: null });
    const { getProfilerCommits } = renderGrid();

    const menuBtn = await screen.findByRole("button", { name: /colunas/i });
    await user.click(menuBtn);
    await screen.findByRole("region", { name: /colunas/i }, { timeout: 8000 });
    const nameCheckbox = await screen.findByRole("checkbox", { name: /^nome$/i });
    await user.click(nameCheckbox);
    await waitFor(() => expect(nameCheckbox).not.toBeChecked(), { timeout: 3000 });
    expect(getProfilerCommits()).toBeLessThan(MAX_PROFILER_COMMITS);
  });

  it("aria-live anuncia alteração de ordenação (após API)", async () => {
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = {
      current: null
    };
    renderGrid({ apiRef });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();

    apiRef.current!.setSortModel([{ field: "name", sort: "asc" }]);
    await waitFor(
      () => {
        expect(live?.textContent ?? "").toMatch(/Nome/);
      },
      { timeout: 5000 }
    );
  });

  it("API: setCellFocus move foco para o editor da coluna indicada (edição em linha)", async () => {
    const user = userEvent.setup({ delay: null });
    const apiRef: React.MutableRefObject<GridApiCommunity<Row> | null> = { current: null };
    const editableCols: GridColDef<Row>[] = columns.map((c) =>
      c.field === "id" ? c : { ...c, editable: true as const }
    );
    renderGrid({
      apiRef,
      columns: editableCols,
      editMode: "row",
      processRowUpdate: async (r) => r,
      showRowEditActions: true,
      pagination: false,
      checkboxSelection: false
    });

    await waitFor(() => expect(apiRef.current).not.toBeNull(), { timeout: 5000 });
    await user.dblClick(await screen.findByText("Alpha"));
    await waitFor(() => {
      const el = document.querySelector(
        "[data-hive-grid-scroll] [data-hive-edit-root] input"
      ) as HTMLInputElement | null;
      expect(el?.value).toBe("Alpha");
    });
    apiRef.current!.setCellFocus({ id: 1, field: "amount" });
    await waitFor(
      () => {
        const amountCell = document.querySelector('[data-hive-cell][data-field="amount"]');
        expect(amountCell?.contains(document.activeElement)).toBe(true);
      },
      { timeout: 8000 }
    );
  });

  it("modo linha: edição sem fieldToFocus foca a primeira coluna editável", async () => {
    const editableCols: GridColDef<Row>[] = columns.map((c) =>
      c.field === "id" ? c : { ...c, editable: true as const }
    );
    renderGrid({
      columns: editableCols,
      editMode: "row",
      processRowUpdate: async (r) => r,
      showRowEditActions: true,
      pagination: false,
      checkboxSelection: false,
      initialState: {
        rowModesModel: { 1: GridRowModes.Edit }
      }
    });

    await waitFor(
      () => {
        const nameCell = document.querySelector('[data-hive-cell][data-field="name"]');
        expect(nameCell?.contains(document.activeElement)).toBe(true);
      },
      { timeout: 8000 }
    );
  });

  type RowPick = { id: number; pick: number | null };
  const rowsPick: RowPick[] = [{ id: 1, pick: null }];
  const columnsPick: GridColDef<RowPick>[] = [
    { field: "id", headerName: "ID", width: 60 },
    {
      field: "pick",
      headerName: "Pick",
      type: "singleSelect",
      editable: true,
      valueOptions: [
        { value: 1, label: "Udo - Shipper" },
        { value: 2, label: "Udo - Shipper 2" },
        { value: 3, label: "Udo - Shipper 3" }
      ]
    }
  ];

  it("select pesquisável: ArrowDown no filtro destaca a primeira opção filtrada (não salta)", async () => {
    const user = userEvent.setup({ delay: null });
    renderGrid({
      rows: rowsPick as unknown as Row[],
      columns: columnsPick as unknown as GridColDef<Row>[],
      getRowId: (r: Row) => (r as unknown as RowPick).id,
      editMode: "row",
      processRowUpdate: async (r) => r,
      showRowEditActions: true,
      pagination: false,
      checkboxSelection: false,
      initialState: {
        rowModesModel: { 1: GridRowModes.Edit }
      }
    });

    const pickCell = await waitFor(() =>
      document.querySelector('[data-hive-cell][data-field="pick"]')
    );
    expect(pickCell).toBeTruthy();
    const openSelect = within(pickCell as HTMLElement).getByRole("button", { name: /escolher valor/i });
    await user.click(openSelect);
    const pop = await waitFor(() => {
      const el = document.querySelector("[data-hive-searchable-select-popover]");
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });
    const search = within(pop).getByRole("textbox", { name: /pesquisar opções/i });
    await user.type(search, "Udo");
    await waitFor(() => {
      expect(within(pop).getAllByRole("option")).toHaveLength(3);
    });
    search.focus();
    expect(document.activeElement).toBe(search);
    fireEvent.keyDown(search, { key: "ArrowDown", bubbles: true });

    await waitFor(() => {
      const panel = document.querySelector("[data-hive-searchable-select-popover]");
      expect(panel).toBeTruthy();
      const first = within(panel as HTMLElement).getAllByRole("option")[0]!;
      expect(first).toHaveAttribute("aria-selected", "true");
      expect(first).toHaveAccessibleName(/Udo - Shipper$/);
    });
  });

  it("singleSelect assíncrono: após escolher opção mantém label no trigger (key estável)", async () => {
    const user = userEvent.setup({ delay: null });
    const loadEditValueOptions = vi.fn(async (_q: string) => [
      { value: 42, label: "Label Quarenta-e-dois" },
      { value: 99, label: "Outra" }
    ]);
    const cols: GridColDef<RowPick>[] = [
      { field: "id", headerName: "ID", width: 60 },
      {
        field: "pick",
        headerName: "Pick",
        type: "singleSelect",
        editable: true,
        async: true,
        valueOptions: [],
        loadEditValueOptions
      }
    ];
    renderGrid({
      rows: rowsPick as unknown as Row[],
      columns: cols as unknown as GridColDef<Row>[],
      getRowId: (r: Row) => (r as unknown as RowPick).id,
      editMode: "row",
      processRowUpdate: async (r) => r,
      showRowEditActions: true,
      pagination: false,
      checkboxSelection: false,
      initialState: {
        rowModesModel: { 1: GridRowModes.Edit }
      }
    });

    await waitFor(() => expect(loadEditValueOptions).toHaveBeenCalled(), { timeout: 5000 });
    const pickCell = await waitFor(() =>
      document.querySelector('[data-hive-cell][data-field="pick"]')
    );
    expect(pickCell).toBeTruthy();
    const openBtn = within(pickCell as HTMLElement).getByRole("button", { name: /escolher valor/i });
    await user.click(openBtn);
    const opt = await screen.findByRole("option", { name: "Label Quarenta-e-dois" }, { timeout: 5000 });
    await user.click(opt);

    await waitFor(() => {
      const btn = within(pickCell as HTMLElement).getByRole("button", { name: /escolher valor/i });
      expect(btn.textContent).toMatch(/Label Quarenta-e-dois/);
      expect(btn.textContent).not.toMatch(/^42$/);
    });
  });

  it("singleSelect assíncrono: após escolher, mantém label se `loadEditValueOptions(\"\")` já não devolve o id", async () => {
    const user = userEvent.setup({ delay: null });
    const loadEditValueOptions = vi.fn(async (q: string) => {
      const t = q.trim().toLowerCase();
      if (t === "") {
        return [{ value: 1, label: "Outro (lista inicial)" }];
      }
      if (t.includes("pre")) {
        return [{ value: 455, label: "Preston" }];
      }
      return [];
    });
    const cols: GridColDef<RowPick>[] = [
      { field: "id", headerName: "ID", width: 60 },
      {
        field: "pick",
        headerName: "Pick",
        type: "singleSelect",
        editable: true,
        async: true,
        valueOptions: [],
        loadEditValueOptions
      }
    ];
    renderGrid({
      rows: rowsPick as unknown as Row[],
      columns: cols as unknown as GridColDef<Row>[],
      getRowId: (r: Row) => (r as unknown as RowPick).id,
      editMode: "row",
      processRowUpdate: async (r) => r,
      showRowEditActions: true,
      pagination: false,
      checkboxSelection: false,
      initialState: {
        rowModesModel: { 1: GridRowModes.Edit }
      }
    });

    await waitFor(() => expect(loadEditValueOptions).toHaveBeenCalled(), { timeout: 5000 });
    const pickCell = await waitFor(() =>
      document.querySelector('[data-hive-cell][data-field="pick"]')
    );
    expect(pickCell).toBeTruthy();
    const openBtn = within(pickCell as HTMLElement).getByRole("button", { name: /escolher valor/i });
    await user.click(openBtn);
    const pop = await waitFor(() => document.querySelector("[data-hive-searchable-select-popover]") as HTMLElement);
    const search = within(pop).getByRole("textbox", { name: /pesquisar opções/i });
    await user.type(search, "pre");
    const opt = await screen.findByRole("option", { name: "Preston" }, { timeout: 5000 });
    await user.click(opt);

    await waitFor(() => {
      const btn = within(pickCell as HTMLElement).getByRole("button", { name: /escolher valor/i });
      expect(btn.textContent).toMatch(/Preston/);
      expect(btn.textContent).not.toMatch(/^455$/);
    });
  });
});

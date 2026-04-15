/**
 * Padrão ProtonWeb (ex.: operation/oceanexport/costs.tsx):
 * editMode="row", processRowUpdate, duplo clique para editar, Gravar/Cancelar na linha.
 *
 * @vitest-environment jsdom
 */
import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "./DataGrid";
import type { GridColDef, GridPreProcessEditCellProps, GridRowModesModel } from "./types";
import { GridRowEditStopReasons, GridRowModes } from "./types";

type Row = { id: number; name: string };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const baseColumns: GridColDef<Row>[] = [
  { field: "name", headerName: "Nome", flex: 1, minWidth: 120, editable: true }
];

describe("Paridade ProtonWeb — edição por linha (costs pattern)", () => {
  it("duplo clique → editar → Gravar chama processRowUpdate com rascunho fundido", async () => {
    const user = userEvent.setup({ delay: null });
    const processRowUpdate = vi.fn(async (newRow: Row, oldRow: Row) => {
      expect(oldRow.name).toBe("Alpha");
      expect(newRow.name).toBe("Beta");
      return newRow;
    });

    function Harness() {
      const [rows, setRows] = React.useState<Row[]>([{ id: 1, name: "Alpha" }]);
      return (
        <DataGrid<Row>
          rows={rows}
          columns={baseColumns}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={async (nr, or) => {
            const out = await processRowUpdate(nr, or);
            setRows([out]);
            return out;
          }}
          pagination={false}
          disableVirtualization
          disableColumnReorder
          disableColumnFilter
          showRowEditActions
        />
      );
    }

    render(<Harness />);

    const cell = await screen.findByText("Alpha");
    await user.dblClick(cell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        "[data-hive-grid-scroll] [data-hive-edit-root] input"
      ) as HTMLInputElement | null;
      if (!el) throw new Error("editor input");
      return el;
    });
    await user.clear(input);
    await user.type(input, "Beta");
    fireEvent.blur(input);

    await user.click(screen.getByRole("button", { name: "Gravar" }));

    await waitFor(
      () => {
        expect(processRowUpdate).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Beta")).toBeInTheDocument();
      },
      { timeout: 8000 }
    );
  });

  it("Cancelar dispara onRowEditStop com cancelButtonClick e previousRow", async () => {
    const user = userEvent.setup({ delay: null });
    const onRowEditStop = vi.fn();
    const processRowUpdate = vi.fn();

    function Harness() {
      const [rows] = React.useState<Row[]>([{ id: 1, name: "Alpha" }]);
      return (
        <DataGrid<Row>
          rows={rows}
          columns={baseColumns}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={processRowUpdate}
          onRowEditStop={onRowEditStop}
          pagination={false}
          disableVirtualization
          disableColumnReorder
          disableColumnFilter
          showRowEditActions
        />
      );
    }

    render(<Harness />);

    await user.dblClick(await screen.findByText("Alpha"));
    const input = await waitFor(() => {
      const el = document.querySelector(
        "[data-hive-grid-scroll] [data-hive-edit-root] input"
      ) as HTMLInputElement | null;
      if (!el) throw new Error("editor input");
      return el;
    });
    await user.clear(input);
    await user.type(input, "Gama");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(onRowEditStop).toHaveBeenCalled());
    const call = onRowEditStop.mock.calls.find(
      (c) => c[0]?.reason === GridRowEditStopReasons.cancelButtonClick
    );
    expect(call).toBeDefined();
    expect(call![0].previousRow?.name).toBe("Alpha");
    expect(processRowUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("Escape termina edição (rowFocusOut / escape) sem gravar", async () => {
    const user = userEvent.setup({ delay: null });
    const onRowEditStop = vi.fn();
    const processRowUpdate = vi.fn();

    function Harness() {
      const [rows] = React.useState<Row[]>([{ id: 1, name: "Alpha" }]);
      return (
        <DataGrid<Row>
          rows={rows}
          columns={baseColumns}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={processRowUpdate}
          onRowEditStop={onRowEditStop}
          pagination={false}
          disableVirtualization
          disableColumnReorder
          disableColumnFilter
          showRowEditActions
        />
      );
    }

    render(<Harness />);

    await user.dblClick(await screen.findByText("Alpha"));
    await waitFor(() => {
      const el = document.querySelector(
        "[data-hive-grid-scroll] [data-hive-edit-root] input"
      ) as HTMLInputElement | null;
      if (!el) throw new Error("editor input");
    });
    await user.keyboard("{Escape}");

    await waitFor(() => expect(onRowEditStop).toHaveBeenCalled());
    expect(
      onRowEditStop.mock.calls.some((c) => c[0]?.reason === GridRowEditStopReasons.escapeKeyDown)
    ).toBe(true);
    expect(processRowUpdate).not.toHaveBeenCalled();
  });

  it("preProcessEditCellProps aplica error e helperText (como costs.tsx)", async () => {
    const user = userEvent.setup({ delay: null });
    const columns: GridColDef<Row>[] = [
      {
        field: "name",
        headerName: "Nome",
        flex: 1,
        minWidth: 120,
        editable: true,
        preProcessEditCellProps: (params: GridPreProcessEditCellProps<Row>) => ({
          ...params.props,
          error: true,
          helperText: "Inválido"
        })
      }
    ];

    render(
      <DataGrid<Row>
        rows={[{ id: 1, name: "Alpha" }]}
        columns={columns}
        getRowId={(r) => r.id}
        editMode="row"
        processRowUpdate={async (r) => r}
        pagination={false}
        disableVirtualization
        disableColumnReorder
        disableColumnFilter
        showRowEditActions
      />
    );

    await user.dblClick(await screen.findByText("Alpha"));
    expect(await screen.findByText("Inválido")).toBeInTheDocument();
    const input = document.querySelector(
      "[data-hive-grid-scroll] [data-hive-edit-root] input"
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  type RowAB = { id: number; a: string; b: number };

  it("preProcessEditCellProps pode mutar otherFieldsProps (padrão ProtonWeb)", async () => {
    const user = userEvent.setup({ delay: null });
    const columns: GridColDef<RowAB>[] = [
      {
        field: "a",
        headerName: "A",
        flex: 1,
        minWidth: 80,
        editable: true,
        preProcessEditCellProps: (params) => {
          const ob = params.otherFieldsProps?.b;
          if (ob) ob.value = 42;
          return { ...params.props };
        }
      },
      { field: "b", headerName: "B", type: "number", width: 100, editable: true }
    ];

    render(
      <DataGrid<RowAB>
        rows={[{ id: 1, a: "x", b: 0 }]}
        columns={columns}
        getRowId={(r) => r.id}
        editMode="row"
        processRowUpdate={async (r) => r}
        pagination={false}
        disableVirtualization
        disableColumnReorder
        disableColumnFilter
        showRowEditActions
      />
    );

    await user.dblClick(await screen.findByText("x"));
    await waitFor(() => {
      const num = document.querySelector(
        "[data-hive-grid-scroll] tr[role='row']:last-of-type input[type='number']"
      ) as HTMLInputElement | null;
      expect(num?.value).toBe("42");
    });
  });

  it("processRowUpdate rejeitado mantém a linha em edição (não sai do modo)", async () => {
    const user = userEvent.setup({ delay: null });
    const processRowUpdate = vi.fn().mockRejectedValue(new Error("save failed"));

    function Harness() {
      const [rows] = React.useState<Row[]>([{ id: 1, name: "Alpha" }]);
      return (
        <DataGrid<Row>
          rows={rows}
          columns={baseColumns}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={processRowUpdate}
          pagination={false}
          disableVirtualization
          disableColumnReorder
          disableColumnFilter
          showRowEditActions
        />
      );
    }

    render(<Harness />);

    await user.dblClick(await screen.findByText("Alpha"));
    const input = await waitFor(() => {
      const el = document.querySelector(
        "[data-hive-grid-scroll] [data-hive-edit-root] input"
      ) as HTMLInputElement | null;
      if (!el) throw new Error("editor input");
      return el;
    });
    await user.clear(input);
    await user.type(input, "Beta");
    fireEvent.blur(input);
    await user.click(screen.getByRole("button", { name: "Gravar" }));

    await waitFor(() => expect(processRowUpdate).toHaveBeenCalledTimes(1), { timeout: 8000 });
    expect(screen.getByRole("button", { name: "Gravar" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Beta")).toBeInTheDocument();
  });

  type RowNameCode = { id: number; name: string; code: string };

  const twoTextColumns: GridColDef<RowNameCode>[] = [
    { field: "name", headerName: "Nome", flex: 1, minWidth: 80, editable: true },
    { field: "code", headerName: "Código", width: 120, editable: true }
  ];

  it("fieldToFocus no rowModesModel foca a coluna indicada ao entrar em edição", async () => {
    function Harness() {
      const [rows] = React.useState<RowNameCode[]>([{ id: 1, name: "A", code: "X1" }]);
      const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({
        1: { mode: GridRowModes.Edit, fieldToFocus: "code" }
      });
      return (
        <DataGrid<RowNameCode>
          rows={rows}
          columns={twoTextColumns}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={async (r) => r}
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          pagination={false}
          disableVirtualization
          disableColumnReorder
          disableColumnFilter
          showRowEditActions
        />
      );
    }

    render(<Harness />);

    await waitFor(
      () => {
        const cell = document.querySelector('[data-hive-cell][data-field="code"]');
        expect(cell?.contains(document.activeElement)).toBe(true);
      },
      { timeout: 8000 }
    );
  });

  it("Tab move o foco para a próxima célula editável na mesma linha", async () => {
    const user = userEvent.setup({ delay: null });

    function Harness() {
      const [rows] = React.useState<RowNameCode[]>([{ id: 1, name: "Alpha", code: "C1" }]);
      return (
        <DataGrid<RowNameCode>
          rows={rows}
          columns={twoTextColumns}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={async (r) => r}
          pagination={false}
          disableVirtualization
          disableColumnReorder
          disableColumnFilter
          showRowEditActions
        />
      );
    }

    render(<Harness />);

    await user.dblClick(await screen.findByText("Alpha"));
    await waitFor(() => {
      const el = document.querySelector(
        "[data-hive-grid-scroll] [data-hive-edit-root] input"
      ) as HTMLInputElement | null;
      expect(el?.value).toBe("Alpha");
    });

    const nameCell = document.querySelector('[data-hive-cell][data-field="name"]');
    expect(nameCell).toBeTruthy();
    fireEvent.keyDown(nameCell!, { key: "Tab", code: "Tab", bubbles: true });

    await waitFor(
      () => {
        const codeCell = document.querySelector('[data-hive-cell][data-field="code"]');
        expect(codeCell?.contains(document.activeElement)).toBe(true);
      },
      { timeout: 8000 }
    );
  });

  it("Tab na última célula editável termina edição com tabKeyDown", async () => {
    const user = userEvent.setup({ delay: null });
    const onRowEditStop = vi.fn();

    function Harness() {
      const [rows] = React.useState<RowNameCode[]>([{ id: 1, name: "Alpha", code: "C1" }]);
      return (
        <DataGrid<RowNameCode>
          rows={rows}
          columns={twoTextColumns}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={async (r) => r}
          onRowEditStop={onRowEditStop}
          pagination={false}
          disableVirtualization
          disableColumnReorder
          disableColumnFilter
          showRowEditActions
        />
      );
    }

    render(<Harness />);

    await user.dblClick(await screen.findByText("C1"));
    await waitFor(() => {
      const cell = document.querySelector('[data-hive-cell][data-field="code"]');
      const input = cell?.querySelector("[data-hive-edit-root] input") as HTMLInputElement | null;
      expect(input?.value).toBe("C1");
    });
    const codeCell = document.querySelector('[data-hive-cell][data-field="code"]');
    expect(codeCell).toBeTruthy();
    fireEvent.keyDown(codeCell!, { key: "Tab", code: "Tab", bubbles: true });

    await waitFor(() => expect(onRowEditStop).toHaveBeenCalled(), { timeout: 8000 });
    expect(
      onRowEditStop.mock.calls.some((c) => c[0]?.reason === GridRowEditStopReasons.tabKeyDown)
    ).toBe(true);
  });
});

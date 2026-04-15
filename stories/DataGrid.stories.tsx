import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { DataGrid, GridActionsCellItem } from "../src/index";
import type { GridColDef } from "../src/index";

type Row = { id: number; name: string; amount: number };

const columns: GridColDef<Row>[] = [
  { field: "id", headerName: "ID", width: 80 },
  { field: "name", headerName: "Nome", flex: 1, minWidth: 120 },
  { field: "amount", headerName: "Valor", type: "number", width: 100 }
];

const rows: Row[] = [
  { id: 1, name: "Alpha", amount: 100 },
  { id: 2, name: "Beta", amount: 250 },
  { id: 3, name: "Gamma", amount: 30 }
];

const meta = {
  title: "DataGrid/Basic",
  component: DataGrid
} as Meta;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="min-h-[320px] w-full max-w-4xl rounded-md border bg-background p-4">
      <DataGrid<Row>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pagination
        checkboxSelection
        disableVirtualization
      />
    </div>
  )
};

/** Sem arrastar para reordenar (`DndContext` não monta). */
export const ColumnReorderDisabled: StoryObj = {
  render: () => (
    <div className="min-h-[320px] w-full max-w-4xl rounded-md border bg-background p-4">
      <DataGrid<Row>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pagination
        checkboxSelection
        disableVirtualization
        disableColumnReorder
      />
    </div>
  )
};

/** Várias páginas (pageSize inicial = 5) para E2E Playwright (paginação). */
const rowsMany: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Row ${i + 1}`,
  amount: (i + 1) * 10
}));

export const PlaywrightSmoke: StoryObj = {
  render: () => (
    <div className="min-h-[320px] w-full max-w-4xl rounded-md border bg-background p-4">
      <DataGrid<Row>
        rows={rowsMany}
        columns={columns}
        getRowId={(r) => r.id}
        pagination
        checkboxSelection
        disableVirtualization
        pageSizeOptions={[2, 5, 10, 20, 50, 100]}
      />
    </div>
  )
};

const columnsPaste: GridColDef<Row>[] = [
  { field: "id", headerName: "ID", width: 70, editable: false },
  { field: "name", headerName: "Nome", flex: 1, minWidth: 120, editable: true },
  { field: "amount", headerName: "Valor", type: "number", width: 100, editable: true }
];

/**
 * E2E G5.1: colar TSV a partir da célula focada (`onRowsChange`).
 * Storybook 8: ID `datagrid-basic--playwright-g-5-clipboard-paste`
 */
export const PlaywrightG5ClipboardPaste: StoryObj = {
  render: function PlaywrightG5ClipboardPaste() {
    const [data, setData] = React.useState<Row[]>(() => rows.map((r) => ({ ...r })));
    return (
      <div className="min-h-[320px] w-full max-w-4xl rounded-md border bg-background p-4">
        <DataGrid<Row>
          rows={data}
          columns={columnsPaste}
          getRowId={(r) => r.id}
          onRowsChange={(updates) => {
            setData((prev) => {
              const next = [...prev];
              for (const u of updates) {
                const i = next.findIndex((r) => r.id === u.id);
                if (i >= 0) next[i] = { ...next[i], ...u };
              }
              return next;
            });
          }}
          disableVirtualization
          pagination={false}
          checkboxSelection={false}
        />
      </div>
    );
  }
};

/**
 * E2E G5.2 / G5.4: `onRowEditStop` com `reason` (cancelar / gravar / Tab).
 * Storybook 8: ID `datagrid-basic--playwright-g-5-row-edit-stop-reason`
 */
export const PlaywrightG5RowEditStopReason: StoryObj = {
  render: function PlaywrightG5RowEditStopReason() {
    const [data, setData] = React.useState<Row[]>(() => rows.map((r) => ({ ...r })));
    const [lastReason, setLastReason] = React.useState("");
    const [lastPreviousName, setLastPreviousName] = React.useState("");
    return (
      <div className="min-h-[320px] w-full max-w-4xl space-y-2 rounded-md border bg-background p-4">
        <p className="text-sm text-muted-foreground" data-testid="g5-last-stop-reason">
          {lastReason}
        </p>
        <p className="text-sm text-muted-foreground" data-testid="g5-previous-row-name">
          {lastPreviousName}
        </p>
        <DataGrid<Row>
          rows={data}
          columns={columnsPaste}
          getRowId={(r) => r.id}
          editMode="row"
          processRowUpdate={(nr) => nr}
          onRowsChange={(updates) => {
            setData((prev) => {
              const next = [...prev];
              for (const u of updates) {
                const i = next.findIndex((r) => r.id === u.id);
                if (i >= 0) next[i] = { ...next[i], ...u };
              }
              return next;
            });
          }}
          onRowEditStop={(p) => {
            setLastReason(p.reason ?? "");
            setLastPreviousName(p.previousRow != null ? p.previousRow.name : "");
          }}
          showRowEditActions
          disableVirtualization
          pagination={false}
          checkboxSelection={false}
        />
      </div>
    );
  }
};

/** 500 linhas para virtualização de linhas (sem paginação). */
const rowsVirtual500: Row[] = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  name: `Row ${i + 1}`,
  amount: (i + 1) * 10
}));

/**
 * E2E G5.6 / backlog #150: scroll com virtualização de linhas; e2e mede ms até «Row 500» visível + anotação `perf`.
 * Storybook 8: ID `datagrid-basic--playwright-g-6-virtual-scroll-smoke`
 */
export const PlaywrightG6VirtualScrollSmoke: StoryObj = {
  render: () => (
    <div className="w-full max-w-4xl rounded-md border bg-background p-4">
      <DataGrid<Row>
        rows={rowsVirtual500}
        columns={columns}
        getRowId={(r) => r.id}
        pagination={false}
        checkboxSelection={false}
      />
    </div>
  )
};

/** E2E paridade: filtro rápido + ordenação (cabeçalho clicável). ID: `datagrid-basic--playwright-parity-quick-filter` */
export const PlaywrightParityQuickFilter: StoryObj = {
  render: () => (
    <div className="min-h-[320px] w-full max-w-4xl rounded-md border bg-background p-4">
      <DataGrid<Row>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pagination={false}
        checkboxSelection={false}
        disableVirtualization
        disableColumnReorder
      />
    </div>
  )
};

type RowAction = { id: number; name: string };

const rowsAction: RowAction[] = [{ id: 1, name: "Item" }];

const columnsAction: GridColDef<RowAction>[] = [
  { field: "name", headerName: "Nome", flex: 1, minWidth: 120 },
  {
    field: "actions",
    type: "actions",
    headerName: " ",
    width: 120,
    getActions: () => [
      <GridActionsCellItem key="edit" icon={<PencilIcon className="h-4 w-4" />} label="Editar" />
    ]
  }
];

/** E2E paridade: coluna `type: actions` (padrão ProtonWeb). ID: `datagrid-basic--playwright-parity-actions-column` */
export const PlaywrightParityActionsColumn: StoryObj = {
  render: () => (
    <div className="min-h-[320px] w-full max-w-4xl rounded-md border bg-background p-4">
      <DataGrid<RowAction>
        rows={rowsAction}
        columns={columnsAction}
        getRowId={(r) => r.id}
        pagination={false}
        checkboxSelection={false}
        disableVirtualization
        disableColumnReorder
      />
    </div>
  )
};

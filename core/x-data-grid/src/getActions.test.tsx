/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DataGrid } from "./DataGrid";
import type { GridColDef } from "./types";
import { GridActionsCellItem } from "./GridCells";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

type Row = { id: number; name: string };

const rows: Row[] = [{ id: 1, name: "A" }];

afterEach(() => {
  cleanup();
});

describe("getActions", () => {
  it("renderiza ícones inline e item em menu", async () => {
    const user = userEvent.setup();
    const columns: GridColDef<Row>[] = [
      { field: "name", headerName: "Nome", flex: 1 },
      {
        field: "actions",
        type: "actions",
        headerName: " ",
        width: 120,
        getActions: () => [
          <GridActionsCellItem key="e" icon={<PencilIcon className="h-4 w-4" />} label="Editar" />,
          <GridActionsCellItem
            key="d"
            showInMenu
            icon={<TrashIcon className="h-4 w-4" />}
            label="Apagar"
          />
        ]
      }
    ];

    render(
      <DataGrid<Row>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        disableVirtualization
        disableColumnReorder
        pagination={false}
      />
    );

    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    const more = screen.getByRole("button", { name: "Mais ações" });
    await user.click(more);
    expect(await screen.findByRole("button", { name: "Apagar" })).toBeInTheDocument();
  });
});

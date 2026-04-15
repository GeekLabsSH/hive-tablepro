import type { ExportColumn } from "../../../src/export/csv-excel";
import { GRID_CHECKBOX_SELECTION_FIELD } from "./constants";
import type { GridColDef, GridValidRowModel } from "./types";

function columnExcludedFromExport<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  return (
    c.type === "actions" ||
    c.getActions != null ||
    c.type === "checkbox" ||
    c.field === GRID_CHECKBOX_SELECTION_FIELD
  );
}

export function gridColumnsToExportColumns<R extends GridValidRowModel>(
  columns: GridColDef<R>[]
): ExportColumn<R & object>[] {
  return columns
    .filter((c) => !columnExcludedFromExport(c))
    .map((c) => ({
      id: c.field,
      header: c.headerName ?? c.field,
      accessor: (row: R & object) => (row as Record<string, unknown>)[c.field]
    }));
}

export function tsvFromSelectedRows<R extends GridValidRowModel>(
  rows: (R & object)[],
  columns: GridColDef<R>[]
): string {
  const cols = gridColumnsToExportColumns(columns);
  const esc = (v: unknown) =>
    String(v ?? "")
      .replace(/\r?\n/g, " ")
      .replace(/\t/g, " ");
  const header = cols.map((c) => esc(c.header)).join("\t");
  const lines = rows.map((row) => cols.map((c) => esc(c.accessor!(row))).join("\t"));
  return [header, ...lines].join("\n");
}

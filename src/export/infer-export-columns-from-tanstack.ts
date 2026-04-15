import type { ColumnDef } from "@tanstack/react-table";
import type { ExportColumn } from "./csv-excel";

/**
 * Infere colunas de export CSV/Excel a partir de definições TanStack (`HiveDataTable`, etc.).
 * Código partilhado com `DataGrid` / exportadores — evita duplicar lógica entre tabelas.
 */
export function inferExportColumnsFromTanstackColumnDefs<T extends object>(
  cols: ColumnDef<T, unknown>[]
): ExportColumn<T>[] {
  const out: ExportColumn<T>[] = [];
  for (const c of cols) {
    const accessorKey = (c as { accessorKey?: keyof T & string }).accessorKey;
    const id = (c.id ?? accessorKey) as string | undefined;
    if (!id || id === "__select__") continue;
    const header = typeof c.header === "string" ? c.header : id;
    const accessorFn = (c as { accessorFn?: (row: T) => unknown }).accessorFn;
    out.push({
      id: id as keyof T,
      header,
      accessor: accessorFn ?? ((row) => row[id as keyof T] as unknown)
    });
  }
  return out;
}

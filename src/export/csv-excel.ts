import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export type ExportColumn<T extends object> = {
  /** Chave do objeto ou id da coluna */
  id: keyof T | string;
  /** Cabeçalho no ficheiro */
  header: string;
  /** Extrair valor para export (opcional) */
  accessor?: (row: T) => unknown;
};

function getCellValue<T extends object>(row: T, col: ExportColumn<T>): unknown {
  if (col.accessor) return col.accessor(row);
  const key = col.id as keyof T;
  return row[key];
}

/**
 * Exporta linhas para CSV (UTF-8).
 * @param utf8WithBom — se `true` (por defeito), prefixa com BOM U+FEFF para o Excel reconhecer UTF-8.
 */
export function exportRowsToCsv<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  utf8WithBom = true
): void {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(getCellValue(row, c))).join(",")
  );
  const body = [header, ...lines].join("\r\n");
  const csv = utf8WithBom ? "\uFEFF" + body : body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/** Exporta linhas para Excel (.xlsx). */
export async function exportRowsToExcel<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Dados"
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(columns.map((c) => c.header));
  for (const row of rows) {
    ws.addRow(columns.map((c) => getCellValue(row, c)));
  }
  const buf = await wb.xlsx.writeBuffer();
  const name = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
}

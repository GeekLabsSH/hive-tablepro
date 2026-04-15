import type { ExportColumn } from "./csv-excel";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCellValue<T extends object>(row: T, col: ExportColumn<T>): unknown {
  if (col.accessor) return col.accessor(row);
  return row[col.id as keyof T];
}

function cellHtml(value: unknown): string {
  if (value == null) return "";
  return escapeHtml(String(value).replace(/\r?\n/g, " "));
}

function buildPrintHtmlDocument<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
  title: string
): string {
  const safeTitle = escapeHtml(title);
  const headerRow = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${cellHtml(getCellValue(row, c))}</td>`).join("")}</tr>`
    )
    .join("");
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>
  body { font-family: system-ui, Segoe UI, sans-serif; margin: 16px; color: #111; }
  h1 { font-size: 1.15rem; font-weight: 600; margin: 0 0 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #bbb; padding: 6px 8px; vertical-align: top; }
  th { background: #f0f0f0; text-align: left; }
  @media print {
    body { margin: 8px; }
    th { background: #eee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<h1>${safeTitle}</h1>
<table><thead><tr>${headerRow}</tr></thead><tbody>${body}</tbody></table>
<script>window.addEventListener("load",function(){window.focus();window.print();});<\/script>
</body></html>`;
}

/**
 * Abre uma janela com a tabela filtrada e dispara o diálogo de impressão do browser.
 * Requer gesto do utilizador (ex.: clique) para não ser bloqueado por popup.
 */
export function openGridPrintPreview<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
  title: string
): void {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  const html = buildPrintHtmlDocument(rows, columns, title);
  w.document.open();
  w.document.write(html);
  w.document.close();
}

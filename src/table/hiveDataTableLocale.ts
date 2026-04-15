/** Textos da UI de `HiveDataTable` (alinhado ao espírito de `GridLocaleText` na DataGrid). */
export interface HiveDataTableLocale {
  filterPlaceholder: string;
  columnsMenu: string;
  columnsVisibility: string;
  exportAriaLabel: string;
  exportCsv: string;
  exportExcel: string;
  /** Template: `{count}` → número de linhas selecionadas. */
  selectedRowsPrefix: string;
  /** Template: `{current}` e `{total}` (1-based). */
  pageReport: string;
  selectAllRowsAria: string;
  selectRowAria: string;
}

export const defaultHiveDataTableLocale: HiveDataTableLocale = {
  filterPlaceholder: "Filtrar…",
  columnsMenu: "Colunas",
  columnsVisibility: "Visibilidade",
  exportAriaLabel: "Exportar",
  exportCsv: "CSV",
  exportExcel: "Excel",
  selectedRowsPrefix: "{count} selecionada(s) · ",
  pageReport: "Página {current} de {total}",
  selectAllRowsAria: "Selecionar todas",
  selectRowAria: "Selecionar linha"
};

export function mergeHiveDataTableLocale(
  partial?: Partial<HiveDataTableLocale>
): HiveDataTableLocale {
  return { ...defaultHiveDataTableLocale, ...partial };
}

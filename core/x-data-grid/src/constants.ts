import type { GridColDef } from "./types";

/** Campo interno da coluna de seleção (checkbox / rádio), alinhado ao DataGrid. */
export const GRID_CHECKBOX_SELECTION_FIELD = "__select__" as const;

/**
 * Definição de coluna de seleção (MUI X).
 * Em geral a grelha adiciona esta coluna com `checkboxSelection`; usar para mesclar em `columns` manualmente.
 */
export const GRID_CHECKBOX_SELECTION_COL_DEF: GridColDef = {
  field: GRID_CHECKBOX_SELECTION_FIELD,
  type: "checkbox",
  width: 52,
  minWidth: 52,
  maxWidth: 52,
  sortable: false,
  filterable: false,
  resizable: false,
  disableColumnMenu: true,
  disableReorder: true,
  hideable: false,
  pinnable: false,
  headerName: ""
};

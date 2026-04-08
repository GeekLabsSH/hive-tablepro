import {
  GridColDef,
  GRID_STRING_COL_DEF,
} from "@geeklabssh/hive-tablepro/core/x-data-grid/src";
import { renderRowReorderCell } from "../../../components/GridRowReorderCell";

export const GRID_REORDER_COL_DEF: GridColDef = {
  ...GRID_STRING_COL_DEF,
  field: "__reorder__",
  type: "reorder",
  sortable: false,
  filterable: false,
  width: 50,
  align: "center",
  headerAlign: "center",
  disableColumnMenu: true,
  disableExport: true,
  disableReorder: true,
  resizable: false,
  // @ts-ignore
  aggregable: false,
  renderHeader: () => " ",
  renderCell: renderRowReorderCell,
};

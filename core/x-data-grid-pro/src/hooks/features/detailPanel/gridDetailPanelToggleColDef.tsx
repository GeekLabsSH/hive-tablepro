import {
  GridColDef,
  GRID_STRING_COL_DEF,
} from "@GeekLabsSH/hive-tablepro/core/x-data-grid/src";
import { GridDetailPanelToggleCell } from "../../../components/GridDetailPanelToggleCell";
import { GridApiPro } from "../../../models/gridApiPro";
import { gridDetailPanelExpandedRowIdsSelector } from "./gridDetailPanelSelector";

export const GRID_DETAIL_PANEL_TOGGLE_FIELD = "__detail_panel_toggle__";

export const GRID_DETAIL_PANEL_TOGGLE_COL_DEF: GridColDef = {
  ...GRID_STRING_COL_DEF,
  field: GRID_DETAIL_PANEL_TOGGLE_FIELD,
  type: "detailPanelToggle",
  editable: false,
  sortable: false,
  filterable: false,
  resizable: false,
  // @ts-ignore
  aggregable: false,
  disableColumnMenu: true,
  disableReorder: true,
  disableExport: true,
  align: "left",
  width: 40,
  valueGetter: (params) => {
    const expandedRowIds = gridDetailPanelExpandedRowIdsSelector(
      (params.api as GridApiPro).state
    );
    return expandedRowIds.includes(params.id);
  },
  renderCell: (params) => <GridDetailPanelToggleCell {...params} />,
  renderHeader: () => null,
};

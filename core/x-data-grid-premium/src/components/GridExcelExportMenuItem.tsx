import MenuItem from "@cronoslogistics/hive-tablepro/core/mui-material/src/MenuItem";
import { GridExportMenuItemProps } from "@cronoslogistics/hive-tablepro/core/x-data-grid-pro/src";
import PropTypes from "prop-types";
import { GridExcelExportOptions } from "../hooks/features/export";
import { useGridApiContext } from "../hooks/utils/useGridApiContext";

export type GridExcelExportMenuItemProps =
  GridExportMenuItemProps<GridExcelExportOptions>;

function GridExcelExportMenuItem(props: GridExcelExportMenuItemProps) {
  const apiRef = useGridApiContext();
  const { hideMenu, options, ...other } = props;

  return (
    <MenuItem
      onClick={() => {
        apiRef.current.exportDataAsExcel(options);
        hideMenu?.();
      }}
      {...other}
    >
      {apiRef.current.getLocaleText("toolbarExportExcel")}
    </MenuItem>
  );
}

GridExcelExportMenuItem.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  hideMenu: PropTypes.func,
  options: PropTypes.shape({
    allColumns: PropTypes.bool,
    columnsStyles: PropTypes.object,
    disableToolbarButton: PropTypes.bool,
    exceljsPostProcess: PropTypes.func,
    exceljsPreProcess: PropTypes.func,
    fields: PropTypes.arrayOf(PropTypes.string),
    fileName: PropTypes.string,
    getRowsToExport: PropTypes.func,
    includeColumnGroupsHeaders: PropTypes.bool,
    includeHeaders: PropTypes.bool,
    valueOptionsSheetName: PropTypes.string,
  }),
} as any;

export { GridExcelExportMenuItem };

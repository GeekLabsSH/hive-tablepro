import ListItemIcon from "@GeekLabsSH/hive-tablepro/core/mui-material/src/ListItemIcon";
import ListItemText from "@GeekLabsSH/hive-tablepro/core/mui-material/src/ListItemText";
import MenuItem from "@GeekLabsSH/hive-tablepro/core/mui-material/src/MenuItem";
import {
  gridColumnLookupSelector,
  GridColumnMenuItemProps,
  useGridSelector,
} from "@GeekLabsSH/hive-tablepro/core/x-data-grid-pro/src";
import PropTypes from "prop-types";
import * as React from "react";
import { gridRowGroupingSanitizedModelSelector } from "../hooks/features/rowGrouping/gridRowGroupingSelector";
import { useGridApiContext } from "../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../hooks/utils/useGridRootProps";

function GridColumnMenuRowUngroupItem(props: GridColumnMenuItemProps) {
  const { colDef, onClick } = props;
  const apiRef = useGridApiContext();
  const rowGroupingModel = useGridSelector(
    apiRef,
    gridRowGroupingSanitizedModelSelector
  );
  const columnsLookup = useGridSelector(apiRef, gridColumnLookupSelector);
  const rootProps = useGridRootProps();

  if (!colDef.groupable) {
    return null;
  }

  const ungroupColumn = (event: React.MouseEvent<HTMLElement>) => {
    apiRef.current.removeRowGroupingCriteria(colDef.field);
    onClick(event);
  };

  const groupColumn = (event: React.MouseEvent<HTMLElement>) => {
    apiRef.current.addRowGroupingCriteria(colDef.field);
    onClick(event);
  };

  const name = columnsLookup[colDef.field].headerName ?? colDef.field;

  if (rowGroupingModel.includes(colDef.field)) {
    return (
      <MenuItem onClick={ungroupColumn}>
        <ListItemIcon>
          <rootProps.components.ColumnMenuUngroupIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          {apiRef.current.getLocaleText("unGroupColumn")(name)}
        </ListItemText>
      </MenuItem>
    );
  }

  return (
    <MenuItem onClick={groupColumn}>
      <ListItemIcon>
        <rootProps.components.ColumnMenuGroupIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        {apiRef.current.getLocaleText("groupColumn")(name)}
      </ListItemText>
    </MenuItem>
  );
}

GridColumnMenuRowUngroupItem.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  colDef: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
} as any;

export { GridColumnMenuRowUngroupItem };

import ListItemIcon from "@cronoslogistics/hive-tablepro/core/mui-material/src/ListItemIcon";
import ListItemText from "@cronoslogistics/hive-tablepro/core/mui-material/src/ListItemText";
import MenuItem from "@cronoslogistics/hive-tablepro/core/mui-material/src/MenuItem";
import {
  gridColumnLookupSelector,
  GridColumnMenuItemProps,
  useGridSelector,
} from "@cronoslogistics/hive-tablepro/core/x-data-grid-pro/src";
import PropTypes from "prop-types";
import * as React from "react";
import { gridRowGroupingSanitizedModelSelector } from "../hooks/features/rowGrouping/gridRowGroupingSelector";
import {
  getRowGroupingCriteriaFromGroupingField,
  GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD,
  isGroupingColumn,
} from "../hooks/features/rowGrouping/gridRowGroupingUtils";
import { useGridApiContext } from "../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../hooks/utils/useGridRootProps";

function GridColumnMenuRowGroupItem(props: GridColumnMenuItemProps) {
  const { colDef, onClick } = props;
  const apiRef = useGridApiContext();
  const rowGroupingModel = useGridSelector(
    apiRef,
    gridRowGroupingSanitizedModelSelector
  );
  const columnsLookup = useGridSelector(apiRef, gridColumnLookupSelector);
  const rootProps = useGridRootProps();

  const renderUnGroupingMenuItem = (field: string) => {
    const ungroupColumn = (event: React.MouseEvent<HTMLElement>) => {
      apiRef.current.removeRowGroupingCriteria(field);
      onClick(event);
    };

    const name = columnsLookup[field].headerName ?? field;
    return (
      <MenuItem onClick={ungroupColumn} key={field}>
        <ListItemIcon>
          <rootProps.components.ColumnMenuUngroupIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          {apiRef.current.getLocaleText("unGroupColumn")(name)}
        </ListItemText>
      </MenuItem>
    );
  };

  if (!colDef || !isGroupingColumn(colDef.field)) {
    return null;
  }

  if (colDef.field === GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD) {
    return (
      <React.Fragment>
        {rowGroupingModel.map(renderUnGroupingMenuItem)}
      </React.Fragment>
    );
  }

  return renderUnGroupingMenuItem(
    getRowGroupingCriteriaFromGroupingField(colDef.field)!
  );
}

GridColumnMenuRowGroupItem.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  colDef: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
} as any;

export { GridColumnMenuRowGroupItem };

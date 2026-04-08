import ListItemIcon from "@GeekLabsSH/hive-tablepro/core/mui-material/src/ListItemIcon";
import ListItemText from "@GeekLabsSH/hive-tablepro/core/mui-material/src/ListItemText";
import MenuItem from "@GeekLabsSH/hive-tablepro/core/mui-material/src/MenuItem";
import PropTypes from "prop-types";
import * as React from "react";
import { useGridApiContext } from "../../../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../../../hooks/utils/useGridRootProps";
import { GridColumnMenuItemProps } from "../GridColumnMenuItemProps";

function GridColumnMenuFilterItem(props: GridColumnMenuItemProps) {
  const { colDef, onClick } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();

  const showFilter = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      onClick(event);
      apiRef.current.showFilterPanel(colDef.field);
    },
    [apiRef, colDef.field, onClick]
  );

  if (rootProps.disableColumnFilter || !colDef.filterable) {
    return null;
  }

  return (
    <MenuItem onClick={showFilter}>
      <ListItemIcon>
        <rootProps.components.ColumnMenuFilterIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        {apiRef.current.getLocaleText("columnMenuFilter")}
      </ListItemText>
    </MenuItem>
  );
}

GridColumnMenuFilterItem.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  colDef: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
} as any;

export { GridColumnMenuFilterItem };

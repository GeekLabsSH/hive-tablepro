import ListItemIcon from "@cronoslogistics/hive-tablepro/core/mui-material/src/ListItemIcon";
import ListItemText from "@cronoslogistics/hive-tablepro/core/mui-material/src/ListItemText";
import MenuItem from "@cronoslogistics/hive-tablepro/core/mui-material/src/MenuItem";
import PropTypes from "prop-types";
import * as React from "react";
import { GridPreferencePanelsValue } from "../../../../hooks/features/preferencesPanel/gridPreferencePanelsValue";
import { useGridApiContext } from "../../../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../../../hooks/utils/useGridRootProps";
import { GridColumnMenuItemProps } from "../GridColumnMenuItemProps";

function GridColumnMenuManageItem(props: GridColumnMenuItemProps) {
  const { onClick } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();

  const showColumns = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      onClick(event); // hide column menu
      apiRef.current.showPreferences(GridPreferencePanelsValue.columns);
    },
    [apiRef, onClick]
  );

  if (rootProps.disableColumnSelector) {
    return null;
  }

  return (
    <MenuItem onClick={showColumns}>
      <ListItemIcon>
        <rootProps.components.ColumnMenuManageColumnsIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        {apiRef.current.getLocaleText("columnMenuManageColumns")}
      </ListItemText>
    </MenuItem>
  );
}

GridColumnMenuManageItem.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  colDef: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
} as any;

export { GridColumnMenuManageItem };

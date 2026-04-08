import {
  GridColumnMenuProps,
  GridGenericColumnMenu,
  GRID_COLUMN_MENU_COMPONENTS,
  GRID_COLUMN_MENU_COMPONENTS_PROPS,
} from "@cronoslogistics/hive-tablepro/core/x-data-grid/src";
import PropTypes from "prop-types";
import * as React from "react";
import { GridColumnMenuPinningItem } from "./GridColumnMenuPinningItem";

export const GRID_COLUMN_MENU_COMPONENTS_PRO = {
  ...GRID_COLUMN_MENU_COMPONENTS,
  ColumnMenuPinningItem: GridColumnMenuPinningItem,
};

export const GRID_COLUMN_MENU_COMPONENTS_PROPS_PRO = {
  ...GRID_COLUMN_MENU_COMPONENTS_PROPS,
  columnMenuPinningItem: {
    displayOrder: 15,
  },
};

const GridProColumnMenu = React.forwardRef<
  HTMLUListElement,
  GridColumnMenuProps
>(function GridProColumnMenu(props, ref) {
  return (
    <GridGenericColumnMenu
      ref={ref}
      {...props}
      defaultComponents={GRID_COLUMN_MENU_COMPONENTS_PRO}
      defaultComponentsProps={GRID_COLUMN_MENU_COMPONENTS_PROPS_PRO}
    />
  );
});

GridProColumnMenu.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  colDef: PropTypes.object.isRequired,
  hideMenu: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
} as any;

export { GridProColumnMenu };

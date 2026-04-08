import {
  styled,
  SxProps,
  Theme,
} from "@GeekLabsSH/hive-tablepro/core/mui-material/src";
import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["panelHeader"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridPanelHeaderRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "PanelHeader",
  overridesResolver: (props, styles) => styles.panelHeader,
})(({ theme }) => ({
  padding: theme.spacing(1),
}));

function GridPanelHeader(
  props: React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
) {
  const { className, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <GridPanelHeaderRoot className={clsx(className, classes.root)} {...other} />
  );
}

GridPanelHeader.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
} as any;

export { GridPanelHeader };

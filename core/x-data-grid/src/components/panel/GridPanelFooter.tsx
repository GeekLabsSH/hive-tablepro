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
    root: ["panelFooter"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridPanelFooterRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "PanelFooter",
  overridesResolver: (props, styles) => styles.panelFooter,
})(({ theme }) => ({
  padding: theme.spacing(0.5),
  display: "flex",
  justifyContent: "space-between",
}));

function GridPanelFooter(
  props: React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
) {
  const { className, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <GridPanelFooterRoot className={clsx(className, classes.root)} {...other} />
  );
}

GridPanelFooter.propTypes = {
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

export { GridPanelFooter };

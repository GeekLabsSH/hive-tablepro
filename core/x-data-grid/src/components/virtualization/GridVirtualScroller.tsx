import {
  styled,
  SxProps,
  Theme,
} from "@GeekLabsSH/hive-tablepro/core/mui-material/src";
import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["virtualScroller"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const VirtualScrollerRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "VirtualScroller",
  overridesResolver: (props, styles) => styles.virtualScroller,
})({
  overflow: "auto",
  height: "100%",
  // See https://github.com/mui/mui-x/issues/4360
  position: "relative",
  "@media print": {
    overflow: "hidden",
  },
});

const GridVirtualScroller = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
>(function GridVirtualScroller(props, ref) {
  const { className, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <VirtualScrollerRoot
      ref={ref}
      className={clsx(classes.root, className)}
      {...other}
    />
  );
});

export { GridVirtualScroller };

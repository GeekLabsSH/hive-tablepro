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
    root: ["virtualScrollerRenderZone"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const VirtualScrollerRenderZoneRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "VirtualScrollerRenderZone",
  overridesResolver: (props, styles) => styles.virtualScrollerRenderZone,
})({
  position: "absolute",
  display: "flex", // Prevents margin collapsing when using `getRowSpacing`
  flexDirection: "column",
});

const GridVirtualScrollerRenderZone = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
>(function GridVirtualScrollerRenderZone(props, ref) {
  const { className, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <VirtualScrollerRenderZoneRoot
      ref={ref}
      className={clsx(classes.root, className)}
      {...other}
    />
  );
});

export { GridVirtualScrollerRenderZone };

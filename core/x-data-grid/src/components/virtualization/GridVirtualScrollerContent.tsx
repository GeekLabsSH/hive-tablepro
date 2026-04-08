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

type OwnerState = {
  classes: DataGridProcessedProps["classes"];
  overflowedContent: boolean;
};

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes, overflowedContent } = ownerState;

  const slots = {
    root: [
      "virtualScrollerContent",
      overflowedContent && "virtualScrollerContent--overflowed",
    ],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const VirtualScrollerContentRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "VirtualScrollerContent",
  overridesResolver: (props, styles) => styles.virtualScrollerContent,
})({});

const GridVirtualScrollerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }
>(function GridVirtualScrollerContent(props, ref) {
  const { className, style, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = {
    classes: rootProps.classes,
    overflowedContent: !rootProps.autoHeight && style?.minHeight === "auto",
  };
  const classes = useUtilityClasses(ownerState);

  return (
    <VirtualScrollerContentRoot
      ref={ref}
      className={clsx(classes.root, className)}
      style={style}
      {...other}
    />
  );
});

export { GridVirtualScrollerContent };

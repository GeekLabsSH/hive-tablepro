import { styled } from "@cronoslogistics/hive-tablepro/core/mui-material/src";
import { unstable_compClasses as compClasses } from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

export type GridIconButtonContainerProps = React.HTMLAttributes<HTMLDivElement>;

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["iconButtonContainer"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridIconButtonContainerRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "IconButtonContainer",
  overridesResolver: (props, styles) => styles.iconButtonContainer,
})(() => ({
  display: "flex",
  visibility: "hidden",
  width: 0,
}));

export const GridIconButtonContainer = React.forwardRef<
  HTMLDivElement,
  GridIconButtonContainerProps
>(function GridIconButtonContainer(props: GridIconButtonContainerProps, ref) {
  const { className, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <GridIconButtonContainerRoot
      ref={ref}
      className={clsx(classes.root, className)}
      {...other}
    />
  );
});

import { styled } from "@cronoslogistics/hive-tablepro/core/mui-material/src";
import { unstable_compClasses as compClasses } from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["main"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridMainContainerRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "Main",
  overridesResolver: (props, styles) => styles.main,
})(() => ({
  position: "relative",
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}));

export function GridMainContainer(props: React.PropsWithChildren<{}>) {
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);
  return (
    <GridMainContainerRoot className={classes.root}>
      {props.children}
    </GridMainContainerRoot>
  );
}

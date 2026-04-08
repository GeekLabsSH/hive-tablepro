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
  classes?: DataGridProcessedProps["classes"];
};

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["columnHeaders", "withBorderColor"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridColumnHeadersRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "ColumnHeaders",
  overridesResolver: (props, styles) => styles.columnHeaders,
})(({ theme }) => {
  return {
    height: 40,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    borderBottom: "1px solid",
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
  };
});

interface GridColumnHeadersProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
}

export const GridColumnHeaders = React.forwardRef<
  HTMLDivElement,
  GridColumnHeadersProps
>(function GridColumnHeaders(props, ref) {
  const { className, ...other } = props;
  const rootProps = useGridRootProps();

  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <GridColumnHeadersRoot
      ref={ref}
      className={clsx(className, classes.root)}
      {...other}
    />
  );
});

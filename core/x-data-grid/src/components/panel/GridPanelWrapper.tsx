import {
  styled,
  Theme,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src";
import TrapFocus from "@cronoslogistics/hive-tablepro/core/mui-material/src/Unstable_TrapFocus";
import { MUIStyledCommonProps } from "@cronoslogistics/hive-tablepro/core/mui-system/src";
import { unstable_compClasses as compClasses } from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["panelWrapper"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridPanelWrapperRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "PanelWrapper",
  overridesResolver: (props, styles) => styles.panelWrapper,
})({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  "&:focus": {
    outline: 0,
  },
});

const isEnabled = () => true;

export interface GridPanelWrapperProps
  extends React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>,
    MUIStyledCommonProps<Theme> {}

const GridPanelWrapper = React.forwardRef<
  HTMLDivElement,
  GridPanelWrapperProps
>(function GridPanelWrapper(props, ref) {
  const { className, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <TrapFocus open disableEnforceFocus isEnabled={isEnabled}>
      <GridPanelWrapperRoot
        ref={ref}
        tabIndex={-1}
        className={clsx(className, classes.root)}
        {...other}
      />
    </TrapFocus>
  );
});

export { GridPanelWrapper };

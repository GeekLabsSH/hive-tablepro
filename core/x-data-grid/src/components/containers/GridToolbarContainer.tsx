import {
  styled,
  SxProps,
  Theme,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src";
import { unstable_compClasses as compClasses } from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

export type GridToolbarContainerProps = React.HTMLAttributes<HTMLDivElement | any> & {
  sx?: SxProps<Theme>;
  customSubtitleText?: string;
};

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["toolbarContainer"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridToolbarContainerRoot = styled("div", {
  name: "MuiDataGrid",
  slot: "ToolbarContainer",
  overridesResolver: (_, styles) => styles.toolbarContainer,
})(({ theme }) => ({
  display: "inline-grid",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 0.5, 0),
  width: "100%",
}));

const GridToolbarContainer = React.forwardRef<
  HTMLDivElement,
  GridToolbarContainerProps
>(function GridToolbarContainer(props, ref) {
  const { className, children, title, customSubtitleText, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);
  if (!children) {
    return null;
  }

  return (
    <>

      <GridToolbarContainerRoot
        ref={ref}
        className={clsx(className, classes.root)}
        {...other}
      >
        <div>
          {children}
        </div>
        <div style={{
            gridColumnStart: 2,
            gridColumnEnd: "two",
            display: "flex",
            alignItems: "baseline",
            justifyContent: 'space-between',
          }}>
          <h5>{title}</h5>
          {customSubtitleText && <span>{customSubtitleText}</span>}
        </div>

      </GridToolbarContainerRoot>
    </>
  );
});

GridToolbarContainer.propTypes = {
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

export { GridToolbarContainer };

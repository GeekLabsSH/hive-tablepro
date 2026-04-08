import { styled } from "@cronoslogistics/hive-tablepro/core/mui-material/src";
import ClickAwayListener, {
  ClickAwayListenerProps,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src/ClickAwayListener";
import Grow, {
  GrowProps,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src/Grow";
import Paper from "@cronoslogistics/hive-tablepro/core/mui-material/src/Paper";
import Popper, {
  PopperProps,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src/Popper";
import {
  HTMLElementType,
  unstable_compClasses as compClasses,
} from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import {
  getDataGridUtilityClass,
  gridClasses,
} from "../../constants/gridClasses";
import { useGridApiContext } from "../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

type MenuPosition =
  | "bottom-end"
  | "bottom-start"
  | "bottom"
  | "left-end"
  | "left-start"
  | "left"
  | "right-end"
  | "right-start"
  | "right"
  | "top-end"
  | "top-start"
  | "top"
  | undefined;

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["menu"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridMenuRoot = styled(Popper, {
  name: "MuiDataGrid",
  slot: "Menu",
  overridesResolver: (_, styles) => styles.menu,
})(({ theme }) => ({
  zIndex: theme.zIndex.modal,
  [`& .${gridClasses.menuList}`]: {
    outline: 0,
  },
}));

export interface GridMenuProps
  extends Omit<PopperProps, "onKeyDown" | "children"> {
  open: boolean;
  target: HTMLElement | null;
  onClickAway: ClickAwayListenerProps["onClickAway"];
  position?: MenuPosition;
  onExited?: GrowProps["onExited"];
  children: React.ReactNode;
}

const transformOrigin = {
  "bottom-start": "top left",
  "bottom-end": "top right",
};

function GridMenu(props: GridMenuProps) {
  const {
    open,
    target,
    onClickAway,
    children,
    position,
    className,
    onExited,
    ...other
  } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  React.useEffect(() => {
    // Emit menuOpen or menuClose events
    const eventName = open ? "menuOpen" : "menuClose";
    apiRef.current.publishEvent(eventName, { target });
  }, [apiRef, open, target]);

  const handleExited =
    (popperOnExited: (() => void) | undefined) => (node: HTMLElement) => {
      if (popperOnExited) {
        popperOnExited();
      }

      if (onExited) {
        onExited(node);
      }
    };

  return (
    <GridMenuRoot
      as={rootProps.components.BasePopper}
      className={clsx(className, classes.root)}
      open={open}
      anchorEl={target as any}
      transition
      placement={position}
      {...other}
      {...rootProps.componentsProps?.basePopper}
    >
      {({ TransitionProps, placement }) => (
        <ClickAwayListener onClickAway={onClickAway} mouseEvent="onMouseDown">
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                transformOrigin[placement as keyof typeof transformOrigin],
            }}
            onExited={handleExited(TransitionProps?.onExited)}
          >
            <Paper>{children}</Paper>
          </Grow>
        </ClickAwayListener>
      )}
    </GridMenuRoot>
  );
}

GridMenu.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  children: PropTypes.node,
  onClickAway: PropTypes.func.isRequired,
  onExited: PropTypes.func,
  /**
   * If `true`, the component is shown.
   */
  open: PropTypes.bool.isRequired,
  position: PropTypes.oneOf([
    "bottom-end",
    "bottom-start",
    "bottom",
    "left-end",
    "left-start",
    "left",
    "right-end",
    "right-start",
    "right",
    "top-end",
    "top-start",
    "top",
  ]),
  target: HTMLElementType,
} as any;

export { GridMenu };

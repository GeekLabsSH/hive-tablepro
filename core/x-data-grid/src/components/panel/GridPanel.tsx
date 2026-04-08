import { styled } from "@GeekLabsSH/hive-tablepro/core/mui-material/src";
import ClickAwayListener from "@GeekLabsSH/hive-tablepro/core/mui-material/src/ClickAwayListener";
import Paper from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Paper";
import Popper from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Popper";
import { unstable_generateUtilityClasses as generateUtilityClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import { gridClasses } from "../../constants/gridClasses";
import { useGridApiContext } from "../../hooks/utils/useGridApiContext";
import { isEscapeKey } from "../../utils/keyboardUtils";

export interface GridPanelClasses {
  /** Styles applied to the root element. */
  panel: string;
  /** Styles applied to the paper element. */
  paper: string;
}

export interface GridPanelProps
  extends React.ComponentProps<typeof GridPanelRoot> {
  children?: React.ReactNode;
  /**
   * Override or extend the styles applied to the component.
   */
  classes?: Partial<GridPanelClasses>;
  open: boolean;
}

export const gridPanelClasses = generateUtilityClasses<keyof GridPanelClasses>(
  "MuiDataGrid",
  ["panel", "paper"]
);

const GridPanelRoot = styled(Popper, {
  name: "MuiDataGrid",
  slot: "Panel",
  overridesResolver: (props, styles) => styles.panel,
})(({ theme }) => ({
  zIndex: theme.zIndex.modal,
}));

const GridPaperRoot = styled(Paper, {
  name: "MuiDataGrid",
  slot: "Paper",
  overridesResolver: (props, styles) => styles.paper,
})(({ theme }) => ({
  backgroundColor: (theme.vars || theme).palette.background.paper,
  minWidth: 300,
  maxHeight: 450,
  display: "flex",
}));

const GridPanel = React.forwardRef<HTMLDivElement, GridPanelProps>(
  (props, ref) => {
    const { children, className, classes: classesProp, ...other } = props;
    const apiRef = useGridApiContext();
    const classes = gridPanelClasses;
    const [isPlaced, setIsPlaced] = React.useState(false);

    const handleClickAway = React.useCallback(() => {
      apiRef.current.hidePreferences();
    }, [apiRef]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (isEscapeKey(event.key)) {
          apiRef.current.hidePreferences();
        }
      },
      [apiRef]
    );

    const modifiers = React.useMemo(
      () => [
        {
          name: "flip",
          enabled: false,
        },
        {
          name: "isPlaced",
          enabled: true,
          phase: "main" as const,
          fn: () => {
            setIsPlaced(true);
          },
          effect: () => () => {
            setIsPlaced(false);
          },
        },
      ],
      []
    );

    const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);

    React.useEffect(() => {
      const columnHeadersElement =
        apiRef.current.rootElementRef?.current?.querySelector(
          `.${gridClasses.columnHeaders}`
        );

      if (columnHeadersElement) {
        setAnchorEl(columnHeadersElement);
      }
    }, [apiRef]);

    if (!anchorEl) {
      return null;
    }

    return (
      <GridPanelRoot
        ref={ref}
        placement="bottom-start"
        className={clsx(className, classes.panel)}
        anchorEl={anchorEl}
        modifiers={modifiers}
        {...other}
      >
        <ClickAwayListener mouseEvent="onMouseUp" onClickAway={handleClickAway}>
          <GridPaperRoot
            className={classes.paper}
            elevation={8}
            onKeyDown={handleKeyDown}
          >
            {isPlaced && children}
          </GridPaperRoot>
        </ClickAwayListener>
      </GridPanelRoot>
    );
  }
);

GridPanel.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * Popper render function or node.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * If `true`, the component is shown.
   */
  open: PropTypes.bool.isRequired,
} as any;

export { GridPanel };

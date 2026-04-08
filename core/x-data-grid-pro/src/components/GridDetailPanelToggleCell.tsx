import IconButton from "@GeekLabsSH/hive-tablepro/core/mui-material/src/IconButton";
import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import {
  getDataGridUtilityClass,
  GridRenderCellParams,
  useGridSelector,
} from "@GeekLabsSH/hive-tablepro/core/x-data-grid/src";
import PropTypes from "prop-types";
import * as React from "react";
import { gridDetailPanelExpandedRowsContentCacheSelector } from "../hooks/features/detailPanel/gridDetailPanelSelector";
import { useGridApiContext } from "../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../hooks/utils/useGridRootProps";
import { DataGridProProcessedProps } from "../models/dataGridProProps";

type OwnerState = {
  classes: DataGridProProcessedProps["classes"];
  isExpanded: boolean;
};

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes, isExpanded } = ownerState;

  const slots = {
    root: [
      "detailPanelToggleCell",
      isExpanded && "detailPanelToggleCell--expanded",
    ],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

function GridDetailPanelToggleCell(props: GridRenderCellParams) {
  const { id, value: isExpanded } = props;

  const rootProps = useGridRootProps() as any;
  const apiRef = useGridApiContext();
  const ownerState: OwnerState = { classes: rootProps.classes, isExpanded };
  const classes = useUtilityClasses(ownerState);

  const contentCache = useGridSelector(
    apiRef,
    gridDetailPanelExpandedRowsContentCacheSelector
  );
  const hasContent = React.isValidElement(contentCache[id] as any);

  const Icon = isExpanded
    ? rootProps.components.DetailPanelCollapseIcon
    : rootProps.components.DetailPanelExpandIcon;

  return (
    <IconButton
      size="small"
      tabIndex={-1}
      disabled={!hasContent}
      className={classes.root}
      aria-label={
        isExpanded
          ? apiRef.current.getLocaleText("collapseDetailPanel")
          : apiRef.current.getLocaleText("expandDetailPanel")
      }
    >
      <Icon fontSize="inherit" />
    </IconButton>
  );
}

GridDetailPanelToggleCell.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * GridApi that let you manipulate the grid.
   */
  api: PropTypes.object.isRequired,
  /**
   * The mode of the cell.
   */
  cellMode: PropTypes.oneOf(["edit", "view"]).isRequired,
  /**
   * The column of the row that the current cell belongs to.
   */
  colDef: PropTypes.object.isRequired,
  /**
   * The column field of the cell that triggered the event.
   */
  field: PropTypes.string.isRequired,
  /**
   * A ref allowing to set imperative focus.
   * It can be passed to the element that should receive focus.
   * @ignore - do not document.
   */
  focusElementRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.shape({
        focus: PropTypes.func.isRequired,
      }),
    }),
  ]),
  /**
   * The cell value formatted with the column valueFormatter.
   */
  formattedValue: PropTypes.any,
  /**
   * If true, the cell is the active element.
   */
  hasFocus: PropTypes.bool.isRequired,
  /**
   * The grid row id.
   */
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  /**
   * If true, the cell is editable.
   */
  isEditable: PropTypes.bool,
  /**
   * The row model of the row that the current cell belongs to.
   */
  row: PropTypes.any.isRequired,
  /**
   * The node of the row that the current cell belongs to.
   */
  rowNode: PropTypes.object.isRequired,
  /**
   * the tabIndex value.
   */
  tabIndex: PropTypes.oneOf([-1, 0]).isRequired,
  /**
   * The cell value.
   * If the column has `valueGetter`, use `params.row` to directly access the fields.
   */
  value: PropTypes.any,
} as any;

export { GridDetailPanelToggleCell };

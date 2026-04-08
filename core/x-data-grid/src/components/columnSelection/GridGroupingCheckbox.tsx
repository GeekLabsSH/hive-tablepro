import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import PropTypes from "prop-types";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { gridTabIndexColumnHeaderSelector } from "../../hooks/features/focus/gridFocusStateSelector";
import { gridRowSelectionStateSelector } from "../../hooks/features/rowSelection/gridRowSelectionSelector";
import { useGridApiContext } from "../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { useGridSelector } from "../../hooks/utils/useGridSelector";
import { GridRowId } from "../../models/gridRows";
import { GridColumnHeaderParams } from "../../models/params/gridColumnHeaderParams";
import { GridGroupingSelectionCheckboxParams } from "../../models/params/gridGroupingSelectionCheckboxParams";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

type OwnerState = { classes: DataGridProcessedProps["classes"] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;
  const slots = {
    root: ["checkboxInput"],
  };
  return compClasses(slots, getDataGridUtilityClass, classes);
};

const GridGroupingCheckbox = React.forwardRef<
  HTMLInputElement,
  GridColumnHeaderParams & { isSubHeader: boolean, group: string}
>(function GridHeaderCheckbox(props, ref) {
  const { field, colDef, isSubHeader, group, ...other } = props;
  const [, forceUpdate] = React.useState(false);
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);
  const allId = apiRef.current.getAllRowIds();
  const allRow = useGridSelector(apiRef, gridRowSelectionStateSelector);
  const tabIndexState = useGridSelector(
    apiRef,
    gridTabIndexColumnHeaderSelector
  );

  const idGroup = group?.substring(group.lastIndexOf("/") + 1);

  const getListId = () => {
    const list = [];
    allId.forEach((id) => {
      if (!apiRef.current.getRow(id)) {
        return false;
      }
      return list.push(apiRef.current.getRowParams(id));
    });

    const newList = isSubHeader ? list.filter(params => params.row.numberOperation == idGroup) : list.filter(params => params.row.master == idGroup);
    return newList.map(row => {return row.id})
  }

  const filteredSelection = React.useMemo(() => {
    const list = [];
    allRow.forEach((id) => {
      // The row might have been deleted
      if (!apiRef.current.getRow(id)) {
        return false;
      }

      return list.push(apiRef.current.getRowParams(id));
    });

    return isSubHeader ? list.filter(params => params.row.numberOperation == idGroup) : list.filter(params => params.row.master == idGroup);

  }, [apiRef, rootProps.isRowSelectable, allRow]);

  const selection = filteredSelection.map(row => {return row.id});

  const selectionCandidates = React.useMemo(() => {
    const rowIds = selection;
    return rowIds.reduce<Record<GridRowId, true>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
  }, [
    rootProps.pagination,
    rootProps.checkboxSelectionVisibleOnly,
    selection
  ]);

  const currentSelectionSize = React.useMemo(
    () => filteredSelection.filter((id) => selectionCandidates[id]).length,
    [filteredSelection, selectionCandidates]
  );

  const isIndeterminate =
    currentSelectionSize > 0 &&
    currentSelectionSize < Object.keys(selectionCandidates).length;

  const isChecked = selection && selection.length > 0;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const params: GridGroupingSelectionCheckboxParams = {
      value: event.target.checked,
      listId: getListId(),
    };
    apiRef.current.publishEvent("groupingSelectionCheckboxChange", params);
  };

  const tabIndex =
    tabIndexState !== null && tabIndexState.field === props.field ? 0 : -1;
  React.useLayoutEffect(() => {
    const element = apiRef.current.getColumnHeaderElement(props.field);
    if (tabIndex === 0 && element) {
      element!.tabIndex = -1;
    }
  }, [tabIndex, apiRef, props.field]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === " ") {
        apiRef.current.publishEvent("groupingSelectionCheckboxChange", {
          value: !isChecked,
          listId: getListId(),
        });
      }
    },
    [apiRef, isChecked]
  );

  const handleSelectionChange = React.useCallback(() => {
    forceUpdate((p) => !p);
  }, []);

  React.useEffect(() => {
    return apiRef.current.subscribeEvent(
      "rowSelectionChange",
      handleSelectionChange
    );
  }, [apiRef, handleSelectionChange]);

  const label = apiRef.current.getLocaleText(
    isChecked
      ? "checkboxSelectionUnselectAllRows"
      : "checkboxSelectionSelectAllRows"
  );

  return (
    <rootProps.components.BaseCheckbox
      ref={ref}
      indeterminate={isIndeterminate}
      checked={isChecked}
      onChange={handleChange}
      className={classes.root}
      inputProps={{ "aria-label": label }}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      {...rootProps.componentsProps?.baseCheckbox}
      {...other}
    />
  );
});

GridGroupingCheckbox.propTypes = {
  colDef: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
} as any;

export { GridGroupingCheckbox };


import { unstable_compClasses as compClasses } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import { getDataGridUtilityClass, GRID_CHECKBOX_SELECTION_COL_DEF, GRID_CHECKBOX_SELECTION_FIELD } from '@geeklabssh/hive-tablepro/core/x-data-grid/src';
import { useGridRegisterPipeProcessor } from '@geeklabssh/hive-tablepro/core/x-data-grid/src/internals';
import React, { useMemo } from "react";

const useUtilityClasses = (ownerState: any) => {
  const { classes } = ownerState;

  return useMemo(() => {
    const slots = {
      cellCheckbox: ['cellCheckbox'],
      columnHeaderCheckbox: ['columnHeaderCheckbox'],
    };

    return compClasses(slots, getDataGridUtilityClass, classes);
  }, [classes]);
};

export const useGridRowSelectionPreProcessors = (
  apiRef: any,
  props: any,
) => {
  const ownerState = { classes: props.classes };
  const classes = useUtilityClasses(ownerState);

  const updateSelectionColumn = React.useCallback(
    (columnsState) => {
      const selectionColumn: any = {
        ...GRID_CHECKBOX_SELECTION_COL_DEF,
        cellClassName: classes.cellCheckbox,
        headerClassName: classes.columnHeaderCheckbox,
        headerName: apiRef.current.getLocaleText('checkboxSelectionHeaderName'),
      };

      const shouldHaveSelectionColumn = props.checkboxSelection;
      const haveSelectionColumn = columnsState.lookup[GRID_CHECKBOX_SELECTION_FIELD] != null;

      if (shouldHaveSelectionColumn && !haveSelectionColumn) {
        columnsState.lookup[GRID_CHECKBOX_SELECTION_FIELD] = selectionColumn;
        columnsState.orderedFields = [GRID_CHECKBOX_SELECTION_FIELD, ...columnsState.orderedFields];
      } else if (!shouldHaveSelectionColumn && haveSelectionColumn) {
        delete columnsState.lookup[GRID_CHECKBOX_SELECTION_FIELD];
        columnsState.orderedFields = columnsState.orderedFields.filter(
          (field) => field !== GRID_CHECKBOX_SELECTION_FIELD,
        );
      } else if (shouldHaveSelectionColumn && haveSelectionColumn) {
        columnsState.lookup[GRID_CHECKBOX_SELECTION_FIELD] = {
          ...selectionColumn,
          ...columnsState.lookup[GRID_CHECKBOX_SELECTION_FIELD],
        };
      }

      return columnsState;
    },
    [apiRef, classes, props.checkboxSelection],
  );

  useGridRegisterPipeProcessor(apiRef, 'hydrateColumns', updateSelectionColumn);
};

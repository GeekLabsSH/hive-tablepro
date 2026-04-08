import { unstable_compClasses as compClasses } from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import { getDataGridUtilityClass, GridColDef } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src';
import { GridPipeProcessor, useGridRegisterPipeProcessor } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src/internals';
import * as React from 'react';
import { DataGridProProcessedProps } from '../../../models/dataGridProProps';
import { GridPrivateApiPro } from '../../../models/gridApiPro';
import { GRID_REORDER_COL_DEF } from './gridRowReorderColDef';

type OwnerState = { classes: DataGridProProcessedProps['classes'] };

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  return React.useMemo(() => {
    const slots = {
      rowReorderCellContainer: ['rowReorderCellContainer'],
      columnHeaderReorder: ['columnHeaderReorder'],
    };

    return compClasses(slots, getDataGridUtilityClass, classes);
  }, [classes]);
};

export const useGridRowReorderPreProcessors = (
  privateApiRef: React.MutableRefObject<GridPrivateApiPro>,
  props: DataGridProProcessedProps,
) => {
  const ownerState = { classes: props.classes };
  const classes = useUtilityClasses(ownerState);

  const updateReorderColumn = React.useCallback<GridPipeProcessor<'hydrateColumns'>>(
    (columnsState) => {
      const reorderColumn: GridColDef = {
        ...GRID_REORDER_COL_DEF,
        cellClassName: classes.rowReorderCellContainer,
        headerClassName: classes.columnHeaderReorder,
        headerName: privateApiRef.current.getLocaleText('rowReorderingHeaderName'),
      };

      const shouldHaveReorderColumn = props.rowReordering;
      const haveReorderColumn = columnsState.lookup[reorderColumn.field] != null;

      if (shouldHaveReorderColumn && haveReorderColumn) {
        return columnsState;
      }

      if (shouldHaveReorderColumn && !haveReorderColumn) {
        columnsState.lookup[reorderColumn.field] = reorderColumn;
        columnsState.orderedFields = [reorderColumn.field, ...columnsState.orderedFields];
      } else if (!shouldHaveReorderColumn && haveReorderColumn) {
        delete columnsState.lookup[reorderColumn.field];
        columnsState.orderedFields = columnsState.orderedFields.filter(
          (field) => field !== reorderColumn.field,
        );
      }

      return columnsState;
    },
    [privateApiRef, classes, props.rowReordering],
  );

  useGridRegisterPipeProcessor(privateApiRef, 'hydrateColumns', updateReorderColumn);
};

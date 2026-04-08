import {
  GridEventListener, gridRowsMetaSelector, GridScrollParams, gridVisibleColumnDefinitionsSelector, useGridApiEventHandler,
  useGridApiOptionHandler, useGridSelector
} from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src';
import { useGridVisibleRows } from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src/internals';
import * as React from 'react';
import { GridRowScrollEndParams } from '../../../models';
import { DataGridProProcessedProps } from '../../../models/dataGridProProps';
import { GridPrivateApiPro } from '../../../models/gridApiPro';

/**
 * @requires useGridColumns (state)
 * @requires useGridDimensions (method) - can be after
 * @requires useGridScroll (method
 */
export const useGridInfiniteLoader = (
  apiRef: React.MutableRefObject<GridPrivateApiPro>,
  props: Pick<
    DataGridProProcessedProps,
    'onRowsScrollEnd' | 'scrollEndThreshold' | 'pagination' | 'paginationMode' | 'rowsLoadingMode'
  >,
): void => {
  const visibleColumns = useGridSelector(apiRef, gridVisibleColumnDefinitionsSelector);
  const currentPage = useGridVisibleRows(apiRef, props);
  const rowsMeta = useGridSelector(apiRef, gridRowsMetaSelector);
  const contentHeight = Math.max(rowsMeta.currentPageTotalHeight, 1);

  const isInScrollBottomArea = React.useRef<boolean>(false);

  const handleRowsScrollEnd = React.useCallback(
    (scrollPosition: GridScrollParams) => {
      const dimensions = apiRef.current.getRootDimensions();

      // Prevent the infite loading working in combination with lazy loading
      if (!dimensions || props.rowsLoadingMode !== 'client') {
        return;
      }

      const scrollPositionBottom = scrollPosition.top + dimensions.viewportOuterSize.height;
      const viewportPageSize = apiRef.current.getViewportPageSize();

      if (scrollPositionBottom < contentHeight - props.scrollEndThreshold) {
        isInScrollBottomArea.current = false;
      }

      if (
        scrollPositionBottom >= contentHeight - props.scrollEndThreshold &&
        !isInScrollBottomArea.current
      ) {
        const rowScrollEndParam: GridRowScrollEndParams = {
          visibleColumns,
          viewportPageSize,
          visibleRowsCount: currentPage.rows.length,
        };
        apiRef.current.publishEvent('rowsScrollEnd', rowScrollEndParam);
        isInScrollBottomArea.current = true;
      }
    },
    [
      contentHeight,
      props.scrollEndThreshold,
      props.rowsLoadingMode,
      visibleColumns,
      apiRef,
      currentPage.rows.length,
    ],
  );

  const handleGridScroll = React.useCallback<GridEventListener<'scrollPositionChange'>>(
    ({ left, top }) => {
      handleRowsScrollEnd({ left, top });
    },
    [handleRowsScrollEnd],
  );

  useGridApiEventHandler(apiRef, 'scrollPositionChange', handleGridScroll);
  useGridApiOptionHandler(apiRef, 'rowsScrollEnd', props.onRowsScrollEnd);
};

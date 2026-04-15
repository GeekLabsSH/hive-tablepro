import * as React from 'react';
import { GridPrivateApiCommunity } from '../../../models/api/gridApiCommunity';
import { useGridApiMethod } from '../../utils/useGridApiMethod';
import { GridCsvExportApi } from '../../../models/api/gridCsvExportApi';
import { GridCsvExportOptions, GridExcelExportOptions } from '../../../models/gridExport';
import { useGridLogger } from '../../utils/useGridLogger';
import { buildCSV } from './serializers/csvSerializer';
import { getColumnsToExport, defaultGetRowsToExport } from './utils';
import { GridPipeProcessor, useGridRegisterPipeProcessor } from '../../core/pipeProcessing';
import {
  GridExportDisplayOptions,
  GridExcelExportMenuItem,
} from '../../../components/toolbar/GridToolbarExport';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { GridExcelExportApi } from '../../../models/api/gridExcelExportApi';

/**
 * @requires useGridColumns (state)
 * @requires useGridFilter (state)
 * @requires useGridSorting (state)
 * @requires useGridSelection (state)
 * @requires useGridParamsApi (method)
 */
export const useGridExcelExport = (apiRef: React.MutableRefObject<GridPrivateApiCommunity>): void => {
  const logger = useGridLogger(apiRef, 'useGridExcelExport');

  const getDataAsExcel = React.useCallback(
    (options: GridCsvExportOptions = {}): string => {
      logger.debug(`Get data as CSV`);

      const exportedColumns = getColumnsToExport({
        apiRef,
        options,
      });

      const getRowsToExport = options.getRowsToExport ?? defaultGetRowsToExport;
      const exportedRowIds = getRowsToExport({ apiRef });

      return buildCSV({
        columns: exportedColumns,
        rowIds: exportedRowIds,
        getCellParams: apiRef.current.getCellParams,
        delimiterCharacter: options.delimiter || ',',
        includeHeaders: options.includeHeaders ?? true,
      });
    },
    [logger, apiRef],
  );

  const exportDataAsExcel = React.useCallback<GridExcelExportApi['exportDataAsExcel']>(
    async (options): Promise<void> => {
      logger.debug(`Export data as CSV`);
      const csv = getDataAsExcel(options);

      const rows = csv.split('\n').map((row) => row.split(';'));

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Sheet 1');

      rows.forEach((row) => {
        worksheet.addRow(row);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const excelBlob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const fileName = (
        options?.fileName != null &&
          options?.fileName != undefined ?
          options.fileName + '.xlsx' :
          'hiveContent.xlsx'
      );
      saveAs(excelBlob, fileName);
    },
    [logger, getDataAsExcel],
  );

  const excelExportApi: GridExcelExportApi = {
    getDataAsExcel,
    exportDataAsExcel,
  };

  useGridApiMethod(apiRef, excelExportApi, 'public');

  /**
   * PRE-PROCESSING
   */
  const addExportMenuButtons = React.useCallback<
    GridPipeProcessor<"exportMenu">
  >(
    (
      initialValue,
      options: {
        excelOptions: GridExcelExportOptions & GridExportDisplayOptions;
      }
    ) => {
      if (options.excelOptions?.disableToolbarButton) {
        return initialValue;
      }
      return [
        ...initialValue,
        {
          component: <GridExcelExportMenuItem options={options.excelOptions} />,
          componentName: "excelConvertExport",
        },
      ];
    },
    []
  );

  useGridRegisterPipeProcessor(apiRef, "exportMenu", addExportMenuButtons);
};

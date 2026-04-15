import { GridExcelExportOptions } from '../gridExport';

/**
 * The Excel export API interface that is available in the grid [[apiRef]].
 */
export interface GridExcelExportApi {
  /**
   * Returns the grid data as a Excel string.
   * This method is used internally by `exportDataAsExcel`.
   * @param {GridExcelExportOptions} options The options to apply on the export.
   * @returns {string} The data in the Excel format.
   */
  getDataAsExcel: (options?: GridExcelExportOptions) => string;
  /**
   * Downloads and exports a Excel of the grid's data.
   * @param {GridExcelExportOptions} options The options to apply on the export.
   */
  exportDataAsExcel: (options?: GridExcelExportOptions) => void;
}

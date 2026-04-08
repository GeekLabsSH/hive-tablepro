import Box from "@geeklabssh/hive-tablepro/core/mui-material/src/Box";
import PropTypes from "prop-types";
import * as React from "react";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import {
  GridToolbarContainer,
  GridToolbarContainerProps,
} from "../containers/GridToolbarContainer";
import { GridToolbarColumnsButton } from "./GridToolbarColumnsButton";
import { GridToolbarDensitySelector } from "./GridToolbarDensitySelector";
import { GridToolbarExport, GridToolbarExportProps } from "./GridToolbarExport";
import { GridToolbarFilterButton } from "./GridToolbarFilterButton";
import {
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
} from "./GridToolbarQuickFilter";

export interface GridToolbarProps
  extends GridToolbarContainerProps,
  Omit<GridToolbarExportProps, "color"> {
  /**
   * Show the quick filter component.
   * @default false
   */
  showQuickFilter?: boolean;
  /**
   * Props passed to the quick filter component.
   */
  quickFilterProps?: GridToolbarQuickFilterProps;
  /**
   * Props to show export button
   */
  showExportButton?: boolean;
}

const GridToolbar = React.forwardRef<HTMLDivElement, GridToolbarProps>(
  function GridToolbar(props, ref) {
    // TODO v6: think about where export option should be passed.
    // from componentProps={{ toolbarExport: { ...exportOption} }} seems to be more appropriate
    const {
      className,
      csvOptions,
      printOptions,
      excelOptions,
      showQuickFilter = false,
      quickFilterProps = {},
      showExportButton = false,
      fileName,
      ...other
    } = props;
    const rootProps = useGridRootProps();

    if (
      rootProps.disableColumnFilter &&
      rootProps.disableColumnSelector &&
      rootProps.disableDensitySelector &&
      !showQuickFilter
    ) {
      return null;
    }

    return (
      <GridToolbarContainer ref={ref} {...other}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        {showExportButton &&
          <GridToolbarExport
            csvOptions={csvOptions}
            printOptions={printOptions}
            excelOptions={excelOptions}
          />
        }
        <GridToolbarQuickFilter id={`${rootProps.id}_quickFilter`} {...quickFilterProps} />
        <Box sx={{ flex: 1 }} />
      </GridToolbarContainer>
    );
  }
);

GridToolbar.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * Props passed to the quick filter component.
   */
  quickFilterProps: PropTypes.object,
  /**
   * Show the quick filter component.
   * @default false
   */
  showQuickFilter: PropTypes.bool,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
} as any;

export { GridToolbar };

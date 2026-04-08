import { useThemeProps } from "@geeklabssh/hive-tablepro/core/mui-material/src/styles";
import {
  DATA_GRID_PROPS_DEFAULT_VALUES,
  GridValidRowModel,
  GRID_DEFAULT_LOCALE_TEXT,
} from "@geeklabssh/hive-tablepro/core/x-data-grid/src";
import * as React from "react";
import { DATA_GRID_PRO_DEFAULT_SLOTS_COMPONENTS } from "../constants/dataGridProDefaultSlotsComponents";
import { GridProSlotsComponent } from "../models";
import {
  DataGridProProcessedProps,
  DataGridProProps,
  DataGridProPropsWithDefaultValue,
} from "../models/dataGridProProps";

/**
 * The default values of `DataGridProPropsWithDefaultValue` to inject in the props of DataGridPro.
 */
export const DATA_GRID_PRO_PROPS_DEFAULT_VALUES: DataGridProPropsWithDefaultValue =
  {
    ...DATA_GRID_PROPS_DEFAULT_VALUES,
    scrollEndThreshold: 80,
    treeData: false,
    defaultGroupingExpansionDepth: 0,
    disableColumnPinning: false,
    keepColumnPositionIfDraggedOutside: false,
    disableChildrenFiltering: false,
    disableChildrenSorting: false,
    rowReordering: false,
    rowsLoadingMode: "client",
    getDetailPanelHeight: () => 500,
  };

export const useDataGridProProps = <R extends GridValidRowModel>(
  inProps: DataGridProProps<R>
) => {
  const themedProps = useThemeProps({ props: inProps, name: "MuiDataGrid" });

  const localeText = React.useMemo(
    () => ({ ...GRID_DEFAULT_LOCALE_TEXT, ...themedProps.localeText }),
    [themedProps.localeText]
  );

  const components = React.useMemo<GridProSlotsComponent>(() => {
    const overrides = themedProps.components;

    if (!overrides) {
      return { ...DATA_GRID_PRO_DEFAULT_SLOTS_COMPONENTS };
    }

    const mergedComponents = {} as GridProSlotsComponent;

    type GridSlots = keyof GridProSlotsComponent;
    Object.entries(DATA_GRID_PRO_DEFAULT_SLOTS_COMPONENTS).forEach(
      ([key, defaultComponent]) => {
        mergedComponents[key as GridSlots] =
          overrides[key as GridSlots] === undefined
            ? defaultComponent
            : overrides[key as GridSlots];
      }
    );

    return mergedComponents;
  }, [themedProps.components]);

  return React.useMemo<DataGridProProcessedProps<R>>(
    () => ({
      ...DATA_GRID_PRO_PROPS_DEFAULT_VALUES,
      ...themedProps,
      localeText,
      components,
      signature: "DataGridPro",
    }),
    [themedProps, localeText, components]
  );
};

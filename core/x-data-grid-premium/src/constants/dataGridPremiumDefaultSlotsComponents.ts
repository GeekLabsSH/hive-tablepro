import { DATA_GRID_PRO_DEFAULT_SLOTS_COMPONENTS } from '@cronoslogistics/hive-tablepro/core/x-data-grid-pro/src/internals';
import { GridFunctionsIcon, GridGroupWorkIcon, GridWorkspacesIcon } from '../components';
import { GridPremiumColumnMenu } from '../components/GridPremiumColumnMenu';
import { GridPremiumIconSlotsComponent, GridPremiumSlotsComponent } from '../models';

export const DEFAULT_GRID_PREMIUM_ICON_SLOTS_COMPONENTS: GridPremiumIconSlotsComponent = {
  ColumnMenuUngroupIcon: GridWorkspacesIcon,
  ColumnMenuGroupIcon: GridGroupWorkIcon,
  ColumnMenuAggregationIcon: GridFunctionsIcon,
};

export const DATA_GRID_PREMIUM_DEFAULT_SLOTS_COMPONENTS: GridPremiumSlotsComponent = {
  ...DATA_GRID_PRO_DEFAULT_SLOTS_COMPONENTS,
  ...DEFAULT_GRID_PREMIUM_ICON_SLOTS_COMPONENTS,
  ColumnMenu: GridPremiumColumnMenu,
};

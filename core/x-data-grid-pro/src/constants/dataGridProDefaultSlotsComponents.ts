import { DATA_GRID_DEFAULT_SLOTS_COMPONENTS } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src/internals';
import { GridPushPinLeftIcon, GridPushPinRightIcon } from '../components';
import { GridProColumnMenu } from '../components/GridProColumnMenu';
import { GridProIconSlotsComponent, GridProSlotsComponent } from '../models';

export const DEFAULT_GRID_PRO_ICON_SLOTS_COMPONENTS: GridProIconSlotsComponent = {
  ColumnMenuPinRightIcon: GridPushPinRightIcon,
  ColumnMenuPinLeftIcon: GridPushPinLeftIcon,
};

export const DATA_GRID_PRO_DEFAULT_SLOTS_COMPONENTS: GridProSlotsComponent = {
  ...DATA_GRID_DEFAULT_SLOTS_COMPONENTS,
  ...DEFAULT_GRID_PRO_ICON_SLOTS_COMPONENTS,
  ColumnMenu: GridProColumnMenu,
};

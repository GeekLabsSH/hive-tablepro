import MUIButton from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Button";
import MUICheckbox from '@GeekLabsSH/hive-tablepro/core/mui-material/src/Checkbox';
import MUIFormControl from "@GeekLabsSH/hive-tablepro/core/mui-material/src/FormControl";
import MUIPopper from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Popper";
import MUISelect from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Select";
import MUISwitch from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Switch";
import MUITextField from "@GeekLabsSH/hive-tablepro/core/mui-material/src/TextField";
import MUITooltip from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Tooltip";
import {
  GridAddIcon, GridArrowDownwardIcon,
  GridArrowUpwardIcon,
  GridCell, GridCheckIcon, GridClearIcon, GridCloseIcon, GridColumnHeaderFilterIconButton, GridColumnIcon,
  GridColumnsPanel, GridDragIcon, GridExpandMoreIcon, GridFilterAltIcon,
  GridFilterListIcon,
  GridFilterPanel,
  GridFooter, GridKeyboardArrowRight, GridLoadingOverlay, GridMoreVertIcon, GridNoRowsOverlay,
  GridPagination,
  GridPanel,
  GridPreferencesPanel, GridRemoveIcon, GridRow,
  GridSaveAltIcon, GridSearchIcon, GridSeparatorIcon, GridSkeletonCell, GridTableRowsIcon,
  GridTripleDotsVerticalIcon, GridViewColumnIcon, GridViewHeadlineIcon,
  GridViewStreamIcon, GridVisibilityOffIcon
} from '../components';
import { GridColumnUnsortedIcon } from '../components/columnHeaders/GridColumnUnsortedIcon';
import { GridNoResultsOverlay } from '../components/GridNoResultsOverlay';
import { GridColumnMenu } from '../components/menu/columnMenu/GridColumnMenu';
import { GridIconSlotsComponent, GridSlotsComponent } from '../models';

const DEFAULT_GRID_ICON_SLOTS_COMPONENTS: GridIconSlotsComponent = {
  BooleanCellTrueIcon: GridCheckIcon,
  BooleanCellFalseIcon: GridCloseIcon,
  ColumnMenuIcon: GridTripleDotsVerticalIcon,
  OpenFilterButtonIcon: GridFilterListIcon,
  FilterPanelDeleteIcon: GridCloseIcon,
  ColumnFilteredIcon: GridFilterAltIcon,
  ColumnSelectorIcon: GridColumnIcon,
  ColumnUnsortedIcon: GridColumnUnsortedIcon,
  ColumnSortedAscendingIcon: GridArrowUpwardIcon,
  ColumnSortedDescendingIcon: GridArrowDownwardIcon,
  ColumnResizeIcon: GridSeparatorIcon,
  DensityCompactIcon: GridViewHeadlineIcon,
  DensityStandardIcon: GridTableRowsIcon,
  DensityComfortableIcon: GridViewStreamIcon,
  ExportIcon: GridSaveAltIcon,
  MoreActionsIcon: GridMoreVertIcon,
  TreeDataCollapseIcon: GridExpandMoreIcon,
  TreeDataExpandIcon: GridKeyboardArrowRight,
  GroupingCriteriaCollapseIcon: GridExpandMoreIcon,
  GroupingCriteriaExpandIcon: GridKeyboardArrowRight,
  DetailPanelExpandIcon: GridAddIcon,
  DetailPanelCollapseIcon: GridRemoveIcon,
  RowReorderIcon: GridDragIcon,
  QuickFilterIcon: GridSearchIcon,
  QuickFilterClearIcon: GridCloseIcon,
  ColumnMenuHideIcon: GridVisibilityOffIcon,
  ColumnMenuSortAscendingIcon: GridArrowUpwardIcon,
  ColumnMenuSortDescendingIcon: GridArrowDownwardIcon,
  ColumnMenuFilterIcon: GridFilterAltIcon,
  ColumnMenuManageColumnsIcon: GridViewColumnIcon,
  ColumnMenuClearIcon: GridClearIcon,
};

export const DATA_GRID_DEFAULT_SLOTS_COMPONENTS: GridSlotsComponent = {
  ...DEFAULT_GRID_ICON_SLOTS_COMPONENTS,
  BaseCheckbox: MUICheckbox,
  BaseTextField: MUITextField,
  BaseFormControl: MUIFormControl,
  BaseSelect: MUISelect,
  BaseSwitch: MUISwitch,
  BaseButton: MUIButton,
  BaseTooltip: MUITooltip,
  BasePopper: MUIPopper,
  Cell: GridCell,
  SkeletonCell: GridSkeletonCell,
  ColumnHeaderFilterIconButton: GridColumnHeaderFilterIconButton,
  ColumnMenu: GridColumnMenu,
  Footer: GridFooter,
  Toolbar: null,
  PreferencesPanel: GridPreferencesPanel,
  LoadingOverlay: GridLoadingOverlay,
  NoResultsOverlay: GridNoResultsOverlay,
  NoRowsOverlay: GridNoRowsOverlay,
  Pagination: GridPagination,
  FilterPanel: GridFilterPanel,
  ColumnsPanel: GridColumnsPanel,
  Panel: GridPanel,
  Row: GridRow,
};

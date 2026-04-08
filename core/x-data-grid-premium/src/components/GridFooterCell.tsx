import Box from "@geeklabssh/hive-tablepro/core/mui-material/src/Box";
import {
  styled,
  Theme,
} from "@geeklabssh/hive-tablepro/core/mui-material/src/styles";
import { SxProps } from "@geeklabssh/hive-tablepro/core/mui-system/src";
import { unstable_compClasses as compClasses } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import {
  getDataGridUtilityClass,
  GridRenderCellParams,
} from "@geeklabssh/hive-tablepro/core/x-data-grid/src";
import { useGridRootProps } from "../hooks/utils/useGridRootProps";
import { DataGridPremiumProcessedProps } from "../models/dataGridPremiumProps";

const GridFooterCellRoot = styled(Box, {
  name: "MuiDataGrid",
  slot: "FooterCell",
  overridesResolver: (_, styles) => styles.footerCell,
})<{ ownerState: OwnerState }>(({ theme }) => ({
  fontWeight: theme.typography.fontWeightMedium,
  color: (theme.vars || theme).palette.primary.dark,
}));

interface GridFooterCellProps extends GridRenderCellParams {
  sx?: SxProps<Theme>;
}

interface OwnerState {
  classes: DataGridPremiumProcessedProps["classes"];
}

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["footerCell"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

function GridFooterCell(props: GridFooterCellProps) {
  const {
    formattedValue,
    colDef,
    cellMode,
    row,
    api,
    id,
    value,
    rowNode,
    field,
    focusElementRef,
    hasFocus,
    tabIndex,
    isEditable,
    ...other
  } = props;
  const rootProps = useGridRootProps();

  const ownerState = { classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  return (
    <GridFooterCellRoot
      ownerState={ownerState}
      className={classes.root}
      {...other}
    >
      {formattedValue}
    </GridFooterCellRoot>
  );
}

export { GridFooterCell };

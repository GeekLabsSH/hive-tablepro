import Box from "@geeklabssh/hive-tablepro/core/mui-material/src/Box";
import { styled } from "@geeklabssh/hive-tablepro/core/mui-material/src/styles";
import { unstable_compClasses as compClasses } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import {
  getDataGridUtilityClass,
  gridClasses,
  GridColDef,
  GridColumnHeaderParams,
  GridColumnHeaderTitle,
} from "@geeklabssh/hive-tablepro/core/x-data-grid/src";
import { getAggregationFunctionLabel } from "../hooks/features/aggregation/gridAggregationUtils";
import { useGridApiContext } from "../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../hooks/utils/useGridRootProps";
import { DataGridPremiumProcessedProps } from "../models/dataGridPremiumProps";

interface OwnerState {
  classes: DataGridPremiumProcessedProps["classes"];
  colDef: GridColDef;
}

const GridAggregationHeaderRoot = styled(Box, {
  name: "MuiDataGrid",
  slot: "AggregationColumnHeader",
  overridesResolver: (_, styles) => styles.aggregationColumnHeader,
})<{ ownerState: OwnerState }>({
  display: "flex",
  flexDirection: "column",
  [`&.${gridClasses["aggregationColumnHeader--alignRight"]}`]: {
    alignItems: "flex-end",
  },
  [`&.${gridClasses["aggregationColumnHeader--alignCenter"]}`]: {
    alignItems: "center",
  },
});

const GridAggregationFunctionLabel = styled("div", {
  name: "MuiDataGrid",
  slot: "AggregationColumnHeaderLabel",
  overridesResolver: (_, styles) => styles.aggregationColumnHeaderLabel,
})<{ ownerState: OwnerState }>(({ theme }) => {
  return {
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.fontSize,
    marginTop: `calc(-2px - ${theme.typography.caption.fontSize})`,
    fontWeight: theme.typography.fontWeightMedium,
    color: (theme.vars || theme).palette.primary.dark,
    textTransform: "uppercase",
  };
});

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes, colDef } = ownerState;

  const slots = {
    root: [
      "aggregationColumnHeader",
      colDef.headerAlign === "left" && "aggregationColumnHeader--alignLeft",
      colDef.headerAlign === "center" && "aggregationColumnHeader--alignCenter",
      colDef.headerAlign === "right" && "aggregationColumnHeader--alignRight",
    ],
    aggregationLabel: ["aggregationColumnHeaderLabel"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

function GridAggregationHeader(props: GridColumnHeaderParams | any) {
  const { colDef, aggregation } = props;

  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();

  const ownerState = { classes: rootProps.classes, colDef };
  const classes = useUtilityClasses(ownerState);

  if (!aggregation) {
    return null;
  }

  const aggregationLabel = getAggregationFunctionLabel({
    apiRef,
    aggregationRule: aggregation.aggregationRule,
  });

  return (
    <GridAggregationHeaderRoot ownerState={ownerState} className={classes.root}>
      <GridColumnHeaderTitle
        label={colDef.headerName ?? colDef.field}
        description={colDef.description}
        columnWidth={colDef.computedWidth}
      />
      <GridAggregationFunctionLabel
        ownerState={ownerState}
        className={classes.aggregationLabel}
      >
        {aggregationLabel}
      </GridAggregationFunctionLabel>
    </GridAggregationHeaderRoot>
  );
}

export { GridAggregationHeader };

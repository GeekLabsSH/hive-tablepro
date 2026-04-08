import Box from "@cronoslogistics/hive-tablepro/core/mui-material/src/Box";
import { GridRenderCellParams } from "@cronoslogistics/hive-tablepro/core/x-data-grid-pro/src";
import { useGridRootProps } from "../hooks/utils/useGridRootProps";

function GridGroupingColumnLeafCell(props: GridRenderCellParams) {
  const { rowNode } = props;

  const rootProps = useGridRootProps();

  const marginLeft =
    rootProps.rowGroupingColumnMode === "multiple" ? 1 : rowNode.depth * 2;

  return (
    <Box sx={{ ml: marginLeft }}>{props.formattedValue ?? props.value}</Box>
  );
}

export { GridGroupingColumnLeafCell };

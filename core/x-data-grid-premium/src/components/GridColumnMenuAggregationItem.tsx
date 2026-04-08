import FormControl from "@cronoslogistics/hive-tablepro/core/mui-material/src/FormControl";
import InputLabel from "@cronoslogistics/hive-tablepro/core/mui-material/src/InputLabel";
import ListItemIcon from "@cronoslogistics/hive-tablepro/core/mui-material/src/ListItemIcon";
import ListItemText from "@cronoslogistics/hive-tablepro/core/mui-material/src/ListItemText";
import MenuItem from "@cronoslogistics/hive-tablepro/core/mui-material/src/MenuItem";
import Select, {
  SelectChangeEvent,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src/Select";
import { unstable_useId as useId } from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import {
  GridColumnMenuItemProps,
  useGridSelector,
} from "@cronoslogistics/hive-tablepro/core/x-data-grid-pro/src";
import PropTypes from "prop-types";
import * as React from "react";
import { GridAggregationModel } from "../hooks/features/aggregation/gridAggregationInterfaces";
import { gridAggregationModelSelector } from "../hooks/features/aggregation/gridAggregationSelectors";
import {
  canColumnHaveAggregationFunction,
  getAggregationFunctionLabel,
  getAvailableAggregationFunctions,
} from "../hooks/features/aggregation/gridAggregationUtils";
import { useGridApiContext } from "../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../hooks/utils/useGridRootProps";

function GridColumnMenuAggregationItem(props: GridColumnMenuItemProps) {
  const { colDef } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const id = useId();
  const aggregationModel = useGridSelector(
    apiRef,
    gridAggregationModelSelector
  );

  const availableAggregationFunctions = React.useMemo(
    () =>
      getAvailableAggregationFunctions({
        aggregationFunctions: rootProps.aggregationFunctions,
        colDef,
      }),
    [colDef, rootProps.aggregationFunctions]
  );

  const selectedAggregationRule = React.useMemo(() => {
    if (!colDef || !aggregationModel[colDef.field]) {
      return "";
    }

    const aggregationFunctionName = aggregationModel[colDef.field];
    if (
      canColumnHaveAggregationFunction({
        colDef,
        aggregationFunctionName,
        aggregationFunction:
          rootProps.aggregationFunctions[aggregationFunctionName],
      })
    ) {
      return aggregationFunctionName;
    }

    return "";
  }, [rootProps.aggregationFunctions, aggregationModel, colDef]);

  const handleAggregationItemChange = (
    event: SelectChangeEvent<string | undefined>
  ) => {
    const newAggregationItem = event.target?.value || undefined;
    const currentModel = gridAggregationModelSelector(apiRef);
    const { [colDef.field]: columnItem, ...otherColumnItems } = currentModel;
    const newModel: GridAggregationModel =
      newAggregationItem == null
        ? otherColumnItems
        : { ...otherColumnItems, [colDef?.field]: newAggregationItem };

    apiRef.current.setAggregationModel(newModel);
    apiRef.current.hideColumnMenu();
  };

  const label = apiRef.current.getLocaleText("aggregationMenuItemHeader");

  return (
    <MenuItem disableRipple>
      <ListItemIcon>
        <rootProps.components.ColumnMenuAggregationIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
          <InputLabel id={`${id}-label`}>{label}</InputLabel>
          <Select
            labelId={`${id}-label`}
            id={`${id}-input`}
            value={selectedAggregationRule}
            label={label}
            color="primary"
            onChange={handleAggregationItemChange}
            onBlur={(e) => e.stopPropagation()}
            fullWidth
          >
            <MenuItem value="">...</MenuItem>
            {availableAggregationFunctions.map((aggFunc) => (
              <MenuItem key={aggFunc} value={aggFunc}>
                {getAggregationFunctionLabel({
                  apiRef,
                  aggregationRule: {
                    aggregationFunctionName: aggFunc,
                    aggregationFunction:
                      rootProps.aggregationFunctions[aggFunc],
                  },
                })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </ListItemText>
    </MenuItem>
  );
}

GridColumnMenuAggregationItem.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  colDef: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
} as any;

export { GridColumnMenuAggregationItem };

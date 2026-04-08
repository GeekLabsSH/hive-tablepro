import { TextFieldProps } from "@geeklabssh/hive-tablepro/core/mui-material/src/TextField";
import { unstable_useId as useId } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import PropTypes from "prop-types";
import * as React from "react";
import { useGridRootProps } from "../../../hooks/utils/useGridRootProps";
import { GridLoadIcon } from "../../icons";
import { GridFilterInputValueProps } from "./GridFilterInputValueProps";

export const SUBMIT_FILTER_STROKE_TIME = 500;

export interface GridTypeFilterInputValueProps
  extends GridFilterInputValueProps {
  type?: "text" | "number" | "date" | "datetime-local";
}

function GridFilterInputValue(
  props: GridTypeFilterInputValueProps & TextFieldProps
) {
  const { item, applyValue, type, apiRef, focusElementRef, ...others } = props;
  const filterTimeout = React.useRef<any>();
  const [filterValueState, setFilterValueState] = React.useState<string>(
    item.value ?? ""
  );
  const [applying, setIsApplying] = React.useState(false);
  const id = useId();
  const rootProps = useGridRootProps();

  const onFilterChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      clearTimeout(filterTimeout.current);
      setFilterValueState(String(value));

      setIsApplying(true);
      filterTimeout.current = setTimeout(() => {
        applyValue({ ...item, value });
        setIsApplying(false);
      }, SUBMIT_FILTER_STROKE_TIME);
    },
    [applyValue, item]
  );

  React.useEffect(() => {
    return () => {
      clearTimeout(filterTimeout.current);
    };
  }, []);

  React.useEffect(() => {
    const itemValue = item.value ?? "";
    setFilterValueState(String(itemValue));
  }, [item.value]);

  const InputProps = applying
    ? { endAdornment: <GridLoadIcon /> }
    : others.InputProps;

  return (
    <rootProps.components.BaseTextField
      id={id}
      label={apiRef.current.getLocaleText("filterPanelInputLabel")}
      placeholder={apiRef.current.getLocaleText("filterPanelInputPlaceholder")}
      value={filterValueState}
      onChange={onFilterChange}
      variant="standard"
      type={type || "text"}
      InputProps={InputProps}
      InputLabelProps={{
        shrink: true,
      }}
      inputRef={focusElementRef}
      {...others}
      {...rootProps.componentsProps?.baseTextField}
    />
  );
}

GridFilterInputValue.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  apiRef: PropTypes.shape({
    current: PropTypes.object.isRequired,
  }).isRequired,
  applyValue: PropTypes.func.isRequired,
  focusElementRef: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    PropTypes.object,
  ]),
  item: PropTypes.shape({
    field: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    operator: PropTypes.string.isRequired,
    value: PropTypes.any,
  }).isRequired,
} as any;

export { GridFilterInputValue };

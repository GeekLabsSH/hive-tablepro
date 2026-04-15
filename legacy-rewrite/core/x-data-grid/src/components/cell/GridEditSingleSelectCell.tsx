import MenuItem from "@geeklabssh/hive-tablepro/core/mui-material/src/MenuItem";
import {
  SelectChangeEvent,
  SelectProps,
} from "@geeklabssh/hive-tablepro/core/mui-material/src/Select";
import { unstable_useEnhancedEffect as useEnhancedEffect } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import { EndpointForSelect, TranslationType } from "@/models/CommonTypes";
import { removeDuplicateByValue, getListAgentNetworkLabel } from "@/utils/functions";
import PropTypes from "prop-types";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Autocomplete,
  CircularProgress,
  TextField,
} from "../../../../mui-material/src";
import { useGridApiContext } from "../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { ValueOptions } from "../../models/colDef/gridColDef";
import { GridEditModes } from "../../models/gridEditRowModel";
import { GridRenderEditCellParams } from "../../models/params/gridCellParams";
import { isEscapeKey } from "../../utils/keyboardUtils";
import {
  getLabelFromValueOption,
  getValueFromValueOptions,
} from "../panel/filterPanel/filterPanelUtils";
import { DELAY } from "@/utils/constants";

export interface GridEditSingleSelectCellProps
  extends GridRenderEditCellParams,
  Omit<SelectProps, "id" | "tabIndex" | "value"> {
  /**
   * Callback called when the value is changed by the user.
   * @param {SelectChangeEvent<any>} event The event source of the callback.
   * @param {any} newValue The value that is going to be passed to `apiRef.current.setEditCellValue`.
   * @returns {Promise<void> | void} A promise to be awaited before calling `apiRef.current.setEditCellValue`
   */
  onValueChange?: (
    event: SelectChangeEvent<any>,
    newValue: any
  ) => Promise<void> | void;
  /**
   * If true, the select opens by default.
   */
  initialOpen?: boolean;
  /**
   * Used to determine the text displayed for a given value option.
   * @param {ValueOptions} value The current value option.
   * @returns {string} The text to be displayed.
   */
  getOptionLabel?: (value: ValueOptions) => string;

  getInitialValue?: (value: any) => any;

  getSearchDebounce?: (value: any) => any;

  async?: boolean;

  registerAPI?: any;
  crud?: EndpointForSelect;
  maxResult?: number;
  typeGet?: number;
  idCountry?: number;
  idState?: number;
  modal?: number;
  acronym?: boolean;
  multiTypeGet?: number[];
  useFixedListToAsync?: boolean;
}

function isKeyboardEvent(event: any): event is React.KeyboardEvent {
  return !!event.key;
}

function GridEditSingleSelectCell(props: GridEditSingleSelectCellProps) {
  const rootProps = useGridRootProps();
  const {
    id,
    value: valueProp,
    formattedValue,
    api,
    field,
    row,
    rowNode,
    colDef,
    cellMode,
    isEditable,
    tabIndex,
    className,
    hasFocus,
    isValidating,
    isProcessingProps,
    error,
    onValueChange,
    initialOpen = rootProps.editMode === GridEditModes.Cell,
    getOptionLabel = getLabelFromValueOption,
    ...other
  } = props;

  const apiRef = useGridApiContext();
  const { t } = useTranslation<TranslationType>("common");
  const ref = React.useRef<any>();
  const inputRef = React.useRef<any>();
  const [open, setOpen] = React.useState(initialOpen);
  const [loading, setLoading] = React.useState<boolean>(false);
  const column = apiRef.current.getColumn(field);
  const isSelectNative = true;
  const [valueOptions, setValueOptions] = React.useState([]);
  const [defaultValue, setDefaultValue] = React.useState<{
    value?: number;
    label?: string;
  }>(
    colDef?.valueOptions?.find((v) => v.value == valueProp)
      ? colDef?.valueOptions?.find((v) => v.value == valueProp)
      : { value: null, label: "" }
  );

  const handleSearchDebounce = async (params): Promise<any> => {
    setLoading(true);
    if (column.useFixedListToAsync) {
      const listFiltered = column?.valueOptions?.filter(c =>
        c.label.toLowerCase().includes(params.toLowerCase()) &&
        c.active
      )
      setValueOptions(listFiltered);
      setLoading(false);
      return listFiltered;
    }
    if (column.multiTypeGet) {
      const { data: list } = await column.registerAPI.simplePut(
        `SelectOption/Search/${column.maxResult}/${column.crud}/${params}/${column.typeGet ?? 0
        }/${column.idCountry ?? 0}/${column.idState ?? 0}/${column.acronym ?? false
        }/${column.modal ?? 0}`,
        column.multiTypeGet ?? []
      );
      setValueOptions(list);
      setLoading(false);
      return list;
    }

    const { data: list } = await column.registerAPI.get2(
      `SelectOption/Search/${column.maxResult}/${column.crud}/${params}/${column.typeGet ?? 0
      }/${column.idCountry ?? 0}/${column.idState ?? 0}/${column.acronym ?? false
      }/${column.modal ?? 0}`
    );
    if (column.showPartnerNetworks) {
      getListAgentNetworkLabel(list, true, t);
    }

    setValueOptions(list);
    setLoading(false);
    return list;
  };

  React.useEffect(() => {
    if (!column.async) {
      if (typeof colDef.valueOptions === "function") {
        setValueOptions(colDef.valueOptions!({ id, row, field }));
        if (!valueOptions.find((v) => v.value == "new")) {
          setValueOptions((old) => [
            ...old,
            {
              value: "new",
              label: " ",
              active: true,
            },
          ]);
        }
      } else {
        setValueOptions(colDef.valueOptions!);
        if (!valueOptions.find((v) => v.value == "new")) {
          setValueOptions((old) => [
            ...old,
            {
              value: "new",
              label: " ",
              active: true,
            },
          ]);
        }
      }
    }
    else if (column.async && column.useFixedListToAsync) {
      setValueOptions(
        column?.valueOptions?.filter(c =>
          c.active
        )
      );
    }
  }, []);

  React.useEffect(() => {
    if (
      !hasFocus &&
      column.async &&
      column.useFixedListToAsync
    ) {
      setValueOptions(
        column?.valueOptions?.filter(c =>
          c.active
        )
      );
    }
  }, [hasFocus])

  const handleChange = async (event, newValue?) => {
    setOpen(false);
    let target;
    let formattedTargetValue;
    if (!newValue) {
      target = event.target as HTMLInputElement;

      if (event.target.value == "new") {
        target.value = null;
      }

      formattedTargetValue = getValueFromValueOptions(
        target.value,
        valueOptions
      );
    }

    // NativeSelect casts the value to a string.

    if (onValueChange) {
      await onValueChange(event, formattedTargetValue);
    }

    if (!newValue) {
      await apiRef.current.setEditCellValue(
        { id, field, value: formattedTargetValue },
        event
      );
    } else {
      await apiRef.current.setEditCellValue(
        { id, field, value: newValue },
        event
      );
    }
  };

  const handleClose = (event: React.KeyboardEvent, reason: string) => {
    if (rootProps.editMode === GridEditModes.Row) {
      setOpen(false);
      return;
    }
    if (reason === "backdropClick" || isEscapeKey(event.key)) {
      apiRef.current.stopCellEditMode({ id, field, ignoreModifications: true });
    }
  };

  const handleOpen: SelectProps["onOpen"] = (event) => {
    if (isKeyboardEvent(event) && event.key === "Enter") {
      return;
    }
    setOpen(true);
  };

  useEnhancedEffect(() => {
    if (hasFocus && !column.async) {
      inputRef.current.focus();
    } else if (hasFocus) {
      ref.current.focus();
      if (ref.current.querySelector("input")) {
        ref.current.querySelector("input").select();
      }
    }
  }, [hasFocus]);

  const handleSearchChange = async (event) => {
    const newSearchText = event.target.value;
    setOpen(true);

    if (newSearchText === "" || newSearchText == null) {
      if (column.async && column.useFixedListToAsync) {
        setValueOptions(
          column?.valueOptions?.filter(c =>
            c.active
          )
        );
        handleChange(event, null);
        return;
      }
      setValueOptions([]);
      handleChange(event, null);
      return;
    }

    await handleSearchDebounce(newSearchText);
  };

  const OptionComponent = isSelectNative ? "option" : MenuItem;

  React.useEffect(() => {
    if (valueProp) {
      if (typeof valueProp == "number") {
        const newData = colDef?.valueOptions?.find((v) => v.value == valueProp);

        if (newData) {
          setDefaultValue(newData);
        } else {
          setDefaultValue({ value: null, label: "" });
        }
      }
      else {
        setDefaultValue(valueProp);
      }
    }
  }, [valueProp]);

  return column.async ? (
    <Autocomplete
      ref={ref}
      options={valueOptions != undefined ? valueOptions : []}
      loading={loading}
      style={{ width: "100%" }}
      getOptionLabel={(option: any) => option.label}
      onChange={handleChange}
      noOptionsText={t("TK_insertSearch")}
      loadingText={t("TK_loading")}
      defaultValue={defaultValue}
      value={defaultValue}
      renderInput={(params) => (
        <TextField
          {...params}
          label={
            defaultValue?.label == null || defaultValue?.label == ""
              ? t("TK_search")
              : defaultValue?.label
          }
          onChange={handleSearchChange}
          InputProps={{
            ...params.InputProps,
            error: error,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  ) : (
    <rootProps.components.BaseSelect
      ref={ref}
      inputRef={inputRef}
      value={valueProp == null || valueProp == 0 ? "new" : valueProp}
      onChange={handleChange}
      open={open}
      onOpen={handleOpen}
      MenuProps={{
        onClose: handleClose,
      }}
      error={error}
      native={isSelectNative}
      loading={loading}
      fullWidth
      {...other}
      {...rootProps.componentsProps?.baseSelect}
    >
      {valueOptions.find((v) => v.active === false)
        ? removeDuplicateByValue(valueOptions, "new")
          ?.filter((v) => v.active === true)
          ?.map((valueOption) => {
            const value =
              typeof valueOption === "object"
                ? valueOption.value
                : valueOption;

            return (
              <OptionComponent key={value} value={value}>
                {getOptionLabel(valueOption)}
              </OptionComponent>
            );
          })
        : removeDuplicateByValue(valueOptions, "new")?.map((valueOption) => {
          const value =
            typeof valueOption === "object" ? valueOption.value : valueOption;

          return (
            <OptionComponent key={value} value={value}>
              {loading && <CircularProgress color="inherit" size={18} />}
              {getOptionLabel(valueOption)}
            </OptionComponent>
          );
        })}
    </rootProps.components.BaseSelect>
  );
}

GridEditSingleSelectCell.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * GridApi that let you manipulate the grid.
   */
  api: PropTypes.object.isRequired,
  /**
   * The mode of the cell.
   */
  cellMode: PropTypes.oneOf(["edit", "view"]).isRequired,
  changeReason: PropTypes.oneOf([
    "debouncedSetEditCellValue",
    "setEditCellValue",
  ]),
  /**
   * The column of the row that the current cell belongs to.
   */
  colDef: PropTypes.object.isRequired,
  /**
   * The column field of the cell that triggered the event.
   */
  field: PropTypes.string.isRequired,
  /**
   * The cell value formatted with the column valueFormatter.
   */
  formattedValue: PropTypes.any,
  /**
   * Used to determine the text displayed for a given value option.
   * @param {ValueOptions} value The current value option.
   * @returns {string} The text to be displayed.
   */
  getOptionLabel: PropTypes.func,
  /**
   * If true, the cell is the active element.
   */
  hasFocus: PropTypes.bool.isRequired,
  /**
   * The grid row id.
   */
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  /**
   * If true, the select opens by default.
   */
  initialOpen: PropTypes.bool,
  /**
   * If true, the cell is editable.
   */
  isEditable: PropTypes.bool,
  isProcessingProps: PropTypes.bool,
  isValidating: PropTypes.bool,
  /**
   * Callback called when the value is changed by the user.
   * @param {SelectChangeEvent<any>} event The event source of the callback.
   * @param {any} newValue The value that is going to be passed to `apiRef.current.setEditCellValue`.
   * @returns {Promise<void> | void} A promise to be awaited before calling `apiRef.current.setEditCellValue`
   */
  onValueChange: PropTypes.func,
  /**
   * The row model of the row that the current cell belongs to.
   */
  row: PropTypes.any.isRequired,
  /**
   * The node of the row that the current cell belongs to.
   */
  rowNode: PropTypes.object.isRequired,
  /**
   * the tabIndex value.
   */
  tabIndex: PropTypes.oneOf([-1, 0]).isRequired,
  /**
   * The cell value.
   * If the column has `valueGetter`, use `params.row` to directly access the fields.
   */
  value: PropTypes.any,

  async: PropTypes.bool,
  getInitialValue: PropTypes.func,
  getSearchDebounce: PropTypes.func,
  registerAPI: PropTypes.any,
  crud: PropTypes.string,
  maxResult: PropTypes.number,
  typeGet: PropTypes.number,
  idCountry: PropTypes.number,
  idState: PropTypes.number,
  modal: PropTypes.number,
  acronym: PropTypes.bool,
  multiTypeGet: PropTypes.array,
  useFixedListToAsync: PropTypes.bool
} as any;

export { GridEditSingleSelectCell };

export const renderEditSingleSelectCell = (
  params: GridEditSingleSelectCellProps
) => <GridEditSingleSelectCell {...params} />;

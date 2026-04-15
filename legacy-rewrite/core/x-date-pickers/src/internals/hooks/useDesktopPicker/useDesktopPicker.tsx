import {
  resolveComponentProps,
  useSlotProps,
} from "@geeklabssh/hive-tablepro/core/mui-base/src/utils";
import IconButton from "@geeklabssh/hive-tablepro/core/mui-material/src/IconButton";
import MuiInputAdornment from "@geeklabssh/hive-tablepro/core/mui-material/src/InputAdornment";
import useForkRef from "@geeklabssh/hive-tablepro/core/mui-utils/src/useForkRef";
import * as React from "react";
import { LocalizationProvider } from "../../../LocalizationProvider";
import { PickersLayout } from "../../../PickersLayout";
import { PickersPopper } from "../../components/PickersPopper";
import { WrapperVariantContext } from "../../components/wrappers/WrapperVariantContext";
import { BaseFieldProps } from "../../models/fields";
import { DateOrTimeView } from "../../models/views";
import { usePicker } from "../usePicker";
import { useUtils } from "../useUtils";
import { InferError } from "../validation/useValidation";
import {
  UseDesktopPickerParams,
  UseDesktopPickerProps,
} from "./useDesktopPicker.types";

/**
 * Hook managing all the single-date desktop pickers:
 * - DesktopDatePicker
 * - DesktopDateTimePicker
 * - DesktopTimePicker
 */
export const useDesktopPicker = <
  TDate,
  TView extends DateOrTimeView,
  TExternalProps extends UseDesktopPickerProps<
    TDate,
    TView,
    any,
    TExternalProps
  >
>({
  props,
  valueManager,
  getOpenDialogAriaText,
  validator,
}: UseDesktopPickerParams<TDate, TView, TExternalProps>) => {
  const {
    slots,
    slotProps,
    className,
    sx,
    format,
    label,
    inputRef,
    readOnly,
    disabled,
    autoFocus,
    localeText,
  } = props;

  const utils = useUtils<TDate>();
  const internalInputRef = React.useRef<HTMLInputElement>(null);

  const {
    open,
    actions,
    hasUIView,
    layoutProps,
    renderCurrentView,
    shouldRestoreFocus,
    fieldProps: pickerFieldProps,
  } = usePicker<TDate | null, TDate, TView, TExternalProps, {}>({
    props,
    inputRef: internalInputRef,
    valueManager,
    validator,
    autoFocusView: true,
    additionalViewProps: {},
    wrapperVariant: "desktop",
  });

  const Field = slots.field;
  const fieldProps: BaseFieldProps<
    TDate | null,
    InferError<TExternalProps>
  > = useSlotProps({
    elementType: Field,
    externalSlotProps: slotProps?.field,
    additionalProps: {
      ...pickerFieldProps,
      readOnly,
      disabled,
      className,
      sx,
      format,
      label,
      autoFocus: autoFocus && !props.open,
    },
    ownerState: props,
  });

  const InputAdornment = slots.inputAdornment ?? MuiInputAdornment;
  const inputAdornmentProps = useSlotProps({
    elementType: InputAdornment,
    externalSlotProps: slotProps?.inputAdornment,
    additionalProps: {
      position: "end" as const,
    },
    ownerState: props,
  });

  const OpenPickerButton = slots.openPickerButton ?? IconButton;
  const { ownerState: openPickerButtonOwnerState, ...openPickerButtonProps } =
    useSlotProps({
      elementType: OpenPickerButton,
      externalSlotProps: slotProps?.openPickerButton,
      additionalProps: {
        disabled: disabled || readOnly,
        onClick: actions.onOpen,
        "aria-label": getOpenDialogAriaText(pickerFieldProps.value, utils),
        edge: inputAdornmentProps.position,
      },
      ownerState: props,
    });

  const OpenPickerIcon = slots.openPickerIcon;

  const slotsForField: BaseFieldProps<TDate | null, unknown>["slots"] = {
    textField: slots.textField,
    ...fieldProps.slots,
  };

  const slotPropsForField: BaseFieldProps<TDate | null, unknown>["slotProps"] =
    {
      ...fieldProps.slotProps,
      textField: (ownerState) => {
        const externalInputProps = resolveComponentProps(
          slotProps?.textField,
          ownerState
        );
        const inputPropsPassedByField = resolveComponentProps(
          fieldProps.slotProps?.textField,
          ownerState
        );

        return {
          ...inputPropsPassedByField,
          ...externalInputProps,
          InputProps: {
            [`${inputAdornmentProps.position}Adornment`]: hasUIView ? (
              <InputAdornment {...inputAdornmentProps}>
                <OpenPickerButton {...openPickerButtonProps}>
                  <OpenPickerIcon {...slotProps?.openPickerIcon} />
                </OpenPickerButton>
              </InputAdornment>
            ) : undefined,
            ...inputPropsPassedByField?.InputProps,
            ...externalInputProps?.InputProps,
          },
        };
      },
    };

  const Layout = slots.layout ?? PickersLayout;

  const handleInputRef = useForkRef(
    internalInputRef,
    fieldProps.inputRef,
    inputRef
  );

  const renderPicker = () => (
    <LocalizationProvider localeText={localeText}>
      <WrapperVariantContext.Provider value="desktop">
        <Field
          {...fieldProps}
          slots={slotsForField}
          slotProps={slotPropsForField}
          inputRef={handleInputRef}
        />
        <PickersPopper
          role="dialog"
          anchorEl={internalInputRef.current}
          {...actions}
          open={open}
          slots={slots}
          slotProps={slotProps}
          shouldRestoreFocus={shouldRestoreFocus}
        >
          <Layout
            {...layoutProps}
            {...slotProps?.layout}
            slots={slots}
            slotProps={slotProps}
          >
            {renderCurrentView()}
          </Layout>
        </PickersPopper>
      </WrapperVariantContext.Provider>
    </LocalizationProvider>
  );

  return { renderPicker };
};

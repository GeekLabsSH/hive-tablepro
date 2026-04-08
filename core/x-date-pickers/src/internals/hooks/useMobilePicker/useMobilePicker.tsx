import {
  resolveComponentProps,
  useSlotProps,
} from "@cronoslogistics/hive-tablepro/core/mui-base/src/utils";
import useForkRef from "@cronoslogistics/hive-tablepro/core/mui-utils/src/useForkRef";
import * as React from "react";
import { LocalizationProvider } from "../../../LocalizationProvider";
import { PickersLayout } from "../../../PickersLayout";
import { PickersModalDialog } from "../../components/PickersModalDialog";
import { WrapperVariantContext } from "../../components/wrappers/WrapperVariantContext";
import { DateOrTimeView } from "../../models";
import { BaseFieldProps } from "../../models/fields";
import { onSpaceOrEnter } from "../../utils/utils";
import { usePicker } from "../usePicker";
import { useUtils } from "../useUtils";
import { InferError } from "../validation/useValidation";
import {
  UseMobilePickerParams,
  UseMobilePickerProps,
} from "./useMobilePicker.types";

/**
 * Hook managing all the single-date mobile pickers:
 * - MobileDatePicker
 * - MobileDateTimePicker
 * - MobileTimePicker
 */
export const useMobilePicker = <
  TDate,
  TView extends DateOrTimeView,
  TExternalProps extends UseMobilePickerProps<TDate, TView, any, TExternalProps>
>({
  props,
  valueManager,
  getOpenDialogAriaText,
  validator,
}: UseMobilePickerParams<TDate, TView, TExternalProps>) => {
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
    localeText,
  } = props;

  const utils = useUtils<TDate>();
  const internalInputRef = React.useRef<HTMLInputElement>(null);

  const {
    open,
    actions,
    layoutProps,
    renderCurrentView,
    fieldProps: pickerFieldProps,
  } = usePicker<TDate | null, TDate, TView, TExternalProps, {}>({
    props,
    inputRef: internalInputRef,
    valueManager,
    validator,
    autoFocusView: true,
    additionalViewProps: {},
    wrapperVariant: "mobile",
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
      readOnly: readOnly ?? true,
      disabled,
      className,
      sx,
      format,
      label,
    },
    ownerState: props,
  });

  const slotsForField: BaseFieldProps<TDate, unknown>["slots"] = {
    textField: slots.textField,
    ...fieldProps.slots,
  };

  const slotPropsForField: BaseFieldProps<TDate, unknown>["slotProps"] = {
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
        disabled,
        ...(!(disabled || readOnly) && {
          onClick: actions.onOpen,
          onKeyDown: onSpaceOrEnter(actions.onOpen),
        }),
        inputProps: {
          "aria-label": getOpenDialogAriaText(pickerFieldProps.value, utils),
          ...inputPropsPassedByField?.inputProps,
          ...externalInputProps?.inputProps,
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
      <WrapperVariantContext.Provider value="mobile">
        <Field
          {...fieldProps}
          slots={slotsForField}
          slotProps={slotPropsForField}
          inputRef={handleInputRef}
        />
        <PickersModalDialog
          {...actions}
          open={open}
          slots={slots}
          slotProps={slotProps}
        >
          <Layout
            {...layoutProps}
            {...slotProps?.layout}
            slots={slots}
            slotProps={slotProps}
          >
            {renderCurrentView()}
          </Layout>
        </PickersModalDialog>
      </WrapperVariantContext.Provider>
    </LocalizationProvider>
  );

  return { renderPicker };
};

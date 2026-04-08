import {
  resolveComponentProps,
  useSlotProps,
} from "@geeklabssh/hive-tablepro/core/mui-base/src/utils";
import {
  DateOrTimeView,
  executeInTheNextEventLoopTick,
  ExportedBaseToolbarProps,
  getActiveElement,
  InferError,
  PickersPopper,
  uncapitalizeObjectKeys,
  usePicker,
  WrapperVariantContext,
} from "@geeklabssh/hive-tablepro/core/x-date-pickers/src/internals";
import { LocalizationProvider } from "@geeklabssh/hive-tablepro/core/x-date-pickers/src/LocalizationProvider";
import {
  PickersLayout,
  PickersLayoutSlotsComponentsProps,
} from "@geeklabssh/hive-tablepro/core/x-date-pickers/src/PickersLayout";
import * as React from "react";
import { BaseMultiInputFieldProps } from "../../models/fields";
import { DateRange, RangePosition } from "../../models/range";
import { getReleaseInfo } from "../../utils/releaseInfo";
import { useRangePickerInputProps } from "../useRangePickerInputProps";
import {
  DesktopRangePickerAdditionalViewProps,
  UseDesktopRangePickerParams,
  UseDesktopRangePickerProps,
} from "./useDesktopRangePicker.types";

const releaseInfo = getReleaseInfo();

export const useDesktopRangePicker = <
  TDate,
  TView extends DateOrTimeView,
  TExternalProps extends UseDesktopRangePickerProps<
    TDate,
    TView,
    any,
    TExternalProps
  >
>({
  props,
  valueManager,
  validator,
}: UseDesktopRangePickerParams<TDate, TView, TExternalProps>) => {
  const {
    slots: innerSlots,
    slotProps: innerslotProps,
    components,
    componentsProps,
    className,
    sx,
    format,
    readOnly,
    disabled,
    autoFocus,
    disableOpenPicker,
    localeText,
  } = props;
  const slots = innerSlots ?? uncapitalizeObjectKeys(components);
  const slotProps = innerslotProps ?? componentsProps;

  const fieldRef = React.useRef<HTMLDivElement>(null);
  const popperRef = React.useRef<HTMLDivElement>(null);
  const [rangePosition, setRangePosition] =
    React.useState<RangePosition>("start");

  const {
    open,
    actions,
    layoutProps,
    renderCurrentView,
    shouldRestoreFocus,
    fieldProps: pickerFieldProps,
  } = usePicker<
    DateRange<TDate>,
    TDate,
    TView,
    TExternalProps,
    DesktopRangePickerAdditionalViewProps
  >({
    props,
    valueManager,
    wrapperVariant: "desktop",
    validator,
    autoFocusView: true,
    additionalViewProps: {
      rangePosition,
      onRangePositionChange: setRangePosition,
    },
  });

  const handleBlur = () => {
    executeInTheNextEventLoopTick(() => {
      if (
        fieldRef.current?.contains(getActiveElement(document)) ||
        popperRef.current?.contains(getActiveElement(document))
      ) {
        return;
      }

      actions.onDismiss();
    });
  };

  const fieldSlotProps = useRangePickerInputProps({
    wrapperVariant: "desktop",
    open,
    actions,
    readOnly,
    disabled,
    disableOpenPicker,
    localeText,
    onBlur: handleBlur,
    rangePosition,
    onRangePositionChange: setRangePosition,
  });

  const Field = slots.field;
  const fieldProps: BaseMultiInputFieldProps<
    DateRange<TDate>,
    InferError<TExternalProps>
  > = useSlotProps({
    elementType: Field,
    externalSlotProps: slotProps?.field as any,
    additionalProps: {
      ...pickerFieldProps,
      readOnly,
      disabled,
      className,
      sx,
      format,
      autoFocus: autoFocus && !props.open,
      ref: fieldRef,
    },
    ownerState: props,
  });

  const slotsForField: BaseMultiInputFieldProps<
    DateRange<TDate>,
    unknown
  >["slots"] = {
    textField: slots.textField,
    root: slots.fieldRoot,
    separator: slots.fieldSeparator,
    ...(fieldProps.slots ?? uncapitalizeObjectKeys(fieldProps?.components)),
  };

  const slotPropsFromFieldProps =
    fieldProps.slotProps ?? fieldProps.componentsProps;
  const slotPropsForField: BaseMultiInputFieldProps<
    DateRange<TDate>,
    unknown
  >["slotProps"] = {
    ...slotPropsFromFieldProps,
    textField: (ownerState) => {
      const externalInputProps = resolveComponentProps(
        slotProps?.textField,
        ownerState
      );
      const inputPropsPassedByField = resolveComponentProps(
        slotPropsFromFieldProps?.textField,
        ownerState
      );
      const inputPropsPassedByPicker =
        ownerState.position === "start"
          ? fieldSlotProps.startInput
          : fieldSlotProps.endInput;

      return {
        ...externalInputProps,
        ...inputPropsPassedByField,
        ...inputPropsPassedByPicker,
        inputProps: {
          ...externalInputProps?.inputProps,
          ...inputPropsPassedByField?.inputProps,
        },
      };
    },
    root: (ownerState) => {
      const externalRootProps = resolveComponentProps(
        slotProps?.fieldRoot,
        ownerState
      );
      const rootPropsPassedByField = resolveComponentProps(
        slotPropsFromFieldProps?.root,
        ownerState
      );
      return {
        ...externalRootProps,
        ...rootPropsPassedByField,
        ...fieldSlotProps.root,
      };
    },
    separator: (ownerState) => {
      const externalSeparatorProps = resolveComponentProps(
        slotProps?.fieldSeparator,
        ownerState
      );
      const separatorPropsPassedByField = resolveComponentProps(
        slotPropsFromFieldProps?.separator,
        ownerState
      );
      return {
        ...externalSeparatorProps,
        ...separatorPropsPassedByField,
        ...fieldSlotProps.root,
      };
    },
  };

  const slotPropsForLayout: PickersLayoutSlotsComponentsProps<
    DateRange<TDate>,
    TView
  > = {
    ...slotProps,
    toolbar: {
      ...slotProps?.toolbar,
      rangePosition,
      onRangePositionChange: setRangePosition,
    } as ExportedBaseToolbarProps,
  };
  const Layout = slots?.layout ?? PickersLayout;

  const renderPicker = () => (
    <LocalizationProvider localeText={localeText}>
      <WrapperVariantContext.Provider value="desktop">
        <Field
          {...fieldProps}
          slots={slotsForField}
          slotProps={slotPropsForField}
        />
        <PickersPopper
          role="tooltip"
          containerRef={popperRef}
          anchorEl={fieldRef.current}
          onBlur={handleBlur}
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
            slotProps={slotPropsForLayout}
          >
            {renderCurrentView()}
          </Layout>
        </PickersPopper>
      </WrapperVariantContext.Provider>
    </LocalizationProvider>
  );

  return {
    renderPicker,
  };
};

import { styled } from "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles";
import clsx from "clsx";
import { LocalizationProvider } from "../../../LocalizationProvider";
import { PickersLayout } from "../../../PickersLayout";
import { WrapperVariantContext } from "../../components/wrappers/WrapperVariantContext";
import { DIALOG_WIDTH } from "../../constants/dimensions";
import { DateOrTimeView } from "../../models/views";
import { usePicker } from "../usePicker";
import {
  UseStaticPickerParams,
  UseStaticPickerProps,
} from "./useStaticPicker.types";
const PickerStaticLayout = styled(PickersLayout)(({ theme }) => ({
  overflow: "hidden",
  minWidth: DIALOG_WIDTH,
  backgroundColor: (theme.vars || theme).palette.background.paper,
})) as unknown as typeof PickersLayout;

/**
 * Hook managing all the single-date static pickers:
 * - StaticDatePicker
 * - StaticDateTimePicker
 * - StaticTimePicker
 */
export const useStaticPicker = <
  TDate,
  TView extends DateOrTimeView,
  TExternalProps extends UseStaticPickerProps<TDate, TView, any, TExternalProps>
>({
  props,
  valueManager,
  validator,
  ref,
}: UseStaticPickerParams<TDate, TView, TExternalProps>) => {
  const {
    localeText,
    slots,
    slotProps,
    className,
    sx,
    displayStaticWrapperAs,
    autoFocus,
  } = props;

  const { layoutProps, renderCurrentView } = usePicker<
    TDate | null,
    TDate,
    TView,
    TExternalProps,
    {}
  >({
    props,
    valueManager,
    validator,
    autoFocusView: autoFocus ?? false,
    additionalViewProps: {},
    wrapperVariant: displayStaticWrapperAs,
  });

  const Layout = slots?.layout ?? PickerStaticLayout;

  const renderPicker = () => (
    <LocalizationProvider localeText={localeText}>
      <WrapperVariantContext.Provider value={displayStaticWrapperAs}>
        <Layout
          {...layoutProps}
          {...slotProps?.layout}
          slots={slots}
          slotProps={slotProps}
          sx={sx}
          className={clsx(className, slotProps?.layout?.className)}
          ref={ref}
        >
          {renderCurrentView()}
        </Layout>
      </WrapperVariantContext.Provider>
    </LocalizationProvider>
  );

  return { renderPicker };
};

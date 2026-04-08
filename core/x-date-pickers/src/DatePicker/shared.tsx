import { useThemeProps } from "@cronoslogistics/hive-tablepro/core/mui-material/src/styles";
import * as React from "react";
import {
  DateCalendarSlotsComponent,
  DateCalendarSlotsComponentsProps,
  ExportedDateCalendarProps,
} from "../DateCalendar/DateCalendar.types";
import { DateViewRendererProps } from "../dateViewRenderers";
import {
  BaseDateValidationProps,
  DateView,
  MuiPickersAdapter,
  UncapitalizeObjectKeys,
} from "../internals";
import { PickerViewRendererLookup } from "../internals/hooks/usePicker/usePickerViews";
import { useDefaultDates, useUtils } from "../internals/hooks/useUtils";
import { DateValidationError } from "../internals/hooks/validation/useDateValidation";
import { DefaultizedProps } from "../internals/models/helpers";
import { BasePickerInputProps } from "../internals/models/props/basePickerProps";
import { applyDefaultDate } from "../internals/utils/date-utils";
import { uncapitalizeObjectKeys } from "../internals/utils/slots-migration";
import {
  applyDefaultViewProps,
  isYearAndMonthViews,
  isYearOnlyView,
} from "../internals/utils/views";
import {
  LocalizedComponent,
  PickersInputLocaleText,
} from "../locales/utils/pickersLocaleTextApi";
import {
  DatePickerToolbar,
  DatePickerToolbarProps,
  ExportedDatePickerToolbarProps,
} from "./DatePickerToolbar";
export interface BaseDatePickerSlotsComponent<TDate>
  extends DateCalendarSlotsComponent<TDate> {
  /**
   * Custom component for the toolbar rendered above the views.
   * @default DatePickerToolbar
   */
  Toolbar?: React.JSXElementConstructor<DatePickerToolbarProps<TDate>>;
}

export interface BaseDatePickerSlotsComponentsProps<TDate>
  extends DateCalendarSlotsComponentsProps<TDate> {
  toolbar?: ExportedDatePickerToolbarProps;
}

export interface BaseDatePickerProps<TDate>
  extends BasePickerInputProps<
      TDate | null,
      TDate,
      DateView,
      DateValidationError
    >,
    ExportedDateCalendarProps<TDate> {
  /**
   * Overrideable components.
   * @default {}
   * @deprecated Please use `slots`.
   */
  components?: BaseDatePickerSlotsComponent<TDate>;
  /**
   * The props used for each component slot.
   * @default {}
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: BaseDatePickerSlotsComponentsProps<TDate>;
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots?: UncapitalizeObjectKeys<BaseDatePickerSlotsComponent<TDate>>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: BaseDatePickerSlotsComponentsProps<TDate>;
  /**
   * Define custom view renderers for each section.
   * If `null`, the section will only have field editing.
   * If `undefined`, internally defined view will be the used.
   */
  viewRenderers?: Partial<
    PickerViewRendererLookup<
      TDate | null,
      DateView,
      DateViewRendererProps<TDate, DateView>,
      {}
    >
  >;
}

type UseDatePickerDefaultizedProps<
  TDate,
  Props extends BaseDatePickerProps<TDate>
> = LocalizedComponent<
  TDate,
  Omit<
    DefaultizedProps<
      Props,
      "views" | "openTo" | keyof BaseDateValidationProps<TDate>
    >,
    "components" | "componentsProps"
  >
>;

export const getDatePickerFieldFormat = (
  utils: MuiPickersAdapter<any>,
  { format, views }: { format?: string; views: readonly DateView[] }
) => {
  if (format != null) {
    return format;
  }
  if (isYearOnlyView(views)) {
    return utils.formats.year;
  }
  if (isYearAndMonthViews(views)) {
    return utils.formats.monthAndYear;
  }
  return undefined;
};

export function useDatePickerDefaultizedProps<
  TDate,
  Props extends BaseDatePickerProps<TDate>
>(props: Props, name: string): UseDatePickerDefaultizedProps<TDate, Props> {
  const utils = useUtils<TDate>();
  const defaultDates = useDefaultDates<TDate>();
  const themeProps = useThemeProps({
    props,
    name,
  });

  const localeText = React.useMemo<
    PickersInputLocaleText<TDate> | undefined
  >(() => {
    if (themeProps.localeText?.toolbarTitle == null) {
      return themeProps.localeText;
    }

    return {
      ...themeProps.localeText,
      datePickerToolbarTitle: themeProps.localeText.toolbarTitle,
    };
  }, [themeProps.localeText]);

  const slots =
    themeProps.slots ?? uncapitalizeObjectKeys(themeProps.components);
  return {
    ...themeProps,
    localeText,
    ...applyDefaultViewProps({
      views: themeProps.views,
      openTo: themeProps.openTo,
      defaultViews: ["year", "day"],
      defaultOpenTo: "day",
    }),
    disableFuture: themeProps.disableFuture ?? false,
    disablePast: themeProps.disablePast ?? false,
    minDate: applyDefaultDate(utils, themeProps.minDate, defaultDates.minDate),
    maxDate: applyDefaultDate(utils, themeProps.maxDate, defaultDates.maxDate),
    slots: { toolbar: DatePickerToolbar, ...slots },
    slotProps: themeProps.slotProps ?? themeProps.componentsProps,
  };
}

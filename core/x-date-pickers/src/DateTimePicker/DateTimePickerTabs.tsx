import {
  styled,
  useThemeProps,
} from "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles";
import Tab from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Tab";
import Tabs, {
  tabsClasses,
} from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Tabs";
import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import PropTypes from "prop-types";
import * as React from "react";
import { DateRange, Time } from "../internals/components/icons";
import { useLocaleText } from "../internals/hooks/useUtils";
import { DateOrTimeView } from "../internals/models";
import {
  BaseTabsProps,
  ExportedBaseTabsProps,
} from "../internals/models/props/tabs";
import {
  DateTimePickerTabsClasses,
  getDateTimePickerTabsUtilityClass,
} from "./dateTimePickerTabsClasses";

type TabValue = "date" | "time";

const viewToTab = (view: DateOrTimeView): TabValue => {
  if (["day", "month", "year"].includes(view)) {
    return "date";
  }

  return "time";
};

const tabToView = (tab: TabValue): DateOrTimeView => {
  if (tab === "date") {
    return "day";
  }

  return "hours";
};

export interface ExportedDateTimePickerTabsProps extends ExportedBaseTabsProps {
  /**
   * Toggles visibility of the tabs allowing view switching.
   * @default `window.innerHeight < 667` for `DesktopDateTimePicker` and `MobileDateTimePicker`, `displayStaticWrapperAs === 'desktop'` for `StaticDateTimePicker`
   */
  hidden?: boolean;
  /**
   * Date tab icon.
   * @default DateRange
   */
  dateIcon?: React.ReactNode;
  /**
   * Time tab icon.
   * @default Time
   */
  timeIcon?: React.ReactNode;
}

export interface DateTimePickerTabsProps
  extends ExportedDateTimePickerTabsProps,
    BaseTabsProps<DateOrTimeView> {
  /**
   * Override or extend the styles applied to the component.
   */
  classes?: Partial<DateTimePickerTabsClasses>;
}

const useUtilityClasses = (ownerState: DateTimePickerTabsProps) => {
  const { classes } = ownerState;
  const slots = {
    root: ["root"],
  };

  return compClasses(slots, getDateTimePickerTabsUtilityClass, classes);
};

const DateTimePickerTabsRoot = styled(Tabs, {
  name: "MuiDateTimePickerTabs",
  slot: "Root",
  overridesResolver: (_, styles) => styles.root,
})<{ ownerState: DateTimePickerTabsProps }>(({ theme }) => ({
  boxShadow: `0 -1px 0 0 inset ${(theme.vars || theme).palette.divider}`,
  "&:last-child": {
    boxShadow: `0 1px 0 0 inset ${(theme.vars || theme).palette.divider}`,
    [`& .${tabsClasses.indicator}`]: {
      bottom: "auto",
      top: 0,
    },
  },
}));

const DateTimePickerTabs = function DateTimePickerTabs(
  inProps: DateTimePickerTabsProps
) {
  const props = useThemeProps({
    props: inProps,
    name: "MuiDateTimePickerTabs",
  });
  const {
    dateIcon = <DateRange />,
    onViewChange,
    timeIcon = <Time />,
    view,
    hidden = typeof window === "undefined" || window.innerHeight < 667,
  } = props;

  const localeText = useLocaleText();
  const classes = useUtilityClasses(props);

  const handleChange = (event: React.SyntheticEvent, value: TabValue) => {
    onViewChange(tabToView(value));
  };

  if (hidden) {
    return null;
  }

  return (
    <DateTimePickerTabsRoot
      ownerState={props}
      variant="fullWidth"
      value={viewToTab(view)}
      onChange={handleChange}
      className={classes.root}
    >
      <Tab
        value="date"
        aria-label={localeText.dateTableLabel}
        icon={<React.Fragment>{dateIcon}</React.Fragment>}
      />
      <Tab
        value="time"
        aria-label={localeText.timeTableLabel}
        icon={<React.Fragment>{timeIcon}</React.Fragment>}
      />
    </DateTimePickerTabsRoot>
  );
};

DateTimePickerTabs.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * Date tab icon.
   * @default DateRange
   */
  dateIcon: PropTypes.node,
  /**
   * Toggles visibility of the tabs allowing view switching.
   * @default `window.innerHeight < 667` for `DesktopDateTimePicker` and `MobileDateTimePicker`, `displayStaticWrapperAs === 'desktop'` for `StaticDateTimePicker`
   */
  hidden: PropTypes.bool,
  /**
   * Callback called when a tab is clicked
   * @template TView
   * @param {TView} view The view to open
   */
  onViewChange: PropTypes.func.isRequired,
  /**
   * Time tab icon.
   * @default Time
   */
  timeIcon: PropTypes.node,
  /**
   * Currently visible picker view.
   */
  view: PropTypes.oneOf(["day", "hours", "minutes", "month", "seconds", "year"])
    .isRequired,
} as any;

export { DateTimePickerTabs };

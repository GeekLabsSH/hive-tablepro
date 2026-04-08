import Grid from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Grid";
import {
  styled,
  useThemeProps,
} from "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles";
import Typography from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Typography";
import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import * as React from "react";
import { BaseToolbarProps } from "../models/props/toolbar";
import { DateOrTimeView } from "../models/views";
import {
  getPickersToolbarUtilityClass,
  PickersToolbarClasses,
} from "./pickersToolbarClasses";
export interface PickersToolbarProps<TValue, TView extends DateOrTimeView>
  extends Pick<BaseToolbarProps<TValue, TView>, "isLandscape" | "hidden"> {
  className?: string;
  landscapeDirection?: "row" | "column";
  toolbarTitle: React.ReactNode;
  classes?: Partial<PickersToolbarClasses>;
}

const useUtilityClasses = (ownerState: PickersToolbarProps<any, any>) => {
  const { classes, isLandscape } = ownerState;
  const slots = {
    root: ["root"],
    content: ["content"],
    penIconButton: ["penIconButton", isLandscape && "penIconButtonLandscape"],
  };

  return compClasses(slots, getPickersToolbarUtilityClass, classes);
};

const PickersToolbarRoot = styled("div", {
  name: "MuiPickersToolbar",
  slot: "Root",
  overridesResolver: (props, styles) => styles.root,
})<{
  ownerState: PickersToolbarProps<any, any>;
}>(({ theme, ownerState }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: theme.spacing(2, 3),
  ...(ownerState.isLandscape && {
    height: "auto",
    maxWidth: 160,
    padding: 16,
    justifyContent: "flex-start",
    flexWrap: "wrap",
  }),
}));

const PickersToolbarContent = styled(Grid, {
  name: "MuiPickersToolbar",
  slot: "Content",
  overridesResolver: (props, styles) => styles.content,
})<{
  ownerState: PickersToolbarProps<any, any>;
}>(({ ownerState }) => ({
  flex: 1,
  ...(!ownerState.isLandscape && {
    alignItems: "center",
  }),
}));

type PickersToolbarComponent = (<TValue, TView extends DateOrTimeView>(
  props: React.PropsWithChildren<PickersToolbarProps<TValue, TView>> &
    React.RefAttributes<HTMLDivElement>
) => JSX.Element) & { propTypes?: any };

export const PickersToolbar = React.forwardRef(function PickersToolbar<
  TValue,
  TView extends DateOrTimeView
>(
  inProps: React.PropsWithChildren<PickersToolbarProps<TValue, TView>>,
  ref: React.Ref<HTMLDivElement>
) {
  const props = useThemeProps({ props: inProps, name: "MuiPickersToolbar" });
  const {
    children,
    className,
    isLandscape,
    landscapeDirection = "column",
    toolbarTitle,
    hidden,
  } = props;

  const ownerState = props;
  const classes = useUtilityClasses(ownerState);

  if (hidden) {
    return null;
  }

  return (
    <PickersToolbarRoot
      ref={ref}
      data-mui-test="picker-toolbar"
      className={clsx(classes.root, className)}
      ownerState={ownerState}
    >
      <Typography
        data-mui-test="picker-toolbar-title"
        color="text.secondary"
        variant="overline"
      >
        {toolbarTitle}
      </Typography>
      <PickersToolbarContent
        container
        justifyContent={isLandscape ? "flex-start" : "space-between"}
        className={classes.content}
        ownerState={ownerState}
        direction={isLandscape ? landscapeDirection : "row"}
        alignItems={isLandscape ? "flex-start" : "flex-end"}
      >
        {children}
      </PickersToolbarContent>
    </PickersToolbarRoot>
  );
}) as PickersToolbarComponent;

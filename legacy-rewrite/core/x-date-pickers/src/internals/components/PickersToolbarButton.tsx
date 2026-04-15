import Button, {
  ButtonProps,
} from "@geeklabssh/hive-tablepro/core/mui-material/src/Button";
import {
  styled,
  useThemeProps,
} from "@geeklabssh/hive-tablepro/core/mui-material/src/styles";
import { TypographyProps } from "@geeklabssh/hive-tablepro/core/mui-material/src/Typography";
import { unstable_compClasses as compClasses } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import * as React from "react";
import { ExtendMui } from "../models/helpers";
import { PickersToolbarButtonClasses } from "./pickersToolbarButtonClasses";
import { getPickersToolbarUtilityClass } from "./pickersToolbarClasses";
import { PickersToolbarText } from "./PickersToolbarText";
export interface PickersToolbarButtonProps
  extends ExtendMui<ButtonProps, "value" | "variant"> {
  align?: TypographyProps["align"];
  selected: boolean;
  typographyClassName?: string;
  value: React.ReactNode;
  variant: TypographyProps["variant"];
  classes?: Partial<PickersToolbarButtonClasses>;
}

const useUtilityClasses = (ownerState: PickersToolbarButtonProps) => {
  const { classes } = ownerState;
  const slots = {
    root: ["root"],
  };

  return compClasses(slots, getPickersToolbarUtilityClass, classes);
};

const PickersToolbarButtonRoot = styled(Button, {
  name: "MuiPickersToolbarButton",
  slot: "Root",
  overridesResolver: (_, styles) => styles.root,
})({
  padding: 0,
  minWidth: 16,
  textTransform: "none",
});

export const PickersToolbarButton: React.FunctionComponent<PickersToolbarButtonProps | any> =
  React.forwardRef(function PickersToolbarButton(inProps, ref) {
    const props = useThemeProps({
      props: inProps,
      name: "MuiPickersToolbarButton",
    });
    const {
      align,
      className,
      selected,
      typographyClassName,
      value,
      variant,
      ...other
    } = props;

    const classes = useUtilityClasses(props);

    return (
      <PickersToolbarButtonRoot
        data-mui-test="toolbar-button"
        variant="text"
        ref={ref}
        className={clsx(className, classes.root)}
        {...other}
      >
        <PickersToolbarText
          align={align}
          className={typographyClassName}
          variant={variant}
          value={value}
          selected={selected}
        />
      </PickersToolbarButtonRoot>
    );
  });

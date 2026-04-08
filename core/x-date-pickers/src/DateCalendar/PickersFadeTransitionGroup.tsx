import Fade from "@GeekLabsSH/hive-tablepro/core/mui-material/src/Fade";
import {
  styled,
  useThemeProps,
} from "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles";
import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import * as React from "react";
import { TransitionGroup } from "react-transition-group";
import {
  getPickersFadeTransitionGroupUtilityClass,
  PickersFadeTransitionGroupClasses,
} from "./pickersFadeTransitionGroupClasses";
export interface PickersFadeTransitionGroupProps {
  children: React.ReactElement;
  className?: string;
  reduceAnimations: boolean;
  transKey: React.Key;
  classes?: Partial<PickersFadeTransitionGroupClasses>;
}

const useUtilityClasses = (ownerState: PickersFadeTransitionGroupProps) => {
  const { classes } = ownerState;
  const slots = {
    root: ["root"],
  };

  return compClasses(
    slots,
    getPickersFadeTransitionGroupUtilityClass,
    classes
  );
};

const animationDuration = 500;

const PickersFadeTransitionGroupRoot = styled(TransitionGroup, {
  name: "MuiPickersFadeTransitionGroup",
  slot: "Root",
  overridesResolver: (_, styles) => styles.root,
})({
  display: "block",
  position: "relative",
});

/**
 * @ignore - do not document.
 */
export function PickersFadeTransitionGroup(
  inProps: PickersFadeTransitionGroupProps
) {
  const props = useThemeProps({
    props: inProps,
    name: "MuiPickersFadeTransitionGroup",
  });
  const { children, className, reduceAnimations, transKey } = props;
  const classes = useUtilityClasses(props);
  if (reduceAnimations) {
    return children;
  }

  return (
    <PickersFadeTransitionGroupRoot className={clsx(classes.root, className)}>
      <Fade
        appear={false}
        mountOnEnter
        unmountOnExit
        key={transKey}
        timeout={{
          appear: animationDuration,
          enter: animationDuration / 2,
          exit: 0,
        }}
      >
        {children}
      </Fade>
    </PickersFadeTransitionGroupRoot>
  );
}

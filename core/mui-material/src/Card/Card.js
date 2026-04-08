import { unstable_compClasses as compClasses } from "@GeekLabsSH/hive-tablepro/core/mui-base/src";
import { chainPropTypes } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import Paper from "../Paper";
import styled from "../styles/styled";
import useThemeProps from "../styles/useThemeProps";
import { getCardUtilityClass } from "./cardClasses";

const useUtilityClasses = (ownerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["root"],
  };

  return compClasses(slots, getCardUtilityClass, classes);
};

const CardRoot = styled(Paper, {
  name: "MuiCard",
  slot: "Root",
  overridesResolver: (props, styles) => styles.root,
})(() => {
  return {
    overflow: "hidden",
  };
});

const Card = React.forwardRef(function Card(inProps, ref) {
  const props = useThemeProps({
    props: inProps,
    name: "MuiCard",
  });

  const { className, raised = false, ...other } = props;

  const ownerState = { ...props, raised };

  const classes = useUtilityClasses(ownerState);

  return (
    <CardRoot
      className={clsx(classes.root, className)}
      elevation={raised ? 8 : undefined}
      ref={ref}
      ownerState={ownerState}
      {...other}
    />
  );
});

Card.propTypes /* remove-proptypes */ = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // |     To update them edit the d.ts file and run "yarn proptypes"     |
  // ----------------------------------------------------------------------
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * If `true`, the card will use raised styling.
   * @default false
   */
  raised: chainPropTypes(PropTypes.bool, (props) => {
    if (props.raised && props.variant === "outlined") {
      return new Error(
        'HIVE: Combining `raised={true}` with `variant="outlined"` has no effect.'
      );
    }

    return null;
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
};

export default Card;

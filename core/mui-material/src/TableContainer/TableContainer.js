import { unstable_compClasses as compClasses } from "@cronoslogistics/hive-tablepro/core/mui-base/src";
import clsx from "clsx";
import PropTypes from "prop-types";
import * as React from "react";
import styled from "../styles/styled";
import useThemeProps from "../styles/useThemeProps";
import { getTableContainerUtilityClass } from "./tableContainerClasses";

const useUtilityClasses = (ownerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ["root"],
  };

  return compClasses(slots, getTableContainerUtilityClass, classes);
};

const TableContainerRoot = styled("div", {
  name: "MuiTableContainer",
  slot: "Root",
  overridesResolver: (props, styles) => styles.root,
})({
  width: "100%",
  overflowX: "auto",
});

const TableContainer = React.forwardRef(function TableContainer(inProps, ref) {
  const props = useThemeProps({ props: inProps, name: "MuiTableContainer" });
  const { className, component = "div", ...other } = props;

  const ownerState = {
    ...props,
    component,
  };

  const classes = useUtilityClasses(ownerState);

  return (
    <TableContainerRoot
      ref={ref}
      as={component}
      className={clsx(classes.root, className)}
      ownerState={ownerState}
      {...other}
    />
  );
});

TableContainer.propTypes /* remove-proptypes */ = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // |     To update them edit the d.ts file and run "yarn proptypes"     |
  // ----------------------------------------------------------------------
  /**
   * The content of the component, normally `Table`.
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
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
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

export default TableContainer;

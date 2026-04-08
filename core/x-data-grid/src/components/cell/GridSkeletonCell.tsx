import Skeleton from "@cronoslogistics/hive-tablepro/core/mui-material/src/Skeleton";
import {
  unstable_capitalize as capitalize,
  unstable_compClasses as compClasses,
} from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import PropTypes from "prop-types";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";

export interface GridSkeletonCellProps {
  width: number;
  contentWidth: number;
  field: string;
  align: string;
}

type OwnerState = Pick<GridSkeletonCellProps, "align"> & {
  classes?: DataGridProcessedProps["classes"];
};

const useUtilityClasses = (ownerState: OwnerState) => {
  const { align, classes } = ownerState;

  const slots = {
    root: [
      "cell",
      "cellSkeleton",
      `cell--text${capitalize(align)}`,
      "withBorderColor",
    ],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

function GridSkeletonCell(
  props: React.HTMLAttributes<HTMLDivElement> & GridSkeletonCellProps
) {
  const { field, align, width, contentWidth, ...other } = props;
  const rootProps = useGridRootProps();
  const ownerState = { classes: rootProps.classes, align };
  const classes = useUtilityClasses(ownerState);

  return (
    <div className={classes.root} style={{ width }} {...other}>
      <Skeleton width={`${contentWidth}%`} />
    </div>
  );
}

GridSkeletonCell.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  align: PropTypes.string.isRequired,
  contentWidth: PropTypes.number.isRequired,
  field: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
} as any;

export { GridSkeletonCell };

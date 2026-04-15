import Badge from "@geeklabssh/hive-tablepro/core/mui-material/src/Badge";
import IconButton from "@geeklabssh/hive-tablepro/core/mui-material/src/IconButton";
import { unstable_compClasses as compClasses } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import PropTypes from "prop-types";
import * as React from "react";
import { getDataGridUtilityClass } from "../../constants/gridClasses";
import { useGridApiContext } from "../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { GridIconSlotsComponent } from "../../models/gridIconSlotsComponent";
import { GridSortDirection } from "../../models/gridSortModel";
import { DataGridProcessedProps } from "../../models/props/DataGridProps";
import { GridIconButtonContainer } from "./GridIconButtonContainer";

export interface GridColumnHeaderSortIconProps {
  direction: GridSortDirection;
  index: number | undefined;
  sortingOrder: GridSortDirection[];
}

type OwnerState = GridColumnHeaderSortIconProps & {
  classes?: DataGridProcessedProps["classes"];
};

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    icon: ["sortIcon"],
  };

  return compClasses(slots, getDataGridUtilityClass, classes);
};

function getIcon(
  icons: GridIconSlotsComponent,
  direction: GridSortDirection,
  className: string,
  sortingOrder: GridSortDirection[]
) {
  let Icon;
  const iconProps: any = {};
  if (direction === "asc") {
    Icon = icons.ColumnSortedAscendingIcon;
  } else if (direction === "desc") {
    Icon = icons.ColumnSortedDescendingIcon;
  } else {
    Icon = icons.ColumnUnsortedIcon;
    iconProps.sortingOrder = sortingOrder;
  }
  return Icon ? (
    <Icon fontSize="small" className={className} {...iconProps} />
  ) : null;
}

function GridColumnHeaderSortIconRaw(props: GridColumnHeaderSortIconProps) {
  const { direction, index, sortingOrder } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const ownerState = { ...props, classes: rootProps.classes };
  const classes = useUtilityClasses(ownerState);

  const iconElement = getIcon(
    rootProps.components,
    direction,
    classes.icon,
    sortingOrder
  );
  if (!iconElement) {
    return null;
  }

  const iconButton = (
    <IconButton
      tabIndex={-1}
      aria-label={apiRef.current.getLocaleText("columnHeaderSortIconLabel")}
      title={apiRef.current.getLocaleText("columnHeaderSortIconLabel")}
      size="small"
    >
      {iconElement}
    </IconButton>
  );

  return (
    <GridIconButtonContainer>
      {index != null && (
        <Badge badgeContent={index} color="default">
          {iconButton}
        </Badge>
      )}

      {index == null && iconButton}
    </GridIconButtonContainer>
  );
}

const GridColumnHeaderSortIcon = React.memo(GridColumnHeaderSortIconRaw);

GridColumnHeaderSortIconRaw.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  direction: PropTypes.oneOf(["asc", "desc"]),
  index: PropTypes.number,
  sortingOrder: PropTypes.arrayOf(PropTypes.oneOf(["asc", "desc"])).isRequired,
} as any;

export { GridColumnHeaderSortIcon };

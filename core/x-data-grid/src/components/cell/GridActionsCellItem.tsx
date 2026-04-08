import IconButton, {
  IconButtonProps,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src/IconButton";
import ListItemIcon from "@cronoslogistics/hive-tablepro/core/mui-material/src/ListItemIcon";
import MenuItem, {
  MenuItemProps,
} from "@cronoslogistics/hive-tablepro/core/mui-material/src/MenuItem";
import { styled } from "@cronoslogistics/hive-tablepro/core/mui-material/src/styles";
import PropTypes from "prop-types";
import * as React from "react";
import { tooltipClasses } from "../../../../mui-material/src";
import Tooltip, {
  TooltipProps,
} from "../../../../mui-material/src/Tooltip/Tooltip";

export type GridActionsCellItemProps = {
  label: string;
  icon?: React.ReactElement;
  tooltip?: string;
  showLabel?: boolean;
} & (
  | ({ showInMenu?: false; icon: React.ReactElement } & IconButtonProps)
  | ({ showInMenu: true } & MenuItemProps)
);

const GridActionsCellItem = React.forwardRef<
  HTMLButtonElement,
  GridActionsCellItemProps
>((props, ref) => {
  const { label, icon, showInMenu, onClick, tooltip, showLabel, ...other } =
    props;

  const handleClick = (event: any) => {
    if (onClick) {
      onClick(event);
    }
  };

  const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      width: "auto",
      height: "auto",
      fontSize: "11px",
    },
  }));

  if (!showInMenu) {
    return (
      <>
        {tooltip ? (
          <BootstrapTooltip title={tooltip} placement={"top"} arrow>
            <IconButton
              ref={ref}
              size="small"
              role="menuitem"
              aria-label={label}
              {...(other as any)}
              onClick={handleClick}
            >
              {React.cloneElement(icon!, { fontSize: "small" })}
            </IconButton>
          </BootstrapTooltip>
        ) : (
          <IconButton
            ref={ref}
            size="small"
            role="menuitem"
            aria-label={label}
            {...(other as any)}
            onClick={handleClick}
          >
            {showLabel
              ? React.cloneElement(icon!, { fontSize: "small" }) && label
              : React.cloneElement(icon!, { fontSize: "small" })}
          </IconButton>
        )}
      </>
    );
  }

  return (
    <MenuItem ref={ref} {...(other as any)} onClick={onClick}>
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      {label}
    </MenuItem>
  );
});

GridActionsCellItem.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  icon: PropTypes.element,
  label: PropTypes.string.isRequired,
  showInMenu: PropTypes.bool,
} as any;

export { GridActionsCellItem };

import { ButtonProps } from "@cronoslogistics/hive-tablepro/core/mui-material/src/Button";
import MenuList from "@cronoslogistics/hive-tablepro/core/mui-material/src/MenuList";
import {
  unstable_useForkRef as useForkRef,
  unstable_useId as useId,
} from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import * as React from "react";
import { gridClasses } from "../../constants/gridClasses";
import { useGridApiContext } from "../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { isHideMenuKey, isTabKey } from "../../utils/keyboardUtils";
import { GridMenu, GridMenuProps } from "../menu/GridMenu";

export const GridToolbarExportContainer = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function GridToolbarExportContainer(props, ref) {
  const { children, onClick, ...other } = props;

  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const buttonId = useId();
  const menuId = useId();

  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const handleRef = useForkRef(ref, buttonRef);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen((prevOpen) => !prevOpen);
    onClick?.(event);
  };

  const handleMenuClose = () => setOpen(false);

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (isTabKey(event.key)) {
      event.preventDefault();
    }
    if (isHideMenuKey(event.key)) {
      handleMenuClose();
    }
  };

  const handleMenuClickAway: GridMenuProps["onClickAway"] = (event) => {
    if (
      buttonRef.current === event.target ||
      // if user clicked on the icon
      buttonRef.current?.contains(event.target as Element)
    ) {
      return;
    }
    setOpen(false);
  };

  if (children == null) {
    return null;
  }

  return (
    <React.Fragment>
      <rootProps.components.BaseButton
        ref={handleRef}
        size="small"
        startIcon={<rootProps.components.ExportIcon />}
        aria-expanded={open ? "true" : undefined}
        aria-label={apiRef.current.getLocaleText("toolbarExportLabel")}
        aria-haspopup="menu"
        aria-labelledby={menuId}
        id={buttonId}
        {...other}
        onClick={handleMenuOpen}
        {...rootProps.componentsProps?.baseButton}
        style={{ fontSize: "0.875rem" }}
      >
        {apiRef.current.getLocaleText("toolbarExport")}
      </rootProps.components.BaseButton>
      <GridMenu
        open={open}
        target={buttonRef.current}
        onClickAway={handleMenuClickAway}
        position="bottom-start"
      >
        <MenuList
          id={menuId}
          className={gridClasses.menuList}
          aria-labelledby={buttonId}
          onKeyDown={handleListKeyDown}
          autoFocusItem={open}
        >
          {React.Children.map(children, (child: any) => {
            if (!React.isValidElement(child as any)) {
              return child;
            }
            return React.cloneElement<any>(child, {
              hideMenu: handleMenuClose,
            });
          })}
        </MenuList>
      </GridMenu>
    </React.Fragment>
  );
});

import { ButtonProps } from "@cronoslogistics/hive-tablepro/core/mui-material/src/Button";
import * as React from "react";
import { gridPreferencePanelStateSelector } from "../../hooks/features/preferencesPanel/gridPreferencePanelSelector";
import { GridPreferencePanelsValue } from "../../hooks/features/preferencesPanel/gridPreferencePanelsValue";
import { useGridApiContext } from "../../hooks/utils/useGridApiContext";
import { useGridRootProps } from "../../hooks/utils/useGridRootProps";
import { useGridSelector } from "../../hooks/utils/useGridSelector";

export const GridToolbarColumnsButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function GridToolbarColumnsButton(props, ref) {
  const { onClick, ...other } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const { open, openedPanelValue } = useGridSelector(
    apiRef,
    gridPreferencePanelStateSelector
  );

  const showColumns = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (open && openedPanelValue === GridPreferencePanelsValue.columns) {
      apiRef.current.hidePreferences();
    } else {
      apiRef.current.showPreferences(GridPreferencePanelsValue.columns);
    }

    onClick?.(event);
  };

  // Disable the button if the corresponding is disabled
  if (rootProps.disableColumnSelector) {
    return null;
  }

  return (
    <rootProps.components.BaseButton
      ref={ref}
      size="small"
      aria-label={apiRef.current.getLocaleText("toolbarColumnsLabel")}
      startIcon={<rootProps.components.ColumnSelectorIcon />}
      {...other}
      onClick={showColumns}
      {...rootProps.componentsProps?.baseButton}
      style={{ fontSize: "0.875rem" }}
    >
      {apiRef.current.getLocaleText("toolbarColumns")}
    </rootProps.components.BaseButton>
  );
});

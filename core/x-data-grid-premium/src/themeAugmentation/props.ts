import {
  ComponentsOverrides,
  ComponentsProps,
} from "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles";
import { DataGridPremiumProps } from "../models/dataGridPremiumProps";

export interface DataGridPremiumComponentsPropsList {
  MuiDataGrid: DataGridPremiumProps;
}

export interface DataGridPremiumComponents<Theme = unknown> {
  MuiDataGrid?: {
    defaultProps?: ComponentsProps["MuiDataGrid"];
    styleOverrides?: ComponentsOverrides<Theme>["MuiDataGrid"];
  };
}

declare module "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles" {
  interface ComponentsPropsList extends DataGridPremiumComponentsPropsList {}
  interface Components<Theme = unknown>
    extends DataGridPremiumComponents<Theme> {}
}

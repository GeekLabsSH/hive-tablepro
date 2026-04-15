import {
  ComponentsOverrides,
  ComponentsProps,
} from "@geeklabssh/hive-tablepro/core/mui-material/src/styles";
import { DataGridProProps } from "../models/dataGridProProps";

export interface DataGridProComponentsPropsList {
  MuiDataGrid: DataGridProProps;
}

export interface DataGridProComponents<Theme = unknown> {
  MuiDataGrid?: {
    defaultProps?: ComponentsProps["MuiDataGrid"];
    styleOverrides?: ComponentsOverrides<Theme>["MuiDataGrid"];
  };
}

declare module "@geeklabssh/hive-tablepro/core/mui-material/src/styles" {
  interface ComponentsPropsList extends DataGridProComponentsPropsList {}
  interface Components<Theme = unknown> extends DataGridProComponents<Theme> {}
}

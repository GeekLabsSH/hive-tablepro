import {
  ComponentsOverrides,
  ComponentsProps,
} from "@geeklabssh/hive-tablepro/core/mui-material/src/styles";
import { DataGridProps } from "../models/props/DataGridProps";

export interface DataGridComponentsPropsList {
  MuiDataGrid: DataGridProps;
}

export interface DataGridComponents<Theme = unknown> {
  MuiDataGrid?: {
    defaultProps?: ComponentsProps["MuiDataGrid"];
    styleOverrides?: ComponentsOverrides<Theme>["MuiDataGrid"];
  };
}

declare module "@geeklabssh/hive-tablepro/core/mui-material/src/styles" {
  interface ComponentsPropsList extends DataGridComponentsPropsList {}
  interface Components<Theme = unknown> extends DataGridComponents<Theme> {}
}

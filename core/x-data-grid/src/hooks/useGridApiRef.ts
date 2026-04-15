import { useRef } from "react";
import type { GridApiCommunity, GridValidRowModel } from "../types";

export function useGridApiRef<R extends GridValidRowModel = GridValidRowModel>() {
  return useRef<GridApiCommunity<R> | null>(null);
}

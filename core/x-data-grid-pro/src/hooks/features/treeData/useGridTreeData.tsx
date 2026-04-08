import {
  GridEventListener,
  useGridApiEventHandler,
} from "@GeekLabsSH/hive-tablepro/core/x-data-grid/src";
import * as React from "react";
import { GridApiPro } from "../../../models/gridApiPro";

export const useGridTreeData = (apiRef: React.MutableRefObject<GridApiPro>) => {
  /**
   * EVENTS
   */
  const handleCellKeyDown = React.useCallback<GridEventListener<"cellKeyDown">>(
    (params, event) => {
      const cellParams = apiRef.current.getCellParams(params.id, params.field);
      if (
        cellParams.colDef.type === "treeDataGroup" &&
        event.key === " " &&
        !event.shiftKey
      ) {
        if (params.rowNode.type !== "group") {
          return;
        }

        apiRef.current.setRowChildrenExpansion(
          params.id,
          !params.rowNode.childrenExpanded
        );
      }
    },
    [apiRef]
  );

  useGridApiEventHandler(apiRef, "cellKeyDown", handleCellKeyDown);
};

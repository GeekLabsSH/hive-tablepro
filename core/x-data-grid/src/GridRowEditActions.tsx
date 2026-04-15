import { Button } from "../../../src/components/ui/button";
import type { GridRowEditActionsSlotProps } from "./dataGridProps";
import type { GridValidRowModel } from "./types";

/** Botões predefinidos para `editMode="row"` (substituíveis por `slots.rowEditActions`). */
export function GridDefaultRowEditActions<R extends GridValidRowModel>({
  api: _api,
  saveRowEdit,
  cancelRowEdit,
  lt
}: GridRowEditActionsSlotProps<R>) {
  return (
    <div
      className="flex min-w-0 items-center justify-end gap-2"
      data-hive-row-edit-actions=""
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Button type="button" variant="outline" size="sm" onClick={(e) => cancelRowEdit(e)}>
        {lt("rowEditActionsCancel", "Cancelar")}
      </Button>
      <Button type="button" size="sm" onClick={(e) => saveRowEdit(e)}>
        {lt("rowEditActionsSave", "Gravar")}
      </Button>
    </div>
  );
}

import * as React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../src/components/ui/select";
import { cn } from "../../../src/lib/utils";
import { GRID_CHECKBOX_SELECTION_FIELD } from "./constants";
import { useGridApiContext, useGridRootContext } from "./GridRootContext";
import type { GridColDef, GridFilterModel, GridValidRowModel } from "./types";

function nextFilterItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `filter-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Upsert de filtro «contém» por coluna; limpa `quickFilterValues` sem disparar pesquisa. */
export function upsertColumnContainsFilter(
  model: GridFilterModel,
  field: string,
  value: string
): GridFilterModel {
  const trimmedText = value.trim();
  const withoutField = model.items.filter((item) => item.field !== field);
  if (trimmedText === "") {
    return {
      ...model,
      items: withoutField,
      quickFilterValues: undefined
    };
  }
  return {
    ...model,
    items: [
      ...withoutField,
      { id: nextFilterItemId(), field, operator: "contains", value: trimmedText }
    ],
    quickFilterValues: undefined
  };
}

function isFilterableVisibleColumn<R extends GridValidRowModel>(col: GridColDef<R>): boolean {
  if (col.field === GRID_CHECKBOX_SELECTION_FIELD) return false;
  if (col.filterable === false) return false;
  if (col.type === "actions" || col.getActions != null) return false;
  return true;
}

export type GridToolbarColumnContainsFilterProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  columnSelectPlaceholder?: string;
  valueInputPlaceholder?: string;
  addAriaLabel?: string;
};

export function GridToolbarColumnContainsFilter({
  className,
  columnSelectPlaceholder = "Coluna",
  valueInputPlaceholder = "Valor…",
  addAriaLabel = "Adicionar filtro",
  ...props
}: GridToolbarColumnContainsFilterProps) {
  const { api } = useGridApiContext();
  const root = useGridRootContext();
  const [selectedField, setSelectedField] = React.useState("");
  const [valueText, setValueText] = React.useState("");

  const filterableCols = React.useMemo(() => {
    if (!api) return [];
    return api.getVisibleColumns().filter(isFilterableVisibleColumn);
  }, [api, root?.activeFilterCount]);

  React.useEffect(() => {
    if (filterableCols.length === 0) {
      setSelectedField("");
      return;
    }
    setSelectedField((prev) =>
      prev && filterableCols.some((c) => c.field === prev) ? prev : filterableCols[0].field
    );
  }, [filterableCols]);

  const applyFilter = React.useCallback(() => {
    if (!api || !selectedField) return;
    const trimmed = valueText.trim();
    if (trimmed === "") return;
    const current = api.getFilterModel();
    api.setFilterModel(upsertColumnContainsFilter(current, selectedField, trimmed));
    setValueText("");
  }, [api, selectedField, valueText]);

  if (filterableCols.length === 0) return null;

  return (
    <div
      className={cn("flex min-w-0 shrink-0 flex-wrap items-center gap-1", className)}
      {...props}
    >
      <Select value={selectedField || undefined} onValueChange={setSelectedField}>
        <SelectTrigger
          className="h-8 w-[9rem] max-w-[12rem] shrink-0 border-0 border-b border-muted-foreground/40 rounded-none px-0 pb-px shadow-none focus:ring-0 focus:ring-offset-0"
          aria-label={columnSelectPlaceholder}
        >
          <SelectValue placeholder={columnSelectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {filterableCols.map((col) => (
            <SelectItem key={col.field} value={col.field}>
              {col.headerName ?? col.field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex min-w-[9rem] max-w-sm flex-1 items-center gap-1 border-0 border-b border-muted-foreground/40 px-0 pb-px focus-within:border-primary">
        <Input
          type="search"
          className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={valueText}
          onChange={(e) => setValueText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyFilter();
            }
          }}
          placeholder={valueInputPlaceholder}
          aria-label={valueInputPlaceholder}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label={addAriaLabel}
          title={addAriaLabel}
          onClick={applyFilter}
          disabled={!selectedField || valueText.trim() === ""}
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

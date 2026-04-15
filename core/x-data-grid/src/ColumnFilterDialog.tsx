import * as React from "react";
import { Button } from "../../../src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../../../src/components/ui/dialog";
import { Input } from "../../../src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../src/components/ui/select";
import { colHasValueOptions, resolveColValueOptions } from "./adapter";
import {
  defaultFilterOperatorForCol,
  getFilterOperatorChoices,
  normalizeValueOptions
} from "./columnFilterShared";
import type {
  GridColDef,
  GridFilterModel,
  GridFilterOperator,
  GridLocaleText,
  GridRowId,
  GridValidRowModel,
  GridValueOptionsList
} from "./types";

type OpChoice = { value: GridFilterOperator; label: string };

function replaceFieldItem(
  model: GridFilterModel,
  field: string,
  item: { field: string; operator: GridFilterOperator; value?: unknown } | null
): GridFilterModel {
  const rest = (model.items ?? []).filter((i) => i.field !== field);
  const items = item ? [...rest, item] : rest;
  return { ...model, items };
}

export function ColumnFilterDialog<R extends GridValidRowModel>({
  open,
  onOpenChange,
  field,
  headerName,
  colDef,
  filterModel,
  onCommit,
  lt
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: string;
  headerName: string;
  colDef?: GridColDef<R>;
  filterModel: GridFilterModel;
  onCommit: (next: GridFilterModel) => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
}) {
  const isNumber = colDef?.type === "number";
  const isBoolean = colDef?.type === "boolean";
  const isDate = colDef?.type === "date";
  const isDateTime = colDef?.type === "dateTime";
  const isDateKind = isDate || isDateTime;
  const isSingleSelect = colDef?.type === "singleSelect" && colDef != null && colHasValueOptions(colDef);

  const normOpts = React.useMemo(() => {
    if (!isSingleSelect || !colDef) return [];
    const list = resolveColValueOptions(colDef, "__filter__" as GridRowId, {} as R);
    return list?.length ? normalizeValueOptions(list as GridValueOptionsList) : [];
  }, [isSingleSelect, colDef]);

  const choices = React.useMemo((): OpChoice[] => getFilterOperatorChoices(colDef, lt), [colDef, lt]);

  const existing = (filterModel.items ?? []).find((i) => i.field === field);

  const defaultOperator = (): GridFilterOperator => defaultFilterOperatorForCol(colDef);

  const [operator, setOperator] = React.useState<GridFilterOperator>(defaultOperator());
  const [valueText, setValueText] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (existing) {
      setOperator(existing.operator);
      if (existing.operator === "isEmpty" || existing.operator === "isNotEmpty") {
        setValueText("");
        return;
      }
      if (isSingleSelect && existing.operator === "equals") {
        const m = normOpts.find(
          (o) =>
            Object.is(o.raw, existing.value) ||
            String(o.raw) === String(existing.value) ||
            o.value === String(existing.value)
        );
        setValueText(m?.value ?? normOpts[0]?.value ?? "");
        return;
      }
      if (isBoolean && existing.operator === "equals") {
        const v = existing.value;
        setValueText(v === true || v === "true" || String(v).toLowerCase() === "true" ? "true" : "false");
        return;
      }
      if (existing.value === undefined || existing.value === null) setValueText("");
      else if (existing.value instanceof Date) {
        if (isDateTime) {
          const d = existing.value;
          const pad = (n: number) => String(n).padStart(2, "0");
          setValueText(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
          );
        } else {
          setValueText(existing.value.toISOString().slice(0, 10));
        }
      } else setValueText(String(existing.value));
    } else {
      setOperator(isSingleSelect || isBoolean ? "equals" : defaultOperator());
      if (isSingleSelect) setValueText(normOpts[0]?.value ?? "");
      else if (isBoolean) setValueText("true");
      else setValueText("");
    }
  }, [open, field, existing, isSingleSelect, isBoolean, isDateKind, isNumber, normOpts, isDateTime]);

  const needsValue = operator !== "isEmpty" && operator !== "isNotEmpty";

  const apply = () => {
    let item: { field: string; operator: GridFilterOperator; value?: unknown };
    if (operator === "isEmpty" || operator === "isNotEmpty") {
      item = { field, operator };
    } else if (isSingleSelect) {
      if (operator !== "equals") return;
      const m = normOpts.find((o) => o.value === valueText);
      if (!m) return;
      item = { field, operator: "equals", value: m.raw };
    } else if (isBoolean) {
      if (operator !== "equals") return;
      item = { field, operator: "equals", value: valueText === "true" };
    } else if (isNumber) {
      const n = Number(valueText.replace(",", "."));
      if (!Number.isFinite(n)) return;
      item = { field, operator, value: n };
    } else if (isDateKind) {
      if (valueText.trim() === "") return;
      item = { field, operator, value: valueText.trim() };
    } else {
      if (valueText.trim() === "") return;
      item = { field, operator, value: valueText };
    }
    onCommit(replaceFieldItem(filterModel, field, item));
    onOpenChange(false);
  };

  const clearField = () => {
    onCommit(replaceFieldItem(filterModel, field, null));
    onOpenChange(false);
  };

  const valueInputId = "hive-col-filter-val";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {lt("columnFilterDialogTitle", "Filtrar coluna")}: {headerName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label htmlFor="hive-col-filter-op" className="text-sm font-medium leading-none">
              {lt("columnFilterOperatorLabel", "Operador")}
            </label>
            <select
              id="hive-col-filter-op"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={operator}
              onChange={(e) => setOperator(e.target.value as GridFilterOperator)}
            >
              {choices.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {needsValue ? (
            isSingleSelect ? (
              <div className="grid gap-2">
                <span className="text-sm font-medium leading-none">
                  {lt("columnFilterValueLabel", "Valor")}
                </span>
                <Select value={valueText} onValueChange={setValueText}>
                  <SelectTrigger className="h-10" aria-label={lt("columnFilterValueLabel", "Valor")}>
                    <SelectValue placeholder={lt("columnFilterValueLabel", "Valor")} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {normOpts.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : isBoolean ? (
              <div className="grid gap-2">
                <span className="text-sm font-medium leading-none">
                  {lt("columnFilterValueLabel", "Valor")}
                </span>
                <Select value={valueText || "true"} onValueChange={setValueText}>
                  <SelectTrigger className="h-10" aria-label={lt("columnFilterValueLabel", "Valor")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="true">{lt("filterBooleanTrue", "Sim")}</SelectItem>
                    <SelectItem value="false">{lt("filterBooleanFalse", "Não")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <label htmlFor={valueInputId} className="text-sm font-medium leading-none">
                  {lt("columnFilterValueLabel", "Valor")}
                </label>
                <Input
                  id={valueInputId}
                  value={valueText}
                  onChange={(e) => setValueText(e.target.value)}
                  type={isNumber ? "number" : isDateTime ? "datetime-local" : isDate ? "date" : "text"}
                  step={isNumber ? "any" : undefined}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      apply();
                    }
                  }}
                />
              </div>
            )
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={clearField}>
            {lt("columnFilterClearField", "Limpar filtro desta coluna")}
          </Button>
          <Button type="button" onClick={apply}>
            {lt("columnFilterApply", "Aplicar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

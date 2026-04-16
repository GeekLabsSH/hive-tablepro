import * as React from "react";
import type { Header } from "@tanstack/react-table";
import { CheckIcon } from "@heroicons/react/20/solid";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../src/components/ui/button";
import { Checkbox } from "../../../src/components/ui/checkbox";
import { Input } from "../../../src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../../src/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../../../src/components/ui/popover";
import { cn } from "../../../src/lib/utils";
import { TableHead } from "../../../src/components/ui/table";
import { colHasValueOptions, resolveColValueOptions } from "./adapter";
import {
  buildCommittedFilterItem,
  defaultFilterOperatorForCol,
  FILTER_ROW_DUMMY_ROW_ID,
  filterRowValueStateFromItem,
  getFilterOperatorChoices,
  normKeysFromFilterRawValue,
  normalizeValueOptions,
  type NormOpt
} from "./columnFilterShared";
import type {
  GridColDef,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperator,
  GridLocaleText,
  GridValidRowModel
} from "./types";

const META = new Set(["__select__", "__detail__", "__tree__"]);

function upsertFieldFilter<R extends GridValidRowModel>(
  model: GridFilterModel,
  field: string,
  next: Pick<GridFilterItem, "operator" | "value"> | null
): GridFilterModel {
  const rest = (model.items ?? []).filter((i) => i.field !== field);
  if (next == null) {
    return { ...model, items: rest };
  }
  const row: GridFilterItem = {
    id: `hive-hdr-${field}`,
    field,
    operator: next.operator,
    value: next.value
  };
  return { ...model, items: [...rest, row] };
}

export function GridHeaderFilterCells<R extends GridValidRowModel>(props: {
  headers: Header<R, unknown>[];
  columns: GridColDef<R>[];
  filterModel: GridFilterModel;
  onCommit: (next: GridFilterModel) => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
  densityPaddingClass: string;
  /** Cabeçalho virtualizado (grelha em `div`) em vez de `<th>`. */
  useDivCells?: boolean;
}) {
  const { headers, columns, filterModel, onCommit, lt, densityPaddingClass, useDivCells } = props;

  return (
    <>
      {headers.map((header, hci) => {
        const id = String(header.column.id);
        if (META.has(id)) {
          return useDivCells ? (
            <div
              key={id}
              role="presentation"
              className={cn("p-0", densityPaddingClass)}
              style={{ width: header.column.getSize() }}
            />
          ) : (
            <TableHead
              key={id}
              role="presentation"
              className={cn("p-0", densityPaddingClass)}
              style={{ width: header.column.getSize() }}
            />
          );
        }
        const col = columns.find((c) => c.field === id);
        if (!col || col.filterable === false || col.type === "actions" || col.getActions != null) {
          return useDivCells ? (
            <div
              key={id}
              role="presentation"
              className={cn("p-0", densityPaddingClass)}
              style={{ width: header.column.getSize() }}
            />
          ) : (
            <TableHead
              key={id}
              role="presentation"
              className={cn("p-0", densityPaddingClass)}
              style={{ width: header.column.getSize() }}
            />
          );
        }

        return (
          <HeaderFilterCell<R>
            key={id}
            hci={hci}
            field={id}
            col={col}
            width={header.column.getSize()}
            filterModel={filterModel}
            onCommit={onCommit}
            lt={lt}
            densityPaddingClass={densityPaddingClass}
            useDivCells={useDivCells}
          />
        );
      })}
    </>
  );
}

function HeaderFilterCell<R extends GridValidRowModel>({
  field,
  col,
  width,
  filterModel,
  onCommit,
  lt,
  densityPaddingClass,
  hci,
  useDivCells
}: {
  hci: number;
  field: string;
  col: GridColDef<R>;
  width: number;
  filterModel: GridFilterModel;
  onCommit: (next: GridFilterModel) => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
  densityPaddingClass: string;
  useDivCells?: boolean;
}) {
  const item = (filterModel.items ?? []).find((i) => i.field === field);
  const isSingleSelect = col.type === "singleSelect" && colHasValueOptions(col);
  const normOpts: NormOpt[] = React.useMemo(() => {
    if (!isSingleSelect) return [];
    const list = resolveColValueOptions(col, FILTER_ROW_DUMMY_ROW_ID, {} as R);
    return list?.length ? normalizeValueOptions(list) : [];
  }, [isSingleSelect, col]);

  const choices = React.useMemo(() => getFilterOperatorChoices(col, lt), [col, lt]);
  const effectiveOp = item?.operator ?? defaultFilterOperatorForCol(col);
  const needsValue = effectiveOp !== "isEmpty" && effectiveOp !== "isNotEmpty";

  const [valueText, setValueText] = React.useState(() =>
    item?.operator === "inList" || (item && !Array.isArray(item.value))
      ? String(item?.value ?? "")
      : ""
  );

  const [multiSelected, setMultiSelected] = React.useState<string[]>(() =>
    isSingleSelect && (item?.operator === "selectAny" || item?.operator === "selectAll")
      ? normKeysFromFilterRawValue(item?.value, normOpts)
      : []
  );

  const [multiPopoverOpen, setMultiPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (item?.operator === "inList" || (item && item.operator !== "selectAny" && item.operator !== "selectAll")) {
      setValueText(String(item?.value ?? ""));
    } else {
      setValueText("");
    }
  }, [item?.operator, item?.value, field]);

  React.useEffect(() => {
    if (isSingleSelect && (item?.operator === "selectAny" || item?.operator === "selectAll")) {
      setMultiSelected(normKeysFromFilterRawValue(item?.value, normOpts));
    }
  }, [item?.operator, item?.value, isSingleSelect, normOpts]);

  const applyOp = (operator: GridFilterOperator) => {
    const defOp = defaultFilterOperatorForCol(col);
    if (operator === "isEmpty" || operator === "isNotEmpty") {
      onCommit(upsertFieldFilter(filterModel, field, { operator, value: undefined }));
      return;
    }

    let vt = valueText;
    let multi: string[] | undefined =
      isSingleSelect && (operator === "selectAny" || operator === "selectAll") ? multiSelected : undefined;

    if (isSingleSelect && operator === "inList") {
      vt = typeof item?.value === "string" ? item.value : "";
      setValueText(vt);
    }
    if (isSingleSelect && (operator === "selectAny" || operator === "selectAll")) {
      const keys = normKeysFromFilterRawValue(item?.value, normOpts);
      multi = keys;
      setMultiSelected(keys);
    }
    if (isSingleSelect && (operator === "equals" || operator === "!=")) {
      if (item?.operator === "equals" || item?.operator === "!=") {
        vt = filterRowValueStateFromItem({
          item,
          colDef: col,
          normOpts,
          isSingleSelect: true,
          isBoolean: false,
          isDateKind: false,
          isNumber: false,
          isDateTime: false
        });
      } else {
        const keys = normKeysFromFilterRawValue(item?.value, normOpts);
        vt = keys[0] ?? normOpts[0]?.value ?? "";
      }
      setValueText(vt);
    }

    const built = buildCommittedFilterItem({
      colDef: col,
      field,
      operator,
      valueText: vt,
      normOpts,
      multiValues: multi
    });

    if (built) {
      onCommit(upsertFieldFilter(filterModel, field, { operator: built.operator, value: built.value }));
      return;
    }

    if (operator === "contains" || operator === "equals" || operator === "!=") {
      onCommit(upsertFieldFilter(filterModel, field, { operator: defOp, value: undefined }));
    } else {
      onCommit(upsertFieldFilter(filterModel, field, null));
    }
  };

  const commitText = () => {
    const built = buildCommittedFilterItem({
      colDef: col,
      field,
      operator: effectiveOp,
      valueText,
      normOpts,
      multiValues:
        isSingleSelect && (effectiveOp === "selectAny" || effectiveOp === "selectAll")
          ? multiSelected
          : undefined
    });
    if (!built) {
      onCommit(upsertFieldFilter(filterModel, field, null));
      return;
    }
    onCommit(upsertFieldFilter(filterModel, field, { operator: built.operator, value: built.value }));
  };

  const activeOpLabel = choices.find((c) => c.value === effectiveOp)?.label ?? String(effectiveOp);
  const valueControlClass =
    "h-6 w-full min-w-0 border-0 bg-transparent py-0 text-[11px] leading-tight outline-none ring-0 focus-visible:ring-0";

  const multiSummaryLabel =
    multiSelected.length === 0
      ? lt("filterPanelEmpty", "—")
      : multiSelected.length <= 2
        ? multiSelected
            .map((k) => normOpts.find((o) => o.value === k)?.label ?? k)
            .join(", ")
        : `${multiSelected.length} valores`;

  const cellClass = cn(
    useDivCells
      ? "border-b border-hiveGrid-chromeBorder bg-muted/30 p-0 align-middle flex flex-col justify-start"
      : "border-b border-hiveGrid-chromeBorder bg-muted/30 p-0 align-middle",
    hci > 0 && "border-l border-hiveGrid-chromeBorder/80",
    densityPaddingClass
  );
  const cellStyle = { width, minWidth: width, maxWidth: width };

  const filterMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-full min-h-0 shrink-0 rounded-none rounded-r-[calc(0.375rem-1px)] px-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          aria-label={`${lt("columnFilterOperatorLabel", "Operador")}: ${activeOpLabel}`}
          title={activeOpLabel}
        >
          <FunnelIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
        {item ? (
          <DropdownMenuItem onClick={() => onCommit(upsertFieldFilter(filterModel, field, null))}>
            {lt("columnFilterClearField", "Limpar filtro")}
          </DropdownMenuItem>
        ) : null}
        {item ? <DropdownMenuSeparator /> : null}
        {choices.map((c) => (
          <DropdownMenuItem key={c.value} onClick={() => applyOp(c.value)} className="gap-2">
            {effectiveOp === c.value ? (
              <CheckIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <span className="inline-block w-4 shrink-0" aria-hidden />
            )}
            {c.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const inner = (
    <div className="px-0.5 py-0">
      <div className="flex h-7 min-w-0 items-stretch rounded-md border border-input bg-background shadow-sm">
        <div className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden pl-1.5 pr-0.5">
          {!needsValue ? (
            <span className="truncate text-[11px] text-muted-foreground">—</span>
          ) : isSingleSelect && (effectiveOp === "equals" || effectiveOp === "!=") ? (
            <select
              className={cn(valueControlClass, "cursor-pointer")}
              value={
                normOpts.find(
                  (o) => Object.is(o.raw, item?.value) || String(o.raw) === String(item?.value)
                )?.value ??
                valueText ??
                ""
              }
              onChange={(e) => {
                const v = e.target.value;
                setValueText(v);
                const built = buildCommittedFilterItem({
                  colDef: col,
                  field,
                  operator: effectiveOp,
                  valueText: v,
                  normOpts
                });
                if (built) onCommit(upsertFieldFilter(filterModel, field, built));
              }}
              aria-label={lt("columnFilterValueLabel", "Valor")}
            >
              <option value="">{lt("filterPanelEmpty", "—")}</option>
              {normOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : isSingleSelect && effectiveOp === "inList" ? (
            <Input
              className={cn(valueControlClass, "shadow-none")}
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
              onBlur={commitText}
              placeholder="a;b;c"
              aria-label={lt("columnFilterValueLabel", "Valor")}
            />
          ) : isSingleSelect && (effectiveOp === "selectAny" || effectiveOp === "selectAll") ? (
            <Popover
              open={multiPopoverOpen}
              onOpenChange={(o) => {
                setMultiPopoverOpen(o);
                if (!o) {
                  const built = buildCommittedFilterItem({
                    colDef: col,
                    field,
                    operator: effectiveOp,
                    valueText: "",
                    normOpts,
                    multiValues: multiSelected
                  });
                  if (built) {
                    onCommit(upsertFieldFilter(filterModel, field, { operator: built.operator, value: built.value }));
                  }
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-6 min-h-0 w-full max-w-full justify-start truncate px-0 text-left text-[11px] font-normal text-foreground hover:bg-transparent"
                  title={multiSummaryLabel}
                  aria-label={lt("columnFilterValueLabel", "Valor")}
                >
                  {multiSummaryLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 max-h-72 overflow-y-auto p-3">
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                  {normOpts.map((o) => (
                    <label key={o.value} className="flex cursor-pointer items-center gap-2 text-xs" title={o.label}>
                      <Checkbox
                        checked={multiSelected.includes(o.value)}
                        onCheckedChange={(c) => {
                          const on = c === true;
                          const next = on
                            ? [...multiSelected, o.value]
                            : multiSelected.filter((x) => x !== o.value);
                          setMultiSelected(next);
                          const built = buildCommittedFilterItem({
                            colDef: col,
                            field,
                            operator: effectiveOp,
                            valueText: "",
                            normOpts,
                            multiValues: next
                          });
                          if (built) {
                            onCommit(
                              upsertFieldFilter(filterModel, field, { operator: built.operator, value: built.value })
                            );
                          }
                        }}
                      />
                      <span className="min-w-0 truncate">{o.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              className={cn(valueControlClass, "shadow-none")}
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
              onBlur={commitText}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitText();
                }
              }}
              type={col.type === "date" ? "date" : col.type === "dateTime" ? "datetime-local" : "text"}
              aria-label={lt("columnFilterValueLabel", "Valor")}
            />
          )}
        </div>
        <div className="flex shrink-0 items-stretch border-l border-border/50">{filterMenu}</div>
      </div>
    </div>
  );

  if (useDivCells) {
    return (
      <div
        key={field}
        role="columnheader"
        aria-colindex={hci + 1}
        className={cellClass}
        style={cellStyle as any}
      >
        {inner}
      </div>
    );
  }

  return (
    <TableHead
      key={field}
      role="columnheader"
      aria-colindex={hci + 1}
      className={cellClass}
      style={cellStyle as any}
    >
      {inner}
    </TableHead>
  );
}

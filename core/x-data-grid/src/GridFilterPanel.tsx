import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { cn } from "../../../src/lib/utils";
import type { GridFilterPanelSlotProps } from "./dataGridProps";
import { colHasValueOptions, resolveColValueOptions } from "./adapter";
import {
  buildCommittedFilterItem,
  defaultFilterOperatorForCol,
  FILTER_ROW_DUMMY_ROW_ID,
  filterRowValueStateFromItem,
  getFilterOperatorChoices,
  normalizeValueOptions,
  type FilterOpChoice,
  type NormOpt
} from "./columnFilterShared";
import type {
  GridColDef,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperator,
  GridLocaleText,
  GridLogicOperator,
  GridValidRowModel
} from "./types";

function useFilterPanelPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null> | undefined
): { top: number; left: number; width: number } | null {
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!open || typeof window === "undefined") {
      setPos(null);
      return;
    }
    const update = () => {
      const el = anchorRef?.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const w = Math.max(320, Math.min(720, Math.max(r.width, 360)));
        setPos({
          top: r.bottom + 6,
          left: Math.min(r.left, window.innerWidth - w - 8),
          width: w
        });
      } else {
        const w = 420;
        setPos({
          top: 72,
          left: (window.innerWidth - w) / 2,
          width: w
        });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  return pos;
}

const underlineSelectClass =
  "h-9 w-full min-w-0 rounded-none border-0 border-b-2 border-primary/80 bg-transparent px-0 py-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";

function FilterLineEditor<R extends GridValidRowModel>({
  item,
  index,
  columns,
  filterModel,
  onCommit,
  onRemove,
  lt
}: {
  item: GridFilterItem;
  index: number;
  columns: GridColDef<R>[];
  filterModel: GridFilterModel;
  onCommit: (next: GridFilterModel) => void;
  onRemove: () => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
}) {
  const col = columns.find((c) => c.field === item.field);
  const isNumber = col?.type === "number";
  const isBoolean = col?.type === "boolean";
  const isDate = col?.type === "date";
  const isDateTime = col?.type === "dateTime";
  const isDateKind = isDate || isDateTime;
  const isSingleSelect = col?.type === "singleSelect" && col != null && colHasValueOptions(col);

  const normOpts: NormOpt[] = React.useMemo(() => {
    if (!isSingleSelect || !col) return [];
    const list = resolveColValueOptions(col, FILTER_ROW_DUMMY_ROW_ID, {} as R);
    return list?.length ? normalizeValueOptions(list) : [];
  }, [isSingleSelect, col]);

  const choices: FilterOpChoice[] = React.useMemo(() => getFilterOperatorChoices(col, lt), [col, lt]);

  const [operator, setOperator] = React.useState<GridFilterOperator>(item.operator);
  const [valueText, setValueText] = React.useState(() =>
    filterRowValueStateFromItem({
      item,
      colDef: col,
      normOpts,
      isSingleSelect: !!isSingleSelect,
      isBoolean: !!isBoolean,
      isDateKind: !!isDateKind,
      isNumber: !!isNumber,
      isDateTime: !!isDateTime
    })
  );

  React.useEffect(() => {
    setOperator(item.operator);
    setValueText(
      filterRowValueStateFromItem({
        item,
        colDef: col,
        normOpts,
        isSingleSelect: !!isSingleSelect,
        isBoolean: !!isBoolean,
        isDateKind: !!isDateKind,
        isNumber: !!isNumber,
        isDateTime: !!isDateTime
      })
    );
  }, [
    item.field,
    item.operator,
    item.value,
    item.id,
    col,
    normOpts,
    isSingleSelect,
    isBoolean,
    isDateKind,
    isNumber,
    isDateTime
  ]);

  const patchItems = (nextItems: GridFilterItem[]) => {
    onCommit({ ...filterModel, items: nextItems });
  };

  const commitItem = (
    patch: Partial<Pick<GridFilterItem, "field" | "operator" | "value">>
  ) => {
    const items = [...(filterModel.items ?? [])];
    const cur = items[index];
    if (!cur) return;
    const field = patch.field ?? cur.field;
    const cdef = columns.find((c) => c.field === field);
    const op = patch.operator ?? operator;
    const vt =
      patch.value !== undefined
        ? String(patch.value)
        : field === cur.field
          ? valueText
          : filterRowValueStateFromItem({
              item: { ...cur, field, operator: op },
              colDef: cdef,
              normOpts:
                cdef?.type === "singleSelect" && colHasValueOptions(cdef)
                  ? normalizeValueOptions(
                      resolveColValueOptions(cdef, FILTER_ROW_DUMMY_ROW_ID, {} as R) ?? []
                    )
                  : [],
              isSingleSelect: cdef?.type === "singleSelect" && colHasValueOptions(cdef),
              isBoolean: cdef?.type === "boolean",
              isDateKind: cdef?.type === "date" || cdef?.type === "dateTime",
              isNumber: cdef?.type === "number",
              isDateTime: cdef?.type === "dateTime"
            });
    const nNorm =
      cdef?.type === "singleSelect" && colHasValueOptions(cdef)
        ? normalizeValueOptions(resolveColValueOptions(cdef, FILTER_ROW_DUMMY_ROW_ID, {} as R) ?? [])
        : normOpts;
    const built = buildCommittedFilterItem({
      colDef: cdef,
      field,
      operator: op,
      valueText: vt,
      normOpts: nNorm
    });
    if (!built) return;
    items[index] = { ...cur, ...built, id: cur.id };
    patchItems(items);
  };

  const needsValue = operator !== "isEmpty" && operator !== "isNotEmpty";

  const onFieldChange = (field: string) => {
    const cdef = columns.find((c) => c.field === field);
    const defOp = defaultFilterOperatorForCol(cdef);
    setOperator(defOp);
    const nNorm =
      cdef?.type === "singleSelect" && colHasValueOptions(cdef)
        ? normalizeValueOptions(resolveColValueOptions(cdef, FILTER_ROW_DUMMY_ROW_ID, {} as R) ?? [])
        : [];
    let nextVal = "";
    if (cdef?.type === "singleSelect" && nNorm[0]) nextVal = nNorm[0].value;
    else if (cdef?.type === "boolean") nextVal = "true";
    setValueText(nextVal);
    const items = [...(filterModel.items ?? [])];
    const cur = items[index];
    if (!cur) return;
    const built = buildCommittedFilterItem({
      colDef: cdef,
      field,
      operator: defOp,
      valueText: nextVal,
      normOpts: nNorm
    });
    if (!built) {
      items[index] = { ...cur, field, operator: defOp, id: cur.id };
      patchItems(items);
      return;
    }
    items[index] = { ...cur, ...built, id: cur.id };
    patchItems(items);
  };

  return (
    <li className="flex flex-wrap items-end gap-2 border-b border-border/40 py-3 first:pt-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={lt("filterPanelRemove", "Remover")}
        onClick={onRemove}
      >
        ×
      </Button>
      <div className="grid min-w-[7.5rem] flex-1 gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {lt("filterPanelChooseColumn", "Coluna")}
        </span>
        <select
          className={underlineSelectClass}
          value={item.field}
          onChange={(e) => onFieldChange(e.target.value)}
          aria-label={lt("filterPanelChooseColumn", "Coluna")}
        >
          {columns
            .filter((c) => c.filterable !== false && c.type !== "actions" && c.getActions == null)
            .map((c) => (
              <option key={c.field} value={c.field}>
                {c.headerName ?? c.field}
              </option>
            ))}
        </select>
      </div>
      <div className="grid min-w-[6.5rem] flex-1 gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {lt("columnFilterOperatorLabel", "Operador")}
        </span>
        <select
          className={underlineSelectClass}
          value={operator}
          onChange={(e) => {
            const op = e.target.value as GridFilterOperator;
            setOperator(op);
            if (op === "isEmpty" || op === "isNotEmpty") setValueText("");
            commitItem({ operator: op });
          }}
          aria-label={lt("columnFilterOperatorLabel", "Operador")}
        >
          {choices.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid min-w-[7rem] flex-[1.2] gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
          {lt("columnFilterValueLabel", "Valor")}
        </span>
        {!needsValue ? (
          <span className="h-9 py-2 text-sm text-muted-foreground">—</span>
        ) : isSingleSelect ? (
          <select
            className={underlineSelectClass}
            value={valueText}
            onChange={(e) => {
              const v = e.target.value;
              setValueText(v);
              commitItem({ value: v as unknown });
            }}
            aria-label={lt("columnFilterValueLabel", "Valor")}
          >
            {normOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : isBoolean ? (
          <select
            className={underlineSelectClass}
            value={valueText || "true"}
            onChange={(e) => {
              const v = e.target.value;
              setValueText(v);
              commitItem({ value: v === "true" });
            }}
            aria-label={lt("columnFilterValueLabel", "Valor")}
          >
            <option value="true">{lt("filterBooleanTrue", "Sim")}</option>
            <option value="false">{lt("filterBooleanFalse", "Não")}</option>
          </select>
        ) : (
          <Input
            className="h-9 rounded-none border-0 border-b-2 border-primary/80 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
            type={isNumber ? "number" : isDateTime ? "datetime-local" : isDate ? "date" : "text"}
            step={isNumber ? "any" : undefined}
            onBlur={() => commitItem({})}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitItem({});
              }
            }}
            aria-label={lt("columnFilterValueLabel", "Valor")}
          />
        )}
      </div>
    </li>
  );
}

/**
 * Painel predefinido: filtros por coluna em popover ancorado (sem overlay a desfocar a grelha).
 */
export function GridFilterPanel<R extends GridValidRowModel>(props: GridFilterPanelSlotProps<R>) {
  const { open, onOpenChange, filterModel, columns, onCommit, lt, anchorRef } = props;
  const items = filterModel.items ?? [];
  const logic = filterModel.logicOperator ?? "And";
  const pos = useFilterPanelPosition(open, anchorRef);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const filterableFields = React.useMemo(
    () =>
      columns
        .filter((c) => c.filterable !== false && c.type !== "actions" && c.getActions == null)
        .map((c) => c.field),
    [columns]
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (panelRef.current && t instanceof Node && !panelRef.current.contains(t)) {
        const a = anchorRef?.current;
        if (a && t instanceof Node && a.contains(t)) return;
        onOpenChange(false);
      }
    };
    window.setTimeout(() => window.addEventListener("pointerdown", onPointerDown, true), 0);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, onOpenChange, anchorRef]);

  const removeAt = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onCommit({ ...filterModel, items: next });
  };

  const clearAll = () => {
    onCommit({ ...filterModel, items: [] });
  };

  const setLogic = (nextLogic: GridLogicOperator) => {
    onCommit({ ...filterModel, logicOperator: nextLogic });
  };

  const addFilterLine = () => {
    const field = filterableFields[0];
    if (!field) return;
    const cdef = columns.find((c) => c.field === field);
    const op = defaultFilterOperatorForCol(cdef);
    const nNorm =
      cdef?.type === "singleSelect" && cdef && colHasValueOptions(cdef)
        ? normalizeValueOptions(resolveColValueOptions(cdef, FILTER_ROW_DUMMY_ROW_ID, {} as R) ?? [])
        : [];
    let value: unknown = undefined;
    if (op === "isEmpty" || op === "isNotEmpty") {
      value = undefined;
    } else if (cdef?.type === "singleSelect" && nNorm[0]) {
      value = nNorm[0].raw;
    } else if (cdef?.type === "boolean") {
      value = true;
    }
    const built = buildCommittedFilterItem({
      colDef: cdef,
      field,
      operator: op,
      valueText:
        cdef?.type === "singleSelect" && nNorm[0]
          ? nNorm[0].value
          : cdef?.type === "boolean"
            ? "true"
            : "",
      normOpts: nNorm
    });
    const row: GridFilterItem = built
      ? { id: `hive-${Date.now()}`, ...built }
      : { id: `hive-${Date.now()}`, field, operator: op, value };
    onCommit({ ...filterModel, items: [...items, row] });
  };

  if (!open || pos == null || typeof document === "undefined") return null;

  const body = (
    <div
      ref={panelRef}
      role="region"
      aria-label={lt("filterPanelTitle", "Filtros ativos")}
      className={cn(
        "fixed z-[90] flex max-h-[min(85vh,560px)] flex-col rounded-lg border border-border bg-popover text-popover-foreground shadow-lg outline-none"
      )}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width
      }}
    >
      <div className="border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold leading-tight">{lt("filterPanelTitle", "Filtros ativos")}</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {lt(
              "filterPanelEmpty",
              "Nenhum filtro por coluna. Use o menu da coluna (⋮) ou «+ adicionar filtro»."
            )}
          </p>
        ) : (
          <ul className="list-none">
            {items.map((item, index) => (
              <FilterLineEditor<R>
                key={item.id != null ? `f-${String(item.id)}` : `${item.field}-${index}`}
                item={item}
                index={index}
                columns={columns}
                filterModel={filterModel}
                onCommit={onCommit}
                onRemove={() => removeAt(index)}
                lt={lt}
              />
            ))}
          </ul>
        )}

        {items.length > 1 ? (
          <div className="mt-2 grid gap-2 border-t border-border/30 py-3">
            <span className="text-xs font-medium text-muted-foreground">
              {lt("filterPanelLogicLabel", "Combinar filtros com")}
            </span>
            <select
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={lt("filterPanelLogicLabel", "Combinar filtros com")}
              value={logic}
              onChange={(e) => setLogic(e.target.value as typeof logic)}
            >
              <option value="And">{lt("filterPanelLogicAnd", "E (todas as condições)")}</option>
              <option value="Or">{lt("filterPanelLogicOr", "Ou (qualquer condição)")}</option>
            </select>
          </div>
        ) : null}

        {filterableFields.length > 0 ? (
          <Button
            type="button"
            variant="link"
            className="mb-3 h-auto justify-start px-0 py-2 text-xs font-semibold uppercase text-primary"
            onClick={addFilterLine}
          >
            + {lt("filterPanelAddFilter", "Adicionar filtro")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5">
        <Button type="button" variant="outline" size="sm" disabled={items.length === 0} onClick={clearAll}>
          {lt("filterPanelClearAll", "Limpar todos os filtros")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          {lt("filterPanelClose", "Fechar")}
        </Button>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}

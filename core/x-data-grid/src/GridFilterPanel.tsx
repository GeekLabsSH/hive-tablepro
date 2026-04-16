import * as React from "react";
import { createPortal } from "react-dom";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../src/components/ui/button";
import { Checkbox } from "../../../src/components/ui/checkbox";
import { Input } from "../../../src/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../src/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../src/components/ui/tooltip";
import { cn } from "../../../src/lib/utils";
import type { GridFilterPanelSlotProps } from "./dataGridProps";
import { colHasValueOptions, resolveColValueOptions } from "./adapter";
import {
  buildCommittedFilterItem,
  defaultFilterOperatorForCol,
  FILTER_ROW_DUMMY_ROW_ID,
  filterRowValueStateFromItem,
  getFilterOperatorChoices,
  normKeysFromFilterRawValue,
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
import { gridFilterGroupKey, sortFilterItemsByOrder } from "./filterFns";

function resolveModelItemIndex(items: GridFilterItem[], it: GridFilterItem): number {
  if (it.id != null) {
    const byId = items.findIndex((x) => x.id === it.id);
    if (byId >= 0) return byId;
  }
  const byRef = items.indexOf(it);
  return byRef >= 0 ? byRef : 0;
}

function getGroupCombineOperator(sortedGroupItems: GridFilterItem[]): GridLogicOperator {
  if (sortedGroupItems.length <= 1) return "And";
  const rest = sortedGroupItems.slice(1);
  const first = rest[0]?.groupItemLogic ?? "And";
  return rest.every((x) => (x.groupItemLogic ?? "And") === first) ? first : "And";
}

function applyGroupCombineToItems(
  allItems: GridFilterItem[],
  groupKey: string,
  op: GridLogicOperator
): GridFilterItem[] {
  const sorted = sortFilterItemsByOrder(
    allItems.filter((it) => gridFilterGroupKey(it.groupId) === groupKey)
  );
  const next = [...allItems];
  sorted.forEach((sg, rank) => {
    const idx = resolveModelItemIndex(next, sg);
    const cur = next[idx];
    if (!cur) return;
    if (rank === 0) next[idx] = { ...cur, groupItemLogic: undefined };
    else next[idx] = { ...cur, groupItemLogic: op };
  });
  return next;
}

function patchAllGroupIds(
  allItems: GridFilterItem[],
  oldKey: string,
  newGroupId: number | undefined
): GridFilterItem[] {
  return allItems.map((it) => {
    if (gridFilterGroupKey(it.groupId) !== oldKey) return it;
    if (newGroupId === undefined) return { ...it, groupId: undefined, groupItemLogic: undefined };
    return { ...it, groupId: newGroupId };
  });
}

/** Conteúdo em `Portal` (Popover, Select, Menu) — não fechar o painel de filtros ao clicar lá. */
function targetIsInsideRadixPortaledContent(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("[data-radix-popper-content-wrapper]") ||
      target.closest("[data-radix-select-content]") ||
      target.closest("[data-radix-dropdown-menu-content]")
  );
}

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
        const w = Math.max(340, Math.min(780, Math.max(r.width, 440)));
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

const panelSelectClass =
  "h-8 w-full min-w-0 max-w-full cursor-pointer truncate rounded-none border-0 border-b-2 border-primary/80 bg-transparent px-0 py-0.5 text-xs leading-tight text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";

type CommitOpts = {
  valueTextOverride?: string;
  multiOverride?: string[];
};

function FilterLineEditor<R extends GridValidRowModel>({
  item,
  itemModelIndex,
  layout,
  isFirstInSortedGroup,
  columns,
  filterModel,
  onCommit,
  onRemove,
  lt
}: {
  item: GridFilterItem;
  itemModelIndex: number;
  layout: "flat" | "grouped";
  isFirstInSortedGroup: boolean;
  columns: GridColDef<R>[];
  filterModel: GridFilterModel;
  onCommit: (next: GridFilterModel) => void;
  onRemove: () => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
}) {
  const index = itemModelIndex;
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

  const [multiSelected, setMultiSelected] = React.useState<string[]>(() =>
    isSingleSelect && (item.operator === "selectAny" || item.operator === "selectAll")
      ? normKeysFromFilterRawValue(item.value, normOpts)
      : []
  );

  const [multiPopoverOpen, setMultiPopoverOpen] = React.useState(false);

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

  React.useEffect(() => {
    if (isSingleSelect && (item.operator === "selectAny" || item.operator === "selectAll")) {
      setMultiSelected(normKeysFromFilterRawValue(item.value, normOpts));
    }
  }, [item.field, item.operator, item.value, isSingleSelect, normOpts]);

  const patchItems = (nextItems: GridFilterItem[]) => {
    onCommit({ ...filterModel, items: nextItems });
  };

  const commitItem = (
    patch: Partial<Pick<GridFilterItem, "field" | "operator" | "value">>,
    opts?: CommitOpts
  ) => {
    const items = [...(filterModel.items ?? [])];
    const cur = items[index];
    if (!cur) return;
    const field = patch.field ?? cur.field;
    const cdef = columns.find((c) => c.field === field);
    const op = patch.operator ?? operator;
    const colIsSingleSelect =
      cdef?.type === "singleSelect" && cdef != null && colHasValueOptions(cdef);

    const vt =
      opts?.valueTextOverride !== undefined
        ? opts.valueTextOverride
        : patch.value !== undefined
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

    const multiForBuild =
      opts?.multiOverride ??
      (colIsSingleSelect && (op === "selectAny" || op === "selectAll") ? multiSelected : undefined);

    const built = buildCommittedFilterItem({
      colDef: cdef,
      field,
      operator: op,
      valueText: vt,
      normOpts: nNorm,
      multiValues: multiForBuild
    });
    if (!built) return;
    items[index] = {
      ...cur,
      ...built,
      id: cur.id,
      groupId: cur.groupId,
      groupItemLogic: cur.groupItemLogic,
      filterOrder: cur.filterOrder
    };
    patchItems(items);
  };

  const needsValue = operator !== "isEmpty" && operator !== "isNotEmpty";

  const prevItem = index > 0 ? (filterModel.items ?? [])[index - 1] : undefined;
  const showJoinWithPrev =
    layout === "flat" &&
    index > 0 &&
    prevItem != null &&
    gridFilterGroupKey(prevItem.groupId) === gridFilterGroupKey(item.groupId);

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
      items[index] = {
        ...cur,
        field,
        operator: defOp,
        id: cur.id,
        groupId: cur.groupId,
        groupItemLogic: cur.groupItemLogic,
        filterOrder: cur.filterOrder
      };
      patchItems(items);
      return;
    }
    items[index] = {
      ...cur,
      ...built,
      id: cur.id,
      groupId: cur.groupId,
      groupItemLogic: cur.groupItemLogic,
      filterOrder: cur.filterOrder
    };
    patchItems(items);
  };

  const filterableCols = columns.filter(
    (c) => c.filterable !== false && c.type !== "actions" && c.getActions == null
  );
  const selectedColMeta = filterableCols.find((c) => c.field === item.field);
  const columnSelectTitle = selectedColMeta?.headerName ?? selectedColMeta?.field ?? "";
  const operatorSelectTitle = choices.find((c) => c.value === operator)?.label ?? operator;
  const equalsValueTitle = normOpts.find((o) => o.value === valueText)?.label ?? valueText;
  const groupLogicTitle =
    (item.groupItemLogic ?? "And") === "And"
      ? lt("filterPanelLogicAnd", "E (todas as condições)")
      : lt("filterPanelLogicOr", "Ou (qualquer condição)");

  const multiSummaryLabel =
    multiSelected.length === 0
      ? lt("filterPanelEmpty", "—")
      : multiSelected.length <= 2
        ? multiSelected
            .map((k) => normOpts.find((o) => o.value === k)?.label ?? k)
            .join(", ")
        : `${multiSelected.length} valores`;

  const shortAnd = lt("filterPanelLogicShortAnd", "E");
  const shortOr = lt("filterPanelLogicShortOr", "OU");

  return (
    <li
      className={cn(
        "flex flex-wrap items-end gap-1.5 py-2 first:pt-1",
        layout === "grouped" ? "border-b border-border/30 last:border-b-0" : "border-b border-border/40"
      )}
    >
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
      <div className="grid w-11 shrink-0 gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {lt("filterPanelOrder", "Ordem")}
        </span>
        <input
          className="h-8 w-full rounded-md border border-input bg-background px-1.5 text-xs tabular-nums"
          type="number"
          aria-label={lt("filterPanelOrder", "Ordem")}
          value={item.filterOrder === undefined || item.filterOrder === null ? "" : String(item.filterOrder)}
          onChange={(e) => {
            const raw = e.target.value.trim();
            const items = [...(filterModel.items ?? [])];
            const curIt = items[index];
            if (!curIt) return;
            if (raw === "") {
              items[index] = { ...curIt, filterOrder: undefined };
            } else {
              const n = Number(raw);
              if (!Number.isFinite(n)) return;
              items[index] = { ...curIt, filterOrder: n };
            }
            patchItems(items);
          }}
          placeholder="—"
        />
      </div>
      {layout === "grouped" ? (
        !isFirstInSortedGroup ? (
          <div className="grid w-[3.5rem] shrink-0 gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {lt("filterPanelLineJoinLabel", "E / OU")}
            </span>
            <select
              className={cn(panelSelectClass, "text-center")}
              title={groupLogicTitle}
              value={item.groupItemLogic ?? "And"}
              onChange={(e) => {
                const gl = e.target.value as GridLogicOperator;
                const items = [...(filterModel.items ?? [])];
                const curIt = items[index];
                if (!curIt) return;
                items[index] = { ...curIt, groupItemLogic: gl };
                patchItems(items);
              }}
              aria-label={lt("filterPanelLineJoinLabel", "E / OU")}
            >
              <option value="And">{shortAnd}</option>
              <option value="Or">{shortOr}</option>
            </select>
          </div>
        ) : (
          <div className="w-[3.5rem] shrink-0" aria-hidden />
        )
      ) : null}
      <div className="grid min-w-[7rem] flex-1 gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {lt("filterPanelChooseColumn", "Coluna")}
        </span>
        <select
          className={panelSelectClass}
          title={columnSelectTitle}
          value={item.field}
          onChange={(e) => onFieldChange(e.target.value)}
          aria-label={lt("filterPanelChooseColumn", "Coluna")}
        >
          {filterableCols.map((c) => (
            <option key={c.field} value={c.field}>
              {c.headerName ?? c.field}
            </option>
          ))}
        </select>
      </div>
      <div className="grid min-w-[6rem] flex-1 gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {lt("columnFilterOperatorLabel", "Operador")}
        </span>
        <select
          className={panelSelectClass}
          title={operatorSelectTitle}
          value={operator}
          onChange={(e) => {
            const op = e.target.value as GridFilterOperator;
            const curRow = (filterModel.items ?? [])[index];
            if (!curRow) return;
            setOperator(op);
            if (op === "isEmpty" || op === "isNotEmpty") setValueText("");
            if (isSingleSelect && op === "inList") {
              const v = typeof curRow.value === "string" ? curRow.value : "";
              setValueText(v);
              commitItem({ operator: op }, { valueTextOverride: v });
              return;
            }
            if (isSingleSelect && (op === "selectAny" || op === "selectAll")) {
              const keys = normKeysFromFilterRawValue(curRow.value, normOpts);
              setMultiSelected(keys);
              commitItem({ operator: op }, { multiOverride: keys });
              return;
            }
            if (isSingleSelect && (op === "equals" || op === "!=")) {
              let nextVt = valueText;
              if (curRow.operator === "equals" || curRow.operator === "!=") {
                nextVt = filterRowValueStateFromItem({
                  item: curRow,
                  colDef: col,
                  normOpts,
                  isSingleSelect: true,
                  isBoolean: false,
                  isDateKind: false,
                  isNumber: false,
                  isDateTime: false
                });
              } else {
                const keys = normKeysFromFilterRawValue(curRow.value, normOpts);
                nextVt = keys[0] ?? normOpts[0]?.value ?? "";
              }
              setValueText(nextVt);
              commitItem({ operator: op }, { valueTextOverride: nextVt });
              return;
            }
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
      <div className="grid min-w-[6.5rem] flex-[1.2] gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
          {lt("columnFilterValueLabel", "Valor")}
        </span>
        {!needsValue ? (
          <span className="h-8 py-1.5 text-xs text-muted-foreground">—</span>
        ) : isSingleSelect ? (
          operator === "equals" || operator === "!=" ? (
            <select
              className={panelSelectClass}
              title={equalsValueTitle}
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
          ) : operator === "inList" ? (
            <Input
              className="h-8 rounded-none border-0 border-b-2 border-primary/80 px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={valueText}
              title={valueText}
              placeholder="a;b;c"
              onChange={(e) => setValueText(e.target.value)}
              onBlur={() => commitItem({})}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitItem({});
                }
              }}
              aria-label={lt("columnFilterValueLabel", "Valor")}
            />
          ) : operator === "selectAny" || operator === "selectAll" ? (
            <Popover
              open={multiPopoverOpen}
              onOpenChange={(o) => {
                setMultiPopoverOpen(o);
                if (!o) commitItem({}, { multiOverride: multiSelected });
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 w-full min-w-0 max-w-full justify-start truncate px-1 text-left text-xs font-normal"
                  title={multiSummaryLabel}
                  aria-label={lt("columnFilterValueLabel", "Valor")}
                >
                  {multiSummaryLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 max-h-72 overflow-y-auto p-3">
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                  {normOpts.map((o) => (
                    <label
                      key={o.value}
                      className="flex cursor-pointer items-center gap-2 text-xs"
                      title={o.label}
                    >
                      <Checkbox
                        checked={multiSelected.includes(o.value)}
                        onCheckedChange={(c) => {
                          const on = c === true;
                          const next = on
                            ? [...multiSelected, o.value]
                            : multiSelected.filter((x) => x !== o.value);
                          setMultiSelected(next);
                          commitItem({}, { multiOverride: next });
                        }}
                      />
                      <span className="min-w-0 truncate">{o.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="h-8 py-1.5 text-xs text-muted-foreground">—</span>
          )
        ) : isBoolean ? (
          <select
            className={panelSelectClass}
            title={valueText === "true" ? lt("filterBooleanTrue", "Sim") : lt("filterBooleanFalse", "Não")}
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
            className="h-8 rounded-none border-0 border-b-2 border-primary/80 px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={valueText}
            title={valueText}
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
      {layout === "flat" ? (
        <div className="flex w-full min-w-0 flex-wrap items-end gap-1.5 border-t border-border/20 pt-1.5">
          <div className="grid w-[5.25rem] shrink-0 gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {lt("filterPanelGroupId", "Grupo")}
            </span>
            <input
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              type="number"
              aria-label={lt("filterPanelGroupId", "Grupo")}
              value={item.groupId === undefined || item.groupId === null ? "" : String(item.groupId)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const items = [...(filterModel.items ?? [])];
                const curIt = items[index];
                if (!curIt) return;
                if (raw === "") {
                  items[index] = { ...curIt, groupId: undefined, groupItemLogic: undefined };
                } else {
                  const n = Number(raw);
                  if (!Number.isFinite(n)) return;
                  items[index] = { ...curIt, groupId: n };
                }
                patchItems(items);
              }}
              placeholder="—"
            />
          </div>
          {showJoinWithPrev ? (
            <div className="grid min-w-[6.5rem] flex-1 gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {lt("filterPanelGroupItemLogic", "Com linha anterior")}
              </span>
              <select
                className={panelSelectClass}
                title={groupLogicTitle}
                value={item.groupItemLogic ?? "And"}
                onChange={(e) => {
                  const gl = e.target.value as GridLogicOperator;
                  const items = [...(filterModel.items ?? [])];
                  const curIt = items[index];
                  if (!curIt) return;
                  items[index] = { ...curIt, groupItemLogic: gl };
                  patchItems(items);
                }}
                aria-label={lt("filterPanelGroupItemLogic", "Com linha anterior")}
              >
                <option value="And">{lt("filterPanelLogicAnd", "E (todas as condições)")}</option>
                <option value="Or">{lt("filterPanelLogicOr", "Ou (qualquer condição)")}</option>
              </select>
            </div>
          ) : null}
        </div>
      ) : null}
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
      if (targetIsInsideRadixPortaledContent(t)) return;
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
    onCommit({ ...filterModel, items: [], quickFilterValues: [] });
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
    const maxOrd = items.reduce((m, it) => {
      const fo = it.filterOrder;
      return typeof fo === "number" && Number.isFinite(fo) ? Math.max(m, fo) : m;
    }, 0);
    const row: GridFilterItem = built
      ? { id: `hive-${Date.now()}`, ...built, filterOrder: maxOrd + 1 }
      : { id: `hive-${Date.now()}`, field, operator: op, value, filterOrder: maxOrd + 1 };
    onCommit({ ...filterModel, items: [...items, row] });
  };

  if (!open || pos == null || typeof document === "undefined") return null;

  const usesGroups = items.some((i) => i.groupId !== undefined && i.groupId !== null);
  const groupLogicVal = filterModel.groupLogicOperator ?? "And";

  const body = (
    <div
      ref={panelRef}
      role="region"
      aria-label={lt("filterPanelTitle", "Filtros ativos")}
      className={cn(
        "fixed z-[90] box-border flex max-h-[600px] flex-col overflow-hidden rounded-lg border border-border bg-popover p-[5px] text-popover-foreground shadow-lg outline-none"
      )}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: 600
      }}
    >
      <div className="shrink-0 border-b border-border/60 px-1 py-2">
        <h2 className="text-sm font-semibold leading-tight">{lt("filterPanelTitle", "Filtros ativos")}</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {lt(
              "filterPanelEmpty",
              "Nenhum filtro por coluna. Use o menu da coluna (⋮) ou «+ adicionar filtro»."
            )}
          </p>
        ) : usesGroups ? (
          <div className="flex flex-col gap-3 py-1">
            {(() => {
              const sortedAll = sortFilterItemsByOrder(items).map((it) => ({
                item: it,
                modelIndex: resolveModelItemIndex(items, it)
              }));
              const groupKeysOrder: string[] = [];
              const seenGk = new Set<string>();
              for (const e of sortedAll) {
                const k = gridFilterGroupKey(e.item.groupId);
                if (!seenGk.has(k)) {
                  seenGk.add(k);
                  groupKeysOrder.push(k);
                }
              }
              const shortAndG = lt("filterPanelLogicShortAnd", "E");
              const shortOrG = lt("filterPanelLogicShortOr", "OU");
              const groupJoinTitleL =
                groupLogicVal === "And"
                  ? lt("filterPanelLogicAnd", "E (todas as condições)")
                  : lt("filterPanelLogicOr", "Ou (qualquer condição)");

              return groupKeysOrder.map((gk, gi) => {
                const entries = sortedAll.filter((e) => gridFilterGroupKey(e.item.groupId) === gk);
                const groupItemsOnly = entries.map((e) => e.item);
                const combineVal = getGroupCombineOperator(groupItemsOnly);
                const combineTitle =
                  combineVal === "And"
                    ? lt("filterPanelLogicAnd", "E (todas as condições)")
                    : lt("filterPanelLogicOr", "Ou (qualquer condição)");
                const headerGroupId = entries[0]?.item.groupId;
                const groupTitle =
                  gk === "__flat__"
                    ? lt("filterPanelUngroupedBlock", "Sem grupo")
                    : `${lt("filterPanelGroupId", "Grupo")} ${headerGroupId === undefined || headerGroupId === null ? "" : String(headerGroupId)}`;

                return (
                  <React.Fragment key={`blk-${gk}`}>
                    {gi === 1 && groupKeysOrder.length >= 2 ? (
                      <div className="rounded-md border border-dashed border-primary/30 bg-muted/10 px-2 py-2">
                        <div className="grid max-w-md gap-1">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {lt("filterPanelGroupBetweenLabel", "Entre grupos")}
                          </span>
                          <select
                            className={panelSelectClass}
                            title={groupJoinTitleL}
                            aria-label={lt("filterPanelGroupBetweenLabel", "Entre grupos")}
                            value={groupLogicVal}
                            onChange={(e) =>
                              onCommit({
                                ...filterModel,
                                groupLogicOperator: e.target.value as GridLogicOperator
                              })
                            }
                          >
                            <option value="And">{lt("filterPanelLogicAnd", "E (todas as condições)")}</option>
                            <option value="Or">{lt("filterPanelLogicOr", "Ou (qualquer condição)")}</option>
                          </select>
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5 shadow-sm">
                      <div className="mb-2 flex flex-wrap items-end gap-3 border-b border-border/50 pb-2">
                        <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                          {groupTitle}
                        </span>
                        <div className="grid w-[5.25rem] shrink-0 gap-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {lt("filterPanelGroupId", "Grupo")}
                          </span>
                          <input
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                            type="number"
                            aria-label={lt("filterPanelGroupId", "Grupo")}
                            title={
                              gk === "__flat__"
                                ? lt("filterPanelUngroupedAssignHint", "Defina o número para criar / juntar a um grupo")
                                : undefined
                            }
                            value={headerGroupId === undefined || headerGroupId === null ? "" : String(headerGroupId)}
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              if (raw === "") {
                                onCommit({ ...filterModel, items: patchAllGroupIds(items, gk, undefined) });
                                return;
                              }
                              const n = Number(raw);
                              if (!Number.isFinite(n)) return;
                              onCommit({ ...filterModel, items: patchAllGroupIds(items, gk, n) });
                            }}
                            placeholder={gk === "__flat__" ? "ex.: 2" : "—"}
                          />
                        </div>
                        {entries.length >= 2 ? (
                          <div className="grid min-w-[5rem] shrink-0 gap-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {lt("filterPanelGroupCombineLabel", "E / OU no grupo")}
                            </span>
                            <select
                              className={cn(panelSelectClass, "min-w-[5rem]")}
                              title={combineTitle}
                              value={combineVal}
                              onChange={(e) =>
                                onCommit({
                                  ...filterModel,
                                  items: applyGroupCombineToItems(items, gk, e.target.value as GridLogicOperator)
                                })
                              }
                              aria-label={lt("filterPanelGroupCombineLabel", "E / OU no grupo")}
                            >
                              <option value="And">{shortAndG}</option>
                              <option value="Or">{shortOrG}</option>
                            </select>
                          </div>
                        ) : null}
                      </div>
                      <ul className="list-none">
                        {entries.map((e, rank) => (
                          <FilterLineEditor<R>
                            key={e.item.id != null ? `f-${String(e.item.id)}` : `f-${gk}-${rank}`}
                            item={e.item}
                            itemModelIndex={e.modelIndex}
                            layout="grouped"
                            isFirstInSortedGroup={rank === 0}
                            columns={columns}
                            filterModel={filterModel}
                            onCommit={onCommit}
                            onRemove={() => removeAt(e.modelIndex)}
                            lt={lt}
                          />
                        ))}
                      </ul>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>
        ) : (
          <ul className="list-none">
            {sortFilterItemsByOrder(items).map((item, sortedIdx) => {
              const index = resolveModelItemIndex(items, item);
              const showFlatJoin = sortedIdx > 0;

              const flatJoinTitle =
                (item.joinWithPrevious ?? logic) === "And"
                  ? lt("filterPanelLogicAnd", "E (todas as condições)")
                  : lt("filterPanelLogicOr", "Ou (qualquer condição)");

              return (
                <React.Fragment key={item.id != null ? `f-${String(item.id)}` : `${item.field}-${index}`}>
                  {showFlatJoin ? (
                    <li className="list-none border-b border-dashed border-border/50 py-2 pl-6">
                      <div className="grid max-w-md gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {lt("filterPanelLogicLabel", "Combinar filtros com")}
                        </span>
                        <select
                          className={panelSelectClass}
                          title={flatJoinTitle}
                          aria-label={lt("filterPanelLogicLabel", "Combinar filtros com")}
                          value={item.joinWithPrevious ?? logic}
                          onChange={(e) => {
                            const gl = e.target.value as GridLogicOperator;
                            const nextItems = items.map((it, i) =>
                              i === index ? { ...it, joinWithPrevious: gl } : it
                            );
                            onCommit({ ...filterModel, items: nextItems });
                          }}
                        >
                          <option value="And">{lt("filterPanelLogicAnd", "E (todas as condições)")}</option>
                          <option value="Or">{lt("filterPanelLogicOr", "Ou (qualquer condição)")}</option>
                        </select>
                      </div>
                    </li>
                  ) : null}
                  <FilterLineEditor<R>
                    item={item}
                    itemModelIndex={index}
                    layout="flat"
                    isFirstInSortedGroup
                    columns={columns}
                    filterModel={filterModel}
                    onCommit={onCommit}
                    onRemove={() => removeAt(index)}
                    lt={lt}
                  />
                </React.Fragment>
              );
            })}
          </ul>
        )}

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

      <TooltipProvider delayDuration={400}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border/60 px-1 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={items.length === 0}
                onClick={clearAll}
                aria-label={lt("filterPanelClearAll", "Limpar todos os filtros")}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{lt("filterPanelClearAll", "Limpar todos os filtros")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onOpenChange(false)}
                aria-label={lt("filterPanelClose", "Fechar")}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{lt("filterPanelClose", "Fechar")}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );

  return createPortal(body, document.body);
}

import * as React from "react";
import { createPortal } from "react-dom";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../src/components/ui/button";
import { Checkbox } from "../../../src/components/ui/checkbox";
import { Input } from "../../../src/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../src/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../src/components/ui/tooltip";
import { cn } from "../../../src/lib/utils";
import type { GridFilterPanelSlotProps } from "./dataGridProps";
import { colHasValueOptions, colHasFilterableSingleSelect, resolveColValueOptions } from "./adapter";
import {
  buildCommittedFilterItem,
  collectRemoteSingleSelectRawKeysFromFilterItem,
  defaultFilterOperatorForCol,
  FILTER_ROW_DUMMY_ROW_ID,
  filterRowValueStateFromItem,
  getFilterOperatorChoices,
  rawKeysFromFilterMultiValue,
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
  GridValidRowModel,
  GridValueOptionsList
} from "./types";
import { gridFilterGroupKey, isHiveFilterHeaderGroupKey, sortFilterItemsByOrder } from "./filterFns";
import { ASYNC_REMOTE_FILTER_SEARCH_DEBOUNCE_MS } from "./constants";

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

/**
 * Clique fora do `panelRef` mas dentro destes nós não deve fechar «Filtros ativos»:
 * portais Radix e lista assíncrona (`createPortal` → body) do valor = / !=.
 */
function targetIsInsideRadixPortaledContent(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("[data-hive-filter-async-select-list]") ||
      target.closest("[data-hive-filter-async-multi-list]") ||
      target.closest("[data-radix-popper-content-wrapper]") ||
      target.closest("[data-radix-select-content]") ||
      target.closest("[data-radix-dropdown-menu-content]")
  );
}

function isRemoteFilterSingleSelectColumn<R extends GridValidRowModel>(c: GridColDef<R> | undefined): boolean {
  return Boolean(
    c &&
    c.type === "singleSelect" &&
    typeof c.loadEditValueOptions === "function" &&
    !colHasValueOptions(c)
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

/** Valor sentinela para `Select` Radix quando ainda não há opção escolhida (evita `value=""`). */
const FILTER_VALUE_PLACEHOLDER = "__hive_filter_ph__";

/** Select estilo painel (Radix): lista com `popover` / tema escuro; evita `<select><option>` nativo (OS claro). */
function FilterPanelSelect({
  value,
  onValueChange,
  title,
  ariaLabel,
  options,
  triggerClassName
}: {
  value: string;
  onValueChange: (next: string) => void;
  title?: string;
  ariaLabel?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  triggerClassName?: string;
}) {
  const resolved = React.useMemo(() => {
    if (options.some((o) => o.value === value)) return value;
    const first = options.find((o) => !o.disabled);
    return first?.value ?? options[0]?.value ?? value;
  }, [value, options]);

  if (options.length === 0) return null;

  return (
    <Select value={resolved} onValueChange={onValueChange}>
      <SelectTrigger
        type="button"
        title={title}
        aria-label={ariaLabel}
        className={cn(
          "h-8 w-full min-w-0 max-w-full justify-between gap-1 overflow-hidden rounded-none border-0 border-b-2 border-primary/80 bg-transparent px-0 py-0.5 text-xs leading-tight text-foreground shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:shrink-0 [&>svg]:opacity-70 [&>span]:min-w-0 [&>span]:max-w-[calc(100%-0.75rem)] [&>span]:truncate",
          triggerClassName
        )}
      >
        <SelectValue className="truncate text-left" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="min-w-[var(--radix-select-trigger-width)] border bg-popover text-popover-foreground"
        style={{ zIndex: 10120 }}
      >
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
            textValue={o.label}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * `singleSelect` assíncrono com operador = / !=: campo de pesquisa + lista rolável (como o editor),
 * sem depender do `Select` Radix (opções dinâmicas + viewport).
 */
function AsyncRemoteSingleSelectValueEditor({
  valueText,
  setValueText,
  commitItem,
  remoteSelectQuery,
  setRemoteSelectQuery,
  remoteNormOpts,
  remoteLoading,
  onSearchInteraction,
  onSearchBlur,
  lt
}: {
  valueText: string;
  setValueText: (s: string) => void;
  commitItem: (patch: Partial<GridFilterItem>) => void;
  remoteSelectQuery: string;
  setRemoteSelectQuery: (s: string) => void;
  remoteNormOpts: NormOpt[];
  remoteLoading: boolean;
  /** Pesquisa manual: não sobrescrever o texto com o rótulo do valor gravado até novo commit. */
  onSearchInteraction?: () => void;
  /** Ao sair do campo: recebe o texto atual; se vazio, não repor o rótulo (permite limpar para pesquisar). */
  onSearchBlur?: (queryTrimmed: string) => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
}) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const listPortalRef = React.useRef<HTMLDivElement>(null);
  const [listBox, setListBox] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const updateListPosition = React.useCallback(() => {
    const el = anchorRef.current;
    if (!el || typeof window === "undefined") {
      setListBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - r.bottom - gap - 8;
    const maxH = Math.min(208, Math.max(120, spaceBelow));
    setListBox({
      top: r.bottom + gap,
      left: r.left,
      width: Math.max(r.width, 200),
      maxHeight: maxH
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      setListBox(null);
      return;
    }
    updateListPosition();
    window.addEventListener("scroll", updateListPosition, true);
    window.addEventListener("resize", updateListPosition);
    return () => {
      window.removeEventListener("scroll", updateListPosition, true);
      window.removeEventListener("resize", updateListPosition);
    };
  }, [open, updateListPosition, remoteNormOpts.length, remoteLoading, remoteSelectQuery]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (wrapRef.current?.contains(t)) return;
      if (listPortalRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const asyncQueryTrimmed = remoteSelectQuery.trim();
  const listBody =
    asyncQueryTrimmed === "" ? (
      <div className="px-2 py-1.5 text-muted-foreground">
        {lt("filterPanelAsyncSelectIdleHint", "Digite para pesquisar…")}
      </div>
    ) : remoteLoading && remoteNormOpts.length === 0 ? (
      <div className="px-2 py-1.5 text-muted-foreground">
        {lt("filterPanelAsyncSelectLoading", "A carregar…")}
      </div>
    ) : remoteNormOpts.length === 0 ? (
      <div className="px-2 py-1.5 text-muted-foreground">
        {lt("filterPanelAsyncSelectEmpty", "— sem resultados —")}
      </div>
    ) : (
      remoteNormOpts.map((o) => (
        <button
          key={o.value}
          type="button"
          role="option"
          aria-selected={valueText === o.value}
          className={cn(
            "flex w-full cursor-default items-center px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground",
            valueText === o.value && "bg-accent/50"
          )}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setValueText(o.value);
            setRemoteSelectQuery(o.label);
            commitItem({ value: o.raw as unknown });
            setOpen(false);
          }}
        >
          {o.label}
        </button>
      ))
    );

  return (
    <div ref={wrapRef} className="flex w-full min-w-0 flex-col gap-1">
      <div ref={anchorRef} className="relative min-w-0 w-full">
        <Input
          className="h-8 w-full min-w-0 text-xs"
          value={remoteSelectQuery}
          onChange={(e) => {
            onSearchInteraction?.();
            setRemoteSelectQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            onSearchInteraction?.();
            setOpen(true);
          }}
          onBlur={() => {
            onSearchBlur?.(remoteSelectQuery.trim());
          }}
          placeholder={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
          aria-label={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
          aria-expanded={open}
          aria-controls="hive-filter-async-select-listbox"
        />
      </div>
      {open && listBox != null && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={listPortalRef}
              id="hive-filter-async-select-listbox"
              data-hive-filter-async-select-list=""
              role="listbox"
              className="hive-filter-async-remote-list fixed overflow-y-auto rounded-md border border-border bg-popover py-1 text-xs text-popover-foreground shadow-md outline-none"
              style={{
                top: listBox.top,
                left: listBox.left,
                width: listBox.width,
                maxHeight: listBox.maxHeight,
                zIndex: 10120
              }}
            >
              {listBody}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

type CommitOpts = {
  valueTextOverride?: string;
  multiOverride?: string[];
};

/** Linha 1 do filtro em modo agrupado (badge + n.º do grupo + E/OU no grupo), por linha do modelo. */
type GroupedFilterLineUi = {
  lineRank: number;
  isHiveHeaderGroup: boolean;
  groupId: number | string | undefined | null;
  groupIdPlaceholder: string;
  groupIdInputTitle?: string;
  onGroupIdChange: (raw: string) => void;
  showGroupCombine: boolean;
  groupCombineValue: GridLogicOperator;
  onGroupCombineChange: (op: GridLogicOperator) => void;
  combineTitle: string;
  combineAria: string;
  shortAnd: string;
  shortOr: string;
};

function FilterLineEditor<R extends GridValidRowModel>({
  item,
  itemModelIndex,
  layout,
  columns,
  filterModel,
  onCommit,
  onRemove,
  lt,
  panelLabelExtras,
  groupedUi
}: {
  item: GridFilterItem;
  itemModelIndex: number;
  layout: "flat" | "grouped";
  columns: GridColDef<R>[];
  filterModel: GridFilterModel;
  onCommit: (next: GridFilterModel) => void;
  onRemove: () => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
  /** Opções fundidas ao abrir o painel (pesquisa vazia + ids do modelo) para mostrar rótulos sem perder seleção. */
  panelLabelExtras?: NormOpt[];
  groupedUi?: GroupedFilterLineUi;
}) {
  const index = itemModelIndex;
  const col = columns.find((c) => c.field === item.field);
  const isNumber = col?.type === "number";
  const isBoolean = col?.type === "boolean";
  const isDate = col?.type === "date";
  const isDateTime = col?.type === "dateTime";
  const isDateKind = isDate || isDateTime;
  const isRemoteSingleSelect =
    col?.type === "singleSelect" &&
    col != null &&
    col.loadEditValueOptions != null &&
    !colHasValueOptions(col);
  const isSingleSelect = col?.type === "singleSelect" && col != null && colHasFilterableSingleSelect(col);

  /** Evita dependências em `col` (novo objecto por render) que cancelavam o debounce antes do fetch. */
  const colLoadEditValueOptionsRef = React.useRef(col?.loadEditValueOptions);
  const colFieldRef = React.useRef(col?.field ?? item.field);
  colLoadEditValueOptionsRef.current = col?.loadEditValueOptions;
  colFieldRef.current = col?.field ?? item.field;

  const [operator, setOperator] = React.useState<GridFilterOperator>(item.operator);
  const [valueText, setValueText] = React.useState("");
  const [multiSelected, setMultiSelected] = React.useState<string[]>([]);
  const [multiPopoverOpen, setMultiPopoverOpen] = React.useState(false);

  const [remoteSelectQuery, setRemoteSelectQuery] = React.useState("");
  const [remoteNormOptsEquals, setRemoteNormOptsEquals] = React.useState<NormOpt[]>([]);
  const [remoteSelectLoadingEquals, setRemoteSelectLoadingEquals] = React.useState(false);
  const remoteFetchEqualsSerialRef = React.useRef(0);

  const [multiSearchQuery, setMultiSearchQuery] = React.useState("");
  const [remoteNormOptsMulti, setRemoteNormOptsMulti] = React.useState<NormOpt[]>([]);
  const [remoteSelectLoadingMulti, setRemoteSelectLoadingMulti] = React.useState(false);
  const remoteFetchMultiSerialRef = React.useRef(0);
  const multiPickedCacheRef = React.useRef<Map<string, NormOpt>>(new Map());
  const [multiPickedVersion, setMultiPickedVersion] = React.useState(0);

  React.useEffect(() => {
    if (!panelLabelExtras?.length) return;
    let bumped = false;
    for (const o of panelLabelExtras) {
      const v = o.value;
      if (!multiPickedCacheRef.current.has(v)) {
        multiPickedCacheRef.current.set(v, o);
        bumped = true;
      }
      const rawK = String(o.raw);
      if (rawK !== v && !multiPickedCacheRef.current.has(rawK)) {
        multiPickedCacheRef.current.set(rawK, o);
        bumped = true;
      }
    }
    if (bumped) setMultiPickedVersion((x) => x + 1);
  }, [panelLabelExtras]);

  const [bootstrapOpt, setBootstrapOpt] = React.useState<NormOpt | null>(null);
  const [asyncSearchTouched, setAsyncSearchTouched] = React.useState(false);

  const equalsRemoteActive =
    isRemoteSingleSelect && (operator === "equals" || operator === "!=");
  const multiRemoteActive =
    isRemoteSingleSelect && (operator === "selectAny" || operator === "selectAll");

  React.useEffect(() => {
    if (!equalsRemoteActive) {
      setRemoteNormOptsEquals([]);
      setRemoteSelectLoadingEquals(false);
      return;
    }
    const loadOpts = colLoadEditValueOptionsRef.current;
    const field = colFieldRef.current;
    if (loadOpts == null || field == null || field === "") {
      setRemoteNormOptsEquals([]);
      setRemoteSelectLoadingEquals(false);
      return;
    }
    const q = remoteSelectQuery.trim();
    if (q === "") {
      setRemoteNormOptsEquals([]);
      setRemoteSelectLoadingEquals(false);
      return;
    }
    let cancelled = false;
    const serial = ++remoteFetchEqualsSerialRef.current;
    setRemoteSelectLoadingEquals(true);
    const t = window.setTimeout(() => {
      void loadOpts(remoteSelectQuery, {
        id: FILTER_ROW_DUMMY_ROW_ID,
        row: {} as R,
        field
      })
        .then((raw) => {
          if (cancelled || serial !== remoteFetchEqualsSerialRef.current) return;
          setRemoteNormOptsEquals(normalizeValueOptions(raw ?? []));
        })
        .catch(() => {
          if (cancelled || serial !== remoteFetchEqualsSerialRef.current) return;
          setRemoteNormOptsEquals([]);
        })
        .finally(() => {
          if (cancelled) return;
          if (serial === remoteFetchEqualsSerialRef.current) {
            setRemoteSelectLoadingEquals(false);
          }
        });
    }, ASYNC_REMOTE_FILTER_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setRemoteSelectLoadingEquals(false);
    };
  }, [equalsRemoteActive, item.field, remoteSelectQuery]);

  React.useEffect(() => {
    if (!multiRemoteActive) {
      setRemoteNormOptsMulti([]);
      setRemoteSelectLoadingMulti(false);
      return;
    }
    const loadOpts = colLoadEditValueOptionsRef.current;
    const field = colFieldRef.current;
    if (loadOpts == null || field == null || field === "") {
      setRemoteNormOptsMulti([]);
      setRemoteSelectLoadingMulti(false);
      return;
    }
    const q = multiSearchQuery.trim();
    if (q === "") {
      setRemoteNormOptsMulti([]);
      setRemoteSelectLoadingMulti(false);
      return;
    }
    let cancelled = false;
    const serial = ++remoteFetchMultiSerialRef.current;
    setRemoteSelectLoadingMulti(true);
    const t = window.setTimeout(() => {
      void loadOpts(multiSearchQuery, {
        id: FILTER_ROW_DUMMY_ROW_ID,
        row: {} as R,
        field
      })
        .then((raw) => {
          if (cancelled || serial !== remoteFetchMultiSerialRef.current) return;
          setRemoteNormOptsMulti(normalizeValueOptions(raw ?? []));
        })
        .catch(() => {
          if (cancelled || serial !== remoteFetchMultiSerialRef.current) return;
          setRemoteNormOptsMulti([]);
        })
        .finally(() => {
          if (cancelled) return;
          if (serial === remoteFetchMultiSerialRef.current) {
            setRemoteSelectLoadingMulti(false);
          }
        });
    }, ASYNC_REMOTE_FILTER_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setRemoteSelectLoadingMulti(false);
    };
  }, [multiRemoteActive, item.field, multiSearchQuery]);

  React.useEffect(() => {
    setBootstrapOpt(null);
  }, [item.field, item.value, operator]);

  React.useEffect(() => {
    if (!equalsRemoteActive) return;
    const loadOpts = colLoadEditValueOptionsRef.current;
    const field = colFieldRef.current;
    if (loadOpts == null || field == null || field === "") return;
    const v = item.value;
    if (v === undefined || v === null || v === "") return;
    let cancelled = false;
    const pick = (rawList: GridValueOptionsList | undefined) => {
      const opts = normalizeValueOptions(rawList ?? []);
      return opts.find(
        (o) => Object.is(o.raw, v) || String(o.raw) === String(v) || o.value === String(v)
      );
    };
    void Promise.all([
      loadOpts(String(v), {
        id: FILTER_ROW_DUMMY_ROW_ID,
        row: {} as R,
        field
      }),
      loadOpts("", {
        id: FILTER_ROW_DUMMY_ROW_ID,
        row: {} as R,
        field
      })
    ])
      .then(([byQuery, byEmpty]) => {
        if (cancelled) return;
        const m = pick(byQuery as GridValueOptionsList) ?? pick(byEmpty as GridValueOptionsList);
        if (m) setBootstrapOpt(m);
        else setBootstrapOpt(null);
      })
      .catch(() => {
        if (!cancelled) setBootstrapOpt(null);
      });
    return () => {
      cancelled = true;
    };
  }, [equalsRemoteActive, item.field, item.value]);

  const normOpts: NormOpt[] = React.useMemo(() => {
    if (!isSingleSelect || !col) return [];
    if (colHasValueOptions(col)) {
      const list = resolveColValueOptions(col, FILTER_ROW_DUMMY_ROW_ID, {} as R);
      return list?.length ? normalizeValueOptions(list) : [];
    }
    if (!isRemoteSingleSelect) return [];
    const remote =
      operator === "equals" || operator === "!="
        ? remoteNormOptsEquals
        : operator === "selectAny" || operator === "selectAll"
          ? remoteNormOptsMulti
          : [];
    const seen = new Set<string>();
    const out: NormOpt[] = [];
    if (bootstrapOpt) {
      if (!seen.has(bootstrapOpt.value)) {
        seen.add(bootstrapOpt.value);
        out.push(bootstrapOpt);
      }
    }
    for (const o of remote) {
      if (!seen.has(o.value)) {
        seen.add(o.value);
        out.push(o);
      }
    }
    for (const k of multiSelected) {
      const c = multiPickedCacheRef.current.get(k);
      if (c && !seen.has(c.value)) {
        seen.add(c.value);
        out.push(c);
      }
    }
    for (const o of panelLabelExtras ?? []) {
      if (!seen.has(o.value)) {
        seen.add(o.value);
        out.push(o);
      }
    }
    return out;
  }, [
    isSingleSelect,
    col,
    isRemoteSingleSelect,
    operator,
    remoteNormOptsEquals,
    remoteNormOptsMulti,
    bootstrapOpt,
    multiSelected,
    multiPickedVersion,
    panelLabelExtras
  ]);

  const choices: FilterOpChoice[] = React.useMemo(() => getFilterOperatorChoices(col, lt), [col, lt]);

  /** Opções remotas de =/!= com o valor gravado no topo (rótulo no input sem pesquisar de novo). */
  const remoteNormOptsEqualsForEditor = React.useMemo(() => {
    if (!equalsRemoteActive || !bootstrapOpt) return remoteNormOptsEquals;
    if (remoteNormOptsEquals.some((o) => o.value === bootstrapOpt.value)) return remoteNormOptsEquals;
    return [bootstrapOpt, ...remoteNormOptsEquals];
  }, [equalsRemoteActive, bootstrapOpt, remoteNormOptsEquals]);

  React.useEffect(() => {
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
    setOperator(item.operator);
  }, [item.operator, item.field]);

  React.useEffect(() => {
    if (isSingleSelect && (item.operator === "selectAny" || item.operator === "selectAll")) {
      /** Sempre derivar das raws persistidas — `normOpts` pode ser só o resultado da última pesquisa. */
      setMultiSelected(rawKeysFromFilterMultiValue(item.value));
    }
  }, [item.field, item.operator, item.value, isSingleSelect]);

  React.useEffect(() => {
    setAsyncSearchTouched(false);
  }, [item.field, item.id, item.value]);

  React.useEffect(() => {
    if (!equalsRemoteActive || asyncSearchTouched) return;
    const v = item.value;
    const m =
      normOpts.find(
        (o) =>
          v !== undefined &&
          v !== null &&
          (Object.is(o.raw, v) || String(o.raw) === String(v) || o.value === String(v))
      ) ??
      (bootstrapOpt &&
      v !== undefined &&
      v !== null &&
      (Object.is(bootstrapOpt.raw, v) ||
        String(bootstrapOpt.raw) === String(v) ||
        bootstrapOpt.value === String(v))
        ? bootstrapOpt
        : undefined);
    if (m) setRemoteSelectQuery(m.label);
    else if (v === undefined || v === null || v === "") setRemoteSelectQuery("");
  }, [equalsRemoteActive, asyncSearchTouched, item.value, normOpts, bootstrapOpt]);

  React.useEffect(() => {
    if (!multiRemoteActive) return;
    const loadOpts = colLoadEditValueOptionsRef.current;
    const field = colFieldRef.current;
    if (loadOpts == null || field == null || field === "") return;
    const keys = rawKeysFromFilterMultiValue(item.value);
    const miss = keys.filter((k) => !multiPickedCacheRef.current.has(k));
    if (miss.length === 0) return;
    let cancelled = false;
    const resolveKey = (k: string, rawList: GridValueOptionsList | undefined) => {
      const opts = normalizeValueOptions(rawList ?? []);
      return opts.find((o) => o.value === k || String(o.raw) === String(k));
    };
    void Promise.all(
      miss.map(async (k) => {
        const byK = await loadOpts(k, {
          id: FILTER_ROW_DUMMY_ROW_ID,
          row: {} as R,
          field
        });
        let hit = resolveKey(k, byK as GridValueOptionsList);
        if (!hit) {
          const byEmpty = await loadOpts("", {
            id: FILTER_ROW_DUMMY_ROW_ID,
            row: {} as R,
            field
          });
          hit = resolveKey(k, byEmpty as GridValueOptionsList);
        }
        return { k, hit };
      })
    )
      .then((pairs) => {
        if (cancelled) return;
        for (const { k, hit } of pairs) {
          if (hit) multiPickedCacheRef.current.set(k, hit);
        }
        setMultiPickedVersion((x) => x + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [multiRemoteActive, item.value, item.field]);

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
      cdef?.type === "singleSelect" && cdef != null && colHasFilterableSingleSelect(cdef);

    const vt =
      opts?.valueTextOverride !== undefined
        ? opts.valueTextOverride
        : patch.value !== undefined && colIsSingleSelect
          ? filterRowValueStateFromItem({
              item: { ...cur, ...patch, field, operator: op },
              colDef: cdef,
              normOpts:
                cdef?.type === "singleSelect" && colHasValueOptions(cdef)
                  ? normalizeValueOptions(
                      resolveColValueOptions(cdef, FILTER_ROW_DUMMY_ROW_ID, {} as R) ?? []
                    )
                  : cdef?.type === "singleSelect" &&
                      cdef &&
                      colHasFilterableSingleSelect(cdef) &&
                      !colHasValueOptions(cdef) &&
                      cdef.field === col?.field
                    ? normOpts
                    : [],
              isSingleSelect: !!colIsSingleSelect,
              isBoolean: cdef?.type === "boolean",
              isDateKind: cdef?.type === "date" || cdef?.type === "dateTime",
              isNumber: cdef?.type === "number",
              isDateTime: cdef?.type === "dateTime"
            })
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
                    : cdef?.type === "singleSelect" &&
                        cdef &&
                        colHasFilterableSingleSelect(cdef) &&
                        !colHasValueOptions(cdef) &&
                        cdef.field === col?.field
                      ? normOpts
                      : [],
                isSingleSelect:
                  cdef?.type === "singleSelect" && colHasFilterableSingleSelect(cdef),
                isBoolean: cdef?.type === "boolean",
                isDateKind: cdef?.type === "date" || cdef?.type === "dateTime",
                isNumber: cdef?.type === "number",
                isDateTime: cdef?.type === "dateTime"
              });
    const nNorm =
      cdef?.type === "singleSelect" && colHasValueOptions(cdef)
        ? normalizeValueOptions(resolveColValueOptions(cdef, FILTER_ROW_DUMMY_ROW_ID, {} as R) ?? [])
        : cdef?.type === "singleSelect" &&
            cdef &&
            colHasFilterableSingleSelect(cdef) &&
            !colHasValueOptions(cdef) &&
            cdef.field === col?.field
          ? normOpts
          : [];

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
    if (cdef?.type === "singleSelect" && colHasFilterableSingleSelect(cdef) && nNorm[0])
      nextVal = nNorm[0].value;
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
  const equalsValueTitle =
    normOpts.find((o) => o.value === valueText || String(o.raw) === valueText)?.label ??
    panelLabelExtras?.find((o) => o.value === valueText || String(o.raw) === valueText)?.label ??
    valueText;
  const groupLogicTitle =
    (item.groupItemLogic ?? "And") === "And"
      ? lt("filterPanelLogicAnd", "E (todas as condições)")
      : lt("filterPanelLogicOr", "Ou (qualquer condição)");

  const multiSummaryLabel = React.useMemo(() => {
    const labelForKey = (k: string) =>
      panelLabelExtras?.find((o) => o.value === k || String(o.raw) === k)?.label ??
      multiPickedCacheRef.current.get(k)?.label ??
      normOpts.find((o) => o.value === k || String(o.raw) === k)?.label ??
      k;
    if (multiSelected.length === 0) return lt("filterPanelEmpty", "—");
    const resolved =
      multiSelected.length <= 2 ? multiSelected.map(labelForKey).join(", ") : `${multiSelected.length} valores`;
    return resolved;
  }, [multiSelected, panelLabelExtras, normOpts, multiPickedVersion, lt, item.field, operator]);

  const shortAnd = lt("filterPanelLogicShortAnd", "E");
  const shortOr = lt("filterPanelLogicShortOr", "OU");

  const equalsSelectOptions = React.useMemo(() => {
    if (normOpts.length === 0) {
      return [
        {
          value: FILTER_VALUE_PLACEHOLDER,
          label: lt("filterPanelAsyncSelectEmpty", "— carregar opções —")
        }
      ];
    }
    if (normOpts.some((o) => o.value === valueText)) {
      return normOpts.map((o) => ({ value: o.value, label: o.label }));
    }
    return [
      { value: FILTER_VALUE_PLACEHOLDER, label: lt("filterPanelValuePick", "Selecionar…") },
      ...normOpts.map((o) => ({ value: o.value, label: o.label }))
    ];
  }, [normOpts, valueText, lt]);

  const equalsSelectValue = React.useMemo(() => {
    if (normOpts.length === 0) return FILTER_VALUE_PLACEHOLDER;
    if (normOpts.some((o) => o.value === valueText)) return valueText;
    return FILTER_VALUE_PLACEHOLDER;
  }, [normOpts, valueText]);

  /**
   * Linha 2: × | Ordem | Operador | Valor (4 colunas). «Coluna» está na linha 1.
   * `minmax` no operador evita etiqueta «OPERADOR» a ser cortada; «Valor» absorve o espaço livre.
   */
  const criteriaGridTemplateColumns =
    "auto 2.75rem minmax(5.5rem, 1.1fr) minmax(0, 2.85fr)";

  return (
    <li
      className={cn(
        "flex min-w-0 max-w-full flex-col gap-1.5 py-2 first:pt-1",
        layout === "grouped" ? "border-b border-border/30 last:border-b-0" : "border-b border-border/40"
      )}
    >
      <div
        className="grid min-h-[2.75rem] min-w-0 gap-x-3 border-b border-border/30 pb-1.5"
        style={{ gridTemplateColumns: "minmax(0, max-content) minmax(0, 1fr)" }}
      >
        <div className="flex min-w-0 max-w-full flex-col gap-2 overflow-hidden">
          {layout === "flat" ? (
            <div className="flex min-w-0 flex-wrap items-end gap-2">
              <div className="grid min-w-0 max-w-[5.25rem] shrink gap-0.5 basis-[4.25rem]">
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
                <div className="grid min-w-0 max-w-full flex-1 basis-[6.5rem] gap-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {lt("filterPanelGroupItemLogic", "Com linha anterior")}
                  </span>
                  <FilterPanelSelect
                    title={groupLogicTitle}
                    ariaLabel={lt("filterPanelGroupItemLogic", "Com linha anterior")}
                    value={item.groupItemLogic ?? "And"}
                    onValueChange={(gl) => {
                      const items = [...(filterModel.items ?? [])];
                      const curIt = items[index];
                      if (!curIt) return;
                      items[index] = { ...curIt, groupItemLogic: gl as GridLogicOperator };
                      patchItems(items);
                    }}
                    options={[
                      { value: "And", label: lt("filterPanelLogicAnd", "E (todas as condições)") },
                      { value: "Or", label: lt("filterPanelLogicOr", "Ou (qualquer condição)") }
                    ]}
                  />
                </div>
              ) : null}
            </div>
          ) : groupedUi != null ? (
            groupedUi.lineRank > 0 ? (
              <div className="grid w-[3.5rem] min-w-0 shrink-0 gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {lt("filterPanelLineJoinLabel", "E / OU")}
                </span>
                <FilterPanelSelect
                  triggerClassName="[&>span]:text-center"
                  title={groupLogicTitle}
                  ariaLabel={lt("filterPanelLineJoinLabel", "E / OU")}
                  value={item.groupItemLogic ?? "And"}
                  onValueChange={(gl) => {
                    const items = [...(filterModel.items ?? [])];
                    const curIt = items[index];
                    if (!curIt) return;
                    items[index] = { ...curIt, groupItemLogic: gl as GridLogicOperator };
                    patchItems(items);
                  }}
                  options={[
                    { value: "And", label: shortAnd },
                    { value: "Or", label: shortOr }
                  ]}
                />
              </div>
            ) : groupedUi.isHiveHeaderGroup ? (
              <div className="min-h-[2.25rem] min-w-0 shrink-0" aria-hidden />
            ) : (
              <div className="flex min-w-0 flex-wrap items-end gap-2">
                <div className="grid w-[5.25rem] shrink-0 gap-0.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {lt("filterPanelGroupId", "Grupo")}
                  </span>
                  <input
                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    type="number"
                    aria-label={lt("filterPanelGroupId", "Grupo")}
                    title={groupedUi.groupIdInputTitle}
                    value={groupedUi.groupId === undefined || groupedUi.groupId === null ? "" : String(groupedUi.groupId)}
                    onChange={(e) => {
                      groupedUi.onGroupIdChange(e.target.value.trim());
                    }}
                    placeholder={groupedUi.groupIdPlaceholder}
                  />
                </div>
                {groupedUi.showGroupCombine ? (
                  <div className="grid min-w-0 max-w-[min(100%,12rem)] shrink gap-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {lt("filterPanelGroupCombineLabel", "E / OU no grupo")}
                    </span>
                    <FilterPanelSelect
                      triggerClassName="min-w-0"
                      title={groupedUi.combineTitle}
                      ariaLabel={groupedUi.combineAria}
                      value={groupedUi.groupCombineValue}
                      onValueChange={(v) => groupedUi.onGroupCombineChange(v as GridLogicOperator)}
                      options={[
                        { value: "And", label: groupedUi.shortAnd },
                        { value: "Or", label: groupedUi.shortOr }
                      ]}
                    />
                  </div>
                ) : null}
              </div>
            )
          ) : (
            <div className="min-h-[2.25rem] shrink-0" aria-hidden />
          )}
        </div>
        <div className="grid min-w-0 w-full max-w-full gap-0.5 overflow-hidden">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {lt("filterPanelChooseColumn", "Coluna")}
          </span>
          <FilterPanelSelect
            title={columnSelectTitle}
            ariaLabel={lt("filterPanelChooseColumn", "Coluna")}
            value={item.field}
            onValueChange={onFieldChange}
            options={filterableCols.map((c) => ({
              value: c.field,
              label: String(c.headerName ?? c.field)
            }))}
          />
        </div>
      </div>

      <div
        className="grid min-w-0 max-w-full grid-rows-1 items-end gap-x-1.5 gap-y-0"
        style={{ gridTemplateColumns: criteriaGridTemplateColumns }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={lt("filterPanelRemove", "Remover")}
          onClick={onRemove}
        >
          <XMarkIcon className="h-4 w-4 shrink-0" aria-hidden />
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
      <div className="grid min-w-0 max-w-full gap-0.5 overflow-hidden">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {lt("columnFilterOperatorLabel", "Operador")}
        </span>
        <FilterPanelSelect
          title={operatorSelectTitle}
          ariaLabel={lt("columnFilterOperatorLabel", "Operador")}
          value={operator}
          onValueChange={(nextOp) => {
            const op = nextOp as GridFilterOperator;
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
              const keys = rawKeysFromFilterMultiValue(curRow.value);
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
                const keys = rawKeysFromFilterMultiValue(curRow.value);
                nextVt = keys[0] ?? normOpts[0]?.value ?? "";
              }
              setValueText(nextVt);
              commitItem({ operator: op }, { valueTextOverride: nextVt });
              return;
            }
            commitItem({ operator: op });
          }}
          options={choices.map((c) => ({ value: c.value, label: c.label }))}
        />
      </div>
      <div className="grid min-w-0 w-full max-w-full gap-0.5 overflow-hidden">
        <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
          {lt("columnFilterValueLabel", "Valor")}
        </span>
        {!needsValue ? (
          <span className="h-8 py-1.5 text-xs text-muted-foreground">—</span>
        ) : isSingleSelect ? (
          operator === "equals" || operator === "!=" ? (
            <div className="min-w-0 w-full max-w-full">
              {isRemoteSingleSelect ? (
                <AsyncRemoteSingleSelectValueEditor
                  valueText={valueText}
                  setValueText={setValueText}
                  commitItem={commitItem}
                  remoteSelectQuery={remoteSelectQuery}
                  setRemoteSelectQuery={setRemoteSelectQuery}
                  remoteNormOpts={remoteNormOptsEqualsForEditor}
                  remoteLoading={remoteSelectLoadingEquals}
                  onSearchInteraction={() => setAsyncSearchTouched(true)}
                  onSearchBlur={(q) => {
                    if (q === "") return;
                    setAsyncSearchTouched(false);
                  }}
                  lt={lt}
                />
              ) : (
                <FilterPanelSelect
                  title={equalsValueTitle}
                  ariaLabel={lt("columnFilterValueLabel", "Valor")}
                  value={equalsSelectValue}
                  onValueChange={(v) => {
                    if (v === FILTER_VALUE_PLACEHOLDER) {
                      setValueText("");
                      commitItem({ value: "" as unknown });
                      return;
                    }
                    setValueText(v);
                    commitItem({ value: v as unknown });
                  }}
                  options={equalsSelectOptions}
                />
              )}
            </div>
          ) : operator === "inList" ? (
            <Input
              className="h-8 w-full min-w-0 rounded-none border-0 border-b-2 border-primary/80 px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
            <div className="min-w-0 w-full max-w-full">
            <Popover
              open={multiPopoverOpen}
              onOpenChange={(o) => {
                setMultiPopoverOpen(o);
                if (o) setMultiSearchQuery("");
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
              <PopoverContent
                align="start"
                className="flex w-80 max-h-[28rem] flex-col gap-2 overflow-hidden p-3"
                style={{ zIndex: 10120 }}
              >
                {isRemoteSingleSelect ? (
                  <>
                    <Input
                      className="h-8 text-xs"
                      value={multiSearchQuery}
                      onChange={(e) => setMultiSearchQuery(e.target.value)}
                      placeholder={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
                      aria-label={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
                    />
                    <div className="max-h-36 min-h-[4.5rem] overflow-y-auto rounded-md border border-border bg-popover py-1">
                      {multiSearchQuery.trim() === "" ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectIdleHint", "Digite para pesquisar…")}
                        </div>
                      ) : remoteSelectLoadingMulti && remoteNormOptsMulti.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectLoading", "A carregar…")}
                        </div>
                      ) : remoteNormOptsMulti.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectEmpty", "— sem resultados —")}
                        </div>
                      ) : (
                        remoteNormOptsMulti.map((o) => (
                          <label
                            key={o.value}
                            className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs hover:bg-accent"
                            title={o.label}
                          >
                            <Checkbox
                              checked={multiSelected.includes(o.value)}
                              onCheckedChange={(c) => {
                                const on = c === true;
                                const next = on
                                  ? [...multiSelected, o.value]
                                  : multiSelected.filter((x) => x !== o.value);
                                if (on) multiPickedCacheRef.current.set(o.value, o);
                                else multiPickedCacheRef.current.delete(o.value);
                                setMultiSelected(next);
                                setMultiPickedVersion((x) => x + 1);
                                commitItem({}, { multiOverride: next });
                              }}
                            />
                            <span className="min-w-0 truncate">{o.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {lt("filterPanelAsyncMultiPicked", "Marcados")}
                    </div>
                    <div className="flex max-h-28 min-h-0 flex-wrap gap-1.5 overflow-y-auto">
                      {multiSelected.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        multiSelected.map((k) => {
                          const lab =
                            multiPickedCacheRef.current.get(k)?.label ??
                            normOpts.find((o) => o.value === k)?.label ??
                            k;
                          return (
                            <label
                              key={k}
                              className="flex max-w-full cursor-pointer items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px]"
                              title={lab}
                            >
                              <Checkbox
                                checked
                                onCheckedChange={() => {
                                  const next = multiSelected.filter((x) => x !== k);
                                  multiPickedCacheRef.current.delete(k);
                                  setMultiSelected(next);
                                  setMultiPickedVersion((x) => x + 1);
                                  commitItem({}, { multiOverride: next });
                                }}
                              />
                              <span className="min-w-0 truncate">{lab}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
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
                )}
              </PopoverContent>
            </Popover>
            </div>
          ) : (
            <span className="h-8 py-1.5 text-xs text-muted-foreground">—</span>
          )
        ) : isBoolean ? (
          <FilterPanelSelect
            title={valueText === "true" ? lt("filterBooleanTrue", "Sim") : lt("filterBooleanFalse", "Não")}
            ariaLabel={lt("columnFilterValueLabel", "Valor")}
            value={valueText || "true"}
            onValueChange={(v) => {
              setValueText(v);
              commitItem({ value: v === "true" });
            }}
            options={[
              { value: "true", label: lt("filterBooleanTrue", "Sim") },
              { value: "false", label: lt("filterBooleanFalse", "Não") }
            ]}
          />
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
  /** Cache entre aberturas do painel: `loadEditValueOptions("")` + opções já vistas por campo. */
  const panelRemoteOptsCacheRef = React.useRef<Record<string, Map<string, NormOpt>>>({});
  const [panelRemoteOptsVersion, setPanelRemoteOptsVersion] = React.useState(0);

  const filterModelBootstrapSig = React.useMemo(
    () =>
      JSON.stringify(
        items.map((it) => ({
          f: it.field,
          o: it.operator,
          v: it.value
        }))
      ),
    [items]
  );

  React.useEffect(() => {
    if (!open) return;
    const fields = new Set<string>();
    for (const it of items) {
      const cdef = columns.find((c) => c.field === it.field);
      if (!isRemoteFilterSingleSelectColumn(cdef)) continue;
      fields.add(it.field);
    }
    if (fields.size === 0) return;

    let cancelled = false;
    const mergeIntoCache = (field: string, norm: NormOpt[]) => {
      let m = panelRemoteOptsCacheRef.current[field];
      if (!m) {
        m = new Map();
        panelRemoteOptsCacheRef.current[field] = m;
      }
      for (const o of norm) {
        m.set(o.value, o);
        const rawK = String(o.raw);
        if (rawK !== o.value) m.set(rawK, o);
      }
    };

    void (async () => {
      for (const field of fields) {
        const cdef = columns.find((c) => c.field === field);
        const loadOpts = cdef?.loadEditValueOptions;
        if (!loadOpts) continue;
        try {
          const raw = await loadOpts("", {
            id: FILTER_ROW_DUMMY_ROW_ID,
            row: {} as R,
            field
          });
          if (cancelled) return;
          mergeIntoCache(field, normalizeValueOptions(raw ?? []));
        } catch {
          /* manter cache parcial */
        }

        const keysForField = new Set<string>();
        for (const it of items) {
          if (it.field !== field) continue;
          for (const k of collectRemoteSingleSelectRawKeysFromFilterItem(it)) {
            if (k.trim() !== "") keysForField.add(k);
          }
        }
        await Promise.all(
          [...keysForField].map(async (id) => {
            try {
              const byId = await loadOpts(id, {
                id: FILTER_ROW_DUMMY_ROW_ID,
                row: {} as R,
                field
              });
              if (cancelled) return;
              const norm = normalizeValueOptions(byId ?? []);
              mergeIntoCache(field, norm);
            } catch {
              /* manter cache parcial */
            }
          })
        );
      }
      if (!cancelled) setPanelRemoteOptsVersion((v) => v + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, filterModelBootstrapSig, columns, items]);

  const panelLabelExtrasByField = React.useMemo(() => {
    const out: Record<string, NormOpt[]> = {};
    const fs = new Set(items.map((i) => i.field));
    for (const f of fs) {
      const m = panelRemoteOptsCacheRef.current[f];
      if (m && m.size > 0) out[f] = Array.from(m.values());
    }
    return out;
  }, [items, panelRemoteOptsVersion]);

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

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-1 py-1">
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
                    : isHiveFilterHeaderGroupKey(gk)
                      ? lt("filterPanelHeaderFiltersGroup", "Colunas")
                      : `${lt("filterPanelGroupId", "Grupo")} ${headerGroupId === undefined || headerGroupId === null ? "" : String(headerGroupId)}`;

                return (
                  <React.Fragment key={`blk-${gk}`}>
                    {gi === 1 && groupKeysOrder.length >= 2 ? (
                      <div className="rounded-md border border-dashed border-primary/30 bg-muted/10 px-2 py-2">
                        <div className="grid max-w-md gap-1">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {lt("filterPanelGroupBetweenLabel", "Entre grupos")}
                          </span>
                          <FilterPanelSelect
                            title={groupJoinTitleL}
                            ariaLabel={lt("filterPanelGroupBetweenLabel", "Entre grupos")}
                            value={groupLogicVal}
                            onValueChange={(v) =>
                              onCommit({
                                ...filterModel,
                                groupLogicOperator: v as GridLogicOperator
                              })
                            }
                            options={[
                              { value: "And", label: lt("filterPanelLogicAnd", "E (todas as condições)") },
                              { value: "Or", label: lt("filterPanelLogicOr", "Ou (qualquer condição)") }
                            ]}
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5 shadow-sm">
                      <div className="mb-2 min-w-0 border-b border-border/45 pb-2">
                        <h3 className="truncate text-xs font-semibold uppercase tracking-wide text-foreground">
                          {groupTitle}
                        </h3>
                      </div>
                      <ul className="list-none min-w-0">
                        {entries.map((e, rank) => (
                          <FilterLineEditor<R>
                            key={e.item.id != null ? `f-${String(e.item.id)}` : `f-${gk}-${rank}`}
                            item={e.item}
                            itemModelIndex={e.modelIndex}
                            layout="grouped"
                            columns={columns}
                            filterModel={filterModel}
                            onCommit={onCommit}
                            onRemove={() => removeAt(e.modelIndex)}
                            lt={lt}
                            panelLabelExtras={panelLabelExtrasByField[e.item.field]}
                            groupedUi={{
                              lineRank: rank,
                              isHiveHeaderGroup: isHiveFilterHeaderGroupKey(gk),
                              groupId: headerGroupId,
                              groupIdPlaceholder: gk === "__flat__" ? "ex.: 2" : "—",
                              groupIdInputTitle:
                                gk === "__flat__"
                                  ? lt(
                                      "filterPanelUngroupedAssignHint",
                                      "Defina o número para criar / juntar a um grupo"
                                    )
                                  : undefined,
                              onGroupIdChange: (raw) => {
                                if (raw === "") {
                                  onCommit({ ...filterModel, items: patchAllGroupIds(items, gk, undefined) });
                                  return;
                                }
                                const n = Number(raw);
                                if (!Number.isFinite(n)) return;
                                onCommit({ ...filterModel, items: patchAllGroupIds(items, gk, n) });
                              },
                              showGroupCombine: entries.length >= 2,
                              groupCombineValue: combineVal,
                              onGroupCombineChange: (op) =>
                                onCommit({
                                  ...filterModel,
                                  items: applyGroupCombineToItems(items, gk, op)
                                }),
                              combineTitle,
                              combineAria: lt("filterPanelGroupCombineLabel", "E / OU no grupo"),
                              shortAnd: shortAndG,
                              shortOr: shortOrG
                            }}
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
          <ul className="list-none min-w-0">
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
                      <div className="grid min-w-0 max-w-full gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {lt("filterPanelLogicLabel", "Combinar filtros com")}
                        </span>
                        <FilterPanelSelect
                          title={flatJoinTitle}
                          ariaLabel={lt("filterPanelLogicLabel", "Combinar filtros com")}
                          value={item.joinWithPrevious ?? logic}
                          onValueChange={(gl) => {
                            const nextItems = items.map((it, i) =>
                              i === index ? { ...it, joinWithPrevious: gl as GridLogicOperator } : it
                            );
                            onCommit({ ...filterModel, items: nextItems });
                          }}
                          options={[
                            { value: "And", label: lt("filterPanelLogicAnd", "E (todas as condições)") },
                            { value: "Or", label: lt("filterPanelLogicOr", "Ou (qualquer condição)") }
                          ]}
                        />
                      </div>
                    </li>
                  ) : null}
                  <FilterLineEditor<R>
                    item={item}
                    itemModelIndex={index}
                    layout="flat"
                    columns={columns}
                    filterModel={filterModel}
                    onCommit={onCommit}
                    onRemove={() => removeAt(index)}
                    lt={lt}
                    panelLabelExtras={panelLabelExtrasByField[item.field]}
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

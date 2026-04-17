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
import { colHasValueOptions, colHasFilterableSingleSelect, resolveColValueOptions } from "./adapter";
import {
  buildCommittedFilterItem,
  defaultFilterOperatorForCol,
  FILTER_ROW_DUMMY_ROW_ID,
  filterRowValueStateFromItem,
  getFilterOperatorChoices,
  normalizeValueOptions,
  rawKeysFromFilterMultiValue,
  type NormOpt
} from "./columnFilterShared";
import { ASYNC_REMOTE_FILTER_SEARCH_DEBOUNCE_MS } from "./constants";
import { HIVE_FILTER_HEADER_GROUP_ID } from "./filterFns";
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

const META = new Set(["__select__", "__detail__", "__tree__"]);

function isHeaderFilterRowId(it: GridFilterItem): boolean {
  return String(it.id ?? "").startsWith("hive-hdr-");
}

function reorderHeaderFilterGroupMeta<R extends GridValidRowModel>(
  items: GridFilterItem[],
  columns: GridColDef<R>[]
): GridFilterItem[] {
  const others = items.filter((i) => !isHeaderFilterRowId(i));
  const rank = (f: string) => {
    const ix = columns.findIndex((c) => c.field === f);
    return ix < 0 ? 9999 : ix;
  };
  const headers = items
    .filter(isHeaderFilterRowId)
    .sort((a, b) => rank(a.field) - rank(b.field))
    .map((it, idx) => ({
      ...it,
      groupId: HIVE_FILTER_HEADER_GROUP_ID,
      groupItemLogic: (idx === 0 ? undefined : "And") as GridLogicOperator | undefined,
      filterOrder: idx + 1
    }));
  return [...others, ...headers];
}

function upsertFieldFilter<R extends GridValidRowModel>(
  model: GridFilterModel,
  field: string,
  next: Pick<GridFilterItem, "operator" | "value"> | null,
  columns: GridColDef<R>[]
): GridFilterModel {
  const rest = (model.items ?? []).filter((i) => i.field !== field);
  if (next == null) {
    return { ...model, items: reorderHeaderFilterGroupMeta(rest, columns) };
  }
  const row: GridFilterItem = {
    id: `hive-hdr-${field}`,
    field,
    operator: next.operator,
    value: next.value
  };
  return { ...model, items: reorderHeaderFilterGroupMeta([...rest, row], columns) };
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
            columns={columns}
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
  columns,
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
  columns: GridColDef<R>[];
  width: number;
  filterModel: GridFilterModel;
  onCommit: (next: GridFilterModel) => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
  densityPaddingClass: string;
  useDivCells?: boolean;
}) {
  const item = (filterModel.items ?? []).find((i) => i.field === field);
  const isSingleSelect = col.type === "singleSelect" && colHasFilterableSingleSelect(col);
  const isRemoteSingleSelect =
    col.type === "singleSelect" &&
    col.loadEditValueOptions != null &&
    !colHasValueOptions(col);

  const [hdrRemoteQueryEquals, setHdrRemoteQueryEquals] = React.useState("");
  const [hdrRemoteOptsEquals, setHdrRemoteOptsEquals] = React.useState<NormOpt[]>([]);
  const [hdrLoadingEquals, setHdrLoadingEquals] = React.useState(false);
  const hdrEqSerialRef = React.useRef(0);

  const [hdrMultiSearch, setHdrMultiSearch] = React.useState("");
  const [hdrRemoteOptsMulti, setHdrRemoteOptsMulti] = React.useState<NormOpt[]>([]);
  const [hdrLoadingMulti, setHdrLoadingMulti] = React.useState(false);
  const hdrMultiSerialRef = React.useRef(0);
  const hdrMultiCacheRef = React.useRef<Map<string, NormOpt>>(new Map());
  const [hdrMultiBump, setHdrMultiBump] = React.useState(0);

  const effectiveOp = item?.operator ?? defaultFilterOperatorForCol(col);
  const equalsRemoteHdr = isRemoteSingleSelect && (effectiveOp === "equals" || effectiveOp === "!=");
  const multiRemoteHdr =
    isRemoteSingleSelect && (effectiveOp === "selectAny" || effectiveOp === "selectAll");

  const hdrColLoadEditValueOptionsRef = React.useRef(col.loadEditValueOptions);
  hdrColLoadEditValueOptionsRef.current = col.loadEditValueOptions;

  React.useEffect(() => {
    if (!equalsRemoteHdr) {
      setHdrRemoteOptsEquals([]);
      setHdrLoadingEquals(false);
      return;
    }
    const loadOpts = hdrColLoadEditValueOptionsRef.current;
    if (loadOpts == null) {
      setHdrRemoteOptsEquals([]);
      setHdrLoadingEquals(false);
      return;
    }
    const q = hdrRemoteQueryEquals.trim();
    if (q === "") {
      setHdrRemoteOptsEquals([]);
      setHdrLoadingEquals(false);
      return;
    }
    let cancelled = false;
    const serial = ++hdrEqSerialRef.current;
    setHdrLoadingEquals(true);
    const t = window.setTimeout(() => {
      void loadOpts(hdrRemoteQueryEquals, {
        id: FILTER_ROW_DUMMY_ROW_ID,
        row: {} as R,
        field
      })
        .then((raw) => {
          if (cancelled || serial !== hdrEqSerialRef.current) return;
          setHdrRemoteOptsEquals(normalizeValueOptions(raw ?? []));
        })
        .catch(() => {
          if (cancelled || serial !== hdrEqSerialRef.current) return;
          setHdrRemoteOptsEquals([]);
        })
        .finally(() => {
          if (cancelled) return;
          if (serial === hdrEqSerialRef.current) setHdrLoadingEquals(false);
        });
    }, ASYNC_REMOTE_FILTER_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setHdrLoadingEquals(false);
    };
  }, [equalsRemoteHdr, field, hdrRemoteQueryEquals]);

  React.useEffect(() => {
    if (!multiRemoteHdr) {
      setHdrRemoteOptsMulti([]);
      setHdrLoadingMulti(false);
      return;
    }
    const loadOpts = hdrColLoadEditValueOptionsRef.current;
    if (loadOpts == null) {
      setHdrRemoteOptsMulti([]);
      setHdrLoadingMulti(false);
      return;
    }
    const q = hdrMultiSearch.trim();
    if (q === "") {
      setHdrRemoteOptsMulti([]);
      setHdrLoadingMulti(false);
      return;
    }
    let cancelled = false;
    const serial = ++hdrMultiSerialRef.current;
    setHdrLoadingMulti(true);
    const t = window.setTimeout(() => {
      void loadOpts(hdrMultiSearch, {
        id: FILTER_ROW_DUMMY_ROW_ID,
        row: {} as R,
        field
      })
        .then((raw) => {
          if (cancelled || serial !== hdrMultiSerialRef.current) return;
          setHdrRemoteOptsMulti(normalizeValueOptions(raw ?? []));
        })
        .catch(() => {
          if (cancelled || serial !== hdrMultiSerialRef.current) return;
          setHdrRemoteOptsMulti([]);
        })
        .finally(() => {
          if (cancelled) return;
          if (serial === hdrMultiSerialRef.current) setHdrLoadingMulti(false);
        });
    }, ASYNC_REMOTE_FILTER_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setHdrLoadingMulti(false);
    };
  }, [multiRemoteHdr, field, hdrMultiSearch]);

  const [multiSelected, setMultiSelected] = React.useState<string[]>([]);
  const [multiPopoverOpen, setMultiPopoverOpen] = React.useState(false);
  const [eqHdrOpen, setEqHdrOpen] = React.useState(false);

  const normOpts: NormOpt[] = React.useMemo(() => {
    if (!isSingleSelect) return [];
    if (colHasValueOptions(col)) {
      const list = resolveColValueOptions(col, FILTER_ROW_DUMMY_ROW_ID, {} as R);
      return list?.length ? normalizeValueOptions(list) : [];
    }
    if (!isRemoteSingleSelect) return [];
    const remote =
      effectiveOp === "equals" || effectiveOp === "!="
        ? hdrRemoteOptsEquals
        : effectiveOp === "selectAny" || effectiveOp === "selectAll"
          ? hdrRemoteOptsMulti
          : [];
    const seen = new Set<string>();
    const out: NormOpt[] = [];
    for (const o of remote) {
      if (!seen.has(o.value)) {
        seen.add(o.value);
        out.push(o);
      }
    }
    for (const k of multiSelected) {
      const c = hdrMultiCacheRef.current.get(k);
      if (c && !seen.has(c.value)) {
        seen.add(c.value);
        out.push(c);
      }
    }
    return out;
  }, [
    isSingleSelect,
    col,
    isRemoteSingleSelect,
    effectiveOp,
    hdrRemoteOptsEquals,
    hdrRemoteOptsMulti,
    multiSelected,
    hdrMultiBump
  ]);

  const choices = React.useMemo(() => getFilterOperatorChoices(col, lt), [col, lt]);
  const needsValue = effectiveOp !== "isEmpty" && effectiveOp !== "isNotEmpty";

  const [valueText, setValueText] = React.useState("");

  React.useEffect(() => {
    setValueText(
      filterRowValueStateFromItem({
        item: item ?? { field, operator: effectiveOp, value: undefined },
        colDef: col,
        normOpts,
        isSingleSelect: !!isSingleSelect,
        isBoolean: col.type === "boolean",
        isDateKind: col.type === "date" || col.type === "dateTime",
        isNumber: col.type === "number",
        isDateTime: col.type === "dateTime"
      })
    );
  }, [item, field, effectiveOp, col, normOpts, isSingleSelect]);

  React.useEffect(() => {
    if (isSingleSelect && (item?.operator === "selectAny" || item?.operator === "selectAll")) {
      setMultiSelected(rawKeysFromFilterMultiValue(item?.value));
    }
  }, [item?.operator, item?.value, isSingleSelect]);

  React.useEffect(() => {
    if (!multiRemoteHdr) return;
    const loadOpts = hdrColLoadEditValueOptionsRef.current;
    if (loadOpts == null) return;
    const keys = rawKeysFromFilterMultiValue(item?.value);
    const miss = keys.filter((k) => !hdrMultiCacheRef.current.has(k));
    if (miss.length === 0) return;
    let cancelled = false;
    void Promise.all(
      miss.map((k) =>
        loadOpts(k, {
          id: FILTER_ROW_DUMMY_ROW_ID,
          row: {} as R,
          field
        })
      )
    )
      .then((arrs) => {
        if (cancelled) return;
        miss.forEach((k, i) => {
          const opts = normalizeValueOptions((arrs[i] as GridValueOptionsList) ?? []);
          const hit = opts.find((o) => o.value === k || String(o.raw) === String(k));
          if (hit) hdrMultiCacheRef.current.set(k, hit);
        });
        setHdrMultiBump((x) => x + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [multiRemoteHdr, item?.value, item?.field]);

  React.useEffect(() => {
    if (!equalsRemoteHdr || !item || eqHdrOpen) return;
    const v = item.value;
    if (v === undefined || v === null || v === "") {
      setHdrRemoteQueryEquals("");
      return;
    }
    const m = normOpts.find(
      (o) => Object.is(o.raw, v) || String(o.raw) === String(v) || o.value === String(v)
    );
    if (m) setHdrRemoteQueryEquals(m.label);
  }, [equalsRemoteHdr, item?.value, normOpts, eqHdrOpen]);

  const applyOp = (operator: GridFilterOperator) => {
    const defOp = defaultFilterOperatorForCol(col);
    if (operator === "isEmpty" || operator === "isNotEmpty") {
      onCommit(upsertFieldFilter(filterModel, field, { operator, value: undefined }, columns));
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
      const keys = rawKeysFromFilterMultiValue(item?.value);
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
        const keys = rawKeysFromFilterMultiValue(item?.value);
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
      onCommit(upsertFieldFilter(filterModel, field, { operator: built.operator, value: built.value }, columns));
      return;
    }

    if (operator === "contains" || operator === "equals" || operator === "!=") {
      onCommit(upsertFieldFilter(filterModel, field, { operator: defOp, value: undefined }, columns));
    } else {
      onCommit(upsertFieldFilter(filterModel, field, null, columns));
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
      onCommit(upsertFieldFilter(filterModel, field, null, columns));
      return;
    }
    onCommit(upsertFieldFilter(filterModel, field, { operator: built.operator, value: built.value }, columns));
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

  const equalsHdrSummary = React.useMemo(() => {
    if (!item || (effectiveOp !== "equals" && effectiveOp !== "!=")) return lt("filterPanelEmpty", "—");
    const v = item.value;
    if (v === undefined || v === null || v === "") return lt("filterPanelEmpty", "—");
    const m = normOpts.find(
      (o) => Object.is(o.raw, v) || String(o.raw) === String(v) || o.value === String(v)
    );
    return m?.label ?? String(v);
  }, [item, effectiveOp, normOpts, lt]);

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
          <DropdownMenuItem onClick={() => onCommit(upsertFieldFilter(filterModel, field, null, columns))}>
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
            isRemoteSingleSelect ? (
              <Popover
                open={eqHdrOpen}
                onOpenChange={(o) => {
                  setEqHdrOpen(o);
                  if (o) {
                    const v = item?.value;
                    const m =
                      v !== undefined && v !== null && v !== ""
                        ? normOpts.find(
                            (x) =>
                              Object.is(x.raw, v) || String(x.raw) === String(v) || x.value === String(v)
                          )
                        : undefined;
                    setHdrRemoteQueryEquals(m?.label ?? "");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-6 min-h-0 w-full max-w-full justify-start truncate px-0 text-left text-[11px] font-normal text-foreground hover:bg-transparent"
                    title={equalsHdrSummary}
                    aria-label={lt("columnFilterValueLabel", "Valor")}
                  >
                    {equalsHdrSummary}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-2">
                  <div className="flex flex-col gap-2">
                    <Input
                      className="h-8 text-xs"
                      value={hdrRemoteQueryEquals}
                      onChange={(e) => setHdrRemoteQueryEquals(e.target.value)}
                      placeholder={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
                      aria-label={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
                    />
                    <div className="max-h-40 overflow-y-auto rounded-md border border-border py-1">
                      {hdrRemoteQueryEquals.trim() === "" ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectIdleHint", "Digite para pesquisar…")}
                        </div>
                      ) : hdrLoadingEquals && hdrRemoteOptsEquals.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectLoading", "A carregar…")}
                        </div>
                      ) : hdrRemoteOptsEquals.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectEmpty", "— sem resultados —")}
                        </div>
                      ) : (
                        hdrRemoteOptsEquals.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            className="flex w-full cursor-default px-2 py-1.5 text-left text-xs hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setValueText(o.value);
                              const built = buildCommittedFilterItem({
                                colDef: col,
                                field,
                                operator: effectiveOp,
                                valueText: o.value,
                                normOpts: [...normOpts.filter((x) => x.value !== o.value), o]
                              });
                              if (built) {
                                onCommit(
                                  upsertFieldFilter(
                                    filterModel,
                                    field,
                                    { operator: built.operator, value: built.value },
                                    columns
                                  )
                                );
                              }
                              setHdrRemoteQueryEquals(o.label);
                              setEqHdrOpen(false);
                            }}
                          >
                            {o.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
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
                  if (built)
                    onCommit(
                      upsertFieldFilter(
                        filterModel,
                        field,
                        { operator: built.operator, value: built.value },
                        columns
                      )
                    );
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
            )
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
            <div className="flex w-full min-w-0 min-h-0 flex-col">
            <Popover
              open={multiPopoverOpen}
              onOpenChange={(o) => {
                setMultiPopoverOpen(o);
                if (o) setHdrMultiSearch("");
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
                    onCommit(upsertFieldFilter(filterModel, field, { operator: built.operator, value: built.value }, columns));
                  }
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-6 min-h-0 w-full min-w-0 max-w-full justify-start truncate px-0 text-left text-[11px] font-normal text-foreground hover:bg-transparent"
                  title={multiSummaryLabel}
                  aria-label={lt("columnFilterValueLabel", "Valor")}
                >
                  {multiSummaryLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="flex w-80 max-h-[28rem] flex-col gap-2 overflow-hidden p-3">
                {isRemoteSingleSelect ? (
                  <>
                    <Input
                      className="h-8 text-xs"
                      value={hdrMultiSearch}
                      onChange={(e) => setHdrMultiSearch(e.target.value)}
                      placeholder={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
                      aria-label={lt("filterPanelAsyncSelectSearch", "Pesquisar…")}
                    />
                    <div className="max-h-36 min-h-[4.5rem] overflow-y-auto rounded-md border border-border py-1">
                      {hdrMultiSearch.trim() === "" ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectIdleHint", "Digite para pesquisar…")}
                        </div>
                      ) : hdrLoadingMulti && hdrRemoteOptsMulti.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectLoading", "A carregar…")}
                        </div>
                      ) : hdrRemoteOptsMulti.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          {lt("filterPanelAsyncSelectEmpty", "— sem resultados —")}
                        </div>
                      ) : (
                        hdrRemoteOptsMulti.map((o) => (
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
                                if (on) hdrMultiCacheRef.current.set(o.value, o);
                                else hdrMultiCacheRef.current.delete(o.value);
                                setMultiSelected(next);
                                setHdrMultiBump((x) => x + 1);
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
                                    upsertFieldFilter(
                                      filterModel,
                                      field,
                                      { operator: built.operator, value: built.value },
                                      columns
                                    )
                                  );
                                }
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
                    <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                      {multiSelected.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        multiSelected.map((k) => {
                          const lab =
                            hdrMultiCacheRef.current.get(k)?.label ??
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
                                  hdrMultiCacheRef.current.delete(k);
                                  setMultiSelected(next);
                                  setHdrMultiBump((x) => x + 1);
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
                                      upsertFieldFilter(
                                        filterModel,
                                        field,
                                        { operator: built.operator, value: built.value },
                                        columns
                                      )
                                    );
                                  }
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
                                upsertFieldFilter(
                                  filterModel,
                                  field,
                                  { operator: built.operator, value: built.value },
                                  columns
                                )
                              );
                            }
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

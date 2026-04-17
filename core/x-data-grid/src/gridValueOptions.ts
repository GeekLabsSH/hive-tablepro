import type { GridColDef, GridRowId, GridValidRowModel, GridValueOptionsList } from "./types";

/** Resolve `valueOptions` estático ou função (MUI X) para a linha indicada. */
export function resolveColValueOptions<R extends GridValidRowModel>(
  col: GridColDef<R>,
  id: GridRowId,
  row: R
): GridValueOptionsList | undefined {
  const vo = col.valueOptions;
  if (vo == null) return undefined;
  if (typeof vo === "function") {
    return vo({ id, field: col.field, row });
  }
  return vo;
}

/** Há opções de seleção (array não vazio ou função). */
export function colHasValueOptions<R extends GridValidRowModel>(col: GridColDef<R>): boolean {
  const vo = col.valueOptions;
  if (vo == null) return false;
  if (typeof vo === "function") return true;
  return vo.length > 0;
}

/** `singleSelect` com opções estáticas ou carregamento assíncrono (`loadEditValueOptions` / `async`). */
export function colHasFilterableSingleSelect<R extends GridValidRowModel>(col: GridColDef<R>): boolean {
  if (col.type !== "singleSelect") return false;
  return colHasValueOptions(col) || col.async === true || col.loadEditValueOptions != null;
}

/** Rótulo de célula `singleSelect` alinhado ao render por defeito da grelha. */
export function formatSingleSelectDisplay(
  raw: unknown,
  options: GridValueOptionsList | undefined
): string {
  if (options == null || options.length === 0) return raw == null ? "" : String(raw);
  for (const o of options) {
    if (o !== null && typeof o === "object" && "value" in o) {
      const opt = o as { value: string | number; label: string };
      if (Object.is(opt.value, raw) || String(opt.value) === String(raw)) return opt.label;
    } else if (Object.is(o, raw) || String(o) === String(raw)) {
      return String(o);
    }
  }
  return raw == null ? "" : String(raw);
}

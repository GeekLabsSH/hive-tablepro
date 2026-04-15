import type {
  GridColDef,
  GridFilterModel,
  GridLocaleText,
  GridSortModel,
  GridValidRowModel
} from "./types";

export type GridLocaleTextLookup = (key: keyof GridLocaleText, fallback: string) => string;

/** Mensagem para leitores de ecrã quando o modelo de ordenação muda. */
export function announceTextForSortModel<R extends GridValidRowModel>(
  model: GridSortModel,
  columns: GridColDef<R>[],
  lt: GridLocaleTextLookup
): string {
  if (!model.length) {
    return lt("gridAnnounceSortCleared", "Ordenação removida.");
  }
  const bits = model.map((item) => {
    const col = columns.find((c) => c.field === item.field);
    const label = String(col?.headerName ?? item.field);
    if (item.sort === "desc") {
      return `${label} (${lt("gridAnnounceSortDirectionDesc", "decrescente")})`;
    }
    if (item.sort === "asc") {
      return `${label} (${lt("gridAnnounceSortDirectionAsc", "crescente")})`;
    }
    return label;
  });
  return lt("gridAnnounceSortChanged", "Ordenação: {detail}.").replace("{detail}", bits.join(", "));
}

/** Mensagem quando o modelo de filtro (itens + filtro rápido) muda. */
export function announceTextForFilterModel(model: GridFilterModel, lt: GridLocaleTextLookup): string {
  const items = model.items ?? [];
  const quickVals = model.quickFilterValues ?? [];
  const hasQuick = quickVals.some((v) => String(v).trim().length > 0);
  if (items.length === 0 && !hasQuick) {
    return lt("gridAnnounceFilterCleared", "Filtros removidos.");
  }
  const count = items.length + (hasQuick ? 1 : 0);
  return lt("gridAnnounceFilterActive", "Filtros atualizados. {count} condição(ões) ativa(s).").replace(
    "{count}",
    String(count)
  );
}

/** Espelho mínimo de `src/utils/tableFunctions.tsx` do ProtonWeb (filtros persistidos). */

export function getFilterTableConfig({ tableName }: { tableName?: string }) {
  if (!tableName) {
    return null;
  }

  const savedConfig = localStorage.getItem(tableName + "_Filter");

  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return null;
}

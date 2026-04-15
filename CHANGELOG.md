# Changelog

## 2.3.2

- **Export:** `GridActionsCellItem`, `GridEditInputCell` e o tipo `GridActionsCellItemProps` na entrada principal `@geeklabssh/hive-tablepro`, para consumidores Next.js/webpack sem depender do subpath `core/x-data-grid-premium/src` (útil quando a versão instalada ainda não declara esse export no `package.json`).

## 2.3.0

- **DataGrid (#153):** tokens dedicados **`--hive-grid-*`** (`hive-data-grid-theme.css`) e cores Tailwind **`hiveGrid`**; raiz com classe `hive-data-grid`; superfícies (cabeçalho, linhas virtualizadas, rodapé de agregação, overlay de loading, paginação, foco de célula) passam a usar esses tokens (sobrescrevíveis no ProtonWeb).
- **E2E / #150:** teste Playwright G5.6 mede **milissegundos** até «Row 500» visível após scroll, anotação `perf` no relatório e limiar 20s para regressões graves.
- **Backlog:** `docs/DATA_GRID_BACKLOG.md` — macro **G6** e **Bloco 16** (#144–153) fechados.

## 2.2.2

- **DataGrid:** `SortableContext` do `@dnd-kit`: `items` só inclui cabeçalhos **com `useSortable`** (colunas arrastáveis); exclui `__select__`/painéis, colunas **pinned** e `disableReorder` (antes esses ids estavam em `items` mas renderizavam `TableHead` sem sortable → travamento e cabeçalhos desalinhados). Continua a alinhar a visibilidade (sem colunas ocultas em `items`). Memos de folhas dependem de `columnVisibilityModel`.
- **DataGrid:** `HeaderSortableWrap` omite `SortableContext` quando `disableColumnReorder` ou não há ids arrastáveis; nova prop **`disableColumnReorder`** para desligar o DnD de cabeçalhos (válvula de segurança vs. fork MUI em `origin/main`).
- **DataGrid:** `getStateSnapshot` estabilizado para a API (`getStateSnapshotForApi` + ref); efeitos `onStateChange` / `subscribeEvent` deixam de depender da identidade da função — evita recriar `gridApi` e cascatas de efeitos ao mudar só a **seleção de linhas** (travamentos).
- **DataGrid:** `localeText` com `checkboxSelectionSelectAll` / `checkboxSelectionSelectRow` (ARIA da coluna de seleção).
- **HiveDataTable:** hook `useHiveDataTableCore`, `HiveDataTableLocale` / `mergeHiveDataTableLocale`, `onRowClick` com `isDataCellInteractiveTarget`.
- **Storybook 8:** `npm run storybook`, história `stories/DataGrid.stories.tsx`, `build-storybook` (saída `storybook-static/`).
- **Backlog:** itens que estavam 🔶 passam a ✅ (`docs/DATA_GRID_BACKLOG.md`).

## 2.2.1

- **DataGrid:** `defaultPreferences` (merge com storage em `preferencesKey`).
- **i18n:** resumo de filtros no painel (`GridFilterPanel`) usa `localeText` para operadores de data/hora.
- **Export:** `isDataCellInteractiveTarget` (reutilização com `HiveDataTable` / consumidores).
- **CI:** workflow GitHub Actions (`typecheck`, `check-imports`, Vitest).
- Documentação: README (API imperativa, validação de tema, CI).

## 2.2.0

- **DataGrid:** virtualização horizontal de colunas (`columnVirtualization`); alturas de linha variáveis na virtualização (`getEstimatedRowHeight`, `enableVariableRowHeight`); persistência opcional (`preferencesKey`, debounce, `onPreferencesChange`).
- **GridApi:** `getCellMode`, `setEditCellValue`; `subscribeEvent` alarga a `rowSelectionChange`, `filterChange`, `sortChange`.
- **Qualidade:** testes `createGridApi`; Playwright smoke (`npm run test:e2e`); `localeText.columnReorderAria`.
- Documentação: [`docs/DATA_GRID_BACKLOG.md`](docs/DATA_GRID_BACKLOG.md) (blocos 12–16).

## 2.1.0

- **Compatibilidade MUI X Data Grid** (sem pacote `@mui/*`): caminho de import `@geeklabssh/hive-tablepro/core/x-data-grid/src` com `DataGrid`, `DataGridPro`, `DataGridPremium` (aliases), `useGridApiRef`, tipos `GridColDef`, `GridSortModel`, `filterModel`, etc.
- Funcionalidades na `DataGrid`: `rows` / `columns` estilo MUI, ordenação, filtro global (quick filter), `filterModel` com operadores comuns, paginação client/server (`paginationMode`, `rowCount`), seleção com `checkboxSelection`, visibilidade de colunas, **redimensionamento** de colunas, **reordenação por arrastar** (`@dnd-kit`), `getRowId`, `loading`, `density`, `apiRef` com métodos essenciais incl. `exportDataAsCsv`.
- Stub mínimo em `core/x-data-grid/src/internals` para imports antigos.
- **Não incluído** nesta camada: tree data, grouping, detail panel, pinning, agregação, alguns slots/toolbar MUI — ecrãs que usem essas APIs precisam de ajuste pontual ou extensão futura.

## 2.0.2

- Ícones: substituição de `lucide-react` por **`@heroicons/react`** (outline 24px na UI geral; `CheckIcon` em `20/solid` no checkbox), alinhado ao ecossistema Tailwind/Heroicons.

## 2.0.1

- Tema visual alinhado ao **shadcn/ui default (slate)**: variáveis `--foreground` / `--card-foreground` consistentes, paleta `--chart-*`, tokens `--sidebar-*`, `antialiased` e `font-feature-settings` no `body`; `tailwind.config` com `container`, `fontFamily` via `--font-sans` / `--font-mono`, cores `chart` e `sidebar` mapeadas para utilitários Tailwind.

## 2.0.0

**Breaking:** remoção completa do fork MUI (Material, System, MUI X Data Grid, Date Pickers). O pacote passa a ser uma biblioteca em React 18 com **Tailwind CSS**, componentes estilo **shadcn** (primitivos **Radix UI**), **TanStack Table** e **TanStack Virtual**.

### O que mudou

- Imports antigos do tipo `@geeklabssh/hive-tablepro/core/x-data-grid/...` ou `core/mui-material/...` deixam de existir.
- Nova API centrada em `HiveDataTable`, `HiveDatePicker`, helpers `exportRowsToCsv` / `exportRowsToExcel`, e reexport dos componentes UI em `src/components/ui/*`.
- O consumidor (ex.: ProtonWeb) deve importar `@geeklabssh/hive-tablepro/styles.css` (ou incluir o mesmo design tokens no seu CSS) e configurar o **Tailwind** para incluir este pacote no `content`.
- Eliminadas dependências **Emotion** e todo o código sob `core/`.

### Migração

Ver secção “Migração da v1 (MUI) para v2” no `README.md`.

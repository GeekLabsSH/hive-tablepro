# Backlog ficheiro-a-ficheiro — paridade 100% hive-tablepro (sem MUI)

Documento vivo: substitui os backlogs antigos em `DATA_GRID_BACKLOG.md` e `PROTONWEB_TABLE_PARITY_BACKLOG.md` como **fonte de verdade** para o trabalho restante. Referência comportamental: API **MUI X Data Grid** tal como o [ProtonWeb](https://github.com/) a consome via `@geeklabssh/hive-tablepro` (ver repositório público [GeekLabsSH/hive-tablepro](https://github.com/GeekLabsSH/hive-tablepro)).

**Regenerar a tabela mecânica** (secção no fim deste ficheiro): na raiz do pacote correr `npm run backlog:skeleton` e substituir desde `<!-- Gerado por:` até ao fim da tabela por ficheiros, **ou** sobrescrever `docs/HIVE_TABLEPRO_FILE_AND_API_BACKLOG.md` com `Get-Content docs/_hive_backlog_intro.md, docs/_backlog_table_tmp.md` após gerar `docs/_backlog_table_tmp.md`.

---

## 1. Definição de paridade

| Critério | Descrição |
| --- | --- |
| Contrato TypeScript | Exports do barrel `src/index.ts` e `package.json` → `exports` alinhados com o que o ProtonWeb importa; tipos equivalentes aos do MUI X onde documentado em `core/x-data-grid/src/types.ts`. |
| Comportamento | Edição (linha/célula), filtros, pin/reorder/resize, virtualização, densidade, seleção, clipboard, export, preferências — equivalente **perceptível** ao fluxo MUI que os utilizadores esperam. |
| Stack | Apenas Tailwind + shadcn/Radix + TanStack; **sem** `@mui/*`. `core/mui-material` é ponte a extinguir (não usar em `ProtonWeb/src` — ver `lint:tablepro`). |

---

## 2. Inventário ProtonWeb (snapshot)

- **Ficheiros que importam o pacote:** 278 (lista completa em `scripts/data/protonweb-inventory.json`, campo `importFilesRelative`).
- **Símbolos mais importados (contagem de ficheiros):** `GridActionsCellItem` (221), `GridRowModesModel` (217), `GridRowModes` (137), `GridRowModel` (137), `rowModeEntryIsEdit` (134), `GridPreProcessEditCellProps` (125), `GridColDef` (119), `GridValidRowModel` (114), `GridRowSelectionModel` (46), `GRID_CHECKBOX_SELECTION_COL_DEF` (27), …
- **Atualizar inventário:** `npm run inventory:protonweb`

**Referência de uso real:** [`ProtonWeb/src/utils/tableFunctions.tsx`](../../protonerp/src/front-end/ProtonWeb/src/utils/tableFunctions.tsx) (`StyledDataGridPro`, `DataGridPremium`, toolbar); módulos de custos com `rowModesModel` / `processRowUpdate`, ex.: [`operation/oceanexport/costs.tsx`](../../protonerp/src/front-end/ProtonWeb/src/submodules/operation/oceanexport/costs.tsx).

---

## 3. Convenções e gates no ProtonWeb (novo padrão)

| Gate | Ficheiro | Regra |
| --- | --- | --- |
| `npm run lint:tablepro` | `scripts/check-tablepro-boundaries.mjs` | **Proíbe** imports `@geeklabssh/hive-tablepro/core/mui-*` e subpaths `x-data-grid-pro` / `x-data-grid-premium` em `src/`. Consumir o **barrel** `@geeklabssh/hive-tablepro` ou `@/components/ui`. |
| `npm run lint:style-gates` | `scripts/check-style-gates.mjs` | Reduz estilos legados (SCSS/modules, `style={{}}`, cores hardcoded, classes Tailwind arbitrárias `bg-[#...]`). Alinhar tokens com Tailwind e CSS variables (`hive-data-grid-theme.css`). |

**Pacote hive-tablepro:** variáveis e classes em `src/styles/hive-data-grid-theme.css`; primitives em `src/components/ui/*`. Evoluir a documentação deste ficheiro quando fechar itens de paridade.

---

## 4. Matriz `GridApiCommunity` → implementação → testes

Implementação principal: [`core/x-data-grid/src/api/createGridApi.ts`](../core/x-data-grid/src/api/createGridApi.ts). Callbacks injetados desde [`DataGrid.tsx`](../core/x-data-grid/src/DataGrid.tsx) + motor [`src/table/useHiveDataTableCore.tsx`](../src/table/useHiveDataTableCore.tsx).

| Método API | Onde está a lógica | Teste (Vitest) / notas |
| --- | --- | --- |
| `getRow` | `createGridApi` → `getTable().getRow` | Integração indireta `DataGrid.interaction.test.tsx` |
| `getRowId` | opções `opts.getRowId` | — |
| `getAllColumns` / `getVisibleColumns` / `getColumn` | `createGridApi` + TanStack | `createGridApi.test.ts` (uso em export/clipboard) |
| `setColumnVisibility` | opções | `DataGrid.interaction.test.tsx` |
| `setSortModel` / `getSortModel` | opções | `adapter.test.ts`, `DataGrid.interaction.test.tsx` |
| `setFilterModel` / `getFilterModel` | opções | `filterFns.test.ts` |
| `setPaginationModel` / `getPaginationModel` | opções | `DataGrid.interaction.test.tsx` |
| `setRowSelectionModel` / `getRowSelectionModel` | opções | `selectionUtils.test.ts`, `DataGrid.interaction.test.tsx` |
| `exportDataAsCsv` / `exportDataAsExcel` / `exportDataAsPrint` | `createGridApi` + `src/export/*` | OK `createGridApi.exports.test.ts` (mocks) |
| `copySelectedRowsToClipboard` | `createGridApi` + `gridExport` | OK `createGridApi.test.ts` (`navigator.clipboard` mock) |
| `setPinnedColumns` / `getPinnedColumns` | opções | OK `createGridApi.test.ts` |
| `setDetailPanelExpandedRowIds` / `get*` | `createGridApi` → `setExpanded` TanStack | OK `createGridApi.test.ts` |
| `setTreeExpandedRowIds` / `get*` | idem | OK `createGridApi.test.ts` |
| `setRowGroupingModel` / `getRowGroupingModel` | `getTable().setGrouping` | OK `createGridApi.test.ts` |
| `getStateSnapshot` | opções | `persistGridPreferences.test.ts` / integração |
| `subscribeEvent` | opções `subscribeEventDispatch` | `DataGrid.interaction.test.tsx` |
| `scroll` / `scrollToIndexes` / `scrollToRow` | `createGridApi` + contentor scroll | OK `createGridApi.test.ts` |
| `setCellFocus` | DOM `querySelector` data attributes | OK `DataGrid.interaction.test.tsx` (edição em linha) |
| `startCellEditMode` / `stopCellEditMode` / `getCellMode` / `setEditCellValue` | opções (ligadas ao hook) | OK `createGridApi.test.ts` |
| `showFilterPanel` / `hideFilterPanel` | opções `openFilterPanel` / `closeFilterPanel` | OK `createGridApi.test.ts` |
| `updateRows` | `opts.onRowsChange` | `clipboardPaste.test.ts` |
| `applyTransaction` | `opts.onRowTransaction` | OK `createGridApi.test.ts` |
| `getRowModesModel` / `setRowModesModel` | opções | OK `createGridApi.test.ts`, `rowEditProtonPattern.test.tsx` |
| `getDensity` / `setDensity` | opções | OK `createGridApi.test.ts` |

**Estado geral da matriz:** OK para métodos listados com evidência em Vitest; E2E Storybook complementa fluxos em `e2e/storybook/datagrid.spec.ts` (incl. `PlaywrightParityQuickFilter`, `PlaywrightParityActionsColumn`). `getRowId` isolado permanece implícito nas opções da API.

---

## 5. `DataGridProps` e slots (checklist)

Fonte de verdade dos nomes: [`core/x-data-grid/src/dataGridProps.ts`](../core/x-data-grid/src/dataGridProps.ts).

- **Dados / colunas:** `rows`, `columns`, `getRowId`, `loading` — OK base; auditar performance com volumes ProtonWeb.
- **Ordenação / filtros / paginação:** `sortModel`, `filterModel`, `paginationModel`, modos servidor/cliente, `paginationMeta`, `rowCount` — auditar paridade com operações financeiras.
- **Seleção:** `checkboxSelection`, `radioSelection`, `rowSelectionModel`, `checkboxSelectionSelectAllPages`, `isRowSelectable` — `selectionUtils.test.ts`.
- **Colunas:** resize, reorder (`disableColumnReorder` + DnD), pin, `columnVisibilityModel`, menus.
- **Virtualização / altura:** `disableVirtualization`, `autoHeight`, `columnVirtualization`, `getEstimatedRowHeight`, `enableVariableRowHeight`.
- **Edição:** `editMode`, `rowModesModel`, `processRowUpdate`, `onRowsChange`, `onRowTransaction`, `onRowEditStart` / `onRowEditStop`, `showRowEditActions`, `isCellEditable`, `preProcessEditCellProps` (em `GridColDef`) — **épico crítico** (secção 6).
- **Detalhe / árvore / agrupamento:** `getDetailPanelContent`, `treeData`, `rowGroupingModel`, `aggregationModel`, `showAggregationFooter`.
- **UX:** `localeText`, `slots` / `slotProps` (`toolbar`, `footer`, `pagination`, `filterPanel`, `rowEditActions`, overlays).
- **Persistência:** `preferencesKey`, `preferencesStorage`, `defaultPreferences`, `onPreferencesChange` — `persistGridPreferences.test.ts`.
- **Clipboard:** `disableClipboardCopy`, `disableClipboardPaste`, `onClipboardPaste` — `clipboardPaste.test.ts`.
- **Export default filenames:** `csvOptions`, `excelOptions`.
- **Acessibilidade:** `disableAccessibilityAnnouncements`, `getRowAriaLabel` — `gridAnnouncements.test.ts`.

Cada prop deve ter no índice mecânico (ficheiro `DataGrid.tsx` / `dataGridProps.ts`) a coluna **Estado** atualizada para `OK` / `parcial` quando fechado.

---

## 6. Épico: edição por linha e por célula (paridade MUI / ProtonWeb)

| Aspeto MUI / ProtonWeb | Onde vive na implementação | Backlog de teste |
| --- | --- | --- |
| `editMode="row"` + `rowModesModel` controlado | `DataGrid.tsx`, `useHiveDataTableCore.tsx` | [`rowEditCostsPattern.test.tsx`](../core/x-data-grid/src/rowEditCostsPattern.test.tsx) (padrão tipo `costs.tsx`: gravar / cancelar) |
| `fieldToFocus`, `ignoreModifications` em `GridRowModeEntry` | Parsing em `types.ts` + foco em `DataGrid` / API `setCellFocus` | Testes RTL: entrar em edição e foco na coluna certa |
| `preProcessEditCellProps` / validação | Coluna + fluxo de commit | Extrair casos de `costs.tsx` (erro, `error` na célula) |
| `processRowUpdate` async / rejeição | `DataGrid.tsx` | Teste: promise rejeitada mantém edição |
| `onProcessRowUpdateError` (se exposto) | Verificar paridade com MUI | Alinhar prop e teste |
| `GridEditInputCell` / editores custom `renderEditCell` | `GridCells.tsx` + integração shadcn | Story + RTL por tipo (`singleSelect`, número, data) |
| Navegação Tab entre células em modo linha | `rowEditTabNavigate` em `DataGrid.tsx` | Teste teclado |
| Ações `GridActionsCellItem` + coluna `type: "actions"` | `GridActionsCell.tsx`, `getActions.test.tsx` | Cobrir ícones e `showInMenu` |

---

## 7. Plano de extinção `core/mui-material`

| Export (barrel `core/mui-material/src/index.ts`) | Substituto alvo | ProtonWeb |
| --- | --- | --- |
| `Box`, `Stack`, `Typography`, `Paper`, `Container`, `Grid`, `Divider` | Layout Tailwind + `src/components/ui` no app | **Não** importar `mui-material` em `src/` (lint) |
| `Button`, `IconButton`, `Fab`, `Checkbox`, `TextField`, `Input`, `Select/*` | `@/components/ui/*` | Idem |
| `Dialog*`, `Tooltip`, `List`, `Link`, `Chip`, `Progress`, `Card`, `AppBar`, `Form` | shadcn/Radix equivalentes | Idem |
| `Theme`, `useMediaQuery` | tema app + hook local se necessário | Idem |

**Objetivo:** remover o export `package.json` → `./core/mui-material/src` quando não houver consumidores externos; até lá, manter apenas para compatibilidade de pacotes antigos.

---

## 8. Ficheiros críticos — template expandido

### `core/x-data-grid/src/DataGrid.tsx`

| Campo | Valor |
| --- | --- |
| **Papel** | Orquestração UI da grelha, ligação TanStack, props MUI-compat. |
| **Símbolos** | `DataGrid`, `DataGridPro`, `DataGridPremium` |
| **Paridade alvo** | MUI X Data Grid Pro/Premium |
| **Estado** | parcial (edição / edge cases) |
| **Substituição** | Manter nomes públicos. |
| **Implementação atual** | + `useHiveDataTableCore.tsx` |
| **Testes** | `DataGrid.interaction.test.tsx`, `rowEditCostsPattern.test.tsx`, e2e Storybook |
| **Consumo ProtonWeb** | Via `StyledDataGridPro` / uso direto — maior parte dos 278 ficheiros |

### `src/table/useHiveDataTableCore.tsx`

| Campo | Valor |
| --- | --- |
| **Papel** | Estado TanStack, edição, virtualização, seleção. |
| **Símbolos** | hook interno (não exportado no barrel principal como API MUI) |
| **Estado** | parcial |
| **Testes** | Indiretos + testes de hook se extraídos |
| **Consumo ProtonWeb** | Indireto |

### `core/x-data-grid/src/types.ts`

| Campo | Valor |
| --- | --- |
| **Papel** | `GridApiCommunity`, `GridColDef`, eventos, modelos de estado. |
| **Estado** | OK estrutural; auditar com MUI quando em dúvida |
| **Testes** | Compilação + usos nos testes |

### `src/index.ts`

| Campo | Valor |
| --- | --- |
| **Papel** | API pública npm |
| **Testes** | `npm run check-imports` |

---

## 9. Índice mecânico de ficheiros (tabela)

A tabela seguinte lista **cada ficheiro** relevante do pacote com colunas a preencher ao fechar paridade. Regenerar com `npm run backlog:skeleton`.

---

<!-- Gerado por: node scripts/generate-file-backlog-skeleton.mjs -->

## Índice mecânico de ficheiros do pacote (esqueleto)

| Caminho (rel. hive-tablepro-src/) | Papel (preencher) | Estado | Testes | Consumo ProtonWeb |
| --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` | CI GitHub Actions | a auditar | — | — |
| `.gitignore` | — | a auditar | — | — |
| `.storybook/main.ts` | — | a auditar | — | — |
| `.storybook/preview.ts` | — | a auditar | — | — |
| `CHANGELOG.md` | — | a auditar | — | — |
| `README.md` | — | a auditar | — | — |
| `components.json` | — | a auditar | — | — |
| `core/mui-material/src/AppBar.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Box.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/ButtonCompat.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Card.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/CheckboxCompat.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Chip.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Container.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/DialogCompat.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Divider.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Fab.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Form.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Grid.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/IconButton.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/InputCompat.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Link.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/List.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Paper.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Progress.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Stack.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/TextField.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Theme.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/TooltipCompat.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/Typography.tsx` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/index.ts` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/mui-material/src/useMediaQuery.ts` | Compat MUI → shadcn (extinção; não usar em ProtonWeb/src) | a auditar | — | — |
| `core/x-data-grid-premium/src/index.ts` | Reexports compat `@mui/x-data-grid-premium` | a auditar | — | — |
| `core/x-data-grid-pro/src/index.ts` | Reexports compat `@mui/x-data-grid-pro` | a auditar | — | — |
| `core/x-data-grid/src/ColumnFilterDialog.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/DataGrid.interaction.test.tsx` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/DataGrid.tsx` | Componente `DataGrid` / `DataGridPro` / `DataGridPremium`; orquestra TanStack + UI | a auditar | — | — |
| `core/x-data-grid/src/GridActionsCell.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/GridCells.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/GridErrorBoundary.test.tsx` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/GridErrorBoundary.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/GridFilterPanel.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/GridRootContext.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/GridRowEditActions.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/adapter.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/adapter.ts` | Adaptação colunas MUI → TanStack | a auditar | — | — |
| `core/x-data-grid/src/api/createGridApi.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/api/createGridApi.ts` | Fábrica `createGridApi` → `GridApiCommunity` | a auditar | — | — |
| `core/x-data-grid/src/api/index.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/clipboardPaste.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/clipboardPaste.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/comparators.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/constants.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/dataGridProps.ts` | Tipo `DataGridProps`, slots e `GridSlots` | a auditar | — | — |
| `core/x-data-grid/src/filterFns.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/filterFns.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/getActions.test.tsx` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/gridAnnouncements.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/gridAnnouncements.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/gridExport.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/gridToolbar.tsx` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/hooks/useGridApiRef.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/index.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/internals/index.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/isDataCellInteractiveTarget.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/isDataCellInteractiveTarget.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/persistGridPreferences.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/persistGridPreferences.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/rowEditCostsPattern.test.tsx` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/selectionUtils.test.ts` | Testes Vitest | a auditar | — | — |
| `core/x-data-grid/src/selectionUtils.ts` | Núcleo Data Grid MUI-compat | a auditar | — | — |
| `core/x-data-grid/src/types.ts` | Tipos e contratos MUI-compat (`GridColDef`, `GridApiCommunity`, …) | a auditar | — | — |
| `e2e/smoke.spec.ts` | Testes Playwright | a auditar | — | — |
| `e2e/storybook/datagrid.spec.ts` | Testes Playwright | a auditar | — | — |
| `models/CommonTypes.ts` | Tipos espelhados do ProtonWeb para compilar o pacote isolado | a auditar | — | — |
| `package.json` | — | a auditar | — | — |
| `playground/src/App.tsx` | Vite playground dev | a auditar | — | — |
| `playground/src/main.tsx` | Vite playground dev | a auditar | — | — |
| `playwright.config.ts` | Config Playwright | a auditar | — | — |
| `playwright.storybook.config.ts` | Config Playwright (Storybook) | a auditar | — | — |
| `postcss.config.cjs` | — | a auditar | — | — |
| `scripts/data/protonweb-inventory.json` | Cache JSON do inventário ProtonWeb | a auditar | — | — |
| `scripts/extract-imports.mjs` | — | a auditar | — | — |
| `scripts/generate-file-backlog-skeleton.mjs` | Gera tabela mecânica deste backlog | a auditar | — | — |
| `scripts/normalize-package-scope.mjs` | — | a auditar | — | — |
| `scripts/protonweb-table-inventory.mjs` | Inventário de imports no ProtonWeb | a auditar | — | — |
| `src/components/ui/button.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/calendar.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/checkbox.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/dialog.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/dropdown-menu.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/input.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/popover.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/scroll-area.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/select.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/table.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/components/ui/tooltip.tsx` | Primitives shadcn/Radix reutilizados pela grelha | a auditar | — | — |
| `src/date-picker/hive-date-picker.tsx` | — | a auditar | — | — |
| `src/date-picker/index.ts` | — | a auditar | — | — |
| `src/export/csv-excel.ts` | CSV / Excel / print usados pela API de export | a auditar | — | — |
| `src/export/index.ts` | CSV / Excel / print usados pela API de export | a auditar | — | — |
| `src/export/infer-export-columns-from-tanstack.ts` | CSV / Excel / print usados pela API de export | a auditar | — | — |
| `src/export/print-html.ts` | CSV / Excel / print usados pela API de export | a auditar | — | — |
| `src/index.ts` | Barrel público npm `@geeklabssh/hive-tablepro` | a auditar | — | — |
| `src/lib/utils.ts` | — | a auditar | — | — |
| `src/styles/globals.css` | — | a auditar | — | — |
| `src/styles/hive-data-grid-theme.css` | — | a auditar | — | — |
| `src/table/hive-data-table.tsx` | Camada tabela TanStack (`HiveDataTable`, locale) | a auditar | — | — |
| `src/table/hiveDataTableLocale.ts` | Camada tabela TanStack (`HiveDataTable`, locale) | a auditar | — | — |
| `src/table/index.ts` | Camada tabela TanStack (`HiveDataTable`, locale) | a auditar | — | — |
| `src/table/useHiveDataTableCore.tsx` | Hook motor TanStack (edição, virtualização, estado) | a auditar | — | — |
| `stories/DataGrid.stories.tsx` | Storybook | a auditar | — | — |
| `tailwind.config.ts` | Preset Tailwind do pacote | a auditar | — | — |
| `tsconfig.json` | — | a auditar | — | — |
| `utils/constants.ts` | Utilitários espelhados / mínimos | a auditar | — | — |
| `utils/functions.ts` | Utilitários espelhados / mínimos | a auditar | — | — |
| `utils/hooks.ts` | Utilitários espelhados / mínimos | a auditar | — | — |
| `utils/tableFunctions.tsx` | Utilitários espelhados / mínimos | a auditar | — | — |
| `vite.config.ts` | — | a auditar | — | — |
| `vitest.config.ts` | Config Vitest | a auditar | — | — |
| `vitest.setup.ts` | Setup global Vitest (jsdom) | a auditar | — | — |

### Referência: ficheiros ProtonWeb que importam o pacote

Total: **278** (ver `scripts/data/protonweb-inventory.json`).

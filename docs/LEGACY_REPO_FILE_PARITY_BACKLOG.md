# Backlog de paridade — repositório legado `GeekLabsSH/hive-tablepro` → pacote v2 (Tailwind + shadcn)

Este documento substitui os backlogs anteriores em `docs/*BACKLOG*.md` como **fonte de verdade** para o trabalho de paridade com o fork MUI X publicado em [GeekLabsSH/hive-tablepro](https://github.com/GeekLabsSH/hive-tablepro/tree/main). O pacote v2 vive na raiz deste repositório (`@geeklabssh/hive-tablepro`).

## 1. Definição de paridade

| Critério | Descrição |
| --- | --- |
| Contrato TypeScript | Exports do barrel [`src/index.ts`](../src/index.ts) alinhados com o que o ProtonWeb importa de `@geeklabssh/hive-tablepro`. |
| Comportamento | Edição (linha/célula), filtros, pin/reorder/resize, virtualização, densidade, seleção, clipboard, export, preferências — equivalente ao fluxo MUI X que os utilizadores esperam. |
| Stack | Apenas Tailwind + shadcn/Radix + TanStack; **sem** `@mui/*`. A ponte [`core/mui-material`](../core/mui-material/src) é temporária e não deve ser usada no ProtonWeb. |

## 2. Categorias de ficheiros legados (coluna `cat` na matriz)

| Código | Significado | Critério de paridade |
| --- | --- | --- |
| **A** | Superfície pública / reexport (ex.: `utils/`) | Contrato explícito + tipo + teste ou uso ProtonWeb. |
| **B** | Fork MUI interno (`core/…`) | Paridade **comportamental** agregada na nova grelha (`core/x-data-grid`, `src/table`), não linha-a-linha do ficheiro legado. |
| **C** | Modelos partilhados (`models/`) | Tipos usados pela app; mapear para [`core/x-data-grid/src/types.ts`](../core/x-data-grid/src/types.ts) ou barrel. |
| **D** | Scripts / tooling (`scripts/`) | Equivalência de pipeline (npm scripts, CI, inventário). |

## 3. Inventário ProtonWeb e gate `lint:tablepro`

- **Gerar inventário:** `npm run inventory:protonweb` (escreve [`scripts/data/protonweb-inventory.json`](../scripts/data/protonweb-inventory.json)).
- **Consumidor:** `protonerp/src/front-end/ProtonWeb/src` (path por omissão no script).
- **Gate no ProtonWeb:** `npm run lint:tablepro` → [`scripts/check-tablepro-boundaries.mjs`](../../protonerp/src/front-end/ProtonWeb/scripts/check-tablepro-boundaries.mjs) (proíbe `@geeklabssh/hive-tablepro/core/mui-*` fora da allowlist, tipicamente `utils/tableFunctions.tsx`).

### Plano de remoção de `core/mui-*` no ProtonWeb

1. **Manter** o gate em CI; qualquer novo import `core/mui-material` ou `x-data-grid-pro` / `premium` por subpath deve falhar o lint.
2. **Substituir** usos remanescentes na allowlist por componentes `@/components/ui` ou pelo barrel `@geeklabssh/hive-tablepro`.
3. **Fechar por épico** no backlog: quando um símbolo da matriz API (secção 5) estiver OK com testes, marcar o item e auditar o ProtonWeb com grep ao subpath legado.
4. **Meta:** zero imports `@geeklabssh/hive-tablepro/core/mui-*` no `ProtonWeb/src` (allowlist vazia).

## 4. Automação: matriz ficheiro-a-ficheiro

| Comando | Efeito |
| --- | --- |
| `npm run legacy:sync` | Clone ou `git pull` do legado em `../_reference/hive-tablepro-legacy` (ou `HIVE_TABLEPRO_LEGACY_ROOT`). |
| `npm run backlog:legacy-matrix` | Gera [`_generated/legacy-matrix.json`](_generated/legacy-matrix.json), [`_generated/legacy-matrix.fragment.md`](_generated/legacy-matrix.fragment.md) (tabela completa) e atualiza o resumo entre os marcadores abaixo. |
| `npm run backlog:execute` | **Pipeline único:** `inventory:protonweb` → `legacy:sync` → `backlog:legacy-matrix` → `typecheck` → `check-imports` → `test`. Opcional: `SKIP_LEGACY_SYNC=1`, `SKIP_LEGACY_MATRIX=1`, `RUN_E2E=1` (ver [`scripts/run-full-backlog.mjs`](../scripts/run-full-backlog.mjs)). |

**Colunas geradas:** `legacy_path`, `cat`, `substituído` (heurística), `hits PW` (soma de contagens de símbolos importados no ProtonWeb), amostra de exports, `pista v2` (primeiro ficheiro v2 onde o símbolo aparece).

CI: workflow [`.github/workflows/legacy-backlog-matrix.yml`](../.github/workflows/legacy-backlog-matrix.yml) (clone legado em `/tmp` + geração do JSON).

## 5. Matriz API `GridApiCommunity` → implementação v2 → testes

Implementação: [`core/x-data-grid/src/api/createGridApi.ts`](../core/x-data-grid/src/api/createGridApi.ts). Injeção de estado em [`DataGrid.tsx`](../core/x-data-grid/src/DataGrid.tsx) e [`useHiveDataTableCore.tsx`](../src/table/useHiveDataTableCore.tsx).

| Método API | Ficheiro principal | Teste / notas |
| --- | --- | --- |
| `getRow` / `getRowId` | `createGridApi.ts` | Integração |
| `getAllColumns` / `getVisibleColumns` / `getColumn` | `createGridApi.ts` | `createGridApi.test.ts` |
| `setColumnVisibility` | `createGridApi.ts` | `DataGrid.interaction.test.tsx` |
| `setSortModel` / `getSortModel` | `createGridApi.ts` | `adapter.test.ts`, interação |
| `setFilterModel` / `getFilterModel` | `createGridApi.ts` | `filterFns.test.ts` |
| `setPaginationModel` / `getPaginationModel` | `createGridApi.ts` | `DataGrid.interaction.test.tsx` |
| `setRowSelectionModel` / `getRowSelectionModel` | `createGridApi.ts` | `selectionUtils.test.ts`, interação |
| `exportDataAsCsv` / `exportDataAsExcel` / `exportDataAsPrint` | `createGridApi.ts` + `src/export/*` | `createGridApi.exports.test.ts` |
| `copySelectedRowsToClipboard` | `createGridApi.ts` + `gridExport.ts` | `createGridApi.test.ts` (mock clipboard) |
| `setPinnedColumns` / `getPinnedColumns` | `createGridApi.ts` | `createGridApi.test.ts` |
| `setDetailPanelExpandedRowIds` / `get*` | `createGridApi.ts` | `createGridApi.test.ts` |
| `setTreeExpandedRowIds` / `get*` | `createGridApi.ts` | `createGridApi.test.ts` |
| `setRowGroupingModel` / `getRowGroupingModel` | `createGridApi.ts` | `createGridApi.test.ts` |
| `getStateSnapshot` | opções | `persistGridPreferences.test.ts` |
| `subscribeEvent` | opções | `DataGrid.interaction.test.tsx` |
| `scroll` / `scrollToIndexes` / `scrollToRow` | `createGridApi.ts` | `createGridApi.test.ts` |
| `setCellFocus` | `createGridApi.ts` | `DataGrid.interaction.test.tsx` |
| `startCellEditMode` / `stopCellEditMode` / `getCellMode` / `setEditCellValue` | opções (`DataGrid`) | `createGridApi.test.ts` |
| `showFilterPanel` / `hideFilterPanel` | `createGridApi.ts` | `createGridApi.test.ts` |
| `updateRows` | `createGridApi.ts` | `clipboardPaste.test.ts` |
| `applyTransaction` | `createGridApi.ts` | `createGridApi.test.ts` |
| `getRowModesModel` / `setRowModesModel` | `createGridApi.ts` | `createGridApi.test.ts`, `rowEditProtonPattern.test.tsx` |
| `getDensity` / `setDensity` | `createGridApi.ts` | `createGridApi.test.ts` |

**Props / slots:** [`dataGridProps.ts`](../core/x-data-grid/src/dataGridProps.ts). Marcar cada prop crítica (`editMode`, `rowModesModel`, `processRowUpdate`, `showRowEditActions`, etc.) com o mesmo rigor.

## 6. Testes no padrão ProtonWeb (`costs.tsx`)

Referência real: `protonerp/.../ProtonWeb/src/submodules/operation/oceanexport/costs.tsx` — `rowModesModel`, `processRowUpdate`, `GridActionsCellItem`, `rowModeEntryIsEdit`, `GridPreProcessEditCellProps`.

**Suite dedicada:** [`core/x-data-grid/src/rowEditProtonPattern.test.tsx`](../core/x-data-grid/src/rowEditProtonPattern.test.tsx) — edição por linha (duplo clique, blur, Gravar/Cancelar, Escape), `preProcessEditCellProps` (`error`/`helperText`, mutação em `otherFieldsProps` + sincronização de rascunho). **Nota:** `preProcessEditCellProps` **assíncrono** (Promise), como em algumas colunas do ProtonWeb com `async: true`, ainda **não** é suportado; tratar noutro épico.

**Storybook / Playwright:** [`stories/DataGrid.stories.tsx`](../stories/DataGrid.stories.tsx), [`e2e/storybook/datagrid.spec.ts`](../e2e/storybook/datagrid.spec.ts) — complementares, não substituem o padrão ProtonWeb.

## 7. Resumo da matriz (top ficheiros legado × ProtonWeb)

<!-- LEGACY_MATRIX_BEGIN -->

<!-- Gerado por: npm run backlog:legacy-matrix — não editar -->

_Resumo: 2017 ficheiros no legado · geração 2026-04-13T13:16:11.671Z · [tabela completa (todos os ficheiros)](./_generated/legacy-matrix.fragment.md) · JSON: [`legacy-matrix.json`](./_generated/legacy-matrix.json)_

### Top 40 ficheiros legado por peso de símbolos importados no ProtonWeb

| legacy_path | cat | substituído | hits PW | exports (amostra) | pista v2 |
| --- | --- | --- | ---: | --- | --- |
| `core/x-data-grid/src/models/gridRows.ts` | B | comportamental_ou_n_a | 270 | GridValidRowModel, GridRowsProp, GridRowModel, GridUpdateAction, GridRowModelUpdate, GridRowsMeta, GridTreeBasicNode, GridLeafNode, GridBasicGroupNode, GridAutoGeneratedGroupNode, GridDataGroupNode, GridGroupNode | GridValidRowModel→types.ts; GridRowModel→types.ts; GridTreeNode→types.ts; GridRowId→types.ts |
| `core/x-data-grid/src/components/cell/GridActionsCellItem.tsx` | B | comportamental_ou_n_a | 221 | GridActionsCellItemProps, GridActionsCellItem | GridActionsCellItem→GridCells.tsx |
| `core/x-data-grid/src/models/api/gridEditingApi.ts` | B | comportamental_ou_n_a | 217 | GridCellModesModelProps, GridCellModesModel, GridRowModesModelProps, GridRowModesModel, GridEditCellMeta, GridEditingSharedApi, GridEditingSharedPrivateApi, GridStartCellEditModeParams, GridStopCellEditModeParams, GridStartRowEditModeParams, GridStopRowEditModeParams, GridCellEditingApi | GridRowModesModel→types.ts |
| `core/x-data-grid/src/models/api/index.ts` | B | comportamental_ou_n_a | 217 | GridCoreApi, GridRowsMetaApi, GridStateApi, GridFocusApi, GridApiCommon, GridEditingApi, GridCellModesModel, GridRowModesModel, GridEditRowApi | GridRowModesModel→types.ts |
| `core/x-data-grid/src/models/gridEditRowModel.ts` | B | comportamental_ou_n_a | 137 | GridEditCellProps, GridEditRowProps, GridEditingState, GridEditMode, GridEditModes, GridCellModes, GridRowModes | GridRowModes→types.ts |
| `core/x-data-grid/src/models/params/gridCellParams.ts` | B | comportamental_ou_n_a | 127 | GridCellParams, FocusElement, GridRenderCellParams, GridRenderEditCellParams, GridValueGetterParams, GridValueSetterParams, GridValueFormatterParams, GridPreProcessEditCellProps | GridCellParams→types.ts; GridPreProcessEditCellProps→types.ts |
| `core/x-data-grid/src/models/colDef/gridColDef.ts` | B | comportamental_ou_n_a | 119 | GridAlignment, ValueOptions, GridKeyValue, GridBaseColDef, GridActionsColDef, GridColDef, GridColTypeDef, GridStateColDef, GridColumnsMeta | GridColDef→types.ts |
| `core/x-data-grid/src/models/colDef/index.ts` | B | comportamental_ou_n_a | 119 | GridAlignment, ValueOptions, GridKeyValue, GridColDef, GridColTypeDef, GridColumnsMeta | GridColDef→types.ts |
| `core/x-data-grid/src/models/gridRowSelectionModel.ts` | B | comportamental_ou_n_a | 46 | GridInputRowSelectionModel, GridRowSelectionModel | GridRowSelectionModel→types.ts |
| `core/x-data-grid/src/colDef/gridCheckboxSelectionColDef.tsx` | B | comportamental_ou_n_a | 27 | GRID_CHECKBOX_SELECTION_FIELD, GRID_CHECKBOX_SELECTION_COL_DEF | GRID_CHECKBOX_SELECTION_COL_DEF→constants.ts |
| `core/x-data-grid/src/components/toolbar/GridToolbar.tsx` | B | comportamental_ou_n_a | 15 | GridToolbarProps, GridToolbar | GridToolbar→gridToolbar.tsx |
| `core/x-data-grid/src/models/params/gridRowParams.ts` | B | comportamental_ou_n_a | 8 | GridRowParams, GridRowClassNameParams, GridRowHeightParams, GridRowHeightReturnValue, GridRowEditStartParams, GridRowEditStopParams, GridRowSpacingParams, GridRowSpacing, GridRowEditStartReasons, GridRowEditStopReasons | GridRowParams→types.ts |
| `core/x-data-grid/src/components/containers/GridToolbarContainer.tsx` | B | comportamental_ou_n_a | 6 | GridToolbarContainerProps, GridToolbarContainer | GridToolbarContainer→gridToolbar.tsx |
| `core/x-data-grid/src/components/cell/GridEditInputCell.tsx` | B | comportamental_ou_n_a | 2 | GridEditInputCellProps, GridEditInputCell, renderEditInputCell | GridEditInputCell→GridCells.tsx |
| `core/x-data-grid/src/models/gridSortModel.ts` | B | comportamental_ou_n_a | 2 | GridSortDirection, GridSortCellParams, GridComparatorFn, GridSortItem, GridSortModel | GridSortItem→types.ts; GridSortModel→types.ts |
| `core/x-data-grid-premium/src/DataGridPremium/DataGrid.tsx` | B | comportamental_ou_n_a | 1 | DataGrid, DataGridPro | DataGridPro→DataGrid.tsx |
| `core/x-data-grid-premium/src/DataGridPremium/DataGridPremium.tsx` | B | comportamental_ou_n_a | 1 | DataGridPremium | DataGridPremium→DataGrid.tsx |
| `core/x-data-grid-premium/src/hooks/utils/useGridRootProps.ts` | B | comportamental_ou_n_a | 1 | useGridRootProps | useGridRootProps→GridRootContext.tsx |
| `core/x-data-grid-premium/src/index.ts` | B | comportamental_ou_n_a | 1 | GridColumnMenu, GRID_COLUMN_MENU_COMPONENTS, GRID_COLUMN_MENU_COMPONENTS_PROPS, DataGridPremiumProps, GridExperimentalPremiumFeatures, useGridApiContext, useGridApiRef, useGridRootProps, GridApi, GridInitialState, GridState | useGridRootProps→GridRootContext.tsx |
| `core/x-data-grid-premium/src/typeOverloads/reexports.ts` | B | comportamental_ou_n_a | 1 | useGridApiContext, useGridApiRef, useGridRootProps, GridApi, GridState, GridInitialState | useGridRootProps→GridRootContext.tsx |
| `core/x-data-grid-pro/src/DataGridPro/DataGrid.tsx` | B | comportamental_ou_n_a | 1 | DataGrid, DataGridPremium | DataGridPremium→DataGrid.tsx |
| `core/x-data-grid-pro/src/DataGridPro/DataGridPro.tsx` | B | comportamental_ou_n_a | 1 | DataGridPro | DataGridPro→DataGrid.tsx |
| `core/x-data-grid-pro/src/hooks/utils/useGridRootProps.ts` | B | comportamental_ou_n_a | 1 | useGridRootProps | useGridRootProps→GridRootContext.tsx |
| `core/x-data-grid-pro/src/index.ts` | B | comportamental_ou_n_a | 1 | GridExportExtension, GridExportFormat, GridToolbarExportProps, GridColumnMenu, GRID_COLUMN_MENU_COMPONENTS, GRID_COLUMN_MENU_COMPONENTS_PROPS, DataGridProProps, GridExperimentalProFeatures, useGridApiContext, useGridApiRef, useGridRootProps, GridApi | useGridRootProps→GridRootContext.tsx |
| `core/x-data-grid-pro/src/typeOverloads/reexports.ts` | B | comportamental_ou_n_a | 1 | useGridApiContext, useGridApiRef, useGridRootProps, GridApi, GridState, GridInitialState | useGridRootProps→GridRootContext.tsx |
| `core/x-data-grid/src/components/toolbar/GridToolbarColumnsButton.tsx` | B | comportamental_ou_n_a | 1 | GridToolbarColumnsButton | GridToolbarColumnsButton→gridToolbar.tsx |
| `core/x-data-grid/src/components/toolbar/GridToolbarDensitySelector.tsx` | B | comportamental_ou_n_a | 1 | GridToolbarDensitySelector | GridToolbarDensitySelector→gridToolbar.tsx |
| `core/x-data-grid/src/components/toolbar/GridToolbarExport.tsx` | B | comportamental_ou_n_a | 1 | GridExportDisplayOptions, GridExportMenuItemProps, GridCsvExportMenuItemProps, GridExcelExportMenuItemProps, GridPrintExportMenuItemProps, GridToolbarExportProps, GridCsvExportMenuItem, GridExcelExportMenuItem, GridPrintExportMenuItem, GridToolbarExport | GridToolbarExport→gridToolbar.tsx |
| `core/x-data-grid/src/components/toolbar/GridToolbarFilterButton.tsx` | B | comportamental_ou_n_a | 1 | GridToolbarFilterButtonProps, GridToolbarFilterButton | GridToolbarFilterButton→gridToolbar.tsx |
| `core/x-data-grid/src/components/toolbar/GridToolbarQuickFilter.tsx` | B | comportamental_ou_n_a | 1 | GridToolbarQuickFilterProps, GridToolbarQuickFilter | GridToolbarQuickFilter→gridToolbar.tsx |
| `core/x-data-grid/src/components/toolbar/index.ts` | B | comportamental_ou_n_a | 1 | GridExportDisplayOptions, GridExportMenuItemProps, GridCsvExportMenuItemProps, GridPrintExportMenuItemProps, GridCsvExportMenuItem, GridPrintExportMenuItem, GridToolbarExport | GridToolbarExport→gridToolbar.tsx |
| `core/x-data-grid/src/hooks/features/sorting/gridSortingUtils.ts` | B | comportamental_ou_n_a | 1 | sanitizeSortModel, mergeStateWithSortModel, buildAggregatedSortingApplier, getNextGridSortDirection, gridStringOrNumberComparator, gridNumberComparator, gridDateComparator | gridStringOrNumberComparator→comparators.ts |
| `core/x-data-grid/src/hooks/features/sorting/index.ts` | B | comportamental_ou_n_a | 1 | GridSortingState, GridSortingInitialState, gridDateComparator, gridNumberComparator, gridStringOrNumberComparator | gridStringOrNumberComparator→comparators.ts |
| `core/x-data-grid/src/hooks/utils/useGridRootProps.ts` | B | comportamental_ou_n_a | 1 | useGridRootProps | useGridRootProps→GridRootContext.tsx |
| `core/x-data-grid/src/index.ts` | B | comportamental_ou_n_a | 1 | GridColumnMenu, GRID_COLUMN_MENU_COMPONENTS, GRID_COLUMN_MENU_COMPONENTS_PROPS, GridToolbarExportProps, useGridApiContext, useGridApiRef, useGridRootProps, GridExportExtension, GridExportFormat, DataGridProps, GridExperimentalFeatures, GridApi | useGridRootProps→GridRootContext.tsx |
| `core/mui-base/src/AutocompleteUnstyled/index.d.ts` | B | comportamental_ou_n_a | 0 | useAutocomplete | — |
| `core/mui-base/src/AutocompleteUnstyled/index.js` | B | comportamental_ou_n_a | 0 | useAutocomplete, createFilterOptions | — |
| `core/mui-base/src/AutocompleteUnstyled/useAutocomplete.d.ts` | B | comportamental_ou_n_a | 0 | CreateFilterOptionsConfig, FilterOptionsState, AutocompleteGroupedOption, createFilterOptions, AutocompleteFreeSoloValueMapping, AutocompleteValue, UseAutocompleteProps, AutocompleteHighlightChangeReason, AutocompleteChangeReason, AutocompleteChangeDetails, AutocompleteCloseReason, AutocompleteInputChangeReason | — |
| `core/mui-base/src/AutocompleteUnstyled/useAutocomplete.js` | B | comportamental_ou_n_a | 0 | createFilterOptions, useAutocomplete | — |
| `core/mui-base/src/BadgeUnstyled/BadgeUnstyled.tsx` | B | comportamental_ou_n_a | 0 | default | — |


<!-- LEGACY_MATRIX_END -->

Tabela completa (todos os ficheiros do legado): [`_generated/legacy-matrix.fragment.md`](_generated/legacy-matrix.fragment.md) · JSON: [`_generated/legacy-matrix.json`](_generated/legacy-matrix.json).

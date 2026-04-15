# Paridade ProtonWeb ↔ `@geeklabssh/hive-tablepro`

Este documento é a **fonte de verdade** para o alinhamento com o uso real no ProtonWeb (`src` da app). O [DATA_GRID_BACKLOG.md](./DATA_GRID_BACKLOG.md) permanece como histórico genérico MUI X.

**Baseline gerada:** ver [`scripts/data/protonweb-inventory.json`](../scripts/data/protonweb-inventory.json) (regenerar com `npm run inventory:protonweb`; opcional `PROTONWEB_SRC`).

**Última execução do inventário:** 278 ficheiros com import do pacote; padrões abaixo refletem esse snapshot.

## Matriz de paridade

| Capacidade | ProtonWeb (ficheiros / ocorrências) | Pacote / notas |
|------------|-------------------------------------|----------------|
| `getActions` + `type: "actions"` | 220 / 221 | `getActions` em `GridColDef` + render em `adapter.ts`; menu `showInMenu` via `GridActionsCell` |
| `editMode` / `rowModesModel` | 196 / 202; 216 / 852 | Suportado (`DataGrid`) |
| `processRowUpdate` | 142 / 163 | Suportado |
| `valueGetter` / `valueFormatter` | 142 / 488; 114 / 497 | Suportado |
| `singleSelect` | 195 / 839 | Suportado |
| `paginationMode` (server) | 210 / 216 | Suportado |
| `pinnedColumns` | 83 / 171 | Suportado |
| `StyledDataGridPro` + `components.Toolbar` → `slots.toolbar` | 275 / 541; 182 `components` | Wrapper Proton; mapeamento no `tableFunctions.tsx` |
| `GridToolbar` / sub-botões | 21 / 55 | Exportados do pacote |
| `rowModeEntryIsEdit` | 134 / 274 | Função utilitária exportada (equivalente MUI) |
| `GridPreProcessEditCellProps` | 125 ficheiros importam | Tipo exportado no entry principal |
| `getRowClassName` | 85 / 88 | Suportado em `DataGrid` (`GridRowClassNameParams.indexRelativeToCurrentPage`) |
| `isCellEditable` (nível grelha) | 7 / 8 | Suportado em `DataGrid` (combina com `colDef`) |
| `checkboxSelection` / seleção | 20 / 22; 59 / 219 | Suportado |
| `renderCell` / `renderEditCell` | 29 / 31; 2 / 2 | Suportado |
| `useGridApiRef` / `apiRef` | 0 | Não usado no ProtonWeb (snapshot) |
| `@geeklabssh/hive-tablepro/table` | 0 | Fora do âmbito ProtonWeb |
| Export CSV/Excel sem coluna `actions` | — | `gridExport.ts` exclui `type: "actions"` e coluna de seleção |

**Critério ~90%:** com as linhas marcadas como suportadas (incluindo wrapper documentado), a matriz cobre os padrões de maior volume no inventário.

## Regenerar o inventário

```bash
npm run inventory:protonweb
# ou
PROTONWEB_SRC=/caminho/para/ProtonWeb/src node scripts/protonweb-table-inventory.mjs
```

## Integração ProtonWeb

- Dependência em [`package.json`](file:///C:/Users/Udo/Documents/Hive/protonerp/src/front-end/ProtonWeb/package.json): `@geeklabssh/hive-tablepro@^2.3.3`.
- O patch `patches/@geeklabssh+hive-tablepro+2.3.2.patch` foi **removido** — a lógica relevante foi fundida no pacote (2.3.3). Se precisares de diffs locais sobre `node_modules`, volta a gerar com `npx patch-package @geeklabssh/hive-tablepro` após `npm install`.
- `StyledDataGridPro` repassa `getRowClassName` e `isCellEditable` ao `DataGridPro`.

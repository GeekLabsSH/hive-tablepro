# Modelo de filtros (`GridFilterModel`) para API HTTP

Com `filterMode="server"`, a grelha **não** aplica `filterModel` em memória sobre as linhas recebidas: o estado serve para UI, `onFilterModelChange` e serialização JSON para o backend.

## Estrutura JSON

```json
{
  "items": [
    {
      "id": "hive-1",
      "field": "status",
      "operator": "equals",
      "value": "open",
      "groupId": 1,
      "groupItemLogic": "And"
    },
    {
      "id": "hive-2",
      "field": "amount",
      "operator": ">=",
      "value": 100,
      "groupId": 1
    },
    {
      "field": "country",
      "operator": "inList",
      "value": "PT;ES;FR",
      "groupId": 2
    }
  ],
  "logicOperator": "And",
  "groupLogicOperator": "Or",
  "quickFilterValues": ["acme"],
  "quickFilterLogicOperator": "And"
}
```

### Campos

| Campo | Significado |
|--------|-------------|
| `items` | Lista de condições. |
| `logicOperator` | `And` / `Or` entre **todas** as linhas quando **nenhum** `groupId` está definido (modo legado). |
| `groupId` | Opcional. Condições com o mesmo id formam um grupo. |
| `groupItemLogic` | `And` / `Or` entre condições **consecutivas do mesmo grupo** (na ordem de `items`); a primeira linha do grupo ignora este campo. |
| `groupLogicOperator` | `And` / `Or` entre **grupos** distintos quando há pelo menos dois grupos. |
| `quickFilterValues` | Tokens do filtro rápido (toolbar). |
| `quickFilterLogicOperator` | `And` / `Or` entre tokens de `quickFilterValues`. |

### Operadores (`operator`)

Inclui os operadores textuais/numéricos/data existentes e:

- `inList` — valor string com entradas separadas por `;` (trim), comparação por igualdade numérica ou string case-insensitive.
- `selectAny` / `selectAll` — valor preferencialmente `unknown[]` (valores crus das opções); `selectAny` = qualquer coincidência; `selectAll` com célula escalar só faz sentido com um único valor seleccionado; com célula array exige que todos os valores seleccionados apareçam na célula.

## Exemplo de payload para `POST /query`

Corpo mínimo sugerido (ajustar ao contrato real do ProtonWeb / .NET):

```json
{
  "filter": {
    "model": { "...": "GridFilterModel como acima" }
  },
  "pagination": { "page": 0, "pageSize": 20 },
  "sort": [{ "field": "name", "sort": "asc" }]
}
```

A grelha garante que `onFilterModelChange` recebe sempre o objecto completo (`items` + campos opcionais), incluindo `quickFilterValues` quando o utilizador altera a pesquisa rápida integrada.

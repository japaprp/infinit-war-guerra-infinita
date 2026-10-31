# PveUtil — extração e primeira leitura do bundle Lua base (2026-10-31)

## Escopo

Extrair e validar `PveUtil.bytes` do bundle utilitário associado ao bundle ID 7 (Lua base), sem alterar o bundle original. O bundle ID 84 (Lua 5.5) permanece pendente.

## Extração — bundle ID 7

- Original: `lua_scripts_util_9422a92002413f82ce5978712bb013ad.bundle`
- Original size: 556,442 bytes
- Original SHA-256: `66b11e278cac65104dc211b8109e5a98ee87bcb6138341f8dfd2f882fe5bbef8`
- Prefixo original: `UnityRawUnityFS`
- Cópia de trabalho: primeiros 8 bytes (`UnityRaw`) removidos; tamanho resultante 556,434 bytes.
- AssetRipper `/LoadFile`: HTTP 200.
- Log: `Finished reading files` e `Finished processing assets`; sem o aviso de que nenhum asset válido foi encontrado.
- AssetRipper `/Export/PrimaryContent`: HTTP 200; marcador de conclusão observado no log.
- TextAsset encontrado: `Assets/Main/LuaTxt/Util/PveUtil.bytes`
- Export size: 88,707 bytes
- Export SHA-256: `691089c87fbb6beb6452f88be999e19f118b961f809955c721087071eb2f161a`

## Validação estrutural Lua

Parser estável utilizado: `tools/parse-lua-chunks.js`.

- Files scanned: 1
- Files passed: 1
- Files failed: 0
- Lua version: 5.4
- Functions: 139
- Instructions: 8,793
- Constants: 1,847
- Strings: 3,420
- Table candidate strings: 44
- Status: `PASS`

Parser experimental adicional: `tools/experiments/parse-lua-opcode-function-fingerprints.js`.

- Files scanned: 1
- Files passed: 1
- Files failed: 0
- Unknown opcode count: 0 para as funções listadas no CSV
- Functions: 139
- Instructions: 8,793
- Constants: 1,847
- Status: `PASS`

Arquivos de resultado locais:
- `tools/assetbundle-wrapper-test/pveutil-id7-parser-output/pveutil-id7-parse-summary.json`
- `tools/assetbundle-wrapper-test/pveutil-id7-parser-output/pveutil-id7-parse-summary-table-candidates.csv`
- `tools/assetbundle-wrapper-test/pveutil-id7-parser-output/pveutil-id7-opcode-fingerprints.json`
- `tools/assetbundle-wrapper-test/pveutil-id7-parser-output/pveutil-id7-opcode-fingerprints-functions.csv`
- `tools/assetbundle-wrapper-test/pveutil-id7-parser-output/pveutil-id7-opcode-fingerprints-constants.csv`

## Símbolos e candidatos identificados

A tabela de constantes do módulo contém os seguintes nomes relevantes:

- `GetArmyXmlName` — constante no protótipo raiz, índice de constante 127. A associação exata ao protótipo filho ainda precisa ser reconstruída.
- `GetHeroXmlName`
- `GetHeroLevelUpXmlName`
- `GetLwHeroTableName`
- `GetHeroCampXmlName`
- `GetABTestTableName`
- `GetTableData`
- `GetTableDataLine`

Referências relevantes de constantes por função:

| Function index | Linha declarada | Constantes relevantes |
|---:|---:|---|
| 61 | 912 | `GetABTestTableName`, `TableName` |
| 68 | 1010 | `GetHeroXmlName`, `GetHeroLevelUpXmlName`, `TableName`, `heroes_levelup_PVE_ABTest`, `aps_heroes_rank_PVE_ABTest` |
| 69 | 1030 | mesmos nomes de tabela/switch da função 68 |
| 70 | 1050 | mesmos nomes de tabela/switch da função 68 |
| 106 | 2105 | `GetHeroLevelUpXmlName`, `GetLwHeroTableName`, `GetHeroCampXmlName`, switches de equipamento |
| 136 | 3163 | `army_xml_use_b`, `TableName`, `Army_B`, `Army` |

Esses dados são evidência de constantes e referências presentes no bytecode. Ainda não constituem, por si só, prova da condição, do valor retornado nem de qual variante está ativa em runtime.

## Validações

| Item | Estado |
|---|---|
| Bundle ID 7 original preservado | PASS |
| Hash e tamanho do bundle original conferidos | PASS |
| Importação com remoção de `UnityRaw` em cópia | PASS |
| Exportação de `PveUtil.bytes` | PASS |
| SHA-256 do TextAsset registrado | PASS |
| Parser Lua 5.4 full-chunk | PASS |
| Parser experimental de fingerprints/opcodes | PASS |
| Reconstrução de `GetArmyXmlName` → protótipo filho | NOT RUN |
| Disassembly e interpretação de funções seletoras | NOT RUN |
| Bundle ID 84 / Lua 5.5 | NOT RUN |
| Comparação semântica Lua 5.4 × Lua 5.5 | NOT RUN |
| Cruzamento com DataTables e valores reais | NOT RUN |

## Restrição de memória

Após a exportação e análise local, a RAM livre oscilou entre 828 MB e 920 MB, com leitura final de aproximadamente 844 MB antes de operações subsequentes. Não iniciar o bundle ID 84 até a memória livre voltar a pelo menos 875 MB e a condição do AssetRipper ser revalidada.

## Próximas etapas

1. Reconstruir a associação entre nomes de métodos no protótipo raiz e protótipos filhos.
2. Disassemblar as funções 61, 68–70, 106 e 136, priorizando `GetArmyXmlName` e os seletores `army_xml_use_b` / `Army_B` / `Army`.
3. Cruzar os nomes retornados com o índice DataTable e os bundles correspondentes.
4. Exportar individualmente o bundle ID 84 quando houver RAM suficiente.
5. Comparar os dois módulos e documentar divergências reais, sem presumir equivalência entre Lua 5.4 e Lua 5.5.

## Limite da conclusão

A extração e a leitura estrutural do módulo Lua base estão validadas. A regra de seleção de nomes de tabela, a variante ativa no servidor e os dados remotos ainda não foram confirmados. Nenhum valor de configuração de servidor foi inferido a partir dessas constantes.

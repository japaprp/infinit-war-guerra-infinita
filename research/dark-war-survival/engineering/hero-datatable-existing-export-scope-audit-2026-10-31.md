# Auditoria do escopo de exportação existente — DataTables de heróis

**Resultado:** PASS na auditoria dos artefatos de exportação existentes; **NOT RUN** para extração dos DataTables.

## Descoberta

Os dois CSVs de batch existentes registram 32 bundles exportados. Todos são módulos `lua_scripts_*` ou `lua_slg_scripts_*`; nenhum é um bundle `datatable_config_luatxt_*`.

O diretório de teste também contém um arquivo isolado `datatable_config_luatxt_lw_8903d9fe6f09a2c0c95f2737061ce543.bundle`, mas não contém a pasta de saída correspondente. Portanto, a presença desse arquivo não é evidência de exportação concluída.

A pasta `export-raw-test` contém TextAssets de código Lua, como:
- `DataCenter/HeroData/HeroDataManager.bytes`
- `DataCenter/HeroLevelUpTemplateManager/HeroLevelUpTemplateManager.bytes`

Esses arquivos são módulos Lua e não os DataTables de gameplay que procuramos:
- `aps_new_heroes.bytes`
- `heroes_levelup.bytes`
- `lw_hero.bytes`
- `lw_hero_B.bytes`

## Validações

| Item | Estado |
|---|---|
| CSVs de batch lidos | PASS |
| 32 bundles listados são módulos Lua | PASS |
| Exportação dos DataTables-alvo | NOT RUN |
| TextAssets DataTable nas pastas de exportação direcionadas | NOT FOUND |
| Instâncias AssetRipper | 1 observada na lista de processos |
| RAM livre atual | NOT RUN |

A última medição de RAM conhecida, 762,9 MB, estava abaixo do limite de segurança de 875 MB. Não foi possível obter nova medição nesta rodada sem acionar uma execução de terminal bloqueada pelas configurações de segurança. Nenhum bundle adicional foi carregado.

## Próxima ação

1. Revalidar a RAM livre com consulta somente de leitura.
2. Somente quando houver pelo menos 875 MB livres, carregar um único bundle DataTable no AssetRipper.
3. Exportar Primary Content e localizar os TextAssets exatos.
4. Registrar caminho, tamanho e SHA-256 dos TextAssets.
5. Repetir para a versão correspondente Lua 5.5 e comparar registros/colunas.

A auditoria não alterou arquivos originais, não iniciou exportação nova e não fez alterações no jogo.

# Pré-checagem dos DataTables de heróis — bundles base e Lua 5.5

**Status:** PASS — seis bundles locais correspondem exatamente ao manifesto de integridade.  
**Extração individual dos TextAssets:** NOT RUN.  
**Carregamento no AssetRipper:** BLOCKED pela margem de RAM (762,9 MB livres no momento da pré-checagem; margem mínima definida: 875 MB).

## Objetivo

Conectar os seletores recuperados em `HeroUtils` aos DataTables originais correspondentes, sem inferir que um nome Lua equivale automaticamente ao nome físico de um TextAsset.

## Mapeamento do inventário de DataTables

| Seletor/variante | AssetPath no manifesto | Bundle | CachedOnS21 |
|---|---|---|---|
| Heróis (base/candidato) | `0/aps_new_heroes.bytes` | `datatable_config_luatxt_aps_859d1e7c0543b40260b362d100ec2579.bundle` | YES |
| Heróis (Lua 5.5/candidato) | `1/aps_new_heroes.bytes` | `datatable_config_luatxt_55_aps_3b5ee2fd1210e98af73c5bc393f57784.bundle` | YES |
| Evolução (base) | `0/heroes_levelup.bytes` | `datatable_config_luatxt_h_6a1d2a950c996f15a938acebcebc598b.bundle` | NO |
| Evolução (Lua 5.5) | `1/heroes_levelup.bytes` | `datatable_config_luatxt_55_h_3241e39d538fe22e815569b43561d206.bundle` | NO |
| Heróis LW (base) | `0/lw_hero.bytes` | `datatable_config_luatxt_lw_8903d9fe6f09a2c0c95f2737061ce543.bundle` | NO |
| Heróis LW B (base) | `0/lw_hero_B.bytes` | mesmo bundle base LW | NO |
| Heróis LW (Lua 5.5) | `1/lw_hero.bytes` | `datatable_config_luatxt_55_lw_572068728368e9a34e2bcaba2485f8af.bundle` | NO |
| Heróis LW B (Lua 5.5) | `1/lw_hero_B.bytes` | mesmo bundle LW 5.5 | NO |

O inventário também registra, para LW, variantes base e B de appearance, effect, skill e skill_effect. No total, a pré-checagem validou 24 linhas de assets relacionadas aos quatro grupos de nomes-alvo e variantes LW.

## Integridade dos seis bundles locais

Todos os seis arquivos foram encontrados nas pastas de trabalho e tiveram tamanho e SHA-256 comparados com `DARKWAR_COMPLETE_BUNDLE_HASH_MANIFEST_V2_2026-10-30.csv`.

| Bundle | Origem registrada | Bytes | SHA-256 |
|---|---|---:|---|
| `datatable_config_luatxt_aps_859d1e7c0543b40260b362d100ec2579.bundle` | S21 cache | 946.250 | `CDF6955190BABA25D86C26F74F7FD3A38E96873F46BAA43B88432AD5D20D3819` |
| `datatable_config_luatxt_55_aps_3b5ee2fd1210e98af73c5bc393f57784.bundle` | S21 cache | 1.960.142 | `32999D6EF944A751141123C39687A91F1E30CFCD5A5C9B5B6A751980CD9F8BAE` |
| `datatable_config_luatxt_lw_8903d9fe6f09a2c0c95f2737061ce543.bundle` | split APK instalado | 540.915 | `6F4FE199962197F5890BCCD03A3B029EA3784524525B067285C0A1C908DD900F` |
| `datatable_config_luatxt_55_lw_572068728368e9a34e2bcaba2485f8af.bundle` | split APK instalado | 829.425 | `62C19DB51CFBC2948F11B4AC4973BEF43010EAB9533E2F29B400BFDFD7D6B2D0` |
| `datatable_config_luatxt_h_6a1d2a950c996f15a938acebcebc598b.bundle` | split APK instalado | 1.125.059 | `E5515AD0044FE7CB4C2FC0831B975D5980F6256A84A1792C993AEAF3AD346749` |
| `datatable_config_luatxt_55_h_3241e39d538fe22e815569b43561d206.bundle` | split APK instalado | 1.235.771 | `59633C228C7BD670407CFC35168E710505EE37219A8D655C290F93D901DACB4D` |

**Resultado:** 6/6 arquivos presentes, tamanhos correspondentes e hashes SHA-256 idênticos ao manifesto.

## O que ainda não está comprovado

- A tabela Lua `NewHeroesB` não aparece como um AssetPath separado `aps_new_heroes_B.bytes` no mapa. A correspondência física precisa ser confirmada dentro do bundle.
- `NewHeroesLevelUp_B` também não aparece como um AssetPath separado `heroes_levelup_B.bytes`; a relação precisa ser examinada no conteúdo exportado.
- `lw_hero.bytes` e `lw_hero_B.bytes` têm caminhos distintos explícitos, mas seus registros ainda não foram comparados.
- Hash PASS de bundle confirma a integridade do bundle, não a exportação ou interpretação do TextAsset individual.

Uma busca direcionada não encontrou os TextAssets individuais nas árvores `UnityGameSubset`, `UnityGameSubset_WithCAB` e `validation-staging`.

## Próxima ação segura

Quando a RAM livre superar 875 MB:
1. Carregar apenas um dos seis bundles por vez no AssetRipper.
2. Exportar os TextAssets-alvo e registrar caminho, tamanho e SHA-256.
3. Comparar base × Lua 5.5.
4. Comparar variantes B × padrão quando existirem como arquivos distintos.
5. Cruzar colunas, IDs e registros com os usos de `GetTableData(tableName, heroId, camp)` já confirmados em `HeroDataManager`.

Nenhum bundle foi carregado nesta pré-checagem; nenhum original foi modificado ou removido.

# PveUtil - pre-checagem da proxima etapa

Data da verificacao: 2026-10-30
Projeto: engenharia reversa de Dark War: Survival como referencia para Guerra Infinita.
Escopo: inspecao estatica e documental; nenhum bundle original foi alterado.

## Evidencias verificadas

Fonte: `Index_Metadata/lua`

- Linha 16950: `957,199/PveUtil.bytes,7`
- Linha 31271: `15278,7554/PveUtil.bytes,84`
- Linha 48515: bundle ID 7 = `lua_scripts_util_9422a92002413f82ce5978712bb013ad.bundle`, tamanho indexado 556442 bytes.
- Linha 48592: bundle ID 84 = `lua_scripts_util_55_b32e6a6b548a2f08eb7ff1ebd93ec297.bundle`, tamanho indexado 593566 bytes.

Os quatro bundles utilitarios ja copiados para
`Selected_Bundles/Additional_Helper_Lua_Cache_2026-10-31/` estao presentes:
- `lua_scripts_util_9422a92002413f82ce5978712bb013ad.bundle` - 556442 bytes - SHA-256 `66b11e278cac65104dc211b8109e5a98ee87bcb6138341f8dfd2f882fe5bbef8`
- `lua_scripts_util_55_b32e6a6b548a2f08eb7ff1ebd93ec297.bundle` - 593566 bytes - SHA-256 `132bfa7337b3920c218f0b7eb8ef3a5f5a1f966ea038741d1062a41e3f1fd532`
- `lua_scripts_util_d4a89127ecf72d48ba50006c97866de5.bundle` - 556027 bytes - SHA-256 `da6dc2b75823f566b8c6e126c8cf318c4b563b92b92c35d4272fd0c46f838060`
- `lua_scripts_util_55_c87c1e51e40d1d9c81647d0cdb164738.bundle` - 593043 bytes - SHA-256 `cdbbb1e824e1a0eb1a5f88bccfebc5df7180fea1bc24836d788ae45936b2b9f6`

O manifesto `DARKWAR_LUA_BINARY_EXPORT_MANIFEST_2026-10-30.csv` nao contem uma entrada direta para `PveUtil.bytes`. O indice Lua associa o arquivo aos bundles utilitarios acima; isso nao deve ser interpretado como ausencia do arquivo original.

## Limite de execucao

A leitura final de memoria fisica reportou 495 MB livres. O gate estabelecido para abrir AssetRipper e de 875-975 MB livres.

## Proxima execucao segura quando o gate for atingido

1. Exportar somente os bundles ID 7 e 84 (Lua base e Lua 5.5), sem reexportacao ampla.
2. Preservar os bundles originais e calcular SHA-256 antes/depois.
3. Extrair `PveUtil.bytes` dos dois bundles e registrar caminho, tamanho e SHA-256.
4. Fazer parse com o parser ja validado, sem alterar o parser estavel.
5. Recuperar `GetArmyXmlName()`, seletores de `TableName` e callers; comparar Lua base e 5.5.
6. Cruzar com indices DataTable e registrar divergencias e lacunas.

## Status

- PASS - indice Lua associa `PveUtil.bytes` aos bundle IDs 7 e 84.
- PASS - os dois bundles-alvo estao presentes no cache local e seus tamanhos coincidem com o indice.
- PASS - os quatro bundles utilitarios estao presentes; os quatro SHA-256 locais coincidem com os hashes de referencia registrados anteriormente.
- BLOCKED - exportacao via AssetRipper: RAM livre abaixo do gate (495 MB vs. minimo de 875 MB).
- NOT RUN - extracao e parse de `PveUtil.bytes`.
- NOT RUN - resolucao completa de `GetArmyXmlName()`, seletores e callers.
- NOT RUN - confirmacao de qualquer variante efetivamente selecionada pelo servidor.

Nenhum arquivo original foi excluido, sobrescrito ou modificado nesta etapa.

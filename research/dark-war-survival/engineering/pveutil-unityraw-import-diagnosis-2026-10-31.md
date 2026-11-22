# PveUtil — diagnóstico de importação com UnityRaw (2026-10-31)

## Objetivo

Retomar a extração dos módulos `PveUtil.bytes` dos bundles utilitários identificados no índice Lua: bundle ID 7 (Lua base) e bundle ID 84 (Lua 5.5).

## Evidências verificadas

- Os quatro bundles utilitários copiados do Galaxy S21 começam com o prefixo ASCII `UnityRawUnityFS`.
- O script existente `tools/extract-lua-modules-raw-export.ps1` já trata esse formato: remove os primeiros 8 bytes quando o prefixo é `UnityRaw`, preservando o conteúdo `UnityFS` para importação.
- O primeiro teste de 2026-10-31 carregou o arquivo original sem remover o prefixo. O log registrou `Files use the 'Unknown' scripting backend` e `The game structure processor could not find any valid assets`. Nenhuma exportação desse teste foi realizada.
- Foi criada uma cópia de trabalho do bundle ID 7 em `tools/assetbundle-wrapper-test/pveutil-stripped-test/`, removendo apenas os primeiros 8 bytes. O original permaneceu intacto.
- O POST para `/LoadFile` retornou HTTP 200 e o bundle apareceu em `/Bundles/View`.
- No log da importação da cópia sem o prefixo, o AssetRipper registrou `Finished reading files` e `Finished processing assets`, sem repetir o aviso `could not find any valid assets`.
- O arquivo original do bundle ID 7 permaneceu com 556,442 bytes e SHA-256 `66b11e278cac65104dc211b8109e5a98ee87bcb6138341f8dfd2f882fe5bbef8`. A cópia de trabalho ficou com 556,434 bytes.
- Os outros três bundles utilitários também foram verificados como iniciando com `UnityRawUnityFS`; seus originais e hashes estão preservados no inventário anterior.

## Estado da validação

| Verificação | Estado | Evidência |
|---|---|---|
| Prefixo UnityRaw identificado nos quatro bundles | PASS | Leitura dos 16 primeiros bytes de cada original |
| Script de extração já implementa remoção do prefixo | PASS | Inspeção de `extract-lua-modules-raw-export.ps1` |
| Importação original sem remoção do prefixo | FAIL | Log: aviso de que nenhum asset válido foi encontrado |
| Importação de cópia sem os 8 bytes | PASS | HTTP 200; bundle visível; processamento concluído sem o aviso |
| Exportação de `PveUtil.bytes` | NOT RUN | Não foi iniciada |
| Bundle ID 84 | NOT RUN | Aguardando exportação individual e controle de RAM |

## Restrição operacional

Após o teste de importação, a RAM livre caiu para aproximadamente 765.7 MB; uma verificação posterior registrou 848.5 MB. O limite operacional definido para iniciar exportação é pelo menos 875 MB livres. Portanto, nenhuma exportação foi iniciada nesta sessão.

## Próxima sequência segura

1. Revalidar RAM livre e estado do AssetRipper.
2. Quando houver pelo menos 875 MB livres, exportar somente o bundle ID 7, usando a cópia de trabalho sem o prefixo `UnityRaw` e o endpoint já utilizado pelo script existente: `/Export/PrimaryContent`.
3. Localizar `PveUtil.bytes`, registrar caminho, tamanho e SHA-256; manter o bundle original intocado.
4. Só depois, repetir individualmente para o bundle ID 84.
5. Atualizar o manifesto/crosswalk e os documentos do projeto com os resultados reais.

## Limites da conclusão

A remoção do prefixo resolveu o bloqueio de reconhecimento/importação observado no teste do bundle ID 7. Isso ainda não prova que o TextAsset `PveUtil.bytes` será exportado; essa confirmação depende da exportação e da verificação do arquivo resultante.

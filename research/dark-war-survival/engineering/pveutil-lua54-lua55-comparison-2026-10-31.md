# PveUtil — comparação Lua 5.4 × Lua 5.5 (2026-10-31)

## Fontes

| Variante | Bundle ID | TextAsset | Bytes | SHA-256 |
|---|---:|---|---:|---|
| Lua 5.4 | 7 | `Assets/Main/LuaTxt/Util/PveUtil.bytes` | 88,707 | `691089c87fbb6beb6452f88be999e19f118b961f809955c721087071eb2f161a` |
| Lua 5.5 | 84 | `Assets/Main/LuaTxt_55/Util/PveUtil.bytes` | 73,423 | `3ac2041fbf8f4a55f5f59f47c42ca2df9e6c511f72d8e9e47cca2be4d9d9e247` |

Ambos os bundles originais tinham o prefixo `UnityRawUnityFS`. Cada importação foi feita a partir de cópia de trabalho com os 8 bytes iniciais `UnityRaw` removidos. Os originais não foram modificados.

## Parser estrutural — resultado conjunto

Os parsers estável e experimental terminaram com PASS para os dois arquivos:

| Métrica | Lua 5.4 | Lua 5.5 |
|---|---:|---:|
| Arquivos aprovados | 1 | 1 |
| Funções | 139 | 139 |
| Instruções | 8,793 | 8,810 |
| Constantes | 1,847 | 1,843 |
| Strings | 3,420 | 3,476 |
| Falhas estruturais | 0 | 0 |

Totais combinados: 2 arquivos aprovados, 278 funções, 17,603 instruções, 3,690 constantes, 6,896 strings e 88 linhas candidatas de nomes de tabelas.

## Alinhamento por linha-fonte e fingerprints

O CSV de funções mostra:
- 139/139 funções da variante 5.4 encontram correspondência por `lineDefined` na variante 5.5.
- 136/139 têm a mesma contagem de instruções.
- 138/139 têm o mesmo fingerprint de constantes.
- Os únicos pontos com diferenças de contagem/fingerprint são:

| Linha | Função 5.4 | Função 5.5 | Instruções 5.4 → 5.5 | Fingerprint de constantes |
|---:|---:|---:|---:|---|
| 255 | 23 | 23 | 201 → 204 | Igual |
| 326 | 24 | 24 | 1,132 → 1,145 | Diferente; constantes 110 → 106 |
| 2,950 | 123 | 123 | 67 → 68 | Igual |

As funções candidatas aos seletores têm alinhamento exato nas duas variantes:

| Linha | Função 5.4 / 5.5 | Instruções em ambas | Fingerprint de constantes |
|---:|---:|---:|---|
| 912 | 61 / 61 | 79 | Igual |
| 1,010 | 68 / 68 | 102 | Igual |
| 1,030 | 69 / 69 | 102 | Igual |
| 1,050 | 70 / 70 | 102 | Igual |
| 2,105 | 106 / 106 | 359 | Igual |
| 3,163 | 136 / 136 | 14 | Igual |

Isso aumenta a confiança de que os seletores candidatos têm estrutura estável entre as duas variantes. Ainda não substitui o disassembly semântico nem comprova a configuração ativa em runtime.

## Estado e próximos passos

- Extração dos dois TextAssets: PASS.
- Parser estrutural 5.4 e 5.5: PASS.
- Alinhamento das 139 funções por linha-fonte: PASS.
- Comparação de fingerprints e contagens: PASS.
- Disassembly semântico de `GetArmyXmlName` e da função 136: NOT RUN.
- Identificação de tabela ativa no servidor: BLOCKED (não inferível apenas do bytecode cliente).

Próximo trabalho: reconstruir a relação entre constantes do protótipo raiz e protótipos filhos; decodificar a função 136 (`army_xml_use_b`, `TableName`, `Army_B`, `Army`); depois comparar o disassembly das funções 61, 68–70 e 106 entre Lua 5.4 e 5.5.

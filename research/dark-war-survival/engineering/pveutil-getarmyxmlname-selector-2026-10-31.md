# PveUtil — resolução de GetArmyXmlName e seletor de Army (2026-10-31)

## Conclusão principal

Foi reconstruída a associação entre o símbolo público `GetArmyXmlName` do módulo PveUtil Lua 5.4 e seu protótipo filho. O corpo correspondente contém uma chamada a `LuaEntry.DataConfig.CheckSwitch("army_xml_use_b")` e referências aos dois nomes de tabela `TableName.Army_B` e `TableName.Army`.

A estrutura correspondente também existe na variante Lua 5.5, na mesma linha-fonte e com as mesmas sete constantes e 14 instruções. A seleção condicional é fortemente indicada pelo padrão `CheckSwitch → TEST/JMP → dois caminhos de retorno`, mas a polaridade final do ramo e o destino exato do salto ainda não foram certificados por um disassembler Lua 5.4/5.5 independente. Portanto, não declarar ainda qual valor booleano seleciona cada tabela como conclusão formal.

## Evidência de associação do nome público — Lua 5.4

Arquivo:
- `Assets/Main/LuaTxt/Util/PveUtil.bytes`
- SHA-256: `691089c87fbb6beb6452f88be999e19f118b961f809955c721087071eb2f161a`

A associação foi reconstruída a partir do protótipo raiz e de seus protótipos filhos:

1. A tabela de constantes do protótipo raiz contém `GetArmyXmlName` no índice 127.
2. A instrução `SETFIELD` do protótipo raiz na posição 243 usa a constante 127 e o registrador R94.
3. A instrução `CLOSURE` na posição 162 cria o closure no registrador R94 a partir do protótipo filho ordinal 85.
4. O protótipo filho ordinal 85 corresponde à função global de parsing nº 136, linha-fonte 3163.

Metadados da função:
- Function index: 136
- Depth: 1
- Line defined: 3163
- Last line defined: 3169
- Parameters: 0
- Instructions: 14
- Constants: 7
- Upvalues: 1
- Child prototypes: 0

Essa cadeia liga o nome público `GetArmyXmlName` ao corpo da função 136; não é apenas uma associação por semelhança de nome ou linha.

## Constantes e instruções do seletor

Constantes locais da função 136:

| Índice | Valor |
|---:|---|
| 0 | `LuaEntry` |
| 1 | `DataConfig` |
| 2 | `CheckSwitch` |
| 3 | `army_xml_use_b` |
| 4 | `TableName` |
| 5 | `Army_B` |
| 6 | `Army` |

Sequência de instruções Lua 5.4, decodificada por opcode:

| PC | Opcode | Papel observado |
|---:|---|---|
| 0 | GETTABUP | Lê `LuaEntry` |
| 1 | GETFIELD | Acessa `DataConfig` |
| 2 | SELF | Prepara chamada do método `CheckSwitch` |
| 3 | LOADK | Carrega a chave `army_xml_use_b` |
| 4 | CALL | Executa a chamada e recebe um resultado |
| 5 | TEST | Testa o resultado |
| 6 | JMP | Salto condicional; destino ainda não certificado pelo decoder |
| 7–9 | GETTABUP, GETFIELD, RETURN1 | Um caminho lê `TableName.Army_B` e retorna o valor |
| 10–12 | GETTABUP, GETFIELD, RETURN1 | O outro caminho lê `TableName.Army` e retorna o valor |
| 13 | RETURN0 | Retorno vazio de encerramento |

Raw instruction words Lua 5.4:
`0000000b;0100000e;02008014;00018103;02030044;00000042;80000138;0400008b;0501008e;000200c8;0400008b;0601008e;000200c8;000100c7`

A disposição confirma que a função é um seletor de nome/tabela condicionado por `army_xml_use_b`, com os dois candidatos `Army_B` e `Army`. O significado de cada caminho está indicado pelas sequências de leitura e retorno. A polaridade exata do booleano permanece pendente até validar o salto e a semântica do opcode no decoder específico desta build.

## Correspondência Lua 5.5

Fonte:
- `Assets/Main/LuaTxt_55/Util/PveUtil.bytes`
- SHA-256: `3ac2041fbf8f4a55f5f59f47c42ca2df9e6c511f72d8e9e47cca2be4d9d9e247`

A função correspondente foi localizada na mesma linha-fonte:
- Function index: 136
- Line defined: 3163
- Instructions: 14
- Constants: 7

As sete constantes são idênticas às da versão 5.4: `LuaEntry`, `DataConfig`, `CheckSwitch`, `army_xml_use_b`, `TableName`, `Army_B`, `Army`.

Raw instruction words Lua 5.5:
`00000062;01000067;0200002e;00018179;02030005;00000050;8000012b;040000fd;050100fb;00020091;040000be;060100fb;00020091;000100a8`

O parser estrutural e o alinhamento por linha-fonte passaram. A interpretação semântica dos campos de instrução Lua 5.5 ainda depende de um decoder específico para o layout desta variante; não reutilizar offsets Lua 5.4 sem validação.

## Validações

| Item | Estado |
|---|---|
| Associação `GetArmyXmlName` → protótipo filho 85 → função 136 (Lua 5.4) | PASS |
| Constantes de switch e nomes de tabela no corpo da função | PASS |
| Sequência de opcodes e dois caminhos de retorno (Lua 5.4) | PASS |
| Função correspondente por linha-fonte 3163 na variante Lua 5.5 | PASS |
| Mesmas sete constantes e 14 instruções nas duas variantes | PASS |
| Decoder independente para validar o destino do JMP Lua 5.4 | NOT RUN |
| Decoder semântico para layout Lua 5.5 | NOT RUN |
| Polaridade formal true/false → Army_B/Army | BLOCKED até validar os saltos |
| Valor ativo de `army_xml_use_b` no servidor | BLOCKED; não é inferível do bytecode cliente |

## Impacto para Guerra Infinita

Especificação técnica segura neste estágio:
- O modelo de dados deve comportar as variantes de tabela de Army `Army` e `Army_B`.
- A resolução do nome deve ser encapsulada por uma regra configurável equivalente a `GetArmyXmlName`, sem codificar como ativo um dos lados do AB test.
- A escolha de variante deve permanecer configurável no ambiente de desenvolvimento/testes.
- Não copiar nomes internos do cliente como API pública do jogo; usar identificadores próprios no código de Guerra Infinita e manter uma tabela de correspondência na documentação de engenharia reversa.

## Próximas etapas

1. Validar os formatos de salto e os destinos de `JMP` nas duas variantes com decoder específico, usando também funções de controle simples já conhecidas.
2. Formalizar a polaridade de `army_xml_use_b` somente após essa validação.
3. Reconstruir as associações e os corpos de `GetABTestTableName`, `GetHeroXmlName`, `GetHeroLevelUpXmlName`, `GetLwHeroTableName` e `GetHeroCampXmlName`.
4. Cruzar os nomes de tabela com o índice DataTable e os assets efetivamente presentes.
5. Preparar especificações para a implementação de Guerra Infinita sem presumir valores de configuração remota.

## Limites

Esta análise é estática e baseada em bytecode cliente exportado. Ela não comprova a configuração ativa no servidor, a resposta remota de `CheckSwitch), nem quais tabelas foram servidas a uma conta específica em runtime.

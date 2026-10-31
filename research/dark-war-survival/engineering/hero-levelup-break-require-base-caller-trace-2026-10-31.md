# HeroLevelUpTemplateManager — rastreamento de GetBreakRequireBase

**Resultado:** PASS parcial — assinatura, campo físico solicitado e callsite direto identificados; argumento de negócio ainda não resolvido.

## 1. Função GetBreakRequireBase

Inventário de funções e constantes do bundle DataCenter em Lua 5.4 e 5.5:
- função 13;
- linhas 71–73;
- 2 parâmetros incluindo self (portanto, um argumento explícito);
- constantes: `GetTableData`, `GetTableName`, `break_require_base`.

A função realiza a consulta:
```
GetTableData(self:GetTableName(), R1, "break_require_base")
```

Diferentemente dos acessores de atributos e tropas (funções 8–10), ela não constrói nome de coluna por concatenação e não recebe R2/R3.

## 2. Callsite direto encontrado

A função 6 do mesmo módulo, linhas 30–39, contém a chamada de método cujo nome é constante K4 = `GetBreakRequireBase`.

- Lua 5.4: a análise de fluxo de registradores identifica a chamada com receptor R0 e argumento R5.
- Lua 5.5: a extração atual reporta receptor R0 e valor `1` para o segundo argumento. Como o decodificador/crosswalk ainda não validou de forma independente essa posição na instrução de chamada Lua 5.5, esse valor não é aceito como equivalente ao R5 de Lua 5.4.

A função 6 também referencia `DataCenter.BuildManager.MainLv` e `HeroMaxLevel`; porém, não se conclui que o argumento R5 seja um desses valores sem decodificar integralmente a sequência de instruções e os registradores intermediários.

## 3. Limites

- Campo solicitado `break_require_base`: confirmado em ambas as versões.
- Assinatura com um argumento explícito: confirmada em ambas.
- Callsite direto na função 6: identificado em ambas.
- Significado semântico do argumento: **UNKNOWN**.
- Equivalência do argumento no callsite Lua 5.4/5.5: **NOT VALIDATED**.
- Chamadores externos à função 6: ainda não identificados.

## 4. Ambiente e próxima etapa

RAM livre medida nesta rodada: 832,1 MB; limite de 875 MB para iniciar nova carga/exportação. Portanto, a extração de novos bundles permanece bloqueada.

Próxima etapa:
1. decodificar independentemente os registradores da função 6 nas duas versões, sem inferir pelo crosswalk parcial;
2. rastrear consumidores externos da função 6 / classe HeroLevelUpTemplateManager;
3. aplicar a mesma técnica aos acessores GetAtk, GetDef e GetArmyNum;
4. extrair e validar `heroes_levelup.bytes` quando a memória atingir o limite.

Nenhum bundle foi carregado/exportado nesta rodada. Nenhum arquivo original foi alterado; sem merge, deploy ou mudança de gameplay.

# Relatório de calibração de probabilidades — v1

**Status:** aprovado para a configuração atual; nenhuma probabilidade foi alterada.
**Método:** simulação Monte Carlo determinística, com semente fixa 0x1f1a17 e 1.000.000 de tentativas.
**Execução CI:** [Drop Probability Calibration](https://github.com/japaprp/infinit-war-guerra-infinita/actions/runs/38779223716).

## Configuração e resultados observados

| Métrica | Configurado | Observado na simulação |
| --- | ---: | ---: |
| Equipamento direto por vitória contra monstro | 20,00% | 19,960% (199.596 / 1.000.000) |
| Encontrar baú por vitória contra monstro | 10,00% | 10,011% (100.111 / 1.000.000) |
| Conteúdo do baú: recursos | 55,00% | 55,02% |
| Conteúdo do baú: fragmentos | 30,00% | 30,01% |
| Conteúdo do baú: equipamento | 15,00% | 14,97% |
| Raridade do equipamento: comum | 72,00% | 71,98% |
| Raridade do equipamento: raro | 23,00% | 22,94% |
| Raridade do equipamento: épico | 5,00% | 5,08% |

O teste verifica que as tabelas totalizam 100% e que as frequências observadas ficam dentro de uma tolerância de seis erros-padrão para cada proporção. O teste passou na CI.

## Leitura da economia

- A expectativa de equipamento direto é de **0,20 item por vitória**.
- A expectativa de equipamento proveniente de baús é de **10% × 15% = 1,5%**, ou **0,015 item por vitória**.
- Somando as duas fontes, a expectativa é de **0,215 item de equipamento por vitória** (antes de considerar qualquer outra fonte futura).
- Como as duas fontes podem ocorrer na mesma vitória, esse valor é uma expectativa de quantidade, não a probabilidade de obter pelo menos um item.

## Decisão de balanceamento

**Não alterar os pesos com base nesta simulação.** O experimento confirma que a implementação estatística corresponde aos pesos configurados; ele não demonstra que as chances são divertidas, justas ou economicamente ideais para jogadores reais. Para calibrar o equilíbrio de jogo, a próxima revisão deve usar sessões de teste e telemetria legítima (por exemplo, itens por hora, progressão e frequência de repetição), além de testes de regressão.

Os valores são parâmetros provisórios do *Guerra Infinita*, não afirmações sobre as probabilidades internas de Dark War: Survival.

# Plano de testes de integração — chips da viatura

**Destino:** Guerra Infinita  
**Estado:** plano derivado da revisão da PR #17; ainda não representa testes executados.  
**PR analisada:** https://github.com/japaprp/infinit-war-guerra-infinita/pull/17  
**Regra:** não atribuir bônus de ressonância até que a regra de design seja aprovada e coberta por testes.

## Constatação da revisão

Na branch `feat/vehicle-chip-loadouts`, `vehicleChipLoadouts` e `activeVehicleChipPreset` são normalizados, persistidos e apresentados na interface. A função de cálculo de atributos observada na revisão usa `hero.equippedChips`; não foi localizada uma integração explícita do preset ativo da viatura nesse cálculo. Assim, os quatro slots/presets estão modelados como estado/configuração, mas **não há evidência no código revisado de que os chips da viatura já alterem os atributos de combate**.

Esta é uma limitação funcional a validar, não uma acusação de falha: a PR descreve uma etapa de domínio/UI e não define bônus de ressonância.

## Casos de teste necessários

| ID | Área | Cenário | Resultado esperado |
|---|---|---|---|
| LOADOUT-001 | Presets | Iniciar save novo | Quatro presets I–IV com quatro slots vazios cada; preset I ativo por padrão |
| LOADOUT-002 | Persistência | Equipar chips em dois presets, salvar e recarregar | Referências e preset ativo permanecem iguais; nenhum item é duplicado no inventário |
| LOADOUT-003 | Integridade | Referência a ID inexistente no save | Referência é normalizada para vazio sem crash |
| LOADOUT-004 | Integridade | Mesmo ID em dois slots do mesmo preset | No máximo um slot conserva a referência |
| LOADOUT-005 | Alternância | Mesma instância salva em presets alternativos | Permitido como configuração salva; apenas o preset ativo é elegível para efeito de combate |
| LOADOUT-006 | Combate | Comparar atributos com preset I ativo e depois preset II ativo, com chips diferentes | Somente chips do preset ativo afetam os atributos da viatura, quando essa regra for implementada |
| LOADOUT-007 | Isolamento | Alterar preset inativo sem trocar o ativo | Atributos de combate não mudam |
| LOADOUT-008 | Inventário | Tentar consumir como cópia um chip referenciado em um ou mais presets | Política explícita e consistente; não destruir silenciosamente uma configuração salva |
| LOADOUT-009 | Troca | Instalar no preset um chip equipado em herói | A ação deve remover a equipagem anterior de modo atômico ou bloquear com mensagem clara; nunca deixar os dois estados ativos |
| LOADOUT-010 | Evolução | Evoluir um chip que aparece em presets alternativos | Todas as referências apontam à mesma instância atualizada; custo cobrado uma única vez |
| LOADOUT-011 | Limite | Instalar quinto chip no mesmo preset | Ação recusada, estado e inventário inalterados |
| LOADOUT-012 | Regressão | Carregar save antigo sem campos de presets | Defaults são criados e dados existentes de heróis/inventário são preservados |
| LOADOUT-013 | Atributos | Mesmo chip salvo em preset inativo e equipado no herói | Regra de exclusividade documentada; não contar bônus duas vezes |
| LOADOUT-014 | Ressonância | Nenhuma regra configurada | Nenhum bônus de ressonância aplicado nem anunciado como ativo |
| LOADOUT-015 | Economia | Erro/falha durante melhoria ou instalação | Nenhum consumo parcial de cópias ou materiais; estado permanece consistente |

## Separação recomendada do cálculo

Manter funções puras para:
1. resolver IDs de chip de um preset;
2. validar que cada referência aponta para uma instância válida;
3. calcular os modificadores de veículo do preset ativo;
4. combinar modificadores do veículo com atributos de heróis sem dupla contagem;
5. aplicar regras de ressonância apenas a partir de uma configuração explícita e versionada.

Os dados de Dark War ficam no diretório de pesquisa e não devem ser importados como tabela de balanceamento de produção.

## Critério de aceite

Não considerar o sistema integrado ao combate até que LOADOUT-006 e LOADOUT-007 tenham testes automatizados determinísticos, e que a persistência, consumo/evolução e migração de save passem nos testes de integração. A execução de testes de domínio isolados não prova integração de combate.

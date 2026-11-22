# Arte de personagens — Guerra Infinita

Este diretório recebe arte original criada para o projeto. Não coloque aqui arquivos extraídos de Dark War: Survival ou de outros jogos.

## Primeiro recurso: `hero_recruit.png`

**Caminho esperado:** `assets/characters/hero_recruit.png`

Especificação de integração:
- PNG; transparência alfa recomendada.
- Personagem inteiro, centralizado, sem cortar cabeça, mãos, mochila ou botas.
- Pose neutra; roupa tática desgastada em grafite, areia e verde militar.
- Mochila compacta, luvas pretas e botas.
- Manter a imagem original em sua resolução; o jogo deve ajustar a exibição sem modificar o arquivo-fonte.
- Evitar nomes com espaços, acentos ou diferenças de maiúsculas/minúsculas.

## Procedimento seguro

1. Envie o arquivo original para este diretório em uma alteração separada.
2. Confira no GitHub se o arquivo abre, se a transparência foi preservada e se não há cortes.
3. Integre a imagem como recurso opcional. Até a validação visual, a arte atual e o fallback devem continuar funcionando.
4. Rode a CI e verifique a interface em execução antes de substituir qualquer representação existente.

## Regras de compatibilidade

- Não depender de serviços, fontes ou URLs externos: os recursos devem ser locais ao jogo.
- Não remover nem renomear os recursos atuais durante a primeira integração.
- Não tratar a presença do arquivo como prova de que ele foi exibido corretamente; validar no jogo.
- Se o arquivo ainda não existir, a interface deve continuar usando a arte/fallback atual.

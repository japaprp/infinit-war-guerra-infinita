# Recebimento e integração da arte original

Esta pasta recebe os arquivos criados especificamente para Guerra Infinita. Os arquivos de arte não são versionados pelo editor de texto do GitHub; devem ser enviados como arquivos binários pelo GitHub Web, GitHub Desktop ou VS Code.

## Estrutura esperada

```
assets/
  art/
    heroes/hero_recruit.png
    enemies/enemy_mutant_scavenger.png
    equipment/equipment_scrap_blade.png
    chests/chest_supply_common.png
    maps/map_wasteland_expedition.png
  original-art-manifest.json
```

Os nomes e caminhos são controlados por `assets/original-art-manifest.json`. Se for preciso renomear algum arquivo, atualize o manifesto no mesmo PR.

## Regras de importação

- Prefira PNG. Personagens, inimigos, equipamentos e baús devem ter transparência real quando possível.
- Mantenha os arquivos individuais; não use uma colagem como substituto.
- Não sobrescreva os recursos existentes nem altere a economia/probabilidades ao integrar arte.
- Não adicione arquivos de referência de outros jogos como recursos finais.
- Evite arquivos gigantes: exporte com dimensões adequadas e comprima sem destruir a nitidez.
- Faça commit na branch `feat/starting-player-progression`, mantendo a PR #4 aberta.

## Validação local

Com Node.js instalado, execute na raiz do repositório:

```bash
node scripts/validate-art-assets.mjs
```

O modo padrão informa os arquivos ainda ausentes e valida os PNGs presentes, permitindo preparar o projeto antes de a arte ficar pronta. Quando todos os arquivos tiverem sido adicionados, execute:

```bash
node scripts/validate-art-assets.mjs --strict
```

A validação confere assinatura PNG e dimensões mínimas. O aviso de transparência é uma verificação técnica inicial; ainda é necessário abrir os arquivos e verificar visualmente recortes, bordas, estilo e artefatos.

## Critério de conclusão

1. Todos os recursos obrigatórios estão no caminho definido.
2. O validador termina sem erros no modo `--strict`.
3. As imagens são abertas e conferidas visualmente.
4. A interface carrega cada imagem com fallback para a apresentação atual quando um arquivo estiver ausente.
5. Executar os testes de persistência, integração de backend, economia e calibração antes de concluir a etapa.

# Mundo do Bip

Plataforma de matemática e lógica de programação com o robô Bip.
Site no ar: https://mundo-do-bip.netlify.app

## O que tem aqui

| Pasta | O que é |
|---|---|
| `dist/` | O site pronto. É isto que o Netlify publica. |
| `fonte/menu/` | Tela inicial: perfis de aluno, menu dos jogos e código de progresso. |
| `fonte/robo/` | Robô Programador (91 fases, 9 mundos), dividido em módulos. |
| `fonte/academia/` | Academia do Bip em 3D (Mundo 1: Fundamentos da Geometria, 12 aulas). |
| `fonte/robo-matematica/` | Versão do Robô com 4 mundos de matemática (6º ao 9º ano), testada, ainda fora do site. |
| `build.py` | Junta tudo da pasta `fonte/` e gera a pasta `dist/`. |

## Como atualizar

1. Mude os arquivos em `fonte/`.
2. Rode `python3 build.py` (precisa de Python 3 e Node).
3. Envie para o GitHub. O Netlify publica sozinho em cerca de 1 minuto
   (projeto **mundo-do-bip** no Netlify, ligado a este repositório, pasta `dist`).

## Regras para não perder o progresso dos alunos

- O progresso fica no navegador de cada aluno, separado por perfil (`robo4:<id>` e `academia-bip-3d-v1:<id>`).
- O código de progresso usa a **ordem** das fases do Robô e das aulas da Academia.
  Fases e aulas novas entram **sempre no final**. Não renomeie nem reordene as que já existem.
- Não volte a colocar o "Liberar todas as fases" (modo professor). O progresso é fase por fase.

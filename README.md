# Mundo do Bip

Plataforma de matemática e lógica de programação com o robô Bip.
Site no ar: https://mundodobip.com.br (hospedado no Cloudflare Pages: publica a pasta dist/ a cada push na main)

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

## Turmas e progresso na nuvem (Supabase)

- `fonte/banco/001_turmas.sql`: tabelas e regras de segurança. Rode no **SQL Editor** do Supabase (pode rodar de novo sem perder dados).
- `fonte/config.json`: endereço do projeto e a chave **publishable/anon** (pública por natureza). **Nunca** coloque a chave secreta/service_role aqui.
- `fonte/menu/nuvem.js`: conexão com o banco (só `fetch`, sem biblioteca).
- `professor.html`: área do professor (criar turmas, ver progresso, trocar PIN).
- Alunos não informam e-mail nem nome completo: só apelido + PIN de 4 números (guardado embaralhado).
- Testes locais: `ferramentas/teste/` (Postgres local imitando o Supabase + teste completo no navegador).

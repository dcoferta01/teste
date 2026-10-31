# Instruções do projeto

Este projeto foi configurado com um conjunto de ferramentas de design de front-end.
**Use-as automaticamente** no trabalho de UI, sem esperar o usuário pedir por nome.

## Regra geral para qualquer trabalho de UI

Sempre que for **criar, redesenhar, reestilizar, polir ou revisar** qualquer
interface — landing page, site de marketing, portfólio, página de produto,
one-pager, hero, ou telas de app (dashboard, admin, settings, inbox) — em
qualquer stack (HTML/CSS, React, Next.js, Vue, Svelte, Astro, Tailwind):

1. **Invoque a skill `design-taste-frontend`** (via Skill) antes de começar o
   design. Ela é a direção de arte "anti-slop": distribui direções pesquisadas,
   aplica o house style sem ornamentos e roda o inspetor em browser real.
   Siga o fluxo dela ("the run", passos 1–10).

2. **Escolha uma linguagem visual de referência** em `design-md-library/`.
   São 84 arquivos `DESIGN.md` (um por marca) em
   `design-md-library/design-md/<marca>/DESIGN.md`. Se o usuário não indicar uma
   marca, escolha a que melhor casa com o briefing, leia o `DESIGN.md` dela e
   use seus tokens e regras. Diga qual marca você escolheu e por quê.

3. **Antes de concluir**, rode o review `/web-interface-guidelines` (comando em
   `.claude/commands/web-interface-guidelines.md`) nos arquivos de UI que você
   criou/alterou, e corrija o que ele apontar (acessibilidade, focus states,
   forms, etc.).

4. **Para verificar o resultado no navegador** (screenshots, testar interações,
   conferir se a página funciona de verdade), use a skill `playwright-cli`. O
   inspetor da `design-taste-frontend` já faz isso no fluxo dele; use a
   `playwright-cli` para checagens adicionais ou automação de browser.

## Onde cada ferramenta vive

| Ferramenta | Local | Para quê |
| --- | --- | --- |
| Skill `design-taste-frontend` | `.agents/skills/design-taste-frontend/` (symlink em `.claude/skills/`) | Direção de arte e house style anti-slop |
| Comando `/web-interface-guidelines` | `.claude/commands/web-interface-guidelines.md` | Revisão de código de UI (Vercel guidelines) |
| Biblioteca `DESIGN.md` | `design-md-library/design-md/<marca>/DESIGN.md` | Linguagens visuais de referência (84 marcas) |
| Skill `playwright-cli` | `.claude/skills/playwright-cli/` | Automação de browser, screenshots e testes |

## Ordem resumida

briefing → `design-taste-frontend` (direção + ideia) → escolher `DESIGN.md` de
referência → construir → `/web-interface-guidelines` → entregar.

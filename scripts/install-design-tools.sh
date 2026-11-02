#!/usr/bin/env bash
#
# Instala GLOBALMENTE (em ~/.claude) o conjunto de ferramentas de design de
# front-end, para que valham em TODOS os repositórios e sessões.
#
# Uso:
#   - Local (sua máquina): rode este script uma vez.
#       bash scripts/install-design-tools.sh
#   - Nuvem (Claude Code web): cole o CONTEÚDO deste script no campo
#       "Setup script" do ambiente (menu do ambiente na barra de título -> Edit).
#     Ele roda no início de cada sessão nova, reinstalando tudo no container.
#
# Idempotente: pode rodar quantas vezes quiser.
set -euo pipefail

CLAUDE_DIR="${HOME}/.claude"
SKILLS_DIR="${CLAUDE_DIR}/skills"
COMMANDS_DIR="${CLAUDE_DIR}/commands"
LIB_DIR="${CLAUDE_DIR}/design-md-library"

mkdir -p "${SKILLS_DIR}" "${COMMANDS_DIR}"

echo ">> 1/5 skill design-taste-frontend"
if [ ! -f "${SKILLS_DIR}/design-taste-frontend/SKILL.md" ]; then
  tmp="$(mktemp -d)"
  git clone --depth 1 https://github.com/Leonxlnx/taste-skill.git "${tmp}/taste"
  rm -rf "${SKILLS_DIR}/design-taste-frontend"
  cp -r "${tmp}/taste/skills/taste-skill" "${SKILLS_DIR}/design-taste-frontend"
  rm -rf "${tmp}"
else
  echo "   (já instalada)"
fi

echo ">> 2/5 comando /web-interface-guidelines"
curl -fsSL \
  https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md \
  -o "${COMMANDS_DIR}/web-interface-guidelines.md"

echo ">> 3/5 biblioteca DESIGN.md (84 marcas)"
if [ ! -d "${LIB_DIR}/design-md" ]; then
  tmp="$(mktemp -d)"
  git clone --depth 1 https://github.com/voltagent/awesome-design-md.git "${tmp}/adm"
  mkdir -p "${LIB_DIR}"
  cp -r "${tmp}/adm/design-md" "${LIB_DIR}/"
  cp "${tmp}/adm/README.md" "${LIB_DIR}/README.md" 2>/dev/null || true
  rm -rf "${tmp}"
else
  echo "   (já instalada)"
fi

echo ">> 4/5 playwright-cli + skill"
npm install -g @playwright/cli@latest >/dev/null 2>&1 || npm install -g @playwright/cli@latest
( cd "${HOME}" && playwright-cli install --skills >/dev/null 2>&1 || true )

echo ">> 5/5 ~/.claude/CLAUDE.md (instruções globais)"
cat > "${CLAUDE_DIR}/CLAUDE.md" <<'EOF'
# Instruções globais de design de front-end

Estas ferramentas estão instaladas globalmente e valem para TODOS os projetos.
**Use-as automaticamente** no trabalho de UI, sem esperar o usuário pedir.

## Regra geral para qualquer trabalho de UI

Sempre que for criar, redesenhar, reestilizar, polir ou revisar qualquer
interface (landing page, site, portfólio, página de produto, one-pager, hero,
ou telas de app: dashboard, admin, settings, inbox) em qualquer stack
(HTML/CSS, React, Next.js, Vue, Svelte, Astro, Tailwind):

1. Invoque a skill `design-taste-frontend` antes de começar o design
   (direção de arte anti-slop; siga o fluxo dela, passos 1–10).
2. Escolha uma linguagem visual de referência em
   `~/.claude/design-md-library/design-md/<marca>/DESIGN.md` (84 marcas). Se o
   usuário não indicar, escolha a que melhor casa com o briefing, leia o
   DESIGN.md dela e diga qual escolheu e por quê.
3. Antes de concluir, rode o review `/web-interface-guidelines` nos arquivos de
   UI criados/alterados e corrija o que apontar (acessibilidade, focus, forms).
4. Para conferir no navegador (screenshots, testar interações), use a skill
   `playwright-cli`.

## Ordem resumida
briefing -> design-taste-frontend -> escolher DESIGN.md -> construir ->
/web-interface-guidelines -> conferir no browser -> entregar.
EOF

echo ""
echo "OK. Ferramentas globais instaladas em ${CLAUDE_DIR}:"
echo "  - skills/design-taste-frontend"
echo "  - skills/playwright-cli"
echo "  - commands/web-interface-guidelines.md"
echo "  - design-md-library/ (84 DESIGN.md)"
echo "  - CLAUDE.md (instruções globais)"

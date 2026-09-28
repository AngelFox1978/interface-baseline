#!/usr/bin/env bash
# Installe une skill Claude (par projet) selon sa méthode.
# Usage : bash scripts/install-skill.sh <method> <arg> [subdir]
#
# Méthodes :
#   uipro       : <arg> = commande (ex. "uipro init --ai claude")
#   qaskills    : <arg> = commande (ex. "npx @qaskills/cli add playwright-e2e-testing --agent claude-code")
#   marketplace : <arg> = commandes CLI claude (ex. "claude plugin marketplace add o/r --scope project && claude plugin install p@m --scope project")
#                 exécutées si la CLI claude est présente, sinon affichées
#   copy        : <arg> = url repo, [subdir] = chemin de la skill dans le repo -> .claude/skills/

set -euo pipefail
METHOD="${1:?methode manquante}"
ARG="${2:?argument manquant}"
SUBDIR="${3:-}"

case "$METHOD" in
  uipro|qaskills)
    eval "$ARG" ;;
  marketplace)
    if command -v claude >/dev/null 2>&1; then eval "$ARG"
    else echo "CLI claude absente — à exécuter plus tard : $ARG"; fi ;;
  copy)
    dest=".claude/skills"; mkdir -p "$dest"
    tmp="$(mktemp -d)"; git clone --depth 1 "$ARG" "$tmp"
    if [ -n "$SUBDIR" ]; then cp -r "$tmp/$SUBDIR" "$dest"/; else cp -r "$tmp"/* "$dest"/; fi
    rm -rf "$tmp" ;;
  *)
    echo "Méthode inconnue : $METHOD" >&2; exit 1 ;;
esac

echo "==> Skill installée ($METHOD)"

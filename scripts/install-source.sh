#!/usr/bin/env bash
# Installe une source GitHub dans le projet courant selon son mode.
# Usage : bash scripts/install-source.sh <url> <mode> [target] [install_cmd]
#
# Modes :
#   merge-template : fusionne les fichiers du repo à la racine
#   skills         : copie skills/ ou .claude/skills/ dans <target> (def .claude/skills/)
#   clone-subdir   : clone dans vendor/<nom>
#   submodule      : git submodule add
#   package        : exécute <install_cmd> (ex. "npm i drizzle-orm")

set -euo pipefail
URL="${1:?url manquante}"
MODE="${2:?mode manquant}"
TARGET="${3:-}"
INSTALL_CMD="${4:-}"
NAME="$(basename "$URL" .git)"

case "$MODE" in
  merge-template)
    tmp="$(mktemp -d)"; git clone --depth 1 "$URL" "$tmp"
    rsync -a --exclude='.git' "$tmp"/ ./ ; rm -rf "$tmp" ;;
  skills)
    dest="${TARGET:-.claude/skills}"; mkdir -p "$dest"
    tmp="$(mktemp -d)"; git clone --depth 1 "$URL" "$tmp"
    cp -r "$tmp"/.claude/skills/* "$dest"/ 2>/dev/null || true
    cp -r "$tmp"/skills/* "$dest"/ 2>/dev/null || true
    cp -r "$tmp"/agents/* "$dest"/ 2>/dev/null || true
    rm -rf "$tmp" ;;
  clone-subdir)
    mkdir -p vendor; git clone --depth 1 "$URL" "vendor/$NAME" ;;
  submodule)
    git submodule add "$URL" "vendor/$NAME" ;;
  package)
    eval "${INSTALL_CMD:?install_cmd requis pour le mode package}" ;;
  *)
    echo "Mode inconnu : $MODE" >&2; exit 1 ;;
esac

echo "==> Source installée : $NAME ($MODE)"

#!/usr/bin/env bash
# Initialise une nouvelle interface créée depuis le template interface-baseline.
# Appelé par Projects Pilot juste après `gh repo create --template`.
#
# Usage :
#   bash scripts/post-init.sh <project_slug> <port> [admin_email]
#
# Effet :
#   - renomme le package
#   - génère AUTH_SECRET, un mot de passe admin + son hash
#   - écrit .env (PORT, secret, admin)
#   - installe la skill de design (ui-ux-pro-max) si la CLI uipro est dispo
#   - affiche les identifiants admin UNE SEULE FOIS (à transmettre à Pilot)

set -euo pipefail

SLUG="${1:?slug manquant}"
PORT="${2:?port manquant}"
ADMIN_EMAIL="${3:-admin@${SLUG}.local}"

echo "==> Initialisation de l'interface '$SLUG' sur le port $PORT"

# 1) Nom du package
npm pkg set name="$SLUG" >/dev/null 2>&1 || true

# 2) Secrets & admin
AUTH_SECRET="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
ADMIN_PASSWORD="$(head -c 12 /dev/urandom | base64 | tr -d '/+=' | cut -c1-16)"
ADMIN_HASH="$(node scripts/seed-admin.mjs "$ADMIN_PASSWORD" | grep ADMIN_PASSWORD_HASH | cut -d= -f2-)"

# 3) .env
cat > .env <<EOF
PORT=$PORT
AUTH_SECRET=$AUTH_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD_HASH=$ADMIN_HASH
EOF

# 4) Skill de design (installée au minimum, par projet)
if command -v uipro >/dev/null 2>&1; then
  echo "==> Installation de la skill ui-ux-pro-max"
  uipro init --ai claude || true
else
  echo "!! CLI 'uipro' absente : skill design non installée. (npm i -g uipro-cli)"
fi

# 5) Récap identifiants (à capturer par Pilot, affiché une seule fois)
echo ""
echo "==================== IDENTIFIANTS ADMIN ===================="
echo " URL local : http://localhost:$PORT"
echo " Email     : $ADMIN_EMAIL"
echo " Password  : $ADMIN_PASSWORD"
echo "============================================================"
echo "(Le mot de passe n'est PAS stocké en clair. Pilot doit le capturer ici.)"

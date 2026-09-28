# interface-baseline

Repo **template** pour Projects Pilot. Chaque nouvelle interface web part d'ici :
auth par mot de passe, FR/EN, sidebar, graphiques, et un design indigo prêt à
l'emploi. Utilisé en *Template repository* (GitHub → Settings → coche
**Template repository**).

## Stack

Next.js 15 · TypeScript · Tailwind v4 · primitives shadcn · next-intl ·
Chart.js · auth maison (jose + bcryptjs).

## Démarrage rapide (en local)

```bash
npm install
cp .env.example .env
npm run seed:admin                    # saisie masquée du mot de passe (jamais en argument)
#   copier TELLE QUELLE la ligne ADMIN_PASSWORD_HASH=\$2a\$… dans .env
#   (sans apostrophes : les \$ sont nécessaires, voir scripts/env-hash.mjs)
#   et renseigner ADMIN_EMAIL + AUTH_SECRET dans .env
npm run dev                           # http://localhost:$PORT (PORT du .env)
```

## Base de données (optionnel)

Postgres sert aux pages **Prompts** et **Journal** (tables de `db/schema.sql`).
Sans base, ces pages affichent « base injoignable » ; le reste fonctionne.

**Avec Docker** (image figée, port publié sur 127.0.0.1 uniquement, schéma
appliqué automatiquement au premier démarrage) :

```bash
cp infra/postgres/.env.example infra/postgres/.env    # changer le mot de passe
docker compose -f infra/postgres/docker-compose.example.yml up -d
# dans .env : DATABASE_URL=postgres://baseline:<mot de passe>@127.0.0.1:5432/baseline
```

**Sans Docker** (Postgres installé localement, `psql` dans le PATH) :

```bash
createdb baseline
psql -d baseline -f db/schema.sql
# dans .env : DATABASE_URL=postgres://<utilisateur>:<mot de passe>@127.0.0.1:5432/baseline
```

Relancer `npm run dev` après avoir modifié `.env`.

## Création d'une interface depuis Pilot

```bash
gh repo create <nom> --template <user>/interface-baseline --private --clone
cd <nom>
bash scripts/post-init.sh <slug> <port> [admin_email]
npm install && npm run dev
```

`post-init.sh` génère `AUTH_SECRET`, un mot de passe admin (affiché une fois),
installe la skill de design, et écrit `.env`.

## Repères

- Design : `design-system/MASTER.md` (+ visuel `design-system/reference/`)
- Comportement Claude Code : `CLAUDE.md`
- Catalogues proposés par Pilot : `catalogs/`
- Décisions auth à finaliser : `docs/AUTH-DECISIONS.md`
- Brief complet : `BASELINE-BRIEF.md`

## Scripts

| Script | Rôle |
| --- | --- |
| `scripts/post-init.sh` | initialise une interface (port, secret, admin, skill design) |
| `scripts/install-source.sh` | installe un GitHub ajouté selon son mode |
| `scripts/install-skill.sh` | installe une skill Claude selon sa méthode |
| `scripts/seed-admin.mjs` | hash bcrypt du mot de passe admin (saisie masquée, ligne prête pour `.env`) |

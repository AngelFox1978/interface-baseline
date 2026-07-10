# Prompts Claude Code — Amélioration interface-baseline

Ordre recommandé : 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
Pour chaque axe : créer une branche, lancer le prompt, vérifier, commit, puis passer au suivant.

```bash
git checkout -b chore/qualite-baseline
```

---
## Workflow Git

- Ne JAMAIS committer directement sur main.
- Avant toute modification de code : vérifier la branche courante avec `git branch --show-current`.
  Si on est sur main : créer et basculer sur une branche dédiée (`git checkout -b <type>/<sujet>`,
  types : feat/, fix/, chore/, docs/) AVANT le premier changement.
- En fin de tâche : proposer le commit avec un message clair en français, mais attendre
  ma validation avant de committer et pousser.

## Prompt 1 — CI GitHub Actions (lint + build)

```
Crée un workflow GitHub Actions dans .github/workflows/ci.yml pour ce projet Next.js 15.

Exigences :
- Déclenchement sur push vers main et sur toute pull request
- Node 22, cache npm activé (actions/setup-node avec cache: 'npm')
- Étapes : npm ci, puis lint, puis npm run build
- Pour le build : définir des variables d'env factices pour que `next build` passe sans vraie config (SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, DATABASE_URL, ANTHROPIC_API_KEY) — inspire-toi de .env.example pour la liste exacte
- Concurrency group pour annuler les runs obsolètes sur une même branche
- Le workflow doit échouer si lint ou build échoue

Ne modifie rien d'autre. Vérifie la syntaxe YAML avant de terminer.
```

---

## Prompt 2 — Migration ESLint flat config (remplace `next lint` déprécié)

```
`next lint` est déprécié depuis Next 15.5. Migre ce projet vers ESLint flat config :

1. Installe les devDependencies nécessaires : eslint, eslint-config-next, @eslint/eslintrc si besoin pour la compat
2. Crée eslint.config.mjs à la racine en flat config, étendant les règles next/core-web-vitals et next/typescript
3. Remplace le script "lint" dans package.json par "eslint ." et ajoute un script "lint:fix" avec --fix
4. Ajoute les ignores nécessaires dans la flat config : .next/, node_modules/, next-env.d.ts
5. Lance npm run lint et corrige les erreurs bloquantes qu'il remonte (pas les warnings cosmétiques, sauf si trivial)

Attention : le fichier console-creation-v2.jsx à la racine est un fichier de référence design, ajoute-le aux ignores plutôt que de le corriger.
```

---

## Prompt 3 — Uniformiser les routes API en TypeScript + validation Zod

```
Ce projet a des routes API mixtes JS/TS. Uniformise tout en TypeScript avec validation Zod :

1. Installe zod
2. Convertis en .ts : app/api/ollama/models/route.js, app/api/hybrid/status/route.js, app/api/prompts/route.js, app/api/prompts/[id]/route.js
3. Pour chaque route : type les réponses, remplace les vérifications manuelles de payload par des schémas Zod (safeParse + retour 400 avec le détail des erreurs de validation)
4. Prends exemple sur app/api/claude/route.ts qui est déjà en TS — et refactorise aussi sa validation manuelle (typeof payload.prompt === "string" etc.) vers un schéma Zod pour la cohérence
5. Centralise les schémas partagés dans lib/validation.ts si plusieurs routes utilisent les mêmes formes
6. Conserve exactement le comportement existant : mêmes codes HTTP, mêmes messages d'erreur en français, même logique de session (getSession → 401)

Vérifie avec npm run build que tout compile. Aucun changement de comportement fonctionnel attendu.
```

---

## Prompt 4 — Rate limiting sur le login

```
Ajoute une protection brute-force sur le login (actions/auth.ts) :

1. Crée lib/rate-limit.ts : un limiteur en mémoire (Map) par clé email+IP avec fenêtre glissante — max 5 tentatives échouées sur 15 minutes, verrou de 15 minutes une fois le seuil atteint. Prévois un nettoyage périodique des entrées expirées pour éviter la fuite mémoire.
2. Intègre-le dans l'action login() : vérifie le verrou AVANT bcrypt.compare, incrémente sur échec, réinitialise sur succès
3. Retourne un état d'erreur distinct { error: "locked" } quand le compte est verrouillé, et affiche un message dédié dans app/login/login-form.tsx (ajoute la traduction dans messages/fr.json et messages/en.json)
4. IMPORTANT — timing attack : quand l'email ne correspond pas à ADMIN_EMAIL, exécute quand même un bcrypt.compare contre un hash factice pour que le temps de réponse ne révèle pas si l'email existe
5. Documente la limite de l'approche en mémoire (reset au redémarrage, non partagé multi-instances) dans un commentaire, avec la piste table pg pour plus tard

Écris le code commenté en français, cohérent avec le style existant du repo.
```

---

## Prompt 5 — Sessions révocables en Postgres

```
Actuellement la session est un JWT 7 jours non révocable (lib/auth.ts + actions/auth.ts). Rends les sessions révocables via Postgres :

1. Ajoute une table sessions dans db/schema.sql : id UUID PK (gen_random_uuid()), email TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ NULL, user_agent TEXT
2. À la connexion : insère une ligne session et mets l'id de session (sid) dans le payload du JWT
3. Crée une fonction validateSession qui vérifie le JWT PUIS que la ligne existe, n'est ni expirée ni révoquée. Utilise le pool pg existant du projet (lib/db)
4. ATTENTION middleware : middleware.ts tourne en Edge runtime, pas d'accès pg direct. Garde dans le middleware la seule vérification JWT (rapide), et fais la vérification DB dans getSession() côté serveur (routes API et Server Components) — documente ce choix en commentaire
5. logout() : marque revoked_at = now() en plus de supprimer le cookie
6. Bonus : script scripts/revoke-sessions.mjs qui révoque toutes les sessions actives (cas token compromis)
7. Prévois un fallback propre si DATABASE_URL est absent : comportement JWT-only actuel avec un console.warn, pour ne pas casser les interfaces sans DB

Aucune dépendance nouvelle : jose et pg suffisent.
```

---

## Prompt 6 — Migrations avec Drizzle ORM

```
Remplace le schema.sql manuel par Drizzle ORM + drizzle-kit :

1. Installe drizzle-orm et drizzle-kit (dev)
2. Crée db/schema.ts en Drizzle reprenant EXACTEMENT les tables existantes de db/schema.sql (prompts, et sessions si elle existe déjà) — mêmes noms de colonnes, mêmes types, mêmes contraintes (content_hash UNIQUE, defaults, etc.)
3. Crée drizzle.config.ts pointant sur DATABASE_URL, migrations dans db/migrations/
4. Ajoute les scripts npm : "db:generate" (drizzle-kit generate), "db:migrate" (drizzle-kit migrate), "db:studio" (drizzle-kit studio)
5. Génère la migration initiale
6. Migre les routes app/api/prompts/* pour utiliser les requêtes typées Drizzle au lieu du SQL brut pg — comportement identique (mêmes réponses JSON, mêmes codes HTTP)
7. Garde db/schema.sql en le renommant db/schema.legacy.sql avec un commentaire de dépréciation, le temps de la transition
8. Mets à jour README.md : section "Base de données" expliquant le nouveau workflow (modifier schema.ts → db:generate → db:migrate)

Vérifie que npm run build passe.
```

---

## Prompt 7 — Headers de sécurité

```
Ajoute des headers de sécurité dans next.config.mjs via la fonction headers() :

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Content-Security-Policy : construis-la en analysant les besoins réels du projet — Chart.js et le thème inline nécessitent probablement 'unsafe-inline' pour style-src ; Next.js en dev a besoin de 'unsafe-eval' pour script-src donc fais une CSP différenciée dev/prod ; connect-src doit autoriser 'self' uniquement (les appels Ollama/Anthropic partent du serveur, pas du navigateur — vérifie-le dans le code avant de conclure)

Teste avec npm run dev que l'app fonctionne toujours (thème, charts, login) et npm run build. Commente chaque header en français.
```

---

## Prompt 8 — Dockerfile + compose + Dependabot

```
Prépare le déploiement et la maintenance du template :

1. Dockerfile multi-stage à la racine : stage deps (npm ci), stage build (next build avec output standalone — ajoute output: 'standalone' dans next.config.mjs), stage runner minimal (node:22-alpine, utilisateur non-root, copie .next/standalone + .next/static + public). Expose 3000.
2. infra/compose.yml : service app (build depuis la racine, env_file .env, port 3000) + service db (postgres:17-alpine, volume nommé, healthcheck) + dépendance app→db condition service_healthy. Ajoute extra_hosts: host.docker.internal:host-gateway pour que le conteneur puisse joindre Ollama qui tourne sur l'hôte Windows, et documente qu'il faut alors OLLAMA_URL=http://host.docker.internal:11434
3. .dockerignore : node_modules, .next, .git, .env*
4. .github/dependabot.yml : écosystème npm (hebdomadaire, groupe les mises à jour mineures/patch en une seule PR) + écosystème github-actions (hebdomadaire)
5. README.md : section "Déploiement Docker" avec les 3 commandes essentielles

Vérifie que docker build fonctionne conceptuellement (pas de chemin manquant dans les COPY).
```

---

## Conseils d'exécution dans Trae

- **Une branche par axe** (`chore/ci`, `chore/eslint`, `feat/rate-limit`…) : plus facile à relire et à annuler qu'une méga-branche.
- **Après chaque prompt** : `npm run lint && npm run build` avant de commit. Le prompt 1 (CI) en premier te donne ensuite ce filet de sécurité automatiquement sur GitHub.
- **Prompts 4 et 5 se touchent** (tous deux modifient actions/auth.ts) : fais-les dans l'ordre et sur la même branche `feat/auth-hardening` pour éviter les conflits.
- Si Claude Code dévie, rappelle-lui : « Lis CLAUDE.md et BASELINE-BRIEF.md avant de commencer, respecte les conventions existantes du repo (commentaires en français, style des routes existantes). »

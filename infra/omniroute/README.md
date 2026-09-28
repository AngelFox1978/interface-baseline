# OmniRoute — passerelle IA locale (garde-fous)

[OmniRoute](https://github.com/diegosouzapw/OmniRoute) expose un point d'accès
unique compatible OpenAI (`http://127.0.0.1:20128/v1`) devant plusieurs
fournisseurs de modèles. Il est proposé par défaut dans le template, mais
**rien n'y est branché** : ni Claude Code, ni les routes de l'interface.

## Règles d'usage (obligatoires)

1. **Fournisseurs officiels uniquement**, avec **tes propres clés d'API**
   (Anthropic, OpenAI, Mistral…), plus **Ollama en local**. Rien d'autre.
2. **Ne pas activer les combos de comptes tiers « gratuits »** ni le catalogue
   « free tiers », les coupons d'affiliation, les fournisseurs « web » (cookies de
   session) ou les options de contournement (« TLS stealth », proxys). Ils
   reposent sur des comptes et des conditions d'usage qui ne sont pas les tiens.
3. **Synchro cloud désactivée** : `CLOUD_URL` reste vide (déjà forcé dans le
   compose) ; ne pas activer de relais distant ni de tunnel (Cloudflare,
   ngrok, Tailscale) depuis le tableau de bord.
4. **Facturation** : l'usage d'une API (Anthropic ou autre) est **facturé à
   part** de l'abonnement Claude (Pro/Max). Router du trafic par OmniRoute ne
   le rend pas gratuit.
5. **Claude Code reste branché en direct** : ne pas définir
   `ANTHROPIC_BASE_URL` vers OmniRoute.
6. **Compression** : ne pas cumuler la compression d'OmniRoute avec
   Headroom sans test préalable.

## Installation (sans lancement automatique)

```bash
bash scripts/install-source.sh https://github.com/diegosouzapw/OmniRoute docker infra/omniroute
# remplir infra/omniroute/.env : JWT_SECRET, API_KEY_SECRET,
# STORAGE_ENCRYPTION_KEY, INITIAL_PASSWORD (commandes openssl indiquées)
docker compose -f infra/omniroute/docker-compose.yml up -d
```

Tableau de bord : http://127.0.0.1:20128 — changer le mot de passe initial,
ajouter les fournisseurs officiels, créer une clé d'API (`REQUIRE_API_KEY=true`).

## Ce que fixe le compose

| Garde-fou | Réglage |
| --- | --- |
| Version figée | `diegosouzapw/omniroute:3.8.50` (jamais `latest`) |
| Réseau | port publié sur `127.0.0.1:20128` uniquement |
| Données | volume nommé `omniroute-data` → `/app/data` |
| Secrets | `infra/omniroute/.env`, ignoré par git |
| Cloud | `CLOUD_URL` vide |

Mise à jour : changer le tag dans le compose après lecture des notes de
version, puis `docker compose -f infra/omniroute/docker-compose.yml up -d`.

## Utilisation depuis l'interface (plus tard)

`OMNIROUTE_URL` est prévue, commentée, dans `.env.example`. Aucune route
existante n'y est rebranchée à ce stade.

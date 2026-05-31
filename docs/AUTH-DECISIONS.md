# AUTH — décisions à finaliser (réservées à Claude Code)

L'auth livrée est **fonctionnelle mais volontairement minimale** : un seul admin
défini dans `.env` (`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`), login email + mot de
passe, session JWT signée (jose), middleware qui protège tout sauf `/login`.

Deux points ont été laissés ouverts (décision actée avec l'utilisateur) :

## 1. Création du compte admin

À trancher : l'email admin est-il **saisi manuellement** à la création (dans
Pilot) ou suit-il un **schéma automatique** (`admin@<slug>.local`, valeur par
défaut actuelle de `post-init.sh`) ? Le mot de passe est-il **choisi** ou
**généré et affiché une seule fois** (comportement actuel de `post-init.sh`) ?

## 2. Stockage des comptes

Actuel : admin unique en `.env` (zéro dépendance native, build léger).
À décider : passe-t-on à une **table `users` en SQLite locale** (multi-
utilisateur, ajout d'autres comptes) ou reste-t-on **mono-admin** ?

Piste si multi-utilisateur : ajouter `better-sqlite3`, une table `users(email,
password_hash, role)`, et faire `actions/auth.ts` vérifier la base au lieu de
`.env`. `lib/auth.ts` (session JWT) reste inchangé.

## Trace centralisée (côté Pilot, déjà acté)

Pilot conserve la correspondance interface ↔ email admin. Le template, lui,
expose simplement l'email + mot de passe via la sortie de `post-init.sh` ; à
Pilot de la capturer et de la stocker.

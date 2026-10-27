# Prismea

Gestion commerciale d'une centrale d'achat de montures : clients, stock (catalogues, entrées par scan), ventes et devis, caisse (journal, règlements, factures PDF, caisse de la semaine), documents joints et suivi des colis DHL.

## Fonctionnement

- `server.js` : serveur Express (comptes, sessions, synchronisation des données, numérotation, documents, suivi DHL).
- `db.js` : connexion PostgreSQL et création des tables au démarrage.
- `dhl.js` : suivi automatique des colis DHL Express (API « Shipment Tracking - Unified »).
- `public/` : l'interface (`index.html`, `boot.js` pour la connexion et la synchronisation, `app.js` pour les écrans, `app.css`).

Les numéros de vente, de facture, de devis, d'entrée de stock, de client, de fournisseur et les codes étiquette sont attribués par le serveur : deux personnes qui valident en même temps n'obtiennent jamais le même numéro. Les mouvements de stock simultanés se cumulent.

## Utilisateurs

Trois comptes sont créés au premier démarrage, avec les mêmes droits :

| Identifiant | Nom |
|---|---|
| `nicolas` | Nicolas Puille |
| `laurent` | Laurent Druost |
| `jennifer` | Jennifer Nalepa |

À la première connexion, chacun utilise le mot de passe provisoire `INIT_PASSWORD`, puis choisit son mot de passe personnel (8 caractères minimum).

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Base PostgreSQL (fournie par Render) |
| `SESSION_SECRET` | Secret des sessions (généré par Render) |
| `INIT_PASSWORD` | Mot de passe provisoire de première connexion |
| `DHL_API_KEY` | Clé de l'API DHL Shipment Tracking (facultatif) |
| `DHL_HOURS` | Heures des vérifications DHL automatiques (`8,12,16,20` par défaut) |
| `DHL_TZ` | Fuseau horaire de ces heures (`Europe/Paris` par défaut) |

## Déploiement sur Render

1. Pousser ce dossier dans le dépôt GitHub privé `prismea`.
2. Dans Render : **New → Blueprint**, choisir le dépôt. Render crée le service web et la base à partir de `render.yaml`.
3. Renseigner `INIT_PASSWORD` (et `DHL_API_KEY` quand la clé DHL est obtenue), puis valider.
4. Ouvrir l'adresse `https://prismea.onrender.com` (ou celle indiquée par Render).

## Version test

Le service `prismea-test` (branche `test`, base `prismea-test-db`) sert à essayer de nouvelles fonctionnalités sans toucher aux vraies données. Avec `APP_ENV=test`, il charge des données fictives au premier démarrage, affiche un bandeau « Version test » et propose de remettre les données à zéro. Les nouveautés sont d'abord poussées sur `test`, puis sur `main` une fois validées.

## Reprendre les données de la première version

Dans l'ancienne version : **Paramètres → Télécharger une sauvegarde**. Dans la version en ligne : **Paramètres → Restaurer une sauvegarde**. Les documents joints dans l'ancienne version ne sont pas repris : il faut les rajouter.

## Lancer en local

```
npm install
DATABASE_URL=postgresql://localhost/prismea INIT_PASSWORD=essai node server.js
```

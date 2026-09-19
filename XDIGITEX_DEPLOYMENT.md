# Déploiement UKWELISASA.DRC.CD

- Runtime : Node.js 20.9+ (22 LTS recommandé), npm, Next.js 15.
- Base de données : PostgreSQL 14+ avec sauvegardes automatiques et connexion TLS si distante.
- Installation : `npm ci`.
- Migration : `npm run db:migrate`.
- Données initiales : `npm run db:seed` une seule fois (idempotent).
- Build : `npm run build`.
- Démarrage : `npm start` avec `NODE_ENV=production`, derrière un gestionnaire de processus.
- URL attendue : `https://www.ukwelisasa.drc.cd`.

## Variables obligatoires

`DATABASE_URL`, `AUTH_SECRET` (minimum 32 caractères aléatoires), `NEXT_PUBLIC_SITE_URL=https://www.ukwelisasa.drc.cd`, `UPLOAD_DIR`, `CRON_SECRET`. Pour les notifications réelles, configurer SMTP et les trois variables VAPID de `.env.example`; générer les clés côté infrastructure et ne jamais les committer.

## Stockage et droits

Le chemin `UPLOAD_DIR` doit être persistant, sauvegardé et accessible en lecture/écriture à l’utilisateur du processus Node. Par défaut : `public/uploads`. En déploiement multi-instance, utiliser un stockage objet partagé et adapter la route de média.

## Tâches programmées

Appeler toutes les minutes :

```text
POST https://www.ukwelisasa.drc.cd/api/cron/publish
Authorization: Bearer <CRON_SECRET>
```

Appeler également toutes les minutes :

```text
POST https://www.ukwelisasa.drc.cd/api/cron/notifications
Authorization: Bearer <CRON_SECRET>
```

La file de notifications est persistée dans PostgreSQL. Le cron prépare les destinataires, effectue des lots bornés, enregistre les états réels et réessaie les échecs temporaires. Aucun websocket n’est requis.

## Proxy inverse

Transmettre `Host`, `X-Forwarded-Proto` et `X-Forwarded-For`; activer HTTP/2/3 et la compression; limiter le corps des requêtes à 12 Mo; ne jamais mettre en cache `/admin/*`, `/api/admin/*` ou `/api/cron/*`. Conserver le cache public court de Next.js pour les pages d’actualité.

## Initialisation de l’administration

Après les migrations :

```bash
npm run admin:create -- admin@domaine.cd 'mot-de-passe-long-et-unique' 'Nom Administrateur'
```

Supprimer l’historique du terminal si le mot de passe y est sensible, puis se connecter à `/admin/login`.

## Santé et vérifications après déploiement

`GET /api/health` doit répondre HTTP 200 avec `status: ok` et `database: connected` sans révéler de secret.

Vérifier ensuite : accueil HTTP 200, connexion CMS, création d’un brouillon, soumission/révision/publication, visibilité publique après publication, recherche, inscription newsletter, contact, téléversement d’une image, RSS `/rss.xml`, sitemap `/sitemap.xml`, sitemap actualités `/news-sitemap.xml`, manifest et page hors connexion. Compléter les pages légales, identité, contacts, réseaux, analytics, SMTP, publicité et web push avec les vraies informations de l’éditeur avant ouverture.

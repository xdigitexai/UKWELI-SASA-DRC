# UKWELISASA.DRC.CD

Plateforme média et CMS francophone pour la République Démocratique du Congo. Elle couvre la publication éditoriale, les archives par rubrique et mot-clé, les auteurs, la recherche, les vidéos et galeries, les commentaires modérés, la newsletter, la publicité, les alertes de dernière minute, les statistiques internes et l’administration par rôles.

Les lecteurs peuvent aussi créer un compte facultatif, vérifier leur email, réinitialiser leur mot de passe, réagir aux articles, les enregistrer, commenter et répondre, suivre la publication, une rubrique ou un journaliste, et gérer séparément leurs préférences email et navigateur. Les notifications passent par une file persistante avec suivi des livraisons et reprises sur erreur.

## Stack

- Next.js 15 / React 19 / TypeScript
- PostgreSQL et Prisma ORM
- Sessions JWT signées en cookie HTTP-only, mots de passe bcrypt
- Rendu serveur, métadonnées SEO, RSS, sitemap standard et Google News, PWA prudente

## Installation locale

Prérequis : Node.js 20.9+ et PostgreSQL 14+.

```bash
cp .env.example .env
npm ci
npx prisma migrate deploy
npm run db:seed
npm run admin:create -- admin@example.cd 'mot-de-passe-long' 'Nom Administrateur'
npm run dev
```

Renseignez `DATABASE_URL`, un `AUTH_SECRET` aléatoire d’au moins 32 caractères, `NEXT_PUBLIC_SITE_URL`, puis `CRON_SECRET`. Les paramètres SMTP et web push restent facultatifs tant que ces intégrations ne sont pas activées.

## Production

```bash
npm ci
npm run db:migrate
npm run build
npm start
```

Le dossier défini par `UPLOAD_DIR` doit être persistant et accessible en écriture par le processus Node. En environnement distribué, remplacez le stockage local par un adaptateur objet/CDN avant d’accepter les téléversements.

Appelez `POST /api/cron/publish` chaque minute avec l’en-tête `Authorization: Bearer $CRON_SECRET` pour publier les articles programmés. Appelez aussi `POST /api/cron/notifications` chaque minute avec le même en-tête pour préparer puis livrer les files email et Web Push. Le point de santé est `GET /api/health`.

L’email utilise SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`). Web Push utilise les clés VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Aucun envoi n’est déclaré réussi lorsqu’un transport manque ou échoue.

## Modèle éditorial et sécurité

Les rôles `ADMINISTRATEUR`, `REDACTEUR_EN_CHEF` et `JOURNALISTE` sont contrôlés côté serveur. Un journaliste ne peut modifier que ses articles et soumet ses textes à révision. La publication, la programmation et les réglages sensibles exigent un rôle supérieur. Le HTML éditorial est nettoyé, les formulaires publics sont validés et limités, et les fichiers sont filtrés par taille et type MIME.

Le seed ne crée aucune fausse actualité : il ajoute uniquement les rubriques et pages légales de base. Leur contenu juridique doit être validé et les coordonnées de l’éditeur complétées avant ouverture publique.

Consultez [XDIGITEX_DEPLOYMENT.md](./XDIGITEX_DEPLOYMENT.md) pour le transfert d’exploitation.

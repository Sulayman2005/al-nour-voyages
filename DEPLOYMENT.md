# Al Nour — Déploiement sur Render

## Instructions pour déployer sur Render.com

1. Crée un compte gratuit sur [Render.com](https://render.com)
2. Clique sur "New" > "Web Service"
3. Connecte ton repo GitHub (ou upload manuel)
4. Configure :
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Environment** : Ajoute les variables de `.env` :
     - `PORT` : 10000 (Render le définit automatiquement)
     - `ADMIN_PASSWORD` : alnouradmin2026
     - `ADMIN_TOKEN` : [la longue clé]
     - `SMTP_HOST` : smtp-relay.brevo.com
     - `SMTP_PORT` : 587
     - `SMTP_SECURE` : false
     - `SMTP_USER` : ton-email-de-connexion-brevo
     - `SMTP_PASS` : ta-cle-smtp-brevo
     - `SMTP_FROM` : "Al Nour <contact@alnour-hajj.org>"

5. Déploie !

## Pour le domaine .org
1. Achète un domaine sur OVH, GoDaddy, etc.
2. Dans Render > Settings > Custom Domain, ajoute ton domaine
3. Configure les DNS chez ton registrar :
   - Type A : vers l'IP de Render
   - Ou CNAME : vers ton URL Render

## HTTPS
Render active automatiquement HTTPS avec Let's Encrypt.

## PostgreSQL / Supabase sur Render
- Le projet peut maintenant se connecter à PostgreSQL si tu fournis `DATABASE_URL`.
- Sur Render, ne stocke pas les données uniquement dans `data/messages.db`.
- Si `DATABASE_URL` est défini, le serveur utilisera PostgreSQL au lieu de SQLite.
- Pour Supabase, tu dois fournir l’URL de connexion et éventuellement `DB_SSL=true`.
- En local, si `DATABASE_URL` n’est pas défini, le serveur continue de fonctionner avec SQLite.

## Test
Une fois déployé, teste :
- Site visible
- Formulaire fonctionne
- Admin accessible
- Email envoyé (avec Brevo configuré)
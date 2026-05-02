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

## Attention SQLite sur Render
- Render utilise un système de fichiers éphémère sur le plan gratuit.
- `data/messages.db` peut être perdu ou réinitialisé à chaque déploiement ou redémarrage.
- Pour un premier test, SQLite peut fonctionner.
- Pour un vrai projet client, migre vers PostgreSQL / Supabase.

## Test
Une fois déployé, teste :
- Site visible
- Formulaire fonctionne
- Admin accessible
- Email envoyé (avec Brevo configuré)
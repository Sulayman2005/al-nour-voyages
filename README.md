# Al Nour — Voyages Hajj & Omra

Projet découpé proprement avec :

- `public/index.html` : structure HTML du site
- `public/css/style.css` : styles CSS
- `public/js/main.js` : interactions front-end
- `server.js` : backend Node.js / Express
- `data/messages.db` : base SQLite locale pour les demandes reçues
- `.env.example` : modèle de configuration sécurisé

## Lancer le projet sur VS Code

1. Ouvre le dossier dans VS Code.
2. Ouvre un terminal dans VS Code.
3. Installe les dépendances :

```bash
npm install
```

4. Crée le fichier `.env` à partir du modèle :

```bash
cp .env.example .env
```

Sur Windows, tu peux aussi copier/coller manuellement `.env.example` et renommer la copie en `.env`.

5. Modifie `.env` :

```env
PORT=3000
ADMIN_PASSWORD=ton-vrai-mot-de-passe-très-fort
ADMIN_TOKEN=une-longue-cle-secrete-difficile-a-deviner
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ton-email-brevo
SMTP_PASS=ta-cle-smtp-brevo
SMTP_FROM="Al Nour <contact@alnour-hajj.org>"
```

6. Lance le site :

```bash
npm run dev
```

7. Ouvre dans ton navigateur :

```txt
http://localhost:3000
```

## Partie admin

L'accès admin est déjà présent dans le footer du site avec le lien `Admin`.

- Le mot de passe est celui défini dans `.env` avec `ADMIN_PASSWORD`.
- Les messages du formulaire sont sauvegardés dans `data/messages.db` (SQLite locale).
- L’admin peut consulter les demandes et les marquer comme lues.

Important : le bouton “Envoyer la réponse” peut maintenant envoyer un vrai email si le service SMTP est configuré.

- Dans `.env`, ajoute ces variables pour Brevo :

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ton-email-de-connexion-brevo
SMTP_PASS=ta-cle-smtp-brevo
SMTP_FROM="Al Nour <contact@alnour-hajj.org>"
```

- Pour obtenir les identifiants SMTP Brevo : inscris-toi sur [brevo.com](https://brevo.com), va dans SMTP & API > Identifiants SMTP, puis utilises ton email de connexion et ta clé SMTP.
- Le serveur utilise Nodemailer pour envoyer le message à l’adresse du client.

## Mettre le site en .org

Un `.org` ne se met pas dans le code. Il faut acheter un nom de domaine, par exemple :

```txt
alnour-hajj.org
```

Ensuite :

1. Déploie le projet sur un hébergeur compatible Node.js : Render, Railway, Fly.io, VPS, o2switch, Hostinger VPS, etc.
2. Dans l’hébergeur, ajoute ton domaine personnalisé.
3. Chez le registrar où tu as acheté le `.org`, modifie les DNS :
   - soit avec un champ `A` vers l’adresse IP du serveur,
   - soit avec un champ `CNAME` vers l’URL fournie par l’hébergeur.
4. Active le certificat SSL/HTTPS dans l’hébergeur.

## Ce qui est fait

- Site vitrine complet.
- Fichiers séparés HTML/CSS/JS.
- Backend Node.js ajouté.
- Formulaire connecté au backend.
- Sauvegarde des demandes dans SQLite locale (`data/messages.db`).
- Login admin côté serveur.
- Liste admin des messages.
- Statut lu/non lu.

## Ce qui reste à faire pour un vrai site professionnel

- Acheter le domaine `.org`.
- Déployer le projet sur un hébergeur Node.js (voir DEPLOYMENT.md).
- Remplacer les textes fictifs, prix et coordonnées (coordonnées mises à jour).
- Configurer les variables SMTP réelles avec Brevo (identifiants SMTP dans .env).
- Prévoir une migration de SQLite vers PostgreSQL/Supabase pour la production.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'demo-token-change-me';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'messages.db');
const DATABASE_URL = process.env.DATABASE_URL || '';
const DB_SSL = process.env.DB_SSL === 'true';

let db;
let dbType = 'sqlite';
let pool = null;

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || `Al Nour <${SMTP_USER || 'no-reply@example.com'}>`;
const emailEnabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function dbRun(sql, params = []) {
  if (dbType === 'postgres') {
    return pool.query(sql, params);
  }

  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function dbAll(sql, params = []) {
  if (dbType === 'postgres') {
    return pool.query(sql, params).then((result) => result.rows);
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initDb() {
  if (DATABASE_URL) {
    dbType = 'postgres';
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DB_SSL ? { rejectUnauthorized: false } : false,
    });

    try {
      await pool.query('SELECT 1');
    } catch (err) {
      console.error('Impossible de se connecter à PostgreSQL :', err);
      process.exit(1);
    }

    await dbRun(`CREATE TABLE IF NOT EXISTS messages (
      id BIGINT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      formule TEXT,
      groupe TEXT,
      date TEXT,
      msg TEXT,
      status TEXT
    )`);
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Erreur d’ouverture de la base de données :', err);
        process.exit(1);
      }
    });

    await dbRun(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      formule TEXT,
      groupe TEXT,
      date TEXT,
      msg TEXT,
      status TEXT
    )`);
  }

  await migrateJsonToDb();
}

async function migrateJsonToDb() {
  const jsonPath = path.join(DATA_DIR, 'messages.json');

  try {
    const raw = await fs.readFile(jsonPath, 'utf8');
    const messages = JSON.parse(raw);

    const existing = await dbAll('SELECT COUNT(*) AS count FROM messages');
    if (Number(existing[0].count) > 0) return;

    for (const message of messages) {
      if (dbType === 'postgres') {
        await dbRun(
          'INSERT INTO messages (id, name, email, phone, formule, groupe, date, msg, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
          [message.id, message.name, message.email, message.phone, message.formule, message.groupe, message.date, message.msg, message.status]
        );
      } else {
        await dbRun(
          'INSERT OR IGNORE INTO messages (id, name, email, phone, formule, groupe, date, msg, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [message.id, message.name, message.email, message.phone, message.formule, message.groupe, message.date, message.msg, message.status]
        );
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Migration JSON -> DB échouée :', error);
    }
  }
}

async function readMessages() {
  return dbAll('SELECT * FROM messages ORDER BY id DESC');
}

async function sendAdminEmail(to, reply) {
  if (!emailEnabled || !transporter) {
    throw new Error('Service email non configuré');
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Réponse à votre demande Al Nour',
    text: `${reply}\n\n--\nAl Nour · Hajj & Omra`,
    html: `${reply.replace(/\n/g, '<br/>')}<br/><br/>--<br/>Al Nour · Hajj & Omra`,
  });
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Accès admin refusé.' });
  }

  next();
}

app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, travelType, groupSize, message } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Prénom, nom et email sont obligatoires.' });
  }

  const newMessage = {
    id: Date.now(),
    name: `${firstName} ${lastName}`,
    email,
    phone: phone || '',
    formule: travelType || '—',
    groupe: groupSize || '—',
    date: new Date().toLocaleDateString('fr-FR'),
    msg: message || 'Message soumis via le formulaire de contact du site.',
    status: 'new'
  };

  await dbRun(
    'INSERT INTO messages (id, name, email, phone, formule, groupe, date, msg, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newMessage.id, newMessage.name, newMessage.email, newMessage.phone, newMessage.formule, newMessage.groupe, newMessage.date, newMessage.msg, newMessage.status]
  );

  res.status(201).json({ success: true, message: newMessage });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }

  res.json({ success: true, token: ADMIN_TOKEN });
});

app.get('/api/admin/messages', requireAdmin, async (req, res) => {
  const messages = await readMessages();
  res.json(messages);
});

app.patch('/api/admin/messages/:id/read', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  const result = await dbRun(
    dbType === 'postgres'
      ? 'UPDATE messages SET status = $1 WHERE id = $2'
      : 'UPDATE messages SET status = ? WHERE id = ?',
    ['read', id]
  );

  const changes = result.changes ?? result.rowCount ?? 0;
  if (changes === 0) {
    return res.status(404).json({ error: 'Message introuvable.' });
  }

  const [message] = await dbAll(
    dbType === 'postgres'
      ? 'SELECT * FROM messages WHERE id = $1'
      : 'SELECT * FROM messages WHERE id = ?',
    [id]
  );
  res.json({ success: true, message });
});

app.post('/api/admin/reply', requireAdmin, async (req, res) => {
  const { to, reply } = req.body;

  if (!to || !reply) {
    return res.status(400).json({ error: 'Destinataire et réponse sont obligatoires.' });
  }

  if (!emailEnabled) {
    return res.status(500).json({ error: 'Service email non configuré. Vérifiez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env.' });
  }

  try {
    await sendAdminEmail(to, reply);
    res.json({ success: true, info: 'Email envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur email:', error);
    res.status(500).json({ error: 'Impossible d’envoyer l’email. Vérifiez la configuration SMTP et les logs du serveur.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Al Nour lancé sur http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erreur d’initialisation du serveur :', error);
    process.exit(1);
  });

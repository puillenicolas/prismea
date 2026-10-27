'use strict';
/* Prismea — serveur : comptes, synchronisation des données, numérotation, documents, suivi DHL */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const { pool, migrate } = require('./db');
const dhl = require('./dhl');

const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';
const INIT_PASSWORD = process.env.INIT_PASSWORD || '';

/* Utilisateurs de départ : tous ont les mêmes droits */
const USERS = [
  ['nicolas', 'Nicolas Puille'],
  ['laurent', 'Laurent Druost'],
  ['jennifer', 'Jennifer Nalepa'],
];

/* Collections synchronisées (tableaux du state) ; le reste du state est en « meta » */
const KINDS = ['clients', 'montures', 'ventes', 'devis', 'receptions', 'reglements', 'clotures', 'catalogue', 'marques', 'fournisseurs'];
const SEQ_NAMES = { V: 'seqV', FA: 'seqFA', M: 'seqM', D: 'seqD', R: 'seqR', C: 'seq', F: 'seqF' };

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.get('/healthz', (req, res) => res.send('ok'));

app.use(session({
  store: new PgStore({ pool, tableName: 'sessions', createTableIfMissing: true }),
  name: 'prismea.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-a-changer',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, sameSite: 'lax', secure: PROD, maxAge: 1000 * 60 * 60 * 24 * 14 },
}));

const json = express.json({ limit: '25mb' });
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function needAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'non_connecte' });
  if (req.session.user.mustChange && req.path !== '/api/password') return res.status(403).json({ error: 'mot_de_passe_a_changer' });
  next();
}

/* ---------- Comptes ---------- */
const loginTries = new Map();
app.post('/api/login', json, wrap(async (req, res) => {
  const login = String(req.body.login || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const key = req.ip + '|' + login;
  const t = loginTries.get(key) || { n: 0, until: 0 };
  if (t.until > Date.now()) return res.status(429).json({ error: 'trop_de_tentatives' });
  const { rows } = await pool.query('select * from users where login=$1', [login]);
  const u = rows[0];
  let ok = false;
  if (u) {
    if (u.password_hash) ok = await bcrypt.compare(password, u.password_hash);
    else ok = !!INIT_PASSWORD && password === INIT_PASSWORD;
  }
  if (!ok) {
    t.n++; if (t.n >= 5) { t.until = Date.now() + 5 * 60 * 1000; t.n = 0; }
    loginTries.set(key, t);
    return res.status(401).json({ error: 'identifiants' });
  }
  loginTries.delete(key);
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'session' });
    req.session.user = { id: u.id, login: u.login, nom: u.nom, mustChange: !u.password_hash || u.must_change };
    res.json({ user: req.session.user });
  });
}));
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/me', (req, res) => res.json({ user: req.session.user || null, initConfigured: !!INIT_PASSWORD }));
app.post('/api/password', json, needAuth, wrap(async (req, res) => {
  const pw = String(req.body.password || '');
  if (pw.length < 8) return res.status(400).json({ error: 'trop_court' });
  if (INIT_PASSWORD && pw === INIT_PASSWORD) return res.status(400).json({ error: 'identique_initial' });
  const hash = await bcrypt.hash(pw, 11);
  await pool.query('update users set password_hash=$1, must_change=false where id=$2', [hash, req.session.user.id]);
  req.session.user.mustChange = false;
  res.json({ user: req.session.user });
}));

/* ---------- Données ---------- */
async function allState() {
  const { rows } = await pool.query("select kind,id,data from entities where not deleted order by kind, updated_at");
  const state = {};
  KINDS.forEach(k => { state[k] = []; });
  for (const r of rows) {
    if (r.kind === 'meta') state[r.id] = r.data.v;
    else if (state[r.kind]) state[r.kind].push(r.data);
  }
  return state;
}
app.get('/api/state', needAuth, wrap(async (req, res) => {
  const { rows } = await pool.query('select now() as now');
  res.json({ now: rows[0].now, state: await allState() });
}));
app.get('/api/changes', needAuth, wrap(async (req, res) => {
  const since = req.query.since ? new Date(String(req.query.since)) : new Date(0);
  const { rows: n } = await pool.query('select now() as now');
  const { rows } = await pool.query(
    'select e.kind,e.id,e.data,e.deleted,e.updated_at,u.nom from entities e left join users u on u.id=e.updated_by where e.updated_at > $1 and e.updated_at <= $2 order by e.updated_at',
    [since, n[0].now]);
  res.json({ now: n[0].now, records: rows.map(r => ({ kind: r.kind, id: r.id, data: r.data, deleted: r.deleted, by: r.nom })) });
}));

/* Compteurs : on garde toujours la valeur la plus haute pour ne jamais redonner un numéro */
function mergeMeta(id, incoming, current) {
  if (id.startsWith('seq') && typeof incoming === 'number') return Math.max(incoming, typeof current === 'number' ? current : 0);
  return incoming;
}
app.post('/api/sync', json, needAuth, wrap(async (req, res) => {
  const ups = Array.isArray(req.body.upserts) ? req.body.upserts : [];
  const dels = Array.isArray(req.body.deletes) ? req.body.deletes : [];
  const uid = req.session.user.id;
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const u of ups) {
      const kind = String(u.kind), id = String(u.id);
      if (kind !== 'meta' && !KINDS.includes(kind)) continue;
      let data = u.data;
      if (kind === 'meta') {
        const cur = await client.query("select data from entities where kind='meta' and id=$1", [id]);
        data = { v: mergeMeta(id, data && data.v, cur.rows[0] && cur.rows[0].data.v) };
      } else if (kind === 'montures' && u.base && typeof u.base.qte === 'number' && typeof data.qte === 'number') {
        /* stock : on applique l'écart, pour que deux ventes simultanées se cumulent au lieu de s'écraser */
        const cur = await client.query("select data from entities where kind='montures' and id=$1 and not deleted", [id]);
        if (cur.rows[0] && typeof cur.rows[0].data.qte === 'number') data = { ...data, qte: cur.rows[0].data.qte + (data.qte - u.base.qte) };
      } else if (kind === 'ventes') {
        /* le suivi DHL est écrit par le serveur : on ne laisse pas une ancienne copie l'écraser */
        const cur = await client.query("select data from entities where kind='ventes' and id=$1", [id]);
        const srv = cur.rows[0] && cur.rows[0].data.expedition && cur.rows[0].data.expedition.dhl;
        if (srv && data.expedition && (!data.expedition.dhl || (data.expedition.dhl.checkedAt || '') < (srv.checkedAt || ''))) {
          data = { ...data, expedition: { ...data.expedition, dhl: srv } };
          if (data.expedition.suivi === cur.rows[0].data.expedition.suivi && cur.rows[0].data.expedition.statut) data.expedition.statut = cur.rows[0].data.expedition.statut;
        }
      }
      await client.query(
        `insert into entities(kind,id,data,deleted,updated_at,updated_by) values($1,$2,$3,false,clock_timestamp(),$4)
         on conflict(kind,id) do update set data=excluded.data, deleted=false, updated_at=clock_timestamp(), updated_by=excluded.updated_by`,
        [kind, id, data, uid]);
    }
    for (const d of dels) {
      const kind = String(d.kind), id = String(d.id);
      if (!KINDS.includes(kind)) continue;
      await client.query('update entities set deleted=true, updated_at=clock_timestamp(), updated_by=$3 where kind=$1 and id=$2', [kind, id, uid]);
    }
    await client.query('commit');
    res.json({ ok: true });
  } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
}));

/* Numérotation attribuée par le serveur (factures, ventes, étiquettes…) : jamais deux fois le même numéro */
app.post('/api/seq/:name', json, needAuth, wrap(async (req, res) => {
  const name = req.params.name;
  const metaKey = SEQ_NAMES[name];
  if (!metaKey) return res.status(400).json({ error: 'compteur_inconnu' });
  const floor = Math.max(0, Math.floor(+req.body.min || 0));
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('select pg_advisory_xact_lock(hashtext($1))', ['seq:' + name]);
    const cur = await client.query("select data from entities where kind='meta' and id=$1 for update", [metaKey]);
    const curV = cur.rows[0] ? +cur.rows[0].data.v || 0 : 0;
    const next = Math.max(curV, floor) + 1;
    await client.query(
      `insert into entities(kind,id,data,deleted,updated_at,updated_by) values('meta',$1,$2,false,clock_timestamp(),$3)
       on conflict(kind,id) do update set data=excluded.data, deleted=false, updated_at=clock_timestamp(), updated_by=excluded.updated_by`,
      [metaKey, { v: next }, req.session.user.id]);
    await client.query('commit');
    res.json({ value: next });
  } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
}));

/* Restauration complète depuis une sauvegarde JSON */
app.post('/api/import', json, needAuth, wrap(async (req, res) => {
  const s = req.body && req.body.state;
  if (!s || !Array.isArray(s.clients) || !Array.isArray(s.montures)) return res.status(400).json({ error: 'sauvegarde_invalide' });
  const uid = req.session.user.id;
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("update entities set deleted=true, updated_at=clock_timestamp() where kind<>'meta'");
    await client.query("delete from entities where kind='meta'");
    for (const [key, val] of Object.entries(s)) {
      if (KINDS.includes(key)) {
        for (const r of val) {
          const id = recordId(key, r);
          if (!id) continue;
          await client.query(
            `insert into entities(kind,id,data,deleted,updated_at,updated_by) values($1,$2,$3,false,clock_timestamp(),$4)
             on conflict(kind,id) do update set data=excluded.data, deleted=false, updated_at=clock_timestamp(), updated_by=excluded.updated_by`,
            [key, id, { ...r, id }, uid]);
        }
      } else if (!Array.isArray(val)) {
        await client.query(`insert into entities(kind,id,data,deleted,updated_at,updated_by) values('meta',$1,$2,false,clock_timestamp(),$3)`, [key, { v: val }, uid]);
      }
    }
    await client.query('commit');
    res.json({ ok: true });
  } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
}));
function recordId(kind, r) {
  if (r && r.id) return String(r.id);
  if (kind === 'clotures' && r.semaine) return 'w' + r.semaine;
  if (kind === 'catalogue' && r.ean) return 'e' + String(r.ean).replace(/\D/g, '').replace(/^0+/, '');
  return null;
}

/* ---------- Documents joints (bordereaux DHL, factures, photos) ---------- */
const FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain', 'text/csv'];
app.post('/api/files', needAuth, express.raw({ type: () => true, limit: '20mb' }), wrap(async (req, res) => {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!FILE_TYPES.includes(type)) return res.status(415).json({ error: 'unsupported_type' });
  if (!req.body || !req.body.length) return res.status(400).json({ error: 'fichier_vide' });
  const nom = decodeURIComponent(String(req.headers['x-filename'] || 'document')).slice(0, 200);
  const id = crypto.randomBytes(16).toString('hex');
  await pool.query('insert into files(id,nom,type,size,data,created_by) values($1,$2,$3,$4,$5,$6)', [id, nom, type, req.body.length, req.body, req.session.user.id]);
  res.json({ id, url: '/api/files/' + id, sizeBytes: req.body.length, contentType: type });
}));
app.get('/api/files/:id', needAuth, wrap(async (req, res) => {
  const { rows } = await pool.query('select nom,type,data from files where id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).send('Document introuvable');
  res.setHeader('Content-Type', rows[0].type);
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(rows[0].nom)}`);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.send(rows[0].data);
}));
app.delete('/api/files/:id', needAuth, wrap(async (req, res) => {
  await pool.query('delete from files where id=$1', [req.params.id]);
  res.json({ ok: true });
}));

/* ---------- Suivi DHL ---------- */
app.get('/api/dhl/status', needAuth, (req, res) => res.json({ configured: dhl.configured() }));
app.post('/api/dhl/refresh/:venteId', needAuth, wrap(async (req, res) => {
  if (!dhl.configured()) return res.status(503).json({ error: 'cle_dhl_absente' });
  const r = await dhl.refreshVente(req.params.venteId);
  res.json(r);
}));

/* ---------- Interface ---------- */
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', extensions: ['html'] }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'erreur_serveur' });
});

(async () => {
  await migrate();
  for (const [login, nom] of USERS) {
    await pool.query('insert into users(login,nom) values($1,$2) on conflict(login) do nothing', [login, nom]);
  }
  if (!INIT_PASSWORD) console.warn('INIT_PASSWORD absent : les premières connexions seront impossibles tant qu\'il n\'est pas défini.');
  dhl.start();
  app.listen(PORT, () => console.log(`Prismea en ligne sur le port ${PORT}`));
})().catch(e => { console.error(e); process.exit(1); });

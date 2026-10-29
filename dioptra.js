'use strict';
/* Connexion DIOPTRA : envoi d'une facture de vente comme livraison à réceptionner chez l'opticien.
   La clé d'intégration reste sur le serveur (table settings) : elle n'est jamais renvoyée au navigateur. */
const { pool } = require('./db');

const DEFAULT_URL = 'https://app.dioptra.pro/api/livraisons';
const KEY = 'dioptra';

async function getConfig() {
  const { rows } = await pool.query('select value from settings where key=$1', [KEY]);
  const v = rows[0] ? rows[0].value : {};
  return { url: v.url || DEFAULT_URL, key: v.key || '' };
}
const hint = k => (k ? k.slice(0, 4) + '…' + k.slice(-4) : '');
async function publicConfig() {
  const c = await getConfig();
  return { url: c.url, keySet: !!c.key, keyHint: hint(c.key), configured: !!(c.url && c.key) };
}
function checkUrl(u) {
  let x;
  try { x = new URL(u); } catch (e) { return false; }
  if (x.protocol === 'https:') return true;
  return process.env.NODE_ENV !== 'production' && x.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(x.hostname);
}
async function saveConfig({ url, key, removeKey }, uid) {
  const cur = await getConfig();
  const next = { url: String(url || cur.url).trim(), key: cur.key };
  if (!checkUrl(next.url)) { const e = new Error('adresse'); e.code = 'adresse_invalide'; throw e; }
  if (removeKey) next.key = '';
  else if (key != null && String(key).trim()) {
    const k = String(key).trim();
    if (!/^dpt_[A-Za-z0-9_\-]{8,}$/.test(k)) { const e = new Error('cle'); e.code = 'cle_invalide'; throw e; }
    next.key = k;
  }
  await pool.query(
    `insert into settings(key,value,updated_at,updated_by) values($1,$2,now(),$3)
     on conflict(key) do update set value=excluded.value, updated_at=now(), updated_by=excluded.updated_by`, [KEY, next, uid]);
  return publicConfig();
}

/* Calculs identiques à Prismea (remise par ligne en % ou en €, puis remise client) */
const r2 = n => Math.round((n || 0) * 100) / 100;
const isE = x => x === '€';
const remL = l => (isE(l.remT) ? Math.min(+l.pu || 0, Math.max(0, +l.rem || 0)) : Math.min(100, Math.max(0, +l.rem || 0)));
const puNet = l => r2(isE(l.remT) ? l.pu - remL(l) : l.pu * (1 - remL(l) / 100));
const dayParis = iso => {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  return isNaN(d) ? String(iso).slice(0, 10) : d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
};

async function entity(kind, id) {
  const { rows } = await pool.query('select data from entities where kind=$1 and id=$2 and not deleted', [kind, id]);
  return rows[0] ? rows[0].data : null;
}

function buildPayload(v, client, societe, montures) {
  const net = v.lignes.reduce((t, l) => t + r2(l.qte * puNet(l)), 0);
  const f = net > 0 ? (v.ht ?? net) / net : 1; // remise client répartie sur les lignes
  const lignes = v.lignes.map(l => {
    const m = montures.get(l.montureId) || {};
    const [marque0, ...mod0] = String(l.designation || '').split(' ');
    const taille = m.calibre ? `${m.calibre}□${m.pont || ''}${m.branche ? ' ' + m.branche : ''}` : (m.taille || '');
    return {
      ean: String(m.ean || l.ean || ''), etiquette: l.etiquette || m.etiquette || '',
      marque: m.marque || marque0 || '', modele: m.modele || mod0.join(' '), coloris: m.coloris || '',
      taille, qte: l.qte, pu: r2(puNet(l) * f),
    };
  });
  return {
    source: 'Prismea',
    fournisseur: (societe && societe.nom) || '',
    numero: v.facture || v.num,
    bl: v.num,
    date: dayParis(v.date),
    echeance: dayParis(v.echeance),
    devise: 'EUR',
    magasin: client.dioptraMagasin || '',
    total: r2(v.ht),
    lignes,
  };
}

async function send(venteId, { force, user }) {
  const cfg = await getConfig();
  if (!cfg.key) return { status: 400, body: { error: 'non_configure' } };
  const v = await entity('ventes', venteId);
  if (!v) return { status: 404, body: { error: 'vente_introuvable' } };
  const c = await entity('clients', v.clientId);
  if (!c || !String(c.dioptraMagasin || '').trim()) return { status: 400, body: { error: 'magasin_manquant' } };
  if (v.dioptra && v.dioptra.statut === 'envoye' && !force) return { status: 409, body: { error: 'deja_envoye', dioptra: v.dioptra } };
  const meta = await entity('meta', 'societe');
  const ids = [...new Set(v.lignes.map(l => l.montureId))];
  const { rows } = await pool.query("select id,data from entities where kind='montures' and id = any($1)", [ids]);
  const montures = new Map(rows.map(r => [r.id, r.data]));
  const payload = buildPayload(v, c, meta && meta.v, montures);

  let http = 0, reponse = null, message = '';
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(cfg.url, {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify(payload),
    });
    clearTimeout(t);
    http = r.status;
    const txt = await r.text();
    try { reponse = JSON.parse(txt); } catch (e) { reponse = null; }
    message = (reponse && (reponse.message || reponse.error || reponse.erreur)) || (r.ok ? '' : txt.slice(0, 200));
  } catch (e) {
    message = e.name === 'AbortError' ? 'DIOPTRA ne répond pas (délai dépassé)' : 'DIOPTRA injoignable : ' + (e.cause && e.cause.code || e.message);
  }
  const ok = http >= 200 && http < 300;
  const now = new Date().toISOString();
  const prev = v.dioptra || {};
  const dioptra = ok
    ? { statut: 'envoye', le: now, par: user.nom, http, ref: String((reponse && (reponse.id || reponse.reference || reponse.livraison || reponse.numero)) || ''), magasin: payload.magasin, lignes: payload.lignes.length, envois: (prev.envois || 0) + 1 }
    : { ...(prev.statut === 'envoye' ? prev : {}), statut: prev.statut === 'envoye' ? 'envoye' : 'erreur', erreur: { le: now, par: user.nom, http, message: String(message || 'Erreur ' + http).slice(0, 300) } };
  /* écrit sur la vente (le navigateur la reçoit par la synchronisation) */
  await pool.query(
    "update entities set data = jsonb_set(data, '{dioptra}', $3::jsonb, true), updated_at=clock_timestamp(), updated_by=$4 where kind=$1 and id=$2",
    ['ventes', venteId, JSON.stringify(dioptra), user.id]);
  const nv = await entity('ventes', venteId);
  return { status: ok ? 200 : 502, body: { ok, dioptra, vente: nv, http, message } };
}

module.exports = { publicConfig, saveConfig, send, buildPayload, DEFAULT_URL };

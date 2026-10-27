'use strict';
/* Suivi automatique des colis DHL (API « Shipment Tracking - Unified ») */
const { pool } = require('./db');

const KEY = process.env.DHL_API_KEY || '';
/* Passages à heures fixes (heure de Libreville par défaut) : 8 h, 12 h, 16 h et 20 h */
const HOURS = String(process.env.DHL_HOURS || '8,12,16,20').split(',').map(h => +h.trim()).filter(h => h >= 0 && h < 24);
const TZ = process.env.DHL_TZ || 'Africa/Libreville';
const PAUSE_MS = 6000; // l'accès de départ autorise 1 appel toutes les 5 secondes
const API = 'https://api-eu.dhl.com/track/shipments';

const configured = () => !!KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function mapStatut(s) {
  const code = (s && s.statusCode) || 'unknown';
  const txt = ((s && (s.description || s.status)) || '').toLowerCase();
  if (code === 'delivered') return 'livre';
  if (code === 'failure') return 'incident';
  if (/customs|douane|clearance|dédouan/.test(txt)) return 'douane';
  if (code === 'transit') return 'transit';
  if (code === 'pre-transit') return 'expedie';
  return null;
}
const place = e => {
  const a = e && e.location && e.location.address;
  return a ? [a.addressLocality, a.countryCode].filter(Boolean).join(', ') : '';
};

async function track(numero) {
  const url = `${API}?trackingNumber=${encodeURIComponent(numero)}&service=express&language=fr`;
  const r = await fetch(url, { headers: { 'DHL-API-Key': KEY, Accept: 'application/json' } });
  if (r.status === 404) return { ok: false, erreur: 'Numéro inconnu chez DHL pour le moment' };
  if (r.status === 429) return { ok: false, erreur: 'Quota DHL atteint pour aujourd\'hui', quota: true };
  if (r.status === 401 || r.status === 403) return { ok: false, erreur: 'Clé API DHL refusée' };
  if (!r.ok) return { ok: false, erreur: `DHL a répondu ${r.status}` };
  const j = await r.json();
  const sh = j.shipments && j.shipments[0];
  if (!sh) return { ok: false, erreur: 'Aucun envoi trouvé' };
  return {
    ok: true,
    statut: mapStatut(sh.status),
    texte: (sh.status && (sh.status.description || sh.status.status)) || '',
    lieu: place(sh.status),
    date: sh.status && sh.status.timestamp,
    estimee: sh.estimatedTimeOfDelivery || '',
    evenements: (sh.events || []).slice(0, 12).map(e => ({ date: e.timestamp, texte: e.description || e.status || '', lieu: place(e) })),
  };
}

async function refreshVente(venteId) {
  const { rows } = await pool.query("select data from entities where kind='ventes' and id=$1 and not deleted", [venteId]);
  const v = rows[0] && rows[0].data;
  if (!v || !v.expedition || !v.expedition.suivi) return { ok: false, erreur: 'Aucun numéro de suivi' };
  const res = await track(v.expedition.suivi);
  const exp = { ...v.expedition };
  exp.dhl = { ...(exp.dhl || {}), checkedAt: new Date().toISOString(), erreur: res.ok ? '' : res.erreur };
  if (res.ok) {
    Object.assign(exp.dhl, { texte: res.texte, lieu: res.lieu, date: res.date, estimee: res.estimee, evenements: res.evenements });
    if (res.statut && exp.statut !== 'incident') exp.statut = res.statut;
    if (res.statut === 'livre' && !exp.livraison && res.date) exp.livraison = String(res.date).slice(0, 10);
  }
  const data = { ...v, expedition: exp };
  await pool.query("update entities set data=$2, updated_at=clock_timestamp() where kind='ventes' and id=$1", [venteId, data]);
  return { ok: res.ok, erreur: res.erreur || '', vente: data, quota: !!res.quota };
}

async function runOnce() {
  const { rows } = await pool.query(`
    select id from entities
    where kind='ventes' and not deleted
      and coalesce(data->'expedition'->>'suivi','') <> ''
      and coalesce(data->'expedition'->>'transporteur','DHL') = 'DHL'
      and coalesce(data->'expedition'->>'statut','') not in ('livre')
    order by coalesce(data->'expedition'->'dhl'->>'checkedAt','') asc
    limit 40`);
  for (const r of rows) {
    try {
      const res = await refreshVente(r.id);
      if (res.quota) break;
    } catch (e) { console.error('Suivi DHL', r.id, e.message); }
    await sleep(PAUSE_MS);
  }
}

let lastSlot = '';
const hourIn = tz => {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date());
  const g = t => (parts.find(p => p.type === t) || {}).value;
  return { day: `${g('year')}-${g('month')}-${g('day')}`, hour: +g('hour') % 24 };
};
function start() {
  if (!configured()) { console.log('Suivi DHL automatique désactivé (DHL_API_KEY absent).'); return; }
  setInterval(async () => {
    const { day, hour } = hourIn(TZ), slot = day + ' ' + hour;
    if (!HOURS.includes(hour) || slot === lastSlot) return;
    lastSlot = slot;
    try { await runOnce(); } catch (e) { console.error('Suivi DHL', e.message); }
  }, 60000);
  console.log(`Suivi DHL automatique à ${HOURS.map(h => h + ' h').join(', ')} (${TZ}).`);
}

module.exports = { configured, refreshVente, start, mapStatut };

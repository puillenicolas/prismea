'use strict';
/* Commandes envoyées à Prismea par un autre logiciel (DIOPTRA) avec une clé d'intégration « psm_… ».
   Les clés sont gardées hachées : la clé complète n'est montrée qu'une fois, à la création. */
const crypto = require('crypto');
const { pool } = require('./db');

const KEY = 'cles_commandes';
const hash = k => crypto.createHash('sha256').update(String(k)).digest('hex');
async function list() {
  const { rows } = await pool.query('select value from settings where key=$1', [KEY]);
  return rows[0] ? rows[0].value : [];
}
async function store(cles, uid) {
  await pool.query(`insert into settings(key,value,updated_at,updated_by) values($1,$2,now(),$3)
    on conflict(key) do update set value=excluded.value, updated_at=now(), updated_by=excluded.updated_by`, [KEY, JSON.stringify(cles), uid]);
}
const pub = c => ({ id: c.id, nom: c.nom, debut: c.debut, cree: c.cree, vu: c.vu || null, actif: c.actif !== false });
async function publicList() { return (await list()).map(pub); }
async function create(nom, uid) {
  const cle = 'psm_' + crypto.randomBytes(24).toString('base64url');
  const c = { id: 'k' + Date.now().toString(36), nom: String(nom || 'DIOPTRA').slice(0, 60), hash: hash(cle), debut: cle.slice(0, 10), cree: new Date().toISOString(), actif: true };
  const all = await list(); all.push(c); await store(all, uid);
  return { ...pub(c), cle };
}
async function setActif(id, actif, uid) {
  const all = await list(); const c = all.find(x => x.id === id); if (!c) return false;
  c.actif = !!actif; await store(all, uid); return true;
}
async function check(req) {
  const j = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers['x-api-key'] || '';
  if (!j) return null;
  const all = await list(); const h = hash(j); const c = all.find(x => x.hash === h && x.actif !== false);
  if (!c) return null;
  if (!c.vu || Date.now() - new Date(c.vu) > 60000) { c.vu = new Date().toISOString(); store(all, null).catch(() => {}); }
  return c;
}

const normEAN = v => String(v ?? '').replace(/\D/g, '').replace(/^0+/, '');
const txt = (v, n = 200) => String(v == null ? '' : v).trim().slice(0, n);
const nb = v => { const n = Number(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

/* Réception d'une commande : elle devient une « commande reçue » à traiter dans Prismea (devis ou vente) */
async function receive(req) {
  const cle = await check(req);
  if (!cle) return { status: 401, body: { erreur: "Clé d'intégration Prismea invalide ou désactivée." } };
  const b = req.body || {}, L = Array.isArray(b.lignes) ? b.lignes : null;
  const numero = txt(b.numero || b.reference || b.commande, 60);
  if (!numero) return { status: 400, body: { erreur: 'Numéro de commande manquant.' } };
  if (!L || !L.length || L.length > 1000) return { status: 400, body: { erreur: 'Lignes manquantes (1 à 1000).' } };
  const lignes = L.map((l, i) => ({ n: i + 1, ean: txt(l.ean, 20).replace(/\s/g, ''), etiquette: txt(l.etiquette || l.ref || l.reference, 40), marque: txt(l.marque, 60), modele: txt(l.modele, 80),
    coloris: txt(l.coloris || l.couleur, 60), taille: txt(l.taille, 30), qte: Math.max(0, Math.round(nb(l.qte ?? l.quantite ?? 1))) }));
  if (lignes.some(l => !l.qte || !(l.ean || l.etiquette || l.modele))) return { status: 400, body: { erreur: 'Chaque ligne doit avoir une quantité et un code EAN, un code étiquette ou un modèle.' } };
  const source = txt(b.source || cle.nom, 60), magasin = txt(b.magasin, 120);
  const id = 'cc-' + norm(source) + '-' + numero.replace(/[^\w.-]+/g, '_');
  /* rapprochement : client par magasin DIOPTRA, montures par EAN ou code étiquette */
  const { rows: cl } = await pool.query("select id,data from entities where kind='clients' and not deleted");
  const client = magasin ? cl.find(r => norm(r.data.dioptraMagasin) === norm(magasin)) : null;
  const { rows: ms } = await pool.query("select id,data from entities where kind='montures' and not deleted");
  const byEAN = new Map(), byEtq = new Map();
  ms.forEach(r => { const k = normEAN(r.data.ean); if (k) byEAN.set(k, r.id); if (r.data.etiquette) byEtq.set(String(r.data.etiquette).toUpperCase(), r.id); });
  lignes.forEach(l => { l.montureId = (l.ean && byEAN.get(normEAN(l.ean))) || (l.etiquette && byEtq.get(l.etiquette.toUpperCase())) || ''; });
  const data = { id, source, numero, magasin, clientId: client ? client.id : '', date: txt(b.date, 30) || new Date().toISOString().slice(0, 10), commentaire: txt(b.commentaire, 500),
    lignes, statut: 'nouvelle', recuLe: new Date().toISOString(), cle: cle.nom };
  const c = await pool.connect(); let etat = 'creee';
  try {
    await c.query('begin');
    const { rows } = await c.query("select data,deleted from entities where kind='commandesC' and id=$1 for update", [id]);
    if (rows[0] && !rows[0].deleted && rows[0].data.statut !== 'nouvelle') { await c.query('rollback'); return { status: 409, body: { erreur: 'Cette commande a déjà été traitée par la centrale.', id, statut: rows[0].data.statut } }; }
    if (rows[0] && !rows[0].deleted) etat = 'maj';
    await c.query(`insert into entities(kind,id,data,deleted,updated_at,updated_by) values('commandesC',$1,$2,false,clock_timestamp(),null)
      on conflict(kind,id) do update set data=excluded.data, deleted=false, updated_at=clock_timestamp(), updated_by=null`, [id, data]);
    await c.query("insert into activite(user_id,user_nom,kind,ent_id,action,label) values(null,$1,'commandesC',$2,$3,$4)", [source + ' (API)', id, etat === 'maj' ? 'modification' : 'creation', source + ' ' + numero + (magasin ? ' · ' + magasin : '')]);
    await c.query('commit');
  } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
  const inconnues = lignes.filter(l => !l.montureId).length;
  return { status: 200, body: { ok: true, id, etat, client: client ? client.data.nom : null, lignes: lignes.length, reconnues: lignes.length - inconnues, inconnues } };
}

/* Catalogue de la centrale pour l'opticien (montures en stock) */
async function catalogue(req) {
  const cle = await check(req);
  if (!cle) return { status: 401, body: { erreur: "Clé d'intégration Prismea invalide ou désactivée." } };
  const { rows } = await pool.query("select data from entities where kind='montures' and not deleted");
  const { rows: ph } = await pool.query("select data from entities where kind='photos' and not deleted");
  const photoEAN = new Map(ph.map(r => [normEAN(r.data.ean), r.data.file]));
  const items = rows.map(r => r.data).filter(m => (m.qte || 0) > 0).map(m => ({ ean: m.ean || '', etiquette: m.etiquette, marque: m.marque, modele: m.modele, coloris: m.coloris || '',
    taille: m.calibre ? `${m.calibre}□${m.pont || ''}${m.branche ? ' ' + m.branche : ''}` : '', matiere: m.matiere || '', prix: m.pv || 0, disponible: m.qte,
    photo: m.photo === null ? '' : (m.photo || photoEAN.get(normEAN(m.ean)) || '') }));
  return { status: 200, body: { devise: 'EUR', maj: new Date().toISOString(), montures: items } };
}

/* Photo d'une monture du catalogue (uniquement les fichiers utilisés comme photos de montures) */
async function photo(req) {
  const cle = await check(req);
  if (!cle) return { status: 401, body: { erreur: "Clé d'intégration Prismea invalide ou désactivée." } };
  const id = String(req.params.id || '');
  if (!/^[a-f0-9]{32}$/.test(id)) return { status: 404, body: { erreur: 'Photo introuvable.' } };
  const { rows: ok } = await pool.query("select 1 from entities where not deleted and ((kind='photos' and data->>'file'=$1) or (kind='montures' and data->>'photo'=$1)) limit 1", [id]);
  if (!ok.length) return { status: 404, body: { erreur: 'Photo introuvable.' } };
  const { rows } = await pool.query('select type,data from files where id=$1', [id]);
  if (!rows[0]) return { status: 404, body: { erreur: 'Photo introuvable.' } };
  return { status: 200, file: rows[0] };
}

/* Statut des commandes envoyées (pour le suivi dans DIOPTRA) */
async function statuts(req) {
  const cle = await check(req);
  if (!cle) return { status: 401, body: { erreur: "Clé d'intégration Prismea invalide ou désactivée." } };
  const b = req.body || {}, source = txt(b.source || cle.nom, 60);
  const nums = (Array.isArray(b.numeros) ? b.numeros : []).slice(0, 200).map(n => txt(n, 60)).filter(Boolean);
  if (!nums.length) return { status: 200, body: { commandes: [] } };
  const ids = nums.map(n => 'cc-' + norm(source) + '-' + n.replace(/[^\w.-]+/g, '_'));
  const { rows } = await pool.query("select id,data,deleted from entities where kind='commandesC' and id = any($1)", [ids]);
  const byId = new Map(rows.map(r => [r.id, r]));
  const vIds = rows.map(r => r.data.venteId).filter(Boolean), dIds = rows.map(r => r.data.devisId).filter(Boolean);
  const { rows: docs } = await pool.query("select kind,id,data from entities where (kind='ventes' and id = any($1)) or (kind='devis' and id = any($2))", [vIds, dIds]);
  const doc = new Map(docs.map(r => [r.kind + ':' + r.id, r.data]));
  return { status: 200, body: { commandes: nums.map((n, i) => { const r = byId.get(ids[i]); if (!r || r.deleted) return { numero: n, statut: 'inconnue' };
    const v = r.data.venteId && doc.get('ventes:' + r.data.venteId), d = r.data.devisId && doc.get('devis:' + r.data.devisId);
    return { numero: n, statut: r.data.statut, traiteeLe: r.data.traiteeLe || null, facture: v ? v.facture : null, vente: v ? v.num : null, devis: d ? d.num : null }; }) } };
}

module.exports = { publicList, create, setActif, receive, catalogue, photo, statuts };

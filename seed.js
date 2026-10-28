'use strict';
/* Données fictives de la version test (APP_ENV=test) */
const { pool } = require('./db');

function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const r2 = n => Math.round(n * 100) / 100;
const pad = (n, l) => String(n).padStart(l, '0');
const iso = d => d.toISOString();
const isoD = d => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function buildState() {
  const rnd = rng(20261027), pick = a => a[Math.floor(rnd() * a.length)];
  const now = new Date();

  const fournisseurs = [
    ['OZ Eyewear', 'Marco Bianchi', 'IT', 'Milan', '0245678912', 'orders@oz-eyewear.example', 'IT01234567890', '30 jours fin de mois'],
    ['Lumea Distribution', 'Claire Martin', 'FR', 'Lyon', '0478451236', 'commandes@lumea.example', 'FR45123456789', '45 jours'],
    ['Kombé Optique', 'Paul Essono', 'CM', 'Douala', '699123456', 'contact@kombe.example', '', 'Paiement à la commande'],
  ].map((f, i) => ({ id: 'f' + (i + 1), num: i + 1, nom: f[0], contact: f[1], pays: f[2], ville: f[3], tel: f[4], email: f[5], adresse: '', tvaIntra: f[6], conditions: f[7] }));

  const marques = [
    ['OZ', 'f1', 2.2], ['OZ Kids', 'f1', 2.4], ['Lumea', 'f2', 2], ['Okoumé', 'f2', 2.1], ['Kombé', 'f3', 1.8],
  ].map((b, i) => ({ id: 'b' + (i + 1), nom: b[0], fournisseurId: b[1], coef: b[2], ...(b[0] === 'OZ' ? { prefixe: 'OZE' } : {}) }));
  /* Code étiquette : 3 lettres de la marque + numéro sur 3 chiffres (OZE001, LUM002…) */
  const autoPrefix = n => (String(n).normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase() + 'XXX').slice(0, 3);
  const prefixOf = n => { const b = marques.find(x => x.nom === n); return (b && b.prefixe) || autoPrefix(n); };
  const seqMeta = {};
  const nextEtq = n => { const P = prefixOf(n); seqMeta['seqM_' + P] = (seqMeta['seqM_' + P] || 0) + 1; return P + pad(seqMeta['seqM_' + P], 3); };
  const coef = n => marques.find(b => b.nom === n).coef;

  const modeles = [
    ['OZ', '1021', 'Noir mat', 52, 18, 140, 38.5], ['OZ', '1022', 'Écaille', 50, 19, 145, 41], ['OZ', '1035', 'Bleu nuit', 54, 17, 145, 44],
    ['OZ', '2040', 'Or rose', 51, 18, 140, 47], ['OZ', '2041', 'Argent', 53, 16, 140, 45], ['OZ Kids', 'K12', 'Rouge', 44, 15, 125, 22],
    ['OZ Kids', 'K14', 'Bleu', 46, 15, 130, 23.5], ['Lumea', 'LM201', 'Noir', 52, 18, 140, 26], ['Lumea', 'LM305', 'Havane', 50, 19, 145, 28],
    ['Lumea', 'LM410', 'Cristal', 49, 20, 140, 30], ['Okoumé', 'OK12', 'Bois clair', 53, 17, 140, 52], ['Okoumé', 'OK15', 'Bois foncé', 55, 17, 145, 55],
    ['Kombé', 'KB07', 'Bleu marine', 54, 16, 145, 14], ['Kombé', 'KB11', 'Rouge', 48, 17, 135, 13], ['Kombé', 'KB20', 'Vert', 52, 18, 140, 15],
    ['Kombé', 'KB21', 'Noir', 50, 18, 140, 15],
  ];
  const montures = modeles.map((m, i) => {
    const pa = m[6];
    return { id: 'm' + (i + 1), etiquette: nextEtq(m[0]), ean: '80' + pad(51234567000 + i * 7, 11), marque: m[0], modele: m[1], coloris: m[2],
      calibre: String(m[3]), pont: String(m[4]), branche: String(m[5]), pa, pv: Math.round(pa * coef(m[0])), seuil: 3, qte: 0 };
  });
  const catalogue = montures.map(m => ({ id: 'e' + m.ean.replace(/^0+/, ''), ean: m.ean, marque: m.marque, modele: m.modele, coloris: m.coloris,
    calibre: m.calibre, pont: m.pont, branche: m.branche, pa: m.pa, pv: m.pv, importe: iso(addDays(now, -100)) }));

  const clients = [
    ['Optique du Littoral', 'Mme Ndong', 'GA', 'Libreville', '077412218', 0, 5, 3000],
    ['Vision Plus Owendo', 'M. Mba', 'GA', 'Owendo', '066128740', 0, 0, 2000],
    ['Clair Regard', 'Mme Moussavou', 'GA', 'Port-Gentil', '074551092', 0, 3, 1500],
    ['Lunetterie de Franceville', 'Mme Ondo', 'GA', 'Franceville', '062487105', 0, 0, 0],
    ['Optique Akwa', 'M. Tchoumi', 'CM', 'Douala', '677452310', 0, 5, 2500],
    ['Regard Brazza', 'M. Mabiala', 'CG', 'Brazzaville', '066541122', 0, 0, 1000],
    ['Optique Sablon', 'Mme Peeters', 'BE', 'Bruxelles', '25123456', 'BE0123456789', 0, 0],
    ['Eyeroom Metz', 'M. Druost', 'FR', 'Metz', '387654321', 'FR', 0, 0],
  ].map((c, i) => ({ id: 'c' + (i + 1), num: i + 1, nom: c[0], contact: c[1], pays: c[2], ville: c[3], tel: c[4], email: '', adresse: '',
    nif: '', rccm: '', tvaFR: c[5] === 'FR', tvaIntra: c[5] && c[5] !== 'FR' ? c[5] : '', remise: c[6], plafond: c[7], cree: iso(addDays(now, -120)) }));
  const regimeOf = c => c.tvaFR ? 'fr' : (c.tvaIntra ? 'ue' : 'export');

  const ventes = [], reglements = [], devis = [], sold = {};
  let seqV = 0, seqFA = 0, seqD = 0;
  const modes = ['Virement', 'Virement', 'Virement', 'Chèque', 'Espèces', 'Mobile Money'];
  const banques = ['BGFI Bank', 'Orabank', 'UGB', 'BNP Paribas', 'Société Générale'];
  for (let d = 95; d >= 0; d--) {
    const day = addDays(now, -d);
    if (day.getDay() === 0 || rnd() < 0.55) continue;
    const c = pick(clients), nl = 1 + Math.floor(rnd() * 4), used = new Set(), lignes = [];
    for (let k = 0; k < nl; k++) {
      const m = pick(montures); if (used.has(m.id)) continue; used.add(m.id);
      const q = 1 + Math.floor(rnd() * (m.pa < 20 ? 8 : 4));
      lignes.push({ montureId: m.id, etiquette: m.etiquette, designation: m.marque + ' ' + m.modele, detail: `${m.coloris} · ${m.calibre}□${m.pont} ${m.branche}`, qte: q, pu: m.pv, pa: m.pa });
      sold[m.id] = (sold[m.id] || 0) + q;
    }
    const date = new Date(day); date.setHours(9 + Math.floor(rnd() * 8), Math.floor(rnd() * 60), 0, 0);
    if (date > now) date.setTime(now - 3600e3);
    const remise = c.remise || 0, reg = regimeOf(c);
    const brut = r2(lignes.reduce((t, l) => t + l.qte * l.pu, 0)), rem = r2(brut * remise / 100), ht = r2(brut - rem);
    const tva = reg === 'fr' ? r2(ht * 0.2) : 0;
    seqV++; seqFA++;
    const v = { id: 'v' + seqV, kind: 'vente', date: iso(date), clientId: c.id, lignes, remise, regime: reg, tvaIntra: reg === 'ue' ? c.tvaIntra : '',
      brut, rem, ht, tva, ttc: r2(ht + tva), num: 'V' + date.getFullYear() + '-' + pad(seqV, 4), facture: 'FA' + date.getFullYear() + '-' + pad(seqFA, 4),
      echeance: isoD(addDays(date, 30)), paiement: 'À régler plus tard', regMig: true };
    if (d > 6) {
      const st = d > 40 ? 'livre' : d > 20 ? pick(['livre', 'transit', 'douane']) : pick(['expedie', 'transit']);
      v.expedition = { transporteur: 'DHL', suivi: pad(Math.floor(1e9 + rnd() * 8e9), 10), date: isoD(addDays(date, 1)), statut: st,
        livraison: st === 'livre' ? isoD(addDays(date, 6)) : '', colis: Array.from({ length: 1 + Math.floor(rnd() * 2) }, () => ({ kg: r2(1.5 + rnd() * 6), l: 40, w: 30, h: 20 + Math.floor(rnd() * 3) * 10 })), note: '' };
    }
    if (reg === 'export' && v.expedition && v.expedition.statut === 'livre') {
      v.douane = { incoterm: 'DAP', declarant: 'DHL Express', mrn: '26FR' + String(1e12 + seqV * 7919).slice(-13) + '7', dateDecl: v.expedition.date,
        bureau: 'FR003220 Roissy fret', dateSortie: isoD(addDays(new Date(v.expedition.date), 1)), note: '' };
    }
    ventes.push(v);
    const p = rnd();
    if (d > 35 ? p < 0.9 : p < 0.45) {
      const mode = pick(modes), part = p < 0.15 ? r2(v.ttc / 2) : v.ttc;
      reglements.push({ id: 'g' + v.id, venteId: v.id, clientId: c.id, date: iso(new Date(Math.min(+addDays(date, 5 + Math.floor(rnd() * 20)), +now))), montant: part, mode,
        banque: mode === 'Virement' || mode === 'Chèque' ? pick(banques) : '', ref: mode === 'Virement' ? 'VIR' + pad(Math.floor(rnd() * 99999), 5) : mode === 'Chèque' ? pad(Math.floor(rnd() * 9999999), 7) : '' });
    }
  }
  for (let i = 0; i < 3; i++) {
    const c = clients[i * 2], date = addDays(now, -3 - i * 4), lignes = montures.slice(i * 3, i * 3 + 2).map(m => ({ montureId: m.id, etiquette: m.etiquette, designation: m.marque + ' ' + m.modele, detail: `${m.coloris} · ${m.calibre}□${m.pont} ${m.branche}`, qte: 5, pu: m.pv }));
    const brut = r2(lignes.reduce((t, l) => t + l.qte * l.pu, 0)), reg = regimeOf(c), ht = r2(brut - brut * (c.remise || 0) / 100), tva = reg === 'fr' ? r2(ht * 0.2) : 0;
    seqD++;
    devis.push({ id: 'd' + seqD, kind: 'devis', date: iso(date), clientId: c.id, lignes, remise: c.remise || 0, regime: reg, tvaIntra: '', brut, rem: r2(brut - ht), ht, tva, ttc: r2(ht + tva),
      num: 'D' + date.getFullYear() + '-' + pad(seqD, 4), validite: isoD(addDays(date, 30)) });
  }

  // Stock final et entrées de stock cohérentes avec les ventes
  montures.forEach((m, i) => { m.qte = i % 7 < 3 ? [0, 2, 1][i % 7] : 4 + Math.floor(rnd() * 12); }); // quelques ruptures et alertes
  const receptions = [];
  let seqR = 0;
  fournisseurs.forEach((f, fi) => {
    const ms = montures.filter(m => marques.find(b => b.nom === m.marque).fournisseurId === f.id);
    seqR++;
    const date = addDays(now, -100 + fi);
    const lignes = ms.map(m => ({ montureId: m.id, etiquette: m.etiquette, designation: m.marque + ' ' + m.modele, detail: `${m.coloris} · ${m.calibre}□${m.pont} ${m.branche}`, qte: m.qte + (sold[m.id] || 0), pa: m.pa }));
    receptions.push({ id: 'r' + seqR, num: 'R' + date.getFullYear() + '-' + pad(seqR, 4), date: iso(date), fournisseurId: f.id, fournisseur: f.nom, doc: 'BL-' + (4100 + fi * 13),
      lignes, total: r2(lignes.reduce((t, l) => t + l.qte * l.pa, 0)) });
  });

  // Factures fournisseurs : une payée, une partiellement payée, une en retard, une à venir
  const facturesF = receptions.map((r, i) => {
    const f = fournisseurs.find(x => x.id === r.fournisseurId), date = addDays(new Date(r.date), 1);
    const ht = r.total, tva = f.pays === 'FR' ? r2(ht * 0.2) : 0, ttc = r2(ht + tva), delai = i === 2 ? 30 : 45;
    const paiements = i === 0 ? [{ id: 'p1', date: isoD(addDays(date, 40)), montant: ttc, mode: 'Virement international (SWIFT)', banque: 'BGFI Bank', ref: 'SWIFT-88412' }]
      : i === 1 ? [{ id: 'p2', date: isoD(addDays(date, 30)), montant: r2(ttc / 2), mode: 'Virement', banque: 'BGFI Bank', ref: 'VIR-20456' }] : [];
    return { id: 'ff' + (i + 1), fournisseurId: f.id, ref: ['OZ-INV-2026-118', 'LUM-F-4471', 'KB-2026-033'][i], date: isoD(date), echeance: isoD(addDays(date, delai)),
      ht, tva, ttc, receptions: [r.id], documents: [], paiements, note: '', cree: iso(date) };
  });
  facturesF.push({ id: 'ff4', fournisseurId: 'f1', ref: 'OZ-INV-2026-131', date: isoD(addDays(now, -40)), echeance: isoD(addDays(now, 5)), ht: 1240, tva: 0, ttc: 1240,
    receptions: [], documents: [], paiements: [], note: 'Réassort OZ 2040 et 2041', cree: iso(addDays(now, -40)) });

  const societe = { nom: 'Prismea Démo SAS', forme: 'SAS', capital: '10 000 €', adresse: '12 rue de la Démo', cp: '75002', ville: 'Paris', pays: 'FR',
    siren: '000000000', rcs: 'RCS Paris', tvaIntra: 'FR00000000000', tel: '01 23 45 67 89', email: 'demo@prismea.example', iban: 'FR76 0000 0000 0000 0000 0000 000', bic: 'DEMOFRPP', banque: 'Banque Démo', delai: 30, transporteur: 'DHL' };

  return {
    clients, montures, ventes, devis, receptions, reglements, clotures: [], catalogue, marques, fournisseurs, facturesF,
    meta: { devise: 'EUR', societe, seq: clients.length, seqV, seqFA, seqD, seqR, ...seqMeta, seqF: fournisseurs.length },
  };
}

async function seed({ force } = {}) {
  const { rows } = await pool.query("select count(*)::int n from entities where kind<>'meta' and not deleted");
  if (rows[0].n > 0 && !force) return false;
  const st = buildState();
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('delete from entities');
    await client.query('delete from files');
    const ins = (kind, id, data) => client.query('insert into entities(kind,id,data,deleted,updated_at) values($1,$2,$3,false,clock_timestamp())', [kind, id, data]);
    for (const [kind, list] of Object.entries(st)) {
      if (kind === 'meta') continue;
      for (const r of list) await ins(kind, r.id, r);
    }
    for (const [k, v] of Object.entries(st.meta)) await ins('meta', k, { v });
    await client.query('commit');
  } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
  return true;
}

module.exports = { seed, buildState };

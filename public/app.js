(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0});

/* Pays : [code ISO, nom, indicatif] */
const PAYS=[
 ['GA','Gabon','241'],['CM','Cameroun','237'],['CG','Congo','242'],['CD','RD Congo','243'],['GQ','Guinée équatoriale','240'],['TD','Tchad','235'],['CF','Centrafrique','236'],['ST','Sao Tomé-et-Principe','239'],
 ['AO','Angola','244'],['BJ','Bénin','229'],['BF','Burkina Faso','226'],['BI','Burundi','257'],['CV','Cap-Vert','238'],['KM','Comores','269'],['CI','Côte d\'Ivoire','225'],['DJ','Djibouti','253'],
 ['DZ','Algérie','213'],['EG','Égypte','20'],['ER','Érythrée','291'],['SZ','Eswatini','268'],['ET','Éthiopie','251'],['GM','Gambie','220'],['GH','Ghana','233'],['GN','Guinée','224'],['GW','Guinée-Bissau','245'],
 ['KE','Kenya','254'],['LS','Lesotho','266'],['LR','Liberia','231'],['LY','Libye','218'],['MG','Madagascar','261'],['MW','Malawi','265'],['ML','Mali','223'],['MA','Maroc','212'],['MU','Maurice','230'],['MR','Mauritanie','222'],
 ['MZ','Mozambique','258'],['NA','Namibie','264'],['NE','Niger','227'],['NG','Nigeria','234'],['UG','Ouganda','256'],['RW','Rwanda','250'],['SN','Sénégal','221'],['SC','Seychelles','248'],['SL','Sierra Leone','232'],
 ['SO','Somalie','252'],['SD','Soudan','249'],['SS','Soudan du Sud','211'],['ZA','Afrique du Sud','27'],['BW','Botswana','267'],['TZ','Tanzanie','255'],['TG','Togo','228'],['TN','Tunisie','216'],['ZM','Zambie','260'],['ZW','Zimbabwe','263'],
 ['FR','France','33'],['BE','Belgique','32'],['CH','Suisse','41'],['LU','Luxembourg','352'],['MC','Monaco','377'],['DE','Allemagne','49'],['ES','Espagne','34'],['IT','Italie','39'],['PT','Portugal','351'],['NL','Pays-Bas','31'],['GB','Royaume-Uni','44'],
 ['AT','Autriche','43'],['BG','Bulgarie','359'],['HR','Croatie','385'],['CY','Chypre','357'],['CZ','Tchéquie','420'],['DK','Danemark','45'],['EE','Estonie','372'],['FI','Finlande','358'],['GR','Grèce','30'],['HU','Hongrie','36'],['IE','Irlande','353'],['LV','Lettonie','371'],['LT','Lituanie','370'],['MT','Malte','356'],['PL','Pologne','48'],['RO','Roumanie','40'],['SK','Slovaquie','421'],['SI','Slovénie','386'],['SE','Suède','46'],
 ['CA','Canada','1'],['US','États-Unis','1'],['BR','Brésil','55'],['CN','Chine','86'],['HK','Hong Kong','852'],['IN','Inde','91'],['JP','Japon','81'],['KR','Corée du Sud','82'],['LB','Liban','961'],['AE','Émirats arabes unis','971'],['TR','Turquie','90']
];
const CEMAC=['GA','CM','CG','GQ','TD','CF'];
const UE=['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
const prefixTVA=c=>c==='GR'?'EL':c;
const paysByCode=c=>PAYS.find(p=>p[0]===c);
const sortedPays=()=>{
  const coll=new Intl.Collator('fr');
  const top=CEMAC.map(paysByCode);
  const ue=PAYS.filter(p=>UE.includes(p[0])).sort((a,b)=>coll.compare(a[1],b[1]));
  const rest=PAYS.filter(p=>!CEMAC.includes(p[0])&&!UE.includes(p[0])).sort((a,b)=>coll.compare(a[1],b[1]));
  return{top,ue,rest};
};
function paysOptions(sel){
  const{top,ue,rest}=sortedPays();
  const o=p=>`<option value="${p[0]}" ${p[0]===sel?'selected':''}>${esc(p[1])} (+${p[2]})</option>`;
  return`<option value="">Choisir un pays</option><optgroup label="Zone CEMAC">${top.map(o).join('')}</optgroup><optgroup label="Union européenne">${ue.map(o).join('')}</optgroup><optgroup label="Autres pays">${rest.map(o).join('')}</optgroup>`;
}
/* Numéro affiché : +241 77 41 22 18 (chiffres groupés par deux) */
function fmtTel(code,num){
  const d=String(num||'').replace(/\D/g,'');
  if(!d)return'';
  const p=paysByCode(code);
  const head=d.length%2&&d.length>3?3:d.length%2;
  const grp=[d.slice(0,head),...(d.slice(head).match(/\d{2}/g)||[])].filter(Boolean).join(' ');
  return p?`+${p[2]} ${grp}`:grp;
}

/* Données */
let S=window.__PRISMEA__.state;S.clients=S.clients||[];S.seq=S.seq||0;if(!S.devise)S.devise='EUR';
const save=()=>window.PrismeaSync.schedule();
const alloc=(name,min)=>window.PrismeaSync.alloc(name,min);
const pad4=n=>String(n).padStart(4,'0');
S.ventes=S.ventes||[];S.devis=S.devis||[];S.seqV=S.seqV||0;S.seqD=S.seqD||0;const TVA_FR=20;
/* Montures d'exemple, en attendant la tuile Stock */
if(!S.montures){S.montures=[
  ['000001','3700000000017','Lumea','LM201','Noir mat','52□18 140',22,12],
  ['000002','3700000000024','Lumea','LM305','Écaille','50□19 145',24.5,8],
  ['000003','3700000000031','Okoumé','OK12','Bois clair','53□17 140',34,5],
  ['000004','3700000000048','Kombé','KB07','Bleu marine','54□16 145',19,20],
  ['000005','3700000000055','Kombé','KB11','Rouge','48□17 135',17,3],
  ['000006','3700000000062','Nyanga Kids','NK3','Rose','44□15 125',13,15]
 ].map((m,i)=>({id:'m'+(i+1),etiquette:m[0],ean:m[1],marque:m[2],modele:m[3],coloris:m[4],taille:m[5],pv:m[6],qte:m[7],demo:true}));save()}
/* Passage du FCFA à l'euro (parité fixe 655,957) pour les données saisies avant */
if(S.devise!=='EUR'){
  const X=655.957,cv=n=>Math.round((n||0)/X*100)/100;
  S.clients.forEach(c=>{if(c.plafond)c.plafond=cv(c.plafond)});
  S.montures.forEach(m=>{const e={m1:22,m2:24.5,m3:34,m4:19,m5:17,m6:13};m.pv=m.demo&&e[m.id]!=null?e[m.id]:cv(m.pv)});
  [...S.ventes,...S.devis].forEach(d=>{d.lignes.forEach(l=>l.pu=cv(l.pu));['brut','rem','ht','tva','ttc'].forEach(k=>{if(d[k]!=null)d[k]=cv(d[k])});if(d.css){d.ttc=cv(0)+Math.round(((d.ht||0)+(d.tva||0))*100)/100;delete d.css}});
  S.devise='EUR';save();
}
const cli=id=>S.clients.find(c=>c.id===id);
const mon=id=>S.montures.find(m=>m.id===id);
const desig=m=>`${m.marque} ${m.modele}`;
const nf2=new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
const r2=n=>Math.round((n||0)*100)/100;
const money=n=>nf2.format(r2(n))+'\u00A0€';
const dF=new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
/* Ventes hors taxes par défaut (export) ; TVA française 20 % uniquement si le client y est assujetti */
/* Régime : 'fr' (TVA française cochée), 'ue' (client UE hors France avec n° TVA intracom), 'export' (tous les autres) */
function regimeOf(c){
  if(!c)return'export';
  if(c.tvaFR)return'fr';
  if(c.pays&&UE.includes(c.pays)&&c.pays!=='FR'&&c.tvaIntra)return'ue';
  return'export';
}
const regOf=d=>d.regime||(d.tvaFR?'fr':'export');
const REGIME={fr:'TVA française 20\u202F% appliquée',ue:'Livraison intracommunautaire hors taxes',export:'Vente hors taxes (exportation)'};
/* Remise par ligne : en % ou en € par monture (l.remT = '€'), l.rem = valeur ; prix net unitaire au centime */
const isE=x=>x==='€';
const remL=l=>isE(l.remT)?Math.min(+l.pu||0,Math.max(0,+l.rem||0)):Math.min(100,Math.max(0,+l.rem||0));
const puNet=l=>r2(isE(l.remT)?l.pu-remL(l):l.pu*(1-remL(l)/100));
const lineHT=l=>r2(l.qte*puNet(l));
const fmtPct=n=>nf2.format(n).replace(/,00$/,'');
const remTag=l=>isE(l.remT)?`−${money(remL(l))}`:`−${fmtPct(remL(l))} %`;
/* Remise client globale : en % (défaut) ou en montant € (remiseT = '€') */
function totals(lignes,remise,regime,remiseT){
  const tvaFR=regime===true||regime==='fr';
  const brut=r2(lignes.reduce((t,l)=>t+l.qte*l.pu,0)),net=r2(lignes.reduce((t,l)=>t+lineHT(l),0)),remLignes=r2(brut-net);
  const rem=r2(isE(remiseT)?Math.min(net,Math.max(0,+remise||0)):net*Math.min(100,Math.max(0,+remise||0))/100),ht=r2(net-rem);
  const tva=r2(tvaFR?ht*TVA_FR/100:0);
  return{brut,remLignes,net,rem,ht,tva,ttc:r2(ht+tva)};
}
const remCliLabel=d=>isE(d.remiseT)?'Remise client':`Remise client ${nf.format(d.remise)} %`;
/* Lignes de remise du récapitulatif (remises sur montures puis remise client globale) */
const remTotals=(d,brut=true)=>(brut&&(d.remLignes||d.rem)&&d.brut?`<dt>Total brut HT</dt><dd>${money(d.brut)}</dd>`:'')+(d.remLignes?`<dt>Remises sur montures</dt><dd>−${money(d.remLignes)}</dd>`:'')+(d.rem?`<dt>${remCliLabel(d)}</dt><dd>−${money(d.rem)}</dd>`:'');
/* Cellule « PU HT » avec le prix barré quand la ligne est remisée */
const puCell=l=>remL(l)?`<s class="muted">${money(l.pu)}</s><br><b>${money(puNet(l))}</b> <span class="rem-tag">${remTag(l)}</span>`:money(l.pu);
function taxLines(t,reg,intra){
  if(reg==='fr')return`<dt>Total HT</dt><dd>${money(t.ht)}</dd><dt>TVA ${TVA_FR}\u202F%</dt><dd>${money(t.tva)}</dd><dt class="big">Total TTC</dt><dd class="big">${money(t.ttc)}</dd>`;
  const legal=reg==='ue'?`Exonération de TVA, article 262 ter I du CGI (livraison intracommunautaire). Autoliquidation par le client${intra?', n° TVA '+esc(intra):''}.`:'Exonération de TVA, article 262 I du CGI (exportation).';
  return`<dt>TVA</dt><dd>Non applicable</dd><dt class="big">Total HT</dt><dd class="big">${money(t.ht)}</dd><dd class="legal">${legal}</dd>`;
}
const normEAN=v=>String(v??'').replace(/\D/g,'').replace(/^0+/,'');
/* Matière de la monture ; codes OPTO11 (caractéristique matière EDI-Optique) tels qu'utilisés par les fournisseurs */
const MATIERES=['Acétate','Métal','Mixte (métal et plastique)','Titane','Plastique injecté','Percée','Bois','Autre'];
const OPTO_MAT={A:'Acétate',B:'Mixte (métal et plastique)',C:'Métal',F:'Percée'};
const tailleOf=m=>m.calibre?`${m.calibre}□${m.pont||''}${m.branche?' '+m.branche:''}`:(m.taille||'');
function findMonture(code){
  const c=code.trim();if(!c)return null;const lc=c.toLowerCase(),k=normEAN(c);
  if(/^\d{1,7}$/.test(c)){const n=+c;const e=S.montures.find(m=>/^\d+$/.test(m.etiquette)&&+m.etiquette===n);if(e)return e}
  const x=c.match(/^([A-Za-z]{3})\s*0*(\d{1,6})$/);if(x){const e=x[1].toUpperCase()+x[2].padStart(3,'0');const f=S.montures.find(m=>m.etiquette===e);if(f)return f}
  return S.montures.find(m=>m.etiquette.toLowerCase()===lc||(k.length>=8&&normEAN(m.ean)===k))||null;
}
const codeOf=c=>'CL'+String(c.num).padStart(4,'0');

/* Outils d'interface */
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3000)}
function openModal(title,sub,body,foot,mount){
  $('.modal-card').classList.remove('wide');$('#m-title').textContent=title;$('#m-sub').textContent=sub||'';$('#m-body').innerHTML=body;$('#m-foot').innerHTML=foot;
  $('#modal').hidden=false;$('#modal').scrollTop=0;if(mount)mount();
}
function closeModal(){$('#modal').hidden=true;$('#m-body').innerHTML=''}

const ICO={
 client:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.4 3.5 5.2"/></svg>',
 stock:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8 20.5 7.4v9.2L12 21.2 3.5 16.6V7.4Z"/><path d="M3.5 7.4 12 12l8.5-4.6M12 12v9.2"/><path d="m7.8 5.1 8.5 4.6"/></svg>',
 caisse:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="10" width="18" height="10.5" rx="2"/><path d="M6 10V4.5h8V10M14 6.5h4V10"/><path d="M7 14h2M11 14h2M15 14h2M7 17h10"/></svg>',
 stats:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5h17"/><rect x="5" y="12" width="3" height="6" rx=".6"/><rect x="10.5" y="7.5" width="3" height="10.5" rx=".6"/><rect x="16" y="4" width="3" height="14" rx=".6"/></svg>',
 go:'<svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h11M11 5.5 15.5 10 11 14.5"/></svg>'
};

/* ---------- Accueil ---------- */
function viewHome(){
  const n=S.clients.length;
  const tile=(href,ico,label,desc)=>`<${href?'a href="'+href+'"':'button data-soon="'+label+'"'} class="tile"><span class="tile-ico">${ico}</span><span class="tile-go">${ICO.go}</span><span class="tile-label">${label}</span><span class="tile-desc">${desc}</span></${href?'a':'button'}>`;
  return`<section class="hello"><span class="eyebrow">Centrale d'achat · Montures</span><h1>${new Date().getHours()<18?'Bonjour':'Bonsoir'}</h1><p>Choisissez un module pour commencer.</p></section>
  <section class="tiles" aria-label="Modules">
   ${tile('#clients',ICO.client,'Client',n?`<span class="tile-count">${n} client${n>1?'s':''}</span> enregistré${n>1?'s':''}.`:'Les opticiens et magasins qui achètent à la centrale.')}
   ${tile('#stock',ICO.stock,'Stock',(()=>{const q=S.montures.reduce((t,m)=>t+Math.max(0,m.qte),0);return q?`<span class="tile-count">${q} monture${q>1?'s':''}</span> en stock.`:'Les montures en stock et les entrées de marchandise.'})())}
   ${tile('#caisse',ICO.caisse,'Caisse',(()=>{const n=S.ventes.filter(v=>resteOf(v)>0.005).length;return n?`<span class="tile-count">${n} facture${n>1?'s':''}</span> à encaisser.`:'Journal des ventes, règlements, factures et caisse de la semaine.'})())}
   ${tile('#achats',ICO_ACHAT,'Achats',(()=>{const o=(S.facturesF||[]).filter(f=>resteF(f)>0.005),l=o.filter(f=>statutF(f)==='retard').length;return o.length?`<span class="tile-count">${o.length} facture${o.length>1?'s':''}</span> fournisseur à payer${l?` · <span class="warn-txt">${l} en retard</span>`:''}.`:'Factures fournisseurs, échéances et paiements.'})())}
   ${tile('#statistiques',ICO.stats,'Statistique',(()=>{const d=new Date(),a=new Date(d.getFullYear(),d.getMonth(),1),ca=S.ventes.filter(v=>new Date(v.date)>=a).reduce((t,v)=>t+v.ht,0);return ca?`<span class="tile-count">${money(ca)} HT</span> vendus ce mois-ci.`:'Chiffre d\'affaires, marges, meilleurs clients et marques.'})())}
   ${tile('#parametres',ICO_SET,'Paramètres','Votre société, la facturation et les sauvegardes.')}
  </section><p class="note" id="note" role="status"></p>`;
}

/* ---------- Client ---------- */
function viewClients(){
  const used=[...new Set(S.clients.map(c=>c.pays).filter(Boolean))].map(paysByCode).filter(Boolean).sort((a,b)=>a[1].localeCompare(b[1],'fr'));
  return`<a class="back" href="#">← Accueil</a>
  <div class="head"><div><h1>Client</h1><p>Les opticiens et magasins qui achètent à la centrale.</p></div><button class="btn primary" data-act="new">Nouveau client</button></div>
  ${S.clients.length?`<div class="toolbar"><input id="q" type="search" placeholder="Rechercher par nom, code, contact, ville ou téléphone" aria-label="Rechercher un client">
   <select id="fp" aria-label="Filtrer par pays"><option value="">Tous les pays</option>${used.map(p=>`<option value="${p[0]}">${esc(p[1])}</option>`).join('')}</select></div>
  <div class="table-wrap"><table><thead><tr><th>Code</th><th>Client</th><th>Pays</th><th>Ville</th><th>Téléphone</th><th class="num">Remise</th><th class="num">Plafond crédit</th></tr></thead><tbody id="rows"></tbody></table></div>
  <span class="count" id="count"></span>`
  :`<div class="table-wrap"><div class="empty-state"><h3>Aucun client pour l'instant</h3><p>Ajoutez les opticiens et magasins qui achètent des montures à la centrale. Leur fiche servira ensuite à la caisse.</p><button class="btn primary" data-act="new">Ajouter le premier client</button></div></div>`}`;
}
function fillRows(){
  const q=($('#q')?.value||'').toLowerCase().trim(),fp=$('#fp')?.value||'';
  const qd=q.replace(/\D/g,'');
  const list=S.clients.filter(c=>{
    if(fp&&c.pays!==fp)return false;
    if(!q)return true;
    const p=paysByCode(c.pays);
    const hay=[codeOf(c),c.nom,c.contact,c.ville,p?p[1]:''].join(' ').toLowerCase();
    return hay.includes(q)||(qd.length>=3&&String(c.tel||'').replace(/\D/g,'').includes(qd));
  }).sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
  $('#rows').innerHTML=list.length?list.map(c=>{const p=paysByCode(c.pays);return`<tr class="click" data-id="${c.id}" tabindex="0">
    <td class="code">${codeOf(c)}</td><td><b>${esc(c.nom)}</b>${c.tvaFR?' <span class="tag">TVA FR</span>':regimeOf(c)==='ue'?' <span class="tag">UE</span>':''}${c.contact?`<span class="sub">${esc(c.contact)}</span>`:''}</td>
    <td>${p?`<span class="country"><span class="cc">${p[0]}</span>${esc(p[1])}</span>`:'<span class="sub">—</span>'}</td>
    <td>${esc(c.ville||'')}</td><td class="mono">${esc(fmtTel(c.pays,c.tel))}</td>
    <td class="num">${c.remise?nf.format(c.remise)+' %':'—'}</td><td class="num">${c.plafond?money(c.plafond):'—'}</td></tr>`}).join('')
    :`<tr><td colspan="7"><div class="empty-state" style="padding:32px 12px"><p>Aucun client ne correspond à cette recherche.</p></div></td></tr>`;
  $('#count').textContent=`${list.length} client${list.length>1?'s':''} sur ${S.clients.length}`;
}

function clientForm(c){
  const isNew=!c;c=c||{pays:'GA'};
  const v=k=>esc(c[k]??'');
  openModal(isNew?'Nouveau client':'Modifier le client',isNew?'':codeOf(c),`
  <fieldset><legend>Identité</legend>
    <label class="full">Raison sociale <span class="req">*</span><input id="f-nom" value="${v('nom')}" placeholder="Nom du magasin ou de la société" autocomplete="organization"></label>
    <label class="full">Gérant ou contact<input id="f-contact" value="${v('contact')}" placeholder="Nom et prénom"></label>
  </fieldset>
  <fieldset><legend>Coordonnées</legend>
    <label>Pays<select id="f-pays">${paysOptions(c.pays)}</select></label>
    <label>Ville<input id="f-ville" value="${v('ville')}"></label>
    <label class="full">Téléphone
      <div class="phone"><span class="dial" id="f-dial"></span><input id="f-tel" type="tel" inputmode="tel" value="${v('tel')}" placeholder="Numéro sans l'indicatif" autocomplete="tel-national"></div>
      <span class="hint" id="f-telhint"></span></label>
    <label class="full">E-mail<input id="f-email" type="email" value="${v('email')}" autocomplete="email"></label>
    <label class="full">Adresse<textarea id="f-adresse" rows="2">${v('adresse')}</textarea></label>
  </fieldset>
  <fieldset><legend>Identifiants légaux</legend>
    <label>NIF<input id="f-nif" value="${v('nif')}"></label>
    <label>RCCM<input id="f-rccm" value="${v('rccm')}"></label>
    <label class="full">N° TVA intracommunautaire<input id="f-intra" value="${v('tvaIntra')}" placeholder="Ex. BE0123456789" autocapitalize="characters" spellcheck="false"><span class="hint" id="f-intrahint"></span></label>
  </fieldset>
  <fieldset><legend>Fiscalité</legend>
    <label class="check full"><input type="checkbox" id="f-tva" ${c.tvaFR?'checked':''}> Client assujetti à la TVA française</label>
    <div class="regime full" id="f-reg"></div>
    <p class="hint full" style="margin:0">À cocher uniquement si la TVA française (20 %) doit lui être facturée. Sinon, ses ventes et devis sont hors taxes (exportation).</p>
  </fieldset>
  <fieldset><legend>Conditions commerciales</legend>
    <label>Remise habituelle<span class="suffix"><input id="f-remise" type="number" min="0" max="100" step="0.5" value="${c.remise??''}" placeholder="0"><span>%</span></span></label>
    <label>Plafond de crédit<span class="suffix"><input id="f-plafond" type="number" min="0" step="100" value="${c.plafond??''}" placeholder="0"><span>€</span></span></label>
  </fieldset>
  <fieldset><legend>DIOPTRA</legend>
    <label class="full">Magasin DIOPTRA<input id="f-dioptra" value="${esc(c.dioptraMagasin||'')}" placeholder="Ex. Magasin Libreville Centre" autocomplete="off"><span class="hint">Facultatif. Le nom exact du magasin dans DIOPTRA : ses factures pourront y être envoyées en réception de stock.</span></label>
  </fieldset>`,
  `${isNew?'':`<button class="btn danger" data-act="del" data-id="${c.id}" style="margin-right:auto">Supprimer le client</button>`}<button class="btn" data-act="close">Annuler</button><button class="btn primary" id="f-ok">${isNew?'Ajouter le client':'Enregistrer'}</button>`,()=>{
    const upd=()=>{
      const p=paysByCode($('#f-pays').value),dial=$('#f-dial');
      dial.textContent=p?'+'+p[2]:'Pays ?';dial.classList.toggle('none',!p);
      const t=fmtTel($('#f-pays').value,$('#f-tel').value);
      $('#f-telhint').textContent=t?'Sera affiché : '+t:(p?'':'Choisissez le pays pour obtenir l\'indicatif.');
    };
    const updReg=()=>{
      const pays=$('#f-pays').value,intra=$('#f-intra').value.trim().toUpperCase().replace(/\s/g,''),fr=$('#f-tva').checked;
      const reg=regimeOf({pays,tvaIntra:intra,tvaFR:fr}),inUE=UE.includes(pays)&&pays!=='FR';
      let h='';
      if(inUE&&!intra)h='Client dans l\'UE : indiquez son numéro de TVA intracommunautaire pour vendre hors taxes.';
      else if(intra&&!inUE)h='Ce numéro ne sert que pour un client situé dans un autre pays de l\'UE.';
      else if(intra&&!intra.startsWith(prefixTVA(pays)))h=`Le numéro devrait commencer par ${prefixTVA(pays)}.`;
      $('#f-intrahint').textContent=h;
      let w='';
      if(!fr&&(pays==='FR'||pays==='MC'))w='Un client situé en France est normalement soumis à la TVA française.';
      else if(!fr&&inUE&&!intra)w='Sans numéro de TVA intracommunautaire, la TVA française doit en principe être facturée.';
      $('#f-reg').className='regime full'+(reg==='fr'?' fr':'')+(w?' warn':'');
      $('#f-reg').innerHTML=`Régime appliqué : ${REGIME[reg]}${w?`<span>${w}</span>`:''}`;
    };
    $('#f-pays').addEventListener('change',()=>{upd();updReg()});$('#f-tel').addEventListener('input',upd);upd();
    $('#f-intra').addEventListener('input',updReg);$('#f-tva').addEventListener('change',updReg);updReg();
    $('#f-nom').focus();
    $('#f-ok').onclick=async()=>{
      const d={nom:$('#f-nom').value.trim(),contact:$('#f-contact').value.trim(),pays:$('#f-pays').value,ville:$('#f-ville').value.trim(),
        tel:$('#f-tel').value.replace(/^\s*\+\s*/,'').trim(),email:$('#f-email').value.trim(),adresse:$('#f-adresse').value.trim(),
        nif:$('#f-nif').value.trim(),rccm:$('#f-rccm').value.trim(),
        tvaFR:$('#f-tva').checked,tvaIntra:$('#f-intra').value.trim().toUpperCase().replace(/\s/g,''),remise:Math.min(100,Math.max(0,+$('#f-remise').value||0)),plafond:Math.max(0,r2(+$('#f-plafond').value||0)),dioptraMagasin:$('#f-dioptra').value.trim()};
      if(!d.nom){toast('Indiquez la raison sociale du client.');$('#f-nom').focus();return}
      if(d.email&&!/^\S+@\S+\.\S+$/.test(d.email)){toast('L\'adresse e-mail n\'est pas valide.');$('#f-email').focus();return}
      const p=paysByCode(d.pays);
      if(p&&d.tel.replace(/\D/g,'').startsWith(p[2])&&/^\s*\+/.test($('#f-tel').value))d.tel=d.tel.replace(/\D/g,'').slice(p[2].length);
      if(S.clients.some(x=>x.nom.toLowerCase()===d.nom.toLowerCase()&&x.id!==c.id)){toast('Un client porte déjà ce nom.');$('#f-nom').focus();return}
      if(isNew){let num;try{num=await alloc('C',S.seq||0)}catch(x){toast('Connexion perdue : le client n\'a pas été créé.');return}S.seq=Math.max(S.seq||0,num);const n={id:'c'+Date.now().toString(36),num,cree:new Date().toISOString(),...d};S.clients.push(n);save();closeModal();render();toast('Client '+codeOf(n)+' ajouté')}
      else{Object.assign(cli(c.id),d);save();closeModal();render();toast('Fiche mise à jour')}
    };
  });
}
const ICO_SALE='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="10" width="18" height="10.5" rx="2"/><path d="M6 10V4.5h8V10M14 6.5h4V10"/><path d="M7 14h2M11 14h2M15 14h2M7 17h10"/></svg>';
const ICO_QUOTE='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2.8H6.5a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8.3Z"/><path d="M14 2.8v5.5h5.5M8.5 13h7M8.5 16.5h5"/></svg>';
function docList(list,empty){
  if(!list.length)return`<p class="muted">${empty}</p>`;
  return`<div class="docs">${[...list].sort((a,b)=>b.date.localeCompare(a.date)).map(d=>`<button class="doc-row" data-act="showdoc" data-id="${d.id}"><span><b class="mono">${d.num}</b><span class="sub">${dF.format(new Date(d.date))}${d.kind==='devis'?' · valable jusqu\'au '+dF.format(new Date(d.validite)):' · '+(d.facture||'')}</span></span><span class="num"><b>${money(d.ttc)}</b><span class="sub">${d.kind==='vente'?STATUT[statutOf(d)][0]+(resteOf(d)>0.005&&paidOf(d)>0?' · reste '+money(resteOf(d)):''):d.lignes.reduce((t,l)=>t+l.qte,0)+' monture'+(d.lignes.reduce((t,l)=>t+l.qte,0)>1?'s':'')}</span></span></button>`).join('')}</div>`;
}
function viewClient(id){
  const c=cli(id);
  if(!c)return`<a class="back" href="#clients">← Clients</a><div class="table-wrap"><div class="empty-state"><h3>Client introuvable</h3><p>Ce client a peut-être été supprimé.</p><a class="btn primary" href="#clients">Retour à la liste</a></div></div>`;
  const p=paysByCode(c.pays),reg=regimeOf(c),enc=encoursOf(c.id),over=c.plafond>0&&enc>c.plafond;
  const fact=(l,v,cls)=>v?`<div class="fact ${cls||''}"><span>${l}</span><b>${v}</b></div>`:'';
  return`<a class="back" href="#clients">← Clients</a>
  <section class="client-card">
    <div class="cc-top"><div><span class="code">${codeOf(c)}</span><h1>${esc(c.nom)}</h1>
      <div class="cc-tags"><span class="tag" style="margin:0">${reg==='fr'?'TVA française 20 %':reg==='ue'?'UE · '+esc(c.tvaIntra):'Export hors taxes'}</span>${over?'<span class="tag bad" style="margin:0">Plafond de crédit dépassé</span>':''}</div></div>
      <button class="btn" data-act="edit" data-id="${id}">Modifier la fiche</button></div>
    <div class="facts">
      ${fact('Contact',esc(c.contact))}
      ${fact('Téléphone',c.tel?`<span class="mono">${esc(fmtTel(c.pays,c.tel))}</span>`:'')}
      ${fact('E-mail',esc(c.email))}
      ${fact('Ville',[esc(c.ville),p?esc(p[1]):''].filter(Boolean).join(', '))}
      ${fact('Remise',c.remise?nf.format(c.remise)+' %':'')}${c.dioptraMagasin?fact('Magasin DIOPTRA',esc(c.dioptraMagasin)):''}
      ${fact('Encours',enc>0.005?money(enc)+(c.plafond>0?` <small>/ ${money(c.plafond)}</small>`:''):'Aucun',over?'bad':'')}
    </div>
  </section>
  <div class="actions-big">
    <button class="act-card primary" data-act="sale" data-id="${id}"><span class="act-ico">${ICO_SALE}</span><span><b>Nouvelle vente</b><span>Vendre des montures à ce client</span></span></button>
    <button class="act-card" data-act="quote" data-id="${id}"><span class="act-ico">${ICO_QUOTE}</span><span><b>Nouveau devis</b><span>Préparer une proposition chiffrée</span></span></button>
  </div>
  <p class="note" id="note" role="status"></p>
  ${ventesParMois(id)}
  ${S.devis.some(v=>v.clientId===id)?`<section class="panel"><h3>Devis</h3>${docList(S.devis.filter(v=>v.clientId===id),'')}</section>`:''}`;
}
function ventesParMois(id){
  const vs=S.ventes.filter(v=>v.clientId===id).sort((a,b)=>b.date.localeCompare(a.date));
  if(!vs.length)return`<section class="panel"><h3>Ventes par mois</h3><p class="muted">Aucune vente pour ce client.</p></section>`;
  const groups=[];vs.forEach(v=>{const k=v.date.slice(0,7);let g=groups.find(x=>x.k===k);if(!g){g={k,list:[]};groups.push(g)}g.list.push(v)});
  const mf=new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'});
  const tot=vs.reduce((t,v)=>t+v.ht,0);
  return`<section class="panel"><div class="row-between"><h3 style="margin:0">Ventes par mois</h3><span class="muted">${vs.length} vente${vs.length>1?'s':''} · ${money(tot)} HT au total</span></div>
  ${groups.map(g=>{const ht=g.list.reduce((t,v)=>t+v.ht,0),nb=g.list.reduce((t,v)=>t+v.lignes.reduce((a,l)=>a+l.qte,0),0),rest=g.list.reduce((t,v)=>t+resteOf(v),0);
    const lab=mf.format(new Date(g.k+'-15'));
    return`<div class="month"><div class="month-head"><b>${lab.charAt(0).toUpperCase()+lab.slice(1)}</b><span>${g.list.length} vente${g.list.length>1?'s':''} · ${nb} monture${nb>1?'s':''} · <b>${money(ht)} HT</b>${rest>0.005?` · <span class="down">reste ${money(rest)}</span>`:''}</span></div>
    <div class="table-wrap"><table><thead><tr><th>Facture</th><th>Date</th><th class="num">Montures</th><th class="num">Total HT</th><th class="num">Total TTC</th><th>Statut</th><th>Expédition</th></tr></thead><tbody>
    ${g.list.map(v=>`<tr class="row-link" data-vid="${v.id}" tabindex="0"><td class="mono">${v.facture||v.num}</td><td>${dF.format(new Date(v.date))}</td><td class="num">${v.lignes.reduce((a,l)=>a+l.qte,0)}</td><td class="num">${money(v.ht)}</td><td class="num"><b>${money(v.ttc)}</b></td><td>${statutPill(v)}</td><td>${expPill(v)||'<span class="sub-cell">—</span>'}</td></tr>`).join('')}
    </tbody></table></div></div>`}).join('')}
  </section>`;
}

/* ---------- Vente et devis ---------- */
let doc=null;
const ICO_SCAN='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M17 3h2.5A1.5 1.5 0 0 1 21 4.5V7M21 17v2.5a1.5 1.5 0 0 1-1.5 1.5H17M7 21H4.5A1.5 1.5 0 0 1 3 19.5V17"/><path d="M7 8v8M10 8v8M13.5 8v8M17 8v8"/></svg>';
function startDoc(kind,clientId){
  if(doc&&doc.kind===kind&&doc.clientId===clientId)return;
  const c=cli(clientId);const v=new Date();v.setDate(v.getDate()+30);
  doc={kind,clientId,lignes:[],remise:c?c.remise||0:0,regime:regimeOf(c),tvaIntra:c?c.tvaIntra||'':'',paiement:PAY_LATER,validite:v.toISOString().slice(0,10)};
}
function viewDoc(kind,clientId){
  const c=cli(clientId);
  if(!c)return`<a class="back" href="#clients">← Clients</a><div class="table-wrap"><div class="empty-state"><h3>Client introuvable</h3><a class="btn primary" href="#clients">Retour à la liste</a></div></div>`;
  startDoc(kind,clientId);
  const demo=S.montures.filter(m=>m.demo);
  return`<a class="back" href="#client-${c.id}">← ${esc(c.nom)}</a>
  <div class="head"><div><span class="code">${codeOf(c)} · ${esc(c.nom)}</span><h1>${kind==='vente'?'Nouvelle vente':'Nouveau devis'}</h1></div></div>
  <div class="doc-grid"><div class="doc-main">
    <section class="panel scan"><label for="scan">Scannez le code-barres ou saisissez le code étiquette</label>
      <div class="scan-row"><span class="scan-ico">${ICO_SCAN}</span><input id="scan" autocomplete="off" spellcheck="false" placeholder="Code-barres ou code étiquette, puis Entrée"><button class="btn primary" data-act="scan-add">Ajouter</button></div>
      <p class="scan-msg" id="scan-msg" role="status"></p>
      ${demo.length?`<p class="hint" style="margin:0">Montures d'exemple pour essayer : ${demo.map(m=>`<span class="mono">${m.etiquette}</span>`).join(', ')}. Elles seront remplacées par votre stock.</p>`:''}
    </section>
    <div class="table-wrap"><table><thead><tr><th>Monture</th><th>Quantité</th><th class="num">PU HT</th><th>Remise</th><th class="num">Montant HT</th><th></th></tr></thead><tbody id="doc-lines"></tbody></table></div>
  </div><aside class="panel doc-side" id="doc-side"></aside></div>`;
}
function drawDoc(){
  const body=$('#doc-lines');if(!body||!doc)return;
  body.innerHTML=doc.lignes.length?doc.lignes.map(l=>{const m=mon(l.montureId);const over=doc.kind==='vente'&&m&&l.qte>m.qte;return`<tr>
    <td><div class="with-thumb">${thumb(m,'sm')}<div><b>${esc(l.designation)}</b><span class="sub"><span class="mono">${esc(m?m.etiquette:l.etiquette)}</span> · ${esc(l.detail)}${over?` · <span class="warn-txt">${m.qte} en stock</span>`:''}</span></div></div></td>
    <td><div class="qty"><button data-act="dq-" data-id="${l.montureId}" aria-label="Diminuer">−</button><input id="dq-${l.montureId}" type="number" min="1" data-dq="${l.montureId}" value="${l.qte}" aria-label="Quantité"><button data-act="dq+" data-id="${l.montureId}" aria-label="Augmenter">+</button></div></td>
    <td class="num">${remL(l)?`<s class="muted">${money(l.pu)}</s><br>${money(puNet(l))}`:money(l.pu)}</td>
    <td><span class="rem-box"><input type="number" min="0" ${isE(l.remT)?`max="${l.pu}" step="0.01"`:'max="100" step="0.5"'} data-drem="${l.montureId}" value="${remL(l)||''}" placeholder="0" aria-label="Remise sur ${esc(l.designation)} ${isE(l.remT)?'en euros par monture':'en pourcentage'}"><button type="button" class="unit-tg" data-act="drem-u" data-id="${l.montureId}" title="Passer la remise ${isE(l.remT)?'en %':'en € par monture'}" aria-label="Unité de la remise : ${isE(l.remT)?'euros, passer en pourcentage':'pourcentage, passer en euros'}">${isE(l.remT)?'€':'%'}</button></span></td>
    <td class="num"><b>${money(lineHT(l))}</b></td>
    <td><button class="icon-btn" data-act="drm" data-id="${l.montureId}" aria-label="Retirer la ligne">×</button></td></tr>`}).join('')
    :`<tr><td colspan="6"><div class="empty-state" style="padding:36px 12px"><p>Scannez une monture pour l'ajouter.</p></div></td></tr>`;
  const t=totals(doc.lignes,doc.remise,doc.regime,doc.remiseT),nb=doc.lignes.reduce((a,l)=>a+l.qte,0);
  $('#doc-side').innerHTML=`<h3>${doc.kind==='vente'?'Récapitulatif de la vente':'Récapitulatif du devis'}</h3>
  <div class="side-fields">
    <label>Remise client${isE(doc.remiseT)?' (montant HT)':''}<span class="rem-box wide"><input id="d-rem" type="number" min="0" ${isE(doc.remiseT)?'step="0.01"':'max="100" step="0.5"'} value="${doc.remise||''}" placeholder="0"><button type="button" class="unit-tg" data-act="d-rem-u" title="Passer la remise client ${isE(doc.remiseT)?'en %':'en montant €'}" aria-label="Unité de la remise client : ${isE(doc.remiseT)?'euros, passer en pourcentage':'pourcentage, passer en euros'}">${isE(doc.remiseT)?'€':'%'}</button></span></label>
    ${doc.kind==='vente'?`<label>Règlement<select id="d-pay">${[PAY_LATER,...PAY_MODES].map(p=>`<option ${p===doc.paiement?'selected':''}>${p}</option>`).join('')}</select><span class="hint">${doc.paiement===PAY_LATER?'La facture apparaîtra dans les impayés jusqu\'à son règlement':'La vente sera enregistrée comme payée'}</span></label>${PAY_DETAIL[doc.paiement]?payDetailFields(doc.paiement,'d',{banque:doc.banque,ref:doc.ref}):''}`
      :`<label>Valable jusqu'au<input id="d-val" type="date" value="${doc.validite}"></label>`}
  </div>
  <div class="regime${doc.regime==='fr'?' fr':''}">${REGIME[doc.regime]}<span>Modifiable dans la fiche du client</span></div>
  ${(()=>{const c=cli(doc.clientId);if(doc.kind!=='vente'||!c||!(c.plafond>0)||doc.paiement!==PAY_LATER)return'';const e=encoursOf(c.id),apres=e+t.ttc;
    return apres>c.plafond?`<div class="regime warn">Plafond de crédit dépassé<span>Encours actuel ${money(e)} + cette vente ${money(t.ttc)} = ${money(apres)}, pour un plafond de ${money(c.plafond)}.</span></div>`:''})()}
  <dl class="totals"><dt>${nb} monture${nb>1?'s':''}</dt><dd>${money(t.brut)}</dd>${remTotals({...t,remise:doc.remise,remiseT:doc.remiseT},false)}
   ${taxLines(t,doc.regime,doc.tvaIntra)}</dl>
  <button class="btn primary block" data-act="doc-ok" ${doc.lignes.length?'':'disabled'}>${doc.kind==='vente'?'Valider la vente':'Enregistrer le devis'}</button>
  <button class="btn block ghost" data-act="doc-cancel">Annuler</button>`;
}
function scanMsg(txt,bad){const m=$('#scan-msg');if(m){m.textContent=txt;m.classList.toggle('bad',!!bad)}}
function scanAdd(){
  const inp=$('#scan');if(!inp)return;const code=inp.value.trim();
  if(!code){inp.focus();return}
  const m=findMonture(code);
  if(!m){scanMsg(`Aucune monture ne correspond au code « ${code} ». Vérifiez le code ou ajoutez la monture au stock.`,true);inp.select();return}
  const l=doc.lignes.find(x=>x.montureId===m.id);
  if(l)l.qte++;else doc.lignes.push({montureId:m.id,etiquette:m.etiquette,designation:desig(m),detail:[m.coloris,tailleOf(m)].filter(Boolean).join(' · '),qte:1,pu:m.pv});
  const q=(l?l.qte:1);
  scanMsg(`${desig(m)} ${m.coloris} ajoutée${q>1?' (×'+q+')':''}.`+(doc.kind==='vente'&&q>m.qte?` Attention : seulement ${m.qte} en stock.`:''),doc.kind==='vente'&&q>m.qte);
  inp.value='';drawDoc();inp.focus();
}
function setDq(id,v,rel){
  const l=doc.lignes.find(x=>x.montureId===id);if(!l)return;
  const q=rel?l.qte+v:v;
  if(q<=0)doc.lignes=doc.lignes.filter(x=>x!==l);else l.qte=q;
  drawDoc();
}
let docBusy=false;
async function validateDoc(){
  if(!doc||!doc.lignes.length||docBusy)return;
  if(doc.kind==='vente'){
    const lack=doc.lignes.filter(l=>{const m=mon(l.montureId);return!m||l.qte>m.qte});
    if(lack.length){toast('Stock insuffisant pour : '+lack.map(l=>l.etiquette).join(', '));return}
  }
  const t=totals(doc.lignes,doc.remise,doc.regime,doc.remiseT),y=new Date().getFullYear();
  let nums;docBusy=true;
  try{nums=doc.kind==='vente'?[await alloc('V',S.seqV||0),await alloc('FA',S.seqFA||0)]:[await alloc('D',S.seqD||0)]}
  catch(x){toast('Connexion perdue : rien n\'a été enregistré, réessayez.');return}finally{docBusy=false}
  const base={id:doc.kind[0]+Date.now().toString(36),kind:doc.kind,date:new Date().toISOString(),clientId:doc.clientId,lignes:doc.lignes.map(l=>({...l,pa:l.pa!=null?l.pa:((mon(l.montureId)||{}).pa||0)})),remise:+doc.remise||0,...(isE(doc.remiseT)?{remiseT:'€'}:{}),regime:doc.regime,tvaIntra:doc.regime==='ue'?doc.tvaIntra:'',...t};
  if(doc.kind==='vente'){
    S.seqV=Math.max(S.seqV||0,nums[0]);S.seqFA=Math.max(S.seqFA||0,nums[1]);const v={...base,num:'V'+y+'-'+pad4(nums[0]),facture:'FA'+y+'-'+pad4(nums[1]),paiement:doc.paiement};
    v.lignes.forEach(l=>{mon(l.montureId).qte-=l.qte});factureFor(v);v.regMig=true;S.ventes.push(v);
    if(doc.paiement!==PAY_LATER)S.reglements.push({id:'g'+Date.now().toString(36),venteId:v.id,clientId:v.clientId,date:v.date,montant:v.ttc,mode:doc.paiement,banque:PAY_DETAIL[doc.paiement]?(doc.banque||''):'',ref:PAY_DETAIL[doc.paiement]?(doc.ref||''):''});
  }else{
    S.seqD=Math.max(S.seqD||0,nums[0]);S.devis.push({...base,num:'D'+y+'-'+pad4(nums[0]),validite:doc.validite||base.date.slice(0,10)});
  }
  const kind=doc.kind,cid=doc.clientId,num=kind==='vente'?S.ventes[S.ventes.length-1].num:S.devis[S.devis.length-1].num;
  save();doc=null;location.hash='client-'+cid;toast((kind==='vente'?'Vente ':'Devis ')+num+' enregistré'+(kind==='vente'?'e':''));
}
function showDoc(id){
  if(S.ventes.some(x=>x.id===id)){venteDetail(id);return}
  const d=S.ventes.find(x=>x.id===id)||S.devis.find(x=>x.id===id);if(!d)return;
  const c=cli(d.clientId);
  openModal((d.kind==='vente'?'Vente ':'Devis ')+d.num,(c?c.nom:'')+' · '+dF.format(new Date(d.date)),
  `<div class="table-wrap"><table><thead><tr><th>Monture</th><th class="num">Qté</th><th class="num">PU HT</th><th class="num">Montant HT</th></tr></thead><tbody>
  ${d.lignes.map(l=>`<tr><td><b>${esc(l.designation)}</b><span class="sub"><span class="mono">${esc(l.etiquette)}</span> · ${esc(l.detail)}</span></td><td class="num">${l.qte}</td><td class="num">${puCell(l)}</td><td class="num">${money(lineHT(l))}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="doc-foot"><span class="muted">${d.kind==='vente'?'Paiement : '+esc(d.paiement):'Valable jusqu\'au '+dF.format(new Date(d.validite))}</span>
  <dl class="totals" style="min-width:250px">${remTotals(d)}${taxLines(d,regOf(d),d.tvaIntra)}</dl></div>`,
  `<button class="btn primary" data-act="close">Fermer</button>`);
}

/* ---------- Stock ---------- */
S.catalogue=S.catalogue||[];S.receptions=S.receptions||[];S.seqR=S.seqR||0;S.coefs=S.coefs||{};
/* ---------- Photos des montures ----------
   S.photos : photos rattachées à un code EAN (pack photos du fournisseur), valables aussi pour les futures fiches.
   m.photo : photo propre à la monture (prise à la réception) ; null = photo retirée volontairement. */
S.photos=S.photos||[];
const photoByEAN=()=>{const x=new Map();S.photos.forEach(p=>x.set(normEAN(p.ean),p.file));return x};
let photoIdx=null,photoIdxN=-1;
function photoOf(m){
  if(!m)return'';if(m.photo===null)return'';if(m.photo)return m.photo;
  if(photoIdxN!==S.photos.length||!photoIdx){photoIdx=photoByEAN();photoIdxN=S.photos.length}
  return m.ean?photoIdx.get(normEAN(m.ean))||'':'';
}
const ICO_FRAME='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="6.5" cy="13" r="3.8"/><circle cx="17.5" cy="13" r="3.8"/><path d="M10.3 12.4c1-.8 2.4-.8 3.4 0M2.7 12.2 1.5 9.5M21.3 12.2l1.2-2.7"/></svg>';
const thumb=(m,cls='')=>{const f=photoOf(m);return f?`<img class="thumb ${cls}" src="/api/files/${esc(f)}" alt="" loading="lazy" decoding="async" data-zoom="${esc(m.id)}" title="Agrandir la photo">`:`<span class="thumb empty ${cls}" aria-hidden="true">${ICO_FRAME}</span>`};
/* Réduction avant envoi : 900 px de large au plus, JPEG ~80 % (≈ 50 à 90 Ko par photo) */
async function shrinkImage(blob){
  let bmp;try{bmp=await createImageBitmap(blob)}catch(e){return null}
  const k=Math.min(1,900/Math.max(bmp.width,bmp.height)),w=Math.round(bmp.width*k),h=Math.round(bmp.height*k);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(bmp,0,0,w,h);bmp.close&&bmp.close();
  return await new Promise(ok=>cv.toBlob(ok,'image/jpeg',0.82));
}
async function uploadPhoto(blob,name){
  const small=await shrinkImage(blob);if(!small)throw new Error('image');
  const r=await fetch('/api/files',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'image/jpeg','X-Filename':encodeURIComponent(name||'photo.jpg')},body:small});
  if(!r.ok)throw new Error('upload');return(await r.json()).id;
}
const dropFile=id=>{if(id)fetch('/api/files/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'}).catch(()=>{})};
function photoView(m){const f=photoOf(m);if(!f)return;openModal(desig(m),[m.coloris,m.etiquette].filter(Boolean).join(' · '),`<img class="photo-big" src="/api/files/${esc(f)}" alt="${esc(desig(m)+' '+(m.coloris||''))}">`,`<button class="btn primary" data-act="close">Fermer</button>`);$('.modal-card').classList.add('wide')}

/* Coefficient par marque : prix de vente HT = prix d'achat HT × coefficient (sauf prix fixé à la main) */
S.marques=S.marques||[];S.fournisseurs=S.fournisseurs||[];S.seqF=S.seqF||0;
const marqueOfName=nom=>S.marques.find(b=>b.nom.toLowerCase()===String(nom||'').trim().toLowerCase());
function ensureMarque(nom){
  nom=String(nom||'').trim();if(!nom)return null;
  let b=S.marques.find(x=>x.nom.toLowerCase()===nom.toLowerCase());
  if(!b){b={id:'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),nom,fournisseurId:'',coef:+(S.coefs||{})[nom]>0?+(S.coefs||{})[nom]:0};S.marques.push(b)}
  return b;
}
function ensureFournisseur(nom){
  nom=String(nom||'').trim();let f=S.fournisseurs.find(x=>x.nom.toLowerCase()===nom.toLowerCase());
  if(!f){S.seqF++;f={id:'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),num:S.seqF,nom,pays:''};S.fournisseurs.push(f)}
  return f;
}
const coefOf=nom=>{const b=S.marques.find(x=>x.nom.toLowerCase()===String(nom||'').trim().toLowerCase());return b&&+b.coef>0?+b.coef:0};
/* Prix calculé arrondi au centime */
const pvFrom=(pa,c)=>Math.round(Math.round((pa||0)*c*10000)/100)/100;
function applyCoef(m){const c=coefOf(m.marque);if(c&&!m.pvManuel&&m.pa>0)m.pv=pvFrom(m.pa,c);return m}
const fmtCoef=c=>String(c).replace('.',',');
S.seqM=S.seqM||S.montures.reduce((mx,m)=>Math.max(mx,+(m.etiquette.match(/\d+$/)||[0])[0]),0);
S.montures.forEach(m=>{
  if(m.calibre==null&&m.taille){const x=String(m.taille).match(/(\d+)\D+(\d+)\D+(\d+)/);if(x){m.calibre=x[1];m.pont=x[2];m.branche=x[3]}}
  if(m.pa==null)m.pa=Math.round(m.pv*55)/100;
  if(m.seuil==null)m.seuil=2;
});
[...S.montures.map(m=>m.marque),...S.catalogue.map(c=>c.marque),...Object.keys(S.coefs||{})].forEach(ensureMarque);delete S.coefs;
S.montures.forEach(m=>{const b=marqueOfName(m.marque);if(b)m.marque=b.nom});
S.receptions.forEach(r=>{if(!r.fournisseurId&&r.fournisseur)r.fournisseurId=ensureFournisseur(r.fournisseur).id});
S.montures.forEach(applyCoef);S.catalogue.forEach(c=>{const k=coefOf(c.marque);if(k&&c.pa)c.pv=pvFrom(c.pa,k)});
save();
let stockTab='montures',rec=null;
/* Code étiquette : 3 premières lettres de la marque + numéro sur 3 chiffres (OZE001, LUM014…).
   Le préfixe se règle dans la fiche de la marque ; chaque préfixe a son propre compteur (au-delà de 999 : OZE1000). */
const autoPrefix=n=>(String(n||'').normalize('NFD').replace(/[^A-Za-z]/g,'').toUpperCase()+'XXX').slice(0,3);
const cleanPrefix=v=>String(v||'').normalize('NFD').replace(/[^A-Za-z]/g,'').toUpperCase().slice(0,3);
const prefixOf=nom=>{const b=marqueOfName(nom);return(b&&b.prefixe)||autoPrefix(nom)};
async function nextEtiquette(marque){
  const P=prefixOf(marque),key='seqM_'+P,re=new RegExp('^'+P+'(\\d+)$');
  const floor=Math.max(S[key]||0,...S.montures.map(m=>{const x=String(m.etiquette).match(re);return x?+x[1]:0}));
  let e;do{const n=await alloc('M_'+P,floor);S[key]=Math.max(S[key]||0,n);e=P+String(n).padStart(3,'0')}while(S.montures.some(m=>m.etiquette===e));
  return e;
}
/* Anciennes montures au code tout chiffres (000012) : passage au nouveau format, à la demande */
const oldCodes=()=>S.montures.filter(m=>/^\d+$/.test(m.etiquette));
async function renumberOld(){
  const list=oldCodes().sort((a,b)=>+a.etiquette-+b.etiquette),map={};
  for(const m of list){const e=await nextEtiquette(m.marque);map[m.id]=e;m.etiquette=e}
  [...S.ventes,...S.devis,...S.receptions].forEach(d=>(d.lignes||[]).forEach(l=>{if(map[l.montureId])l.etiquette=map[l.montureId]}));
  save();return list.length;
}
const catByEAN=code=>{const k=normEAN(code);return k?S.catalogue.find(c=>normEAN(c.ean)===k):null};
const fmtEAN=e=>String(e||'');
function stockState(m){
  if(m.qte<=0)return`<span class="pill bad">${m.qte<0?m.qte:'Rupture'}</span>`;
  if(m.qte<=m.seuil)return`<span class="pill warn">${m.qte}</span>`;
  return`<span class="pill ok">${m.qte}</span>`;
}
const ICO_IMPORT='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17"/></svg>';

function viewStock(){
  const nb=S.montures.reduce((t,m)=>t+Math.max(0,m.qte),0),val=S.montures.reduce((t,m)=>t+Math.max(0,m.qte)*(m.pa||0),0);
  const alertes=S.montures.filter(m=>m.qte<=m.seuil).length;
  const brands=[...new Set([...S.montures.map(m=>m.marque),...S.catalogue.map(c=>c.marque)].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
  const tab=(k,l,n)=>`<button role="tab" aria-selected="${stockTab===k}" data-act="s-tab" data-k="${k}">${l}${n!=null?` <span class="tab-n">${n}</span>`:''}</button>`;
  const marques=[...new Set(S.montures.map(m=>m.marque))].sort((a,b)=>a.localeCompare(b,'fr'));
  let body='';
  if(stockTab==='montures')body=S.montures.length?`<div class="toolbar"><input id="qs" type="search" placeholder="Rechercher par étiquette, EAN, marque, modèle ou coloris" aria-label="Rechercher une monture">
    <select id="ff" aria-label="Fournisseur"><option value="">Tous les fournisseurs</option>${[...S.fournisseurs].sort((a,b)=>a.nom.localeCompare(b.nom,'fr')).map(f=>`<option value="${f.id}">${esc(f.nom)}</option>`).join('')}</select>
    <select id="fm" aria-label="Marque"><option value="">Toutes les marques</option>${marques.map(m=>`<option>${esc(m)}</option>`).join('')}</select>
    <select id="fa" aria-label="Niveau de stock"><option value="">Tous les niveaux</option><option value="1">En alerte ou en rupture</option></select></div>
    <div class="table-wrap"><table><thead><tr><th class="th-thumb"><span class="sr">Photo</span></th><th>Étiquette</th><th>Monture</th><th>Taille</th><th>EAN</th><th class="num">Prix d'achat HT</th><th class="num">Prix de vente HT</th><th class="num">Stock</th></tr></thead><tbody id="srows"></tbody></table></div><span class="count" id="scount"></span>`
    :`<div class="table-wrap"><div class="empty-state"><h3>Aucune monture en stock</h3><p>Importez le catalogue d'une marque, puis scannez les pochettes à la réception : les fiches se remplissent toutes seules.</p><div class="row-btns"><a class="btn" href="#catalogue">${ICO_IMPORT} Importer un catalogue</a><a class="btn primary" href="#entree">Entrée de stock</a></div></div></div>`;
  else if(stockTab==='marques')body=marquesTab();
  else if(stockTab==='fournisseurs')body=fournisseursTab();
  else if(stockTab==='receptions'){
    const rs=[...S.receptions].sort((a,b)=>b.date.localeCompare(a.date));
    body=`<div class="table-wrap"><table><thead><tr><th>N°</th><th>Date</th><th>Fournisseur</th><th>BL / facture</th><th class="num">Montures</th><th class="num">Montant HT</th></tr></thead><tbody>
    ${rs.length?rs.map(r=>`<tr class="row-link" data-rid="${r.id}" tabindex="0"><td class="mono">${r.num}</td><td>${dF.format(new Date(r.date))}</td><td>${esc(r.fournisseur)}</td><td class="mono">${esc(r.doc||'—')}</td><td class="num">${r.lignes.reduce((t,l)=>t+l.qte,0)}</td><td class="num">${money(r.total)}</td></tr>`).join('')
    :'<tr><td colspan="6"><div class="empty-state" style="padding:32px 12px"><p>Aucune entrée de stock enregistrée.</p></div></td></tr>'}</tbody></table></div>`;
  }
  return`<a class="back" href="#">← Accueil</a>
  <div class="head"><div><h1>Stock</h1><p>${nb} monture${nb>1?'s':''} en stock · ${money(val)} au prix d'achat${alertes?` · <span class="warn-txt">${alertes} en alerte</span>`:''}</p></div>
    <div class="row-btns"><a class="btn" href="#catalogue">${ICO_IMPORT} Importer un catalogue</a><button class="btn" data-act="s-new">Nouvelle monture</button><a class="btn primary" href="#entree">Entrée de stock</a></div></div>
  <div class="tabs" role="tablist">${tab('montures','Montures',S.montures.length)}${tab('receptions','Entrées de stock',S.receptions.length)}${tab('marques','Marques et coefficients',S.marques.length)}${tab('fournisseurs','Fournisseurs',S.fournisseurs.length)}</div>${body}`;
}
function fillStock(){
  const b=$('#srows');if(!b)return;
  const q=($('#qs')?.value||'').toLowerCase().trim(),fm=$('#fm')?.value||'',fa=$('#fa')?.value||'',ff=$('#ff')?.value||'',qe=normEAN(q);
  const list=S.montures.filter(m=>(!fm||m.marque===fm)&&(!ff||(marqueOfName(m.marque)||{}).fournisseurId===ff)&&(!fa||m.qte<=m.seuil)&&(!q||[m.etiquette,m.marque,m.modele,m.coloris].join(' ').toLowerCase().includes(q)||(qe.length>=4&&normEAN(m.ean).includes(qe))))
    .sort((a,b)=>(a.marque+a.modele+a.coloris).localeCompare(b.marque+b.modele+b.coloris,'fr'));
  b.innerHTML=list.length?list.map(m=>`<tr class="row-link" data-mid="${m.id}" tabindex="0"><td class="td-thumb">${thumb(m)}</td><td class="mono">${esc(m.etiquette)}</td><td><b>${esc(desig(m))}</b><span class="sub">${esc([m.coloris,m.matiere].filter(Boolean).join(' · '))}</span></td><td class="mono">${esc(tailleOf(m))}</td><td class="mono sub-cell">${esc(fmtEAN(m.ean))}</td><td class="num">${money(m.pa)}</td><td class="num">${money(m.pv)}</td><td class="num">${stockState(m)}</td></tr>`).join('')
    :'<tr><td colspan="8"><div class="empty-state" style="padding:32px 12px"><p>Aucune monture ne correspond.</p></div></td></tr>';
  $('#scount').textContent=`${list.length} référence${list.length>1?'s':''} sur ${S.montures.length}`;
}

/* Fiche monture (création, modification) */
function montureForm(m,onSaved){
  const isNew=!m||!m.id;m=m||{};
  const v=k=>esc(m[k]??'');
  const marques=S.marques.map(b=>b.nom).sort((a,b)=>a.localeCompare(b,'fr'));
  let ph={file:m.photo,changed:false};
  const phHtml=()=>{const f=ph.changed?ph.file:photoOf(m);const fromPack=!ph.changed&&!m.photo&&f;
    return`<div class="photo-box">${f?`<img src="/api/files/${esc(f)}" alt="Photo de la monture">`:`<span class="photo-empty">${ICO_FRAME}<span>Pas de photo</span></span>`}
    <div class="photo-acts"><label class="btn small" for="m-cam">${f?'Reprendre la photo':'Prendre une photo'}<input id="m-cam" type="file" accept="image/*" capture="environment" hidden></label>
    <label class="btn small ghost" for="m-pic">Choisir une image<input id="m-pic" type="file" accept="image/jpeg,image/png,image/webp" hidden></label>
    ${f?'<button type="button" class="link danger-link" id="m-phdel">Retirer la photo</button>':''}
    <span class="hint" id="m-phmsg">${fromPack?'Photo du pack fournisseur (liée au code EAN)':''}</span></div></div>`};
  openModal(isNew?'Nouvelle monture':desig(m),isNew?(m.ean?'Code-barres '+m.ean+' inconnu : complétez la fiche une seule fois':''):m.etiquette,`
  <div id="m-photo">${phHtml()}</div>
  <fieldset><legend>Identification</legend>
    <label>Code EAN (pochette)<input id="m-ean" value="${v('ean')}" inputmode="numeric" class="mono-in" spellcheck="false"></label>
    <label>Code étiquette<input id="m-etq" value="${isNew?'Attribué à l\'enregistrement':v('etiquette')}" disabled class="mono-in"></label>
    <label>Marque <span class="req">*</span><input id="m-marque" value="${v('marque')}" list="dl-marques"></label>
    <datalist id="dl-marques">${marques.map(x=>`<option value="${esc(x)}"></option>`).join('')}</datalist>
    <label>Modèle <span class="req">*</span><input id="m-modele" value="${v('modele')}"></label>
    <label>Coloris<input id="m-coloris" value="${v('coloris')}"></label>
    <label>Matière<select id="m-mat"><option value="">Non renseignée</option>${[...new Set([...MATIERES,...(m.matiere?[m.matiere]:[])])].map(x=>`<option ${x===m.matiere?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
  </fieldset>
  <fieldset class="three"><legend>Taille</legend>
    <label>Calibre<input id="m-cal" type="number" min="0" value="${v('calibre')}" placeholder="52"></label>
    <label>Pont<input id="m-pont" type="number" min="0" value="${v('pont')}" placeholder="18"></label>
    <label>Branche<input id="m-br" type="number" min="0" value="${v('branche')}" placeholder="140"></label>
  </fieldset>
  <fieldset class="three"><legend>Prix et stock</legend>
    <label>Prix d'achat HT<span class="suffix"><input id="m-pa" type="number" min="0" step="0.01" value="${m.pa??''}"><span>€</span></span></label>
    <label>Prix de vente HT<span class="suffix"><input id="m-pv" type="number" min="0" step="0.01" value="${m.pv??''}"><span>€</span></span><span class="hint" id="m-pvhint"></span></label>
    <label>Seuil d'alerte<input id="m-seuil" type="number" min="0" value="${m.seuil??2}"></label>
    <label class="check full" id="m-manwrap"><input type="checkbox" id="m-man" ${m.pvManuel?'checked':''}> Fixer le prix de vente à la main pour cette monture</label>
    ${isNew?'':`<label>Stock compté<input id="m-qte" type="number" value="${m.qte}"><span class="hint">Pour corriger après un inventaire</span></label>`}
  </fieldset>`,
  `${isNew?'':`<button class="btn danger" data-act="s-del" data-id="${m.id}" style="margin-right:auto">Supprimer</button>`}<button class="btn" data-act="close">Annuler</button><button class="btn primary" id="m-ok">${onSaved?'Enregistrer et ajouter':'Enregistrer'}</button>`,()=>{
    (isNew&&m.ean?$('#m-marque'):$('#m-ean')).focus();
    const bindPh=()=>{
      const pick=async inp=>{const f=inp.files[0];if(!f)return;$('#m-phmsg').textContent='Envoi de la photo…';
        try{const id=await uploadPhoto(f,(m.etiquette||'monture')+'.jpg');if(ph.changed&&ph.file&&ph.file!==m.photo)dropFile(ph.file);ph={file:id,changed:true};$('#m-photo').innerHTML=phHtml();bindPh()}
        catch(e){$('#m-phmsg').textContent='La photo n\'a pas pu être envoyée. Vérifiez la connexion et réessayez.'}};
      $('#m-cam').onchange=e=>pick(e.target);$('#m-pic').onchange=e=>pick(e.target);
      const del=$('#m-phdel');if(del)del.onclick=()=>{if(ph.changed&&ph.file&&ph.file!==m.photo)dropFile(ph.file);ph={file:null,changed:true};$('#m-photo').innerHTML=phHtml();bindPh()};
      const im=$('#m-photo img');if(im)im.onclick=()=>window.open(im.src,'_blank');
    };bindPh();
    const syncPv=()=>{
      const c=coefOf($('#m-marque').value.trim()),man=$('#m-man').checked,pa=+$('#m-pa').value||0,pv=$('#m-pv');
      $('#m-manwrap').hidden=!c;
      if(c&&!man){pv.value=pa?pvFrom(pa,c).toFixed(2):'';pv.disabled=true;$('#m-pvhint').textContent=`Calculé : prix d'achat × ${fmtCoef(c)}, arrondi au centime`}
      else{pv.disabled=false;$('#m-pvhint').textContent=c?'Prix fixé à la main, le coefficient est ignoré':'Aucun coefficient défini pour cette marque'}
    };
    ['m-marque','m-pa'].forEach(i=>$('#'+i).addEventListener('input',syncPv));$('#m-man').addEventListener('change',syncPv);syncPv();
    $('#m-ok').onclick=async()=>{
      const d={ean:$('#m-ean').value.trim(),marque:$('#m-marque').value.trim(),modele:$('#m-modele').value.trim(),coloris:$('#m-coloris').value.trim(),matiere:$('#m-mat').value,
        calibre:$('#m-cal').value.trim(),pont:$('#m-pont').value.trim(),branche:$('#m-br').value.trim(),
        pa:r2(+$('#m-pa').value||0),pv:r2(+$('#m-pv').value||0),pvManuel:!!(coefOf($('#m-marque').value.trim())&&$('#m-man').checked),seuil:Math.max(0,Math.round(+$('#m-seuil').value||0))};
      if(!d.marque||!d.modele){toast('La marque et le modèle sont obligatoires.');return}
      if(d.ean&&S.montures.some(x=>x.id!==m.id&&normEAN(x.ean)===normEAN(d.ean))){toast('Ce code EAN est déjà attribué à une autre monture.');return}
      let res;
      if(isNew){let etq;try{etq=await nextEtiquette(d.marque)}catch(x){toast('Connexion perdue : la monture n\'a pas été créée.');return}res={id:'m'+Date.now().toString(36),etiquette:etq,qte:0,...d};S.montures.push(res)}
      else{res=mon(m.id);Object.assign(res,d);res.demo=false;const q=$('#m-qte');if(q)res.qte=Math.round(+q.value||0)}
      if(ph.changed){if(res.photo&&res.photo!==ph.file)dropFile(res.photo);if(ph.file)res.photo=ph.file;else res.photo=null}
      res.marque=ensureMarque(res.marque).nom;applyCoef(res);delete res.taille;save();closeModal();
      if(onSaved)onSaved(res);else{render();toast(isNew?`Monture ${res.etiquette} créée`:'Fiche mise à jour')}
    };
  });
}
async function montureFromCatalogue(c){
  const m={id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),etiquette:await nextEtiquette(c.marque),ean:c.ean,marque:ensureMarque(c.marque).nom,modele:c.modele,coloris:c.coloris||'',matiere:c.matiere||'',
    calibre:c.calibre||'',pont:c.pont||'',branche:c.branche||'',pa:c.pa||0,pv:c.pv||0,seuil:2,qte:0};
  applyCoef(m);S.montures.push(m);save();return m;
}

/* Entrée de stock */
function viewEntree(){
  if(!rec)rec={fournisseurId:'',doc:'',date:new Date().toISOString().slice(0,10),lignes:[]};
  const bs=rec.fournisseurId?marquesOfFour(rec.fournisseurId):[];
  return`<a class="back" href="#stock">← Stock</a>
  <div class="head"><div><h1>Entrée de stock</h1><p>Scannez chaque pochette reçue. Les quantités s'additionnent à chaque scan.</p></div></div>
  <div class="doc-grid"><div class="doc-main">
    <section class="panel"><div class="form-row">
      <label>Fournisseur <span class="req">*</span><select id="r-four">${fourOptions(rec.fournisseurId,true)}</select>${rec.fournisseurId?`<span class="hint">${bs.length?'Marques : '+bs.map(b=>esc(b.nom)).join(', '):'Aucune marque rattachée'}</span>`:''}</label>
      <label>N° BL ou facture<input id="r-doc" value="${esc(rec.doc)}"></label>
      <label>Date de réception<input id="r-date" type="date" value="${rec.date}"></label></div></section>
    <section class="panel scan"><label for="rscan">Scannez le code-barres de la pochette ou saisissez le code étiquette</label>
      <div class="scan-row"><span class="scan-ico">${ICO_SCAN}</span><input id="rscan" autocomplete="off" spellcheck="false" placeholder="Code-barres EAN ou code étiquette, puis Entrée"><button class="btn primary" data-act="r-add">Ajouter</button></div>
      <p class="scan-msg" id="rscan-msg" role="status"></p>
      <p class="hint" style="margin:0">${S.catalogue.length?`${S.catalogue.length} références de catalogue disponibles pour remplir les fiches automatiquement.`:`Aucun catalogue importé : les codes inconnus ouvriront une fiche à compléter. <a href="#catalogue">Importer un catalogue</a>`}</p>
    </section>
    <div class="table-wrap"><table><thead><tr><th>Étiquette</th><th>Monture</th><th>Quantité</th><th class="num">Prix d'achat HT</th><th class="num">Montant HT</th><th></th></tr></thead><tbody id="r-lines"></tbody></table></div>
  </div><aside class="panel doc-side" id="r-side"></aside></div>`;
}
function drawRec(){
  const b=$('#r-lines');if(!b||!rec)return;
  b.innerHTML=rec.lignes.length?rec.lignes.map(l=>{const m=mon(l.montureId);if(!m)return'';return`<tr>
    <td class="mono">${esc(m.etiquette)}${l.nouvelle?'<span class="sub"><span class="tag" style="margin:0">Nouvelle fiche</span></span>':''}</td>
    <td><div class="with-thumb">${thumb(m,'sm')}<div><b>${esc(desig(m))}</b><span class="sub">${esc([m.coloris,tailleOf(m)].filter(Boolean).join(' · '))}${m.ean?' · EAN '+esc(m.ean):''}</span></div></div></td>
    <td><div class="qty"><button data-act="rq-" data-id="${m.id}" aria-label="Diminuer">−</button><input id="rq-${m.id}" type="number" min="1" data-rq="${m.id}" value="${l.qte}" aria-label="Quantité"><button data-act="rq+" data-id="${m.id}" aria-label="Augmenter">+</button></div></td>
    <td class="num"><span class="suffix inline"><input id="rp-${m.id}" type="number" min="0" step="0.01" data-rp="${m.id}" value="${l.pa}" aria-label="Prix d'achat"><span>€</span></span></td>
    <td class="num"><b>${money(l.qte*l.pa)}</b></td>
    <td><button class="icon-btn" data-act="r-rm" data-id="${m.id}" aria-label="Retirer la ligne">×</button></td></tr>`}).join('')
  :'<tr><td colspan="6"><div class="empty-state" style="padding:36px 12px"><p>Scannez la première pochette pour commencer.</p></div></td></tr>';
  const nb=rec.lignes.reduce((t,l)=>t+l.qte,0),tot=rec.lignes.reduce((t,l)=>t+l.qte*l.pa,0),nv=rec.lignes.filter(l=>l.nouvelle).length;
  $('#r-side').innerHTML=`<h3>Récapitulatif</h3>
  <dl class="totals"><dt>Références</dt><dd>${rec.lignes.length}</dd><dt>Montures reçues</dt><dd>${nb}</dd>${nv?`<dt>Nouvelles fiches</dt><dd>${nv}</dd>`:''}<dt class="big">Total HT</dt><dd class="big">${money(tot)}</dd></dl>
  <p class="hint" style="margin:0">À la validation, le stock augmente, le prix d'achat est recalculé au prix moyen pondéré et le prix de vente suit le coefficient de la marque.</p>
  <button class="btn primary block" data-act="r-ok" ${rec.lignes.length?'':'disabled'}>Valider l'entrée de stock</button>
  <button class="btn block ghost" data-act="r-cancel">Annuler</button>`;
}
function rMsg(t,bad){const m=$('#rscan-msg');if(m){m.textContent=t;m.classList.toggle('bad',!!bad)}}
function recAdd(m,nouvelle,from){
  const l=rec.lignes.find(x=>x.montureId===m.id);
  if(l)l.qte++;else rec.lignes.unshift({montureId:m.id,qte:1,pa:m.pa||0,nouvelle:!!nouvelle});
  const q=l?l.qte:1;
  const b=marqueOfName(m.marque),autre=rec.fournisseurId&&b&&b.fournisseurId&&b.fournisseurId!==rec.fournisseurId?fourOf(b.fournisseurId):null;
  rMsg(`${desig(m)}${m.coloris?' '+m.coloris:''} : ${q} reçue${q>1?'s':''}.${from?' Fiche remplie depuis le catalogue '+from+'.':''}${autre?` Attention : la marque ${b.nom} est rattachée à ${autre.nom}.`:''}`,!!autre);
  drawRec();const i=$('#rscan');if(i){i.value='';i.focus()}
}
async function recScan(){
  const inp=$('#rscan');if(!inp)return;const code=inp.value.trim();if(!code){inp.focus();return}
  const m=findMonture(code);
  if(m){recAdd(m,false);return}
  const c=catByEAN(code);
  if(c){inp.value='';try{recAdd(await montureFromCatalogue(c),true,c.marque)}catch(x){rMsg('Connexion perdue : réessayez de scanner cette pochette.',true)}return}
  if(/^\d{8,14}$/.test(code.replace(/\s/g,''))){
    rMsg(`Code ${code} inconnu : complétez la fiche, elle sera retrouvée automatiquement au prochain scan.`,true);
    montureForm({ean:code.replace(/\s/g,'')},nm=>{location.hash==='#entree'||(location.hash='entree');recAdd(nm,true)});
    return;
  }
  rMsg(`Aucune monture ne correspond au code « ${code} ».`,true);inp.select();
}
async function validateRec(){
  if(!rec||!rec.lignes.length)return;
  rec.doc=$('#r-doc').value.trim();rec.date=$('#r-date').value||rec.date;
  const four=fourOf(rec.fournisseurId);
  if(!four){toast('Choisissez le fournisseur.');$('#r-four').focus();return}
  const lignes=rec.lignes.filter(l=>l.qte>0&&mon(l.montureId));
  let numR;try{numR=await alloc('R',S.seqR||0)}catch(x){toast('Connexion perdue : l\'entrée n\'a pas été validée, réessayez.');return}
  lignes.forEach(l=>{const m=mon(l.montureId);const base=Math.max(0,m.qte),tot=base+l.qte;
    m.pa=r2(tot?(base*(m.pa||0)+l.qte*l.pa)/tot:l.pa);m.qte+=l.qte;m.demo=false;applyCoef(m)});
  S.seqR=Math.max(S.seqR||0,numR);const now=new Date(),d=new Date(rec.date+'T'+now.toTimeString().slice(0,8));
  const r={id:'r'+Date.now().toString(36),num:'R'+d.getFullYear()+'-'+pad4(numR),date:d.toISOString(),fournisseurId:four.id,fournisseur:four.nom,doc:rec.doc,
    lignes:lignes.map(l=>{const m=mon(l.montureId);return{montureId:m.id,etiquette:m.etiquette,designation:desig(m),detail:[m.coloris,tailleOf(m)].filter(Boolean).join(' · '),qte:l.qte,pa:l.pa}}),
    total:r2(lignes.reduce((t,l)=>t+l.qte*l.pa,0))};
  S.receptions.push(r);save();rec=null;stockTab='receptions';location.hash='stock';
  toast(`Entrée ${r.num} validée : ${r.lignes.reduce((t,l)=>t+l.qte,0)} montures ajoutées au stock`);
}
function showRec(id){
  const r=S.receptions.find(x=>x.id===id);if(!r)return;
  openModal('Entrée de stock '+r.num,`${r.fournisseur}${r.doc?' · '+r.doc:''} · ${dF.format(new Date(r.date))}`,
  `<div class="table-wrap"><table><thead><tr><th>Monture</th><th class="num">Qté</th><th class="num">Prix d'achat HT</th><th class="num">Montant HT</th></tr></thead><tbody>
  ${r.lignes.map(l=>`<tr><td><b>${esc(l.designation)}</b><span class="sub"><span class="mono">${esc(l.etiquette)}</span>${l.detail?' · '+esc(l.detail):''}</span></td><td class="num">${l.qte}</td><td class="num">${money(l.pa)}</td><td class="num">${money(l.qte*l.pa)}</td></tr>`).join('')}
  </tbody></table></div><dl class="totals" style="max-width:260px;margin-left:auto"><dt class="big">Total HT</dt><dd class="big">${money(r.total)}</dd></dl>`,
  `<button class="btn primary" data-act="close">Fermer</button>`);
}

/* ---------- Marques et fournisseurs ---------- */
const fourOf=id=>S.fournisseurs.find(f=>f.id===id);
const marqueOf=nom=>S.marques.find(b=>b.nom.toLowerCase()===String(nom||'').trim().toLowerCase());
const marquesOfFour=fid=>S.marques.filter(b=>b.fournisseurId===fid).sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
const fcode=f=>'F'+String(f.num).padStart(3,'0');
function fourOptions(sel,withNew){
  return`<option value="">Choisir un fournisseur</option>${[...S.fournisseurs].sort((a,b)=>a.nom.localeCompare(b.nom,'fr')).map(f=>`<option value="${f.id}" ${f.id===sel?'selected':''}>${esc(f.nom)}</option>`).join('')}${withNew?'<option value="__new">+ Nouveau fournisseur…</option>':''}`;
}
function marquesTab(){
  if(!S.marques.length)return`<div class="table-wrap"><div class="empty-state"><h3>Aucune marque</h3><p>Créez vos marques et rattachez-les à leur fournisseur. Elles sont aussi créées automatiquement à l'import d'un catalogue.</p><button class="btn primary" data-act="b-new">Nouvelle marque</button></div></div>`;
  const list=[...S.marques].sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
  return`<div class="row-between"><p class="muted">Prix de vente HT = prix d'achat HT × coefficient de la marque, arrondi au centime. Une monture dont le prix a été fixé à la main n'est pas recalculée.</p><button class="btn" data-act="b-new">Nouvelle marque</button></div>
  ${oldCodes().length?`<div class="regime warn" style="margin-bottom:14px">${oldCodes().length} monture${oldCodes().length>1?'s ont':' a'} encore un ancien code étiquette tout en chiffres (ex. ${esc(oldCodes()[0].etiquette)}).<span>Les nouvelles montures reçoivent un code « 3 lettres de la marque + 3 chiffres ». <button class="link" data-act="etq-renum">Passer les anciennes au nouveau format</button></span></div>`:''}
  <div class="table-wrap"><table><thead><tr><th>Marque</th><th>Préfixe</th><th>Fournisseur</th><th class="num">Références</th><th class="num">En stock</th><th>Coefficient</th><th>Exemple</th><th></th></tr></thead><tbody>
  ${list.map(b=>{const ms=S.montures.filter(m=>m.marque===b.nom),c=coefOf(b.nom),f=fourOf(b.fournisseurId);
    const cat=S.catalogue.filter(x=>x.marque===b.nom&&!ms.some(m=>normEAN(m.ean)===normEAN(x.ean))).length;
    const pa=ms.length?ms.reduce((t,m)=>t+(m.pa||0),0)/ms.length:(S.catalogue.find(x=>x.marque===b.nom)||{}).pa||0;
    return`<tr><td><b>${esc(b.nom)}</b>${ms.some(m=>m.pvManuel)?`<span class="sub">${ms.filter(m=>m.pvManuel).length} prix fixé${ms.filter(m=>m.pvManuel).length>1?'s':''} à la main</span>`:''}</td>
    <td class="mono">${esc(prefixOf(b.nom))}</td><td>${f?esc(f.nom):'<span class="warn-txt">Non rattachée</span>'}</td>
    <td class="num">${ms.length+cat}</td><td class="num">${ms.reduce((t,m)=>t+Math.max(0,m.qte),0)}</td>
    <td><span class="suffix coef"><input type="number" min="0" step="0.05" id="coef-${b.id}" data-coef="${b.id}" value="${c||''}" placeholder="non défini" aria-label="Coefficient ${esc(b.nom)}"><span>×</span></span></td>
    <td class="sub-cell">${c&&pa?`${money(pa)} → <b style="color:var(--ink)">${money(pvFrom(pa,c))}</b>`:'—'}</td>
    <td class="num"><button class="link" data-act="b-edit" data-id="${b.id}">Modifier</button></td></tr>`}).join('')}
  </tbody></table></div>`;
}
function fournisseursTab(){
  if(!S.fournisseurs.length)return`<div class="table-wrap"><div class="empty-state"><h3>Aucun fournisseur</h3><p>Ajoutez vos fournisseurs et les marques qu'ils distribuent. Vous les choisirez ensuite à chaque entrée de stock.</p><button class="btn primary" data-act="f-new">Nouveau fournisseur</button></div></div>`;
  const list=[...S.fournisseurs].sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
  return`<div class="row-between"><span></span><button class="btn" data-act="f-new">Nouveau fournisseur</button></div>
  <div class="table-wrap"><table><thead><tr><th>Code</th><th>Fournisseur</th><th>Pays</th><th>Téléphone</th><th>Marques</th><th class="num">Entrées</th><th class="num">Achats HT</th><th class="num">Reste à payer</th></tr></thead><tbody>
  ${list.map(f=>{const p=paysByCode(f.pays),rs=S.receptions.filter(r=>r.fournisseurId===f.id),bs=marquesOfFour(f.id);
    return`<tr class="row-link" data-fid="${f.id}" tabindex="0"><td class="code">${fcode(f)}</td><td><b>${esc(f.nom)}</b>${f.contact?`<span class="sub">${esc(f.contact)}</span>`:''}</td>
    <td>${p?`<span class="country"><span class="cc">${p[0]}</span>${esc(p[1])}</span>`:'—'}</td><td class="mono">${esc(fmtTel(f.pays,f.tel))||'—'}</td>
    <td>${bs.length?bs.map(b=>`<span class="chip-s">${esc(b.nom)}</span>`).join(' '):'<span class="sub-cell">Aucune</span>'}</td>
    <td class="num">${rs.length}</td><td class="num">${money(rs.reduce((t,r)=>t+r.total,0))}</td><td class="num">${(()=>{const d=(S.facturesF||[]).filter(x=>x.fournisseurId===f.id).reduce((t,x)=>t+resteF(x),0);return d>0.005?`<b>${money(d)}</b>`:'—'})()}</td></tr>`}).join('')}
  </tbody></table></div>`;
}
function marqueForm(b,presetFour){
  const isNew=!b;b=b||{nom:'',fournisseurId:presetFour||'',coef:0};
  const nbm=isNew?0:S.montures.filter(m=>m.marque===b.nom).length;
  openModal(isNew?'Nouvelle marque':b.nom,isNew?'':`${nbm} monture${nbm>1?'s':''} en stock ou en fiche`,`
  <fieldset><label class="full">Nom de la marque <span class="req">*</span><input id="b-nom" value="${esc(b.nom)}"></label>
    <label>Fournisseur<select id="b-four">${fourOptions(b.fournisseurId,true)}</select></label>
    <label>Coefficient<span class="suffix"><input id="b-coef" type="number" min="0" step="0.05" value="${b.coef||''}" placeholder="ex. 2,2"><span>× achat</span></span></label>
    <label>Préfixe des codes étiquette<input id="b-pre" maxlength="3" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase" value="${esc(b.prefixe||'')}" placeholder="${esc(autoPrefix(b.nom)||'ABC')}"><span class="hint" id="b-pre-h">Nouvelles montures : <b class="mono">${esc((b.prefixe||autoPrefix(b.nom)))}001</b>, ${esc((b.prefixe||autoPrefix(b.nom)))}002… Laissez vide pour les 3 premières lettres du nom.</span></label></fieldset>`,
  `${isNew?'':`<button class="btn danger" data-act="b-del" data-id="${b.id}" style="margin-right:auto">Supprimer</button>`}<button class="btn" data-act="close">Annuler</button><button class="btn primary" id="b-ok">Enregistrer</button>`,()=>{
    $('#b-nom').focus();
    const preH=()=>{const P=cleanPrefix($('#b-pre').value)||autoPrefix($('#b-nom').value);$('#b-pre').placeholder=autoPrefix($('#b-nom').value);$('#b-pre-h').innerHTML=`Nouvelles montures : <b class="mono">${esc(P)}001</b>, ${esc(P)}002… Laissez vide pour les 3 premières lettres du nom.`};
    $('#b-nom').addEventListener('input',preH);$('#b-pre').addEventListener('input',preH);
    $('#b-four').addEventListener('change',e=>{if(e.target.value==='__new'){const keep={nom:$('#b-nom').value,coef:$('#b-coef').value,id:b.id};
      fournisseurForm(null,f=>{marqueForm(isNew?null:mq(keep.id),f.id);$('#b-nom').value=keep.nom;$('#b-coef').value=keep.coef})}});
    $('#b-ok').onclick=()=>{
      const nom=$('#b-nom').value.trim(),fid=$('#b-four').value==='__new'?'':$('#b-four').value,coef=+String($('#b-coef').value).replace(',','.')||0;
      if(!nom){toast('Indiquez le nom de la marque.');return}
      const preIn=cleanPrefix($('#b-pre').value);if($('#b-pre').value.trim()&&preIn.length!==3){toast('Le préfixe doit faire 3 lettres.');return}
      const prefixe=preIn&&preIn!==autoPrefix(nom)?preIn:'';
      const dup=marqueOf(nom);if(dup&&dup.id!==b.id){toast('Cette marque existe déjà.');return}
      if(isNew)S.marques.push({id:'b'+Date.now().toString(36),nom,fournisseurId:fid,coef:coef>0?r2(coef):0,...(prefixe?{prefixe}:{})});
      else{const x=mq(b.id),old=x.nom;
        if(old!==nom){S.montures.forEach(m=>{if(m.marque===old)m.marque=nom});S.catalogue.forEach(c=>{if(c.marque===old)c.marque=nom})}
        Object.assign(x,{nom,fournisseurId:fid,coef:coef>0?r2(coef):0});if(prefixe)x.prefixe=prefixe;else delete x.prefixe}
      let n=0;S.montures.forEach(m=>{if(m.marque===nom&&coef>0&&!m.pvManuel){applyCoef(m);n++}});
      S.catalogue.forEach(c=>{if(c.marque===nom&&coef>0&&c.pa)c.pv=pvFrom(c.pa,coef)});
      save();closeModal();render();toast(isNew?`Marque ${nom} créée`:`Marque ${nom} mise à jour${n?`, ${n} prix recalculé${n>1?'s':''}`:''}`);
    };
  });
}
const mq=id=>S.marques.find(b=>b.id===id);
function fournisseurForm(f,onSaved){
  const isNew=!f;f=f||{pays:'FR'};
  const v=k=>esc(f[k]??'');
  const others=[...S.marques].sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
  openModal(isNew?'Nouveau fournisseur':f.nom,isNew?'':fcode(f),`
  <fieldset><legend>Identité</legend>
    <label class="full">Nom du fournisseur <span class="req">*</span><input id="fo-nom" value="${v('nom')}" autocomplete="organization"></label>
    <label class="full">Contact<input id="fo-contact" value="${v('contact')}" placeholder="Nom du commercial ou du service"></label></fieldset>
  <fieldset><legend>Coordonnées</legend>
    <label>Pays<select id="fo-pays">${paysOptions(f.pays)}</select></label>
    <label>Ville<input id="fo-ville" value="${v('ville')}"></label>
    <label class="full">Téléphone<div class="phone"><span class="dial" id="fo-dial"></span><input id="fo-tel" type="tel" value="${v('tel')}" placeholder="Numéro sans l'indicatif"></div></label>
    <label class="full">E-mail<input id="fo-email" type="email" value="${v('email')}"></label>
    <label class="full">Adresse<textarea id="fo-adresse" rows="2">${v('adresse')}</textarea></label></fieldset>
  <fieldset><legend>Informations commerciales</legend>
    <label>N° TVA intracommunautaire<input id="fo-intra" value="${v('tvaIntra')}" class="mono-in" spellcheck="false"></label>
    <label>Conditions de paiement<input id="fo-cond" value="${v('conditions')}" placeholder="Ex. 30 jours fin de mois"></label></fieldset>
  <fieldset><legend>Marques distribuées</legend>
    <div class="full brand-checks">${others.length?others.map(b=>{const cur=fourOf(b.fournisseurId);return`<label class="check"><input type="checkbox" data-bk="${b.id}" ${b.fournisseurId&&b.fournisseurId===f.id?'checked':''}> ${esc(b.nom)}${cur&&cur.id!==f.id?` <span class="hint">(actuellement chez ${esc(cur.nom)})</span>`:''}</label>`}).join(''):'<span class="hint">Aucune marque pour l\'instant.</span>'}</div>
    <label class="full">Créer de nouvelles marques<input id="fo-newb" placeholder="Noms séparés par des virgules, ex. OZ, OZ Kids"></label></fieldset>`,
  `${isNew?'':`<button class="btn danger" data-act="f-del" data-id="${f.id}" style="margin-right:auto">Supprimer</button>`}<button class="btn" data-act="close">Annuler</button><button class="btn primary" id="fo-ok">${isNew?'Ajouter le fournisseur':'Enregistrer'}</button>`,()=>{
    const upd=()=>{const p=paysByCode($('#fo-pays').value),d=$('#fo-dial');d.textContent=p?'+'+p[2]:'Pays ?';d.classList.toggle('none',!p)};
    $('#fo-pays').addEventListener('change',upd);upd();$('#fo-nom').focus();
    $('#fo-ok').onclick=async()=>{
      const d={nom:$('#fo-nom').value.trim(),contact:$('#fo-contact').value.trim(),pays:$('#fo-pays').value,ville:$('#fo-ville').value.trim(),tel:$('#fo-tel').value.trim(),
        email:$('#fo-email').value.trim(),adresse:$('#fo-adresse').value.trim(),tvaIntra:$('#fo-intra').value.trim().toUpperCase().replace(/\s/g,''),conditions:$('#fo-cond').value.trim()};
      if(!d.nom){toast('Indiquez le nom du fournisseur.');$('#fo-nom').focus();return}
      if(S.fournisseurs.some(x=>x.id!==f.id&&x.nom.toLowerCase()===d.nom.toLowerCase())){toast('Un fournisseur porte déjà ce nom.');return}
      let res;
      if(isNew){let num;try{num=await alloc('F',S.seqF||0)}catch(x){toast('Connexion perdue : le fournisseur n\'a pas été créé.');return}S.seqF=Math.max(S.seqF||0,num);res={id:'f'+Date.now().toString(36),num,...d};S.fournisseurs.push(res)}
      else{res=fourOf(f.id);Object.assign(res,d);S.receptions.forEach(r=>{if(r.fournisseurId===res.id)r.fournisseur=res.nom})}
      document.querySelectorAll('[data-bk]').forEach(cb=>{const b=mq(cb.dataset.bk);if(!b)return;if(cb.checked)b.fournisseurId=res.id;else if(b.fournisseurId===res.id)b.fournisseurId=''});
      $('#fo-newb').value.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean).forEach(n=>{const b=ensureMarque(n);b.fournisseurId=res.id});
      save();closeModal();
      if(onSaved)onSaved(res);else{render();toast(isNew?`Fournisseur ${res.nom} ajouté`:'Fournisseur mis à jour')}
    };
  });
}

/* ---------- Import de catalogue ---------- */
const CAT_FIELDS=[
  ['ean','Code EAN',true,/(^|\b|_)(ean|gtin|upc|code.?barre|barcode|bar.?code|ean13)/],
  ['marque','Marque',false,/(marque|brand|collection|fabricant|manufacturer)/],
  ['modele','Modèle / référence',true,/(modele|model|reference|^ref|ref\b|article|style|designation|description|nom|libelle)/],
  ['coloris','Coloris',false,/(colou?r|coloris|couleur|teinte|col\b|col\.)/],
  ['calibre','Calibre',false,/(calibre|eye|lens.?width|caliber|taille.?verre|boxing.?a|(^|\W)a$)/],
  ['pont','Pont',false,/(pont|bridge|dbl)/],
  ['branche','Branche',false,/(branche|temple|arm\b|arm_|length)/],
  ['matiere','Matière',false,/(matiere|material|materiau)/],
  ['taille','Taille complète (52-18-140)',false,/(taille|size|dimension)/],
  ['pa','Prix d\'achat HT',false,/(achat|wholesale|whs|cost|prix.?net|net.?price|purchase|gros|tarif|pa\b|ppht|buy)/],
  ['pv','Prix de vente HT (sans coefficient)',false,/(vente|retail|pvc|rrp|msrp|public|selling|pv\b|consumer|sale)/]
];
let imp=null;
const normH=h=>String(h||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
const parseNum=v=>{if(typeof v==='number')return v;const s=String(v||'').replace(/[^\d,.\-]/g,'');if(!s)return 0;const t=s.includes(',')&&s.includes('.')?s.replace(/\./g,'').replace(',','.'):s.replace(',','.');return +t||0};
const cellEAN=v=>{if(typeof v==='number')return Math.round(v).toString();return String(v||'').replace(/\s/g,'').replace(/\.0+$/,'')};
function viewCatalogue(){
  const byM={};S.catalogue.forEach(c=>{byM[c.marque]=byM[c.marque]||{n:0,date:c.importe};byM[c.marque].n++;if(c.importe>byM[c.marque].date)byM[c.marque].date=c.importe});
  const list=Object.entries(byM).sort((a,b)=>a[0].localeCompare(b[0],'fr'));
  return`<a class="back" href="#stock">← Stock</a>
  <div class="head"><div><h1>Importer un catalogue</h1><p>Le fichier d'une marque (OPTO11 en XML, Excel ou CSV) avec les codes EAN. À la réception, chaque pochette scannée remplira sa fiche toute seule.</p></div></div>
  <section class="panel">
    <label class="drop" id="drop" for="imp-file"><span class="drop-ico">${ICO_IMPORT}</span><b>Choisir le fichier du catalogue</b><span>ou le glisser ici · .xml (OPTO11), .xlsx, .xls ou .csv</span>
      <input id="imp-file" type="file" accept=".xml,.xlsx,.xls,.csv,.txt" hidden></label>
    <div id="imp-area"></div>
  </section>
  <section class="panel" id="ph-panel"><h3>Photos des montures</h3>
    <p class="muted" style="margin-top:-4px">Le pack photos du fournisseur : un fichier .zip (ou plusieurs images) dont chaque photo porte le code EAN dans son nom, par exemple <span class="mono">03760313673960.jpg</span>. Chaque photo est rattachée à sa monture, y compris celles qui entreront en stock plus tard.</p>
    ${(()=>{const withEAN=new Set([...S.catalogue.map(c=>normEAN(c.ean)),...S.montures.map(m=>normEAN(m.ean))].filter(Boolean)),idx=photoByEAN();const n=[...withEAN].filter(k=>idx.has(k)).length;
      return`<p class="hint">${S.photos.length} photo${S.photos.length>1?'s':''} importée${S.photos.length>1?'s':''} · ${n} référence${n>1?'s':''} sur ${withEAN.size} ont une photo.</p>`})()}
    <label class="drop small" id="ph-drop" for="ph-file"><b>Choisir le pack photos</b><span>ou le glisser ici · .zip, .jpg, .png ou .webp</span>
      <input id="ph-file" type="file" accept=".zip,image/jpeg,image/png,image/webp" multiple hidden></label>
    <div id="ph-area"></div>
  </section>
  <section class="panel"><h3>Catalogues importés</h3>
    ${list.length?`<div class="table-wrap"><table><thead><tr><th>Marque</th><th class="num">Références</th><th class="num">En stock</th><th>Dernier import</th><th></th></tr></thead><tbody>
    ${list.map(([m,x])=>`<tr><td><b>${esc(m)}</b></td><td class="num">${x.n}</td><td class="num">${S.montures.filter(y=>y.marque===m&&y.qte>0).length}</td><td>${dF.format(new Date(x.date))}</td><td class="num"><button class="link danger-link" data-act="cat-del" data-m="${esc(m)}">Retirer le catalogue</button></td></tr>`).join('')}
    </tbody></table></div>`:'<p class="muted">Aucun catalogue importé pour l\'instant.</p>'}
  </section>`;
}
/* ---------- Import du pack photos ---------- */
const JSZIP='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';let jszipReady=null;
function loadJSZip(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(!jszipReady)jszipReady=new Promise((ok,ko)=>{const s=document.createElement('script');s.src=JSZIP;s.onload=()=>ok(window.JSZip);s.onerror=()=>{jszipReady=null;ko(new Error('jszip'))};document.head.appendChild(s)});
  return jszipReady;
}
let phImp=null;
const IMG_RE=/\.(jpe?g|png|webp)$/i;
async function readPhotoFiles(files){
  const area=$('#ph-area');area.innerHTML='<p class="muted">Lecture des photos…</p>';
  const items=[];// {name, get:()=>Promise<Blob>}
  try{
    for(const f of files){
      if(/\.zip$/i.test(f.name)||f.type==='application/zip'||f.type==='application/x-zip-compressed'){
        const JSZip=await loadJSZip();const z=await JSZip.loadAsync(f);
        z.forEach((path,e)=>{const base=path.split('/').pop();if(e.dir||!IMG_RE.test(base)||/^\._|^__MACOSX/.test(base)||path.includes('__MACOSX/'))return;items.push({name:base,path,get:()=>e.async('blob')})});
      }else if(IMG_RE.test(f.name))items.push({name:f.name,path:f.name,get:async()=>f});
    }
  }catch(e){area.innerHTML='<p class="warn-txt">Le fichier n\'a pas pu être ouvert. Vérifiez que c\'est bien un .zip de photos.</p>';return}
  if(!items.length){area.innerHTML='<p class="warn-txt">Aucune photo (.jpg, .png ou .webp) trouvée dans ce fichier.</p>';return}
  /* Références connues : catalogue + stock */
  const refs=new Map();// EAN -> {modele, coloris, marque}
  [...S.catalogue,...S.montures].forEach(r=>{const k=normEAN(r.ean);if(k&&!refs.has(k))refs.set(k,r)});
  const byTxt=new Map();refs.forEach((r,k)=>{const cc=String(r.coloris||'').split(/\s+/)[0];[r.modele+cc,r.marque+r.modele+cc].forEach(t=>{const n=normTxtF(t);if(n.length>=4&&!byTxt.has(n))byTxt.set(n,k)})});
  const groups=new Map(),unknown=[];
  items.sort((a,b)=>a.name.localeCompare(b.name,'fr',{numeric:true})).forEach(it=>{
    const stem=it.name.replace(/\.[^.]+$/,'');let k='';
    const nums=stem.match(/\d{8,14}/g)||[];for(const n of nums){if(refs.has(normEAN(n))){k=normEAN(n);break}}
    if(!k){const t=normTxtF(stem.replace(/[_\-\s]+(\d{1,2}|[a-z])$/i,''));if(byTxt.has(t))k=byTxt.get(t)}
    if(!k){unknown.push(it.name);return}
    if(!groups.has(k))groups.set(k,it);// première photo du groupe (face) ; les autres angles sont ignorés
  });
  const idx=photoByEAN(),fresh=[...groups.keys()].filter(k=>!idx.has(k)).length;
  phImp={groups,unknown,total:items.length,fresh,replace:false};drawPhotoImport();
}
function drawPhotoImport(){
  const area=$('#ph-area');if(!area||!phImp)return;const {groups,unknown,total,fresh}=phImp,n=groups.size,already=n-fresh;
  const todo=phImp.replace?n:fresh;
  area.innerHTML=`<div class="imp-file"><b>${total} photo${total>1?'s':''}</b> lue${total>1?'s':''} · <b>${n}</b> monture${n>1?'s':''} reconnue${n>1?'s':''}${unknown.length?` · <span class="warn-txt">${unknown.length} sans correspondance</span>`:''}</div>
  ${already?`<label class="check"><input type="checkbox" id="ph-repl" ${phImp.replace?'checked':''}> Remplacer les ${already} photo${already>1?'s':''} déjà présente${already>1?'s':''}</label>`:''}
  ${unknown.length?`<details class="hint" style="margin:8px 0"><summary>Voir les photos sans correspondance</summary><p class="mono" style="font-size:12px">${unknown.slice(0,60).map(esc).join(', ')}${unknown.length>60?'…':''}</p><p>Le nom du fichier doit contenir le code EAN d'une référence du catalogue ou du stock. Importez d'abord le catalogue de la marque.</p></details>`:''}
  <div class="imp-foot"><span class="muted" id="ph-prog">${todo?`${todo} photo${todo>1?'s':''} à importer`:'Rien de nouveau à importer'}</span>
  <div class="row-btns"><button class="btn" data-act="ph-cancel">Annuler</button><button class="btn primary" data-act="ph-ok" ${todo?'':'disabled'}>Importer ${todo} photo${todo>1?'s':''}</button></div></div>`;
  const r=$('#ph-repl');if(r)r.onchange=()=>{phImp.replace=r.checked;drawPhotoImport()};
}
async function runPhotoImport(){
  if(!phImp||phImp.busy)return;phImp.busy=true;
  const idx=new Map(S.photos.map(p=>[normEAN(p.ean),p]));
  const jobs=[...phImp.groups.entries()].filter(([k])=>phImp.replace||!idx.has(k));
  const btn=document.querySelector('[data-act=ph-ok]');if(btn)btn.disabled=true;
  let done=0,fail=0,i=0;const prog=$('#ph-prog');
  const worker=async()=>{while(i<jobs.length){const [k,it]=jobs[i++];
    try{const blob=await it.get();const id=await uploadPhoto(blob,k+'.jpg');const old=idx.get(k);
      if(old){if(old.file!==id)dropFile(old.file);old.file=id;old.importe=new Date().toISOString()}else{const p={id:'p'+k,ean:k,file:id,importe:new Date().toISOString()};S.photos.push(p);idx.set(k,p)}
      done++}catch(e){fail++}
    if(prog)prog.textContent=`Import en cours : ${done+fail} / ${jobs.length}${fail?` · ${fail} échec${fail>1?'s':''}`:''}`;
    if((done+fail)%40===0)save()}};
  await Promise.all([worker(),worker(),worker(),worker()]);
  save();phImp=null;render();toast(`${done} photo${done>1?'s':''} importée${done>1?'s':''}${fail?` · ${fail} en échec, relancez l'import pour les reprendre`:''}`);
}
function bindImport(){
  const pf=$('#ph-file'),pd=$('#ph-drop');
  if(pf){pf.addEventListener('change',()=>{if(pf.files.length)readPhotoFiles([...pf.files])});
    ['dragover','dragenter'].forEach(ev=>pd.addEventListener(ev,e=>{e.preventDefault();pd.classList.add('over')}));
    ['dragleave','drop'].forEach(ev=>pd.addEventListener(ev,e=>{e.preventDefault();pd.classList.remove('over')}));
    pd.addEventListener('drop',e=>{if(e.dataTransfer.files.length)readPhotoFiles([...e.dataTransfer.files])});if(phImp)drawPhotoImport()}
  const f=$('#imp-file'),dz=$('#drop');if(!f)return;
  f.addEventListener('change',()=>{if(f.files[0])readCatalogue(f.files[0])});
  ['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over')}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('over')}));
  dz.addEventListener('drop',e=>{const file=e.dataTransfer.files[0];if(file)readCatalogue(file)});
}
function readCatalogue(file){
  const area=$('#imp-area');area.innerHTML=`<p class="muted">Lecture de ${esc(file.name)}…</p>`;
  const fr=new FileReader();
  fr.onerror=()=>{area.innerHTML='<p class="warn-txt">Le fichier n\'a pas pu être lu.</p>'};
  fr.onload=()=>{
    try{
      let rows;
      const head=new TextDecoder('latin1').decode(new Uint8Array(fr.result).slice(0,400));
      if(/\.xml$/i.test(file.name)||/^\s*(\uFEFF)?\s*<(\?xml|[A-Za-z])/.test(head)){
        const enc=(head.match(/encoding=["']([\w-]+)["']/i)||[])[1]||'utf-8';let txt;try{txt=new TextDecoder(enc).decode(fr.result)}catch(e){txt=new TextDecoder().decode(fr.result)}
        const x=xmlRows(txt);
        if(!x){area.innerHTML='<p class="warn-txt">Ce fichier XML ne contient aucun code EAN reconnaissable. Envoyez-le à l\'assistance pour l\'adapter.</p>';return}
        prepareImport(file.name,x.rows,x.info,x);return;
      }
      if(window.XLSX){const wb=XLSX.read(new Uint8Array(fr.result),{type:'array'});
        const best=wb.SheetNames.map(n=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''})).sort((a,b)=>b.length-a.length)[0];rows=best}
      else{const txt=new TextDecoder().decode(fr.result);const sep=(txt.split('\n')[0].match(/;/g)||[]).length>(txt.split('\n')[0].match(/,/g)||[]).length?';':',';
        rows=txt.split(/\r?\n/).map(l=>l.split(sep).map(x=>x.replace(/^"|"$/g,'')))}
      prepareImport(file.name,rows||[]);
    }catch(e){area.innerHTML=`<p class="warn-txt">Ce fichier n'a pas pu être lu comme un tableau. Enregistrez-le en .xlsx ou .csv et réessayez.</p>`}
  };
  fr.readAsArrayBuffer(file);
}
/* Catalogue XML (norme OPTO11 d'EDI-Optique ou autre) : chaque article porteur d'un code EAN/GTIN devient une ligne.
   Les informations des éléments parents (marque, modèle…) sont recopiées sur chaque article. */
function xmlRows(txt){
  const xd=new DOMParser().parseFromString(txt.replace(/^\uFEFF/,''),'application/xml');
  if(xd.getElementsByTagName('parsererror').length)throw new Error('xml');
  if(xd.getElementsByTagNameNS('*','ContainedOpticCatalogueItem').length)return optoRows(xd);
  const name=el=>el.localName||el.nodeName;
  const leafs=el=>[...el.children].length===0;
  const val=el=>(el.textContent||'').trim();
  const GT=/^\d{8,14}$/;
  const all=[...xd.getElementsByTagName('*')];
  const gtinLeaf=all.filter(el=>(leafs(el)&&GT.test(val(el))&&/(ean|gtin|upc|barre|barcode)/i.test(name(el)))||[...el.attributes].some(a=>/(ean|gtin|upc)/i.test(a.name)&&GT.test(a.value.trim())));
  const src=gtinLeaf.length?gtinLeaf:all.filter(el=>leafs(el)&&/^\d{12,14}$/.test(val(el)));
  if(!src.length)return null;
  /* Élément « article » : le plus proche ancêtre répété parmi ses frères */
  const votes=new Map();
  src.forEach(el=>{let a=[...el.attributes].some(x=>/(ean|gtin|upc)/i.test(x.name))&&!leafs(el)?el:el.parentElement;let pick=null;
    for(let b=a;b&&b.parentElement;b=b.parentElement){const sib=[...b.parentElement.children].filter(x=>name(x)===name(b));if(sib.length>1){pick=b;break}}
    pick=pick||a;if(pick){const k=name(pick);votes.set(k,(votes.get(k)||0)+1)}});
  const tag=[...votes.entries()].sort((a,b)=>b[1]-a[1])[0][0];
  const recs=all.filter(el=>name(el)===tag&&src.some(g=>el===g||el.contains(g)));
  const key=(el,base)=>{const at=[...el.attributes].filter(a=>!/^xmlns/.test(a.name)&&a.value.length<30&&!/^\d+([.,]\d+)?$/.test(a.value)).map(a=>a.value);return(base?base+'/':'')+name(el)+(at.length?'['+at.join(',')+']':'')};
  const flat=(el,base,o)=>{
    [...el.attributes].forEach(a=>{if(!/^xmlns/.test(a.name))o[(base?base:name(el))+'@'+a.name]=a.value.trim()});
    [...el.children].forEach(c=>{if(leafs(c)){let k=key(c,base);let n=2;while(k in o)k=key(c,base)+' #'+(n++);o[k]=val(c);[...c.attributes].forEach(a=>{if(!/^xmlns/.test(a.name)&&/^\d+([.,]\d+)?$|^\d{8,14}$/.test(a.value.trim()))o[k+'@'+a.name]=a.value.trim()})}
      else if(name(c)!==tag&&!src.some(g=>c!==g&&c.contains(g)&&name(c)===tag))flat(c,(base?base+'/':'')+name(c),o)});
    return o;
  };
  const rows=recs.map(r=>{const o={};
    /* champs simples des ancêtres (marque, modèle, collection…) */
    const anc=[];for(let a=r.parentElement;a&&a.parentElement;a=a.parentElement)anc.unshift(a);
    anc.forEach(a=>{[...a.attributes].forEach(x=>{if(!/^xmlns/.test(x.name))o[name(a)+'@'+x.name]=x.value.trim()});[...a.children].filter(leafs).forEach(c=>{o[name(a)+'/'+key(c,'')]=val(c)})});
    flat(r,'',o);return o});
  const cols=[];rows.forEach(o=>Object.keys(o).forEach(k=>{if(!cols.includes(k))cols.push(k)}));
  const used=cols.filter(k=>rows.some(o=>o[k]!==''&&o[k]!=null));
  return{rows:[used,...rows.map(o=>used.map(k=>o[k]??''))],info:`XML · élément article « ${tag} »`};
}
/* Norme OPTO11 (EDI-Optique) : lecture directe des articles du catalogue.
   Caractéristiques : 482 = calibre, 518 = pont, 485 = branche ; prix AAA = prix net d'achat. */
function optoRows(xd){
  const kids=(el,n)=>el?[...el.children].filter(c=>c.localName===n):[];
  const kid=(el,n)=>kids(el,n)[0]||null;
  const tx=(el,n)=>{const k=kid(el,n);return k?(k.textContent||'').trim():''};
  const deep=(el,n)=>el?el.getElementsByTagNameNS('*',n)[0]||null:null;
  const items=[...xd.getElementsByTagNameNS('*','ContainedOpticCatalogueItem')];
  const fmt=(deep(xd,'Format')||{}).textContent||'OPTO11';
  const sup=deep(xd,'SupplierOpticParty')||deep(xd,'ProviderOpticParty')||deep(xd,'ManufacturerOpticParty');
  const supNom=sup?tx(sup,'Name'):'';
  const SOL=/Sunglass/i;
  const head=['GTIN','Marque','Modèle','Coloris','Calibre','Pont','Branche','Prix net d\'achat','Prix public','Type','Code douanier','Matière'];
  const rows=[];
  items.forEach(it=>{
    if(tx(it,'ActionCode')==='3')return; // article retiré du catalogue
    const p=kid(it,'ReferencedOpticProduct');if(!p)return;
    const idEl=[...p.getElementsByTagNameNS('*','ID')].find(e=>e.parentElement.localName==='SpecifiedOpticProductIdentification'&&(!e.getAttribute('schemeID')||/GTIN|EAN/i.test(e.getAttribute('schemeID'))));
    const ean=idEl?idEl.textContent.trim():'';
    const ch={};[...p.getElementsByTagNameNS('*','ApplicableOpticProductCharacteristic')].forEach(c=>{const id=tx(c,'ID');const v=tx(c,'ValueMeasure')||tx(c,'ValueText')||tx(c,'ValueCode');if(id&&v&&!(id in ch))ch[id]=v});
    const cc=tx(p,'ColorCode'),cdesc=tx(p,'ColorDescription'),info=tx(it,'AdditionalInformation');
    let modele=tx(p,'ModelName')||tx(p,'Name');if(cc&&modele.toUpperCase().endsWith(' '+cc.toUpperCase()))modele=modele.slice(0,-cc.length-1).trim();
    const coul=[cc,info&&info!==cc?info:(cdesc&&cdesc!==cc?cdesc:'')].filter(Boolean).join(' ');
    let pa='',pv='';[...it.getElementsByTagNameNS('*','AssignedOpticPrice')].forEach(ap=>{const t=tx(ap,'TypeCode'),v=tx(ap,'ChargeAmount');if(/^(AAA|AAB|NET|INV)$/i.test(t)&&pa==='')pa=v;else if(/^(RRP|RTP|SRP|PUB|AAE)$/i.test(t)&&pv==='')pv=v});
    const sub=(deep(p,'SubClassCode')||{}).textContent||'';
    const mc=kids(p,'ComposedOpticMaterial').map(x=>tx(x,'ID')).filter(Boolean);
    const mat=mc.length>1?'Mixte (métal et plastique)':mc.length?(OPTO_MAT[mc[0].toUpperCase()]||'Code '+mc[0]):'';
    rows.push([ean,tx(p,'BrandName')||tx(p,'SubBrandName'),modele,coul,ch['482']||'',ch['518']||'',ch['485']||'',pa,pv,SOL.test(sub)?'Solaire':'Optique',ch['977']||'',mat]);
  });
  if(!rows.length)return null;
  const brands=[...new Set(rows.map(r=>r[1]).filter(Boolean))];
  return{rows:[head,...rows],info:`Norme ${fmt}${supNom?' · fournisseur '+supNom:''} · ${brands.length} marque${brands.length>1?'s':''} : ${brands.join(', ')}`,
    map:{ean:0,marque:1,modele:2,coloris:3,calibre:4,pont:5,branche:6,pa:7,pv:rows.some(r=>r[8])?8:undefined,matiere:rows.some(r=>r[11])?11:undefined},fournisseur:supNom,opto:true};
}
function prepareImport(name,rows,info,x){
  rows=rows.filter(r=>r.some(c=>String(c).trim()!==''));
  let hi=0;if(!info)for(let i=0;i<Math.min(20,rows.length);i++){if(rows[i].filter(c=>typeof c==='string'&&c.trim()&&isNaN(+c)).length>=3){hi=i;break}}
  const headers=(rows[hi]||[]).map((h,i)=>String(h).trim()||`Colonne ${i+1}`);
  const data=rows.slice(hi+1);
  const map={},used=new Set();
  /* Pour la marque, le modèle et le coloris, on préfère une colonne « libellé » à une colonne « code » */
  const LBL=/(name|nom|libelle|label|desc|lib\b)/,CODE=/(code|id\b|_id|cod\b)/;
  CAT_FIELDS.forEach(([k,,,re])=>{let cand=headers.map((h,j)=>j).filter(j=>!used.has(j)&&re.test(normH(headers[j])));
    if(['marque','modele','coloris'].includes(k)&&cand.length>1){const lb=cand.filter(j=>LBL.test(normH(headers[j]))&&!CODE.test(normH(headers[j])));if(lb.length)cand=lb;else{const nc=cand.filter(j=>!CODE.test(normH(headers[j])));if(nc.length)cand=nc}}
    if(k==='ean'&&cand.length>1){const g=cand.filter(j=>data.slice(0,30).some(r=>/^\d{8,14}$/.test(cellEAN(r[j]))));if(g.length)cand=g}
    const i=cand.length?cand[0]:-1;if(i>=0){map[k]=i;used.add(i)}});
  if(map.ean==null){const i=headers.findIndex((h,j)=>!used.has(j)&&data.slice(0,30).filter(r=>/^\d{12,14}$/.test(cellEAN(r[j]))).length>=Math.min(5,data.length));if(i>=0)map.ean=i}
  if(x&&x.map)Object.keys(map).forEach(k=>delete map[k]),Object.entries(x.map).forEach(([k,v])=>{if(v!=null)map[k]=v});
  const guessBrand=x&&x.opto?'':(name.match(/oz/i)?'OZ':'');
  const fn=x&&x.fournisseur?normTxtF(x.fournisseur):'';
  const fMatch=fn?S.fournisseurs.find(f=>normTxtF(f.nom)===fn):null;
  imp={name,headers,data,map,marque:guessBrand,coef:'',info:info||'',fournisseurNom:x&&x.fournisseur||'',fournisseurId:fMatch?fMatch.id:(x&&x.fournisseur?'__opto':'')};
  drawImport();
}
const normTxtF=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'');
const brandsOf=()=>imp?[...new Set(mappedRows().map(r=>r.marque).filter(Boolean))]:[];
function mappedRows(){
  const {data,map}=imp;const g=(r,k)=>map[k]!=null?r[map[k]]:'';
  return data.map(r=>{
    const o={ean:cellEAN(g(r,'ean')),marque:String(g(r,'marque')||imp.marque||'').trim(),modele:String(g(r,'modele')||'').trim(),coloris:String(g(r,'coloris')||'').trim(),
      matiere:String(g(r,'matiere')||'').trim(),calibre:String(g(r,'calibre')||'').trim(),pont:String(g(r,'pont')||'').trim(),branche:String(g(r,'branche')||'').trim(),pa:r2(parseNum(g(r,'pa'))),pv:r2(parseNum(g(r,'pv')))};
    const t=String(g(r,'taille')||'');const x=t.match(/(\d{2})\D+(\d{1,2})(?:\D+(\d{3}))?/);
    if(x){o.calibre=o.calibre||x[1];o.pont=o.pont||x[2];o.branche=o.branche||x[3]||''}
    if(o.marque&&o.modele.toLowerCase().startsWith(o.marque.toLowerCase()+' '))o.modele=o.modele.slice(o.marque.length+1).trim();
    const c=+String(imp.coef).replace(',','.')>0?+String(imp.coef).replace(',','.'):coefOf(o.marque);
    if(c&&o.pa)o.pv=pvFrom(o.pa,c);
    return o;
  });
}
function drawImport(){
  const area=$('#imp-area');if(!area||!imp)return;
  const rows=mappedRows(),ok=rows.filter(r=>normEAN(r.ean).length>=8&&r.modele&&r.marque),exist=ok.filter(r=>catByEAN(r.ean)).length;
  const sel=k=>`<select data-map="${k}" id="map-${k}"><option value="">— Aucune —</option>${imp.headers.map((h,i)=>`<option value="${i}" ${imp.map[k]===i?'selected':''}>${esc(h)}</option>`).join('')}</select>`;
  area.innerHTML=`<div class="imp-file"><b>${esc(imp.name)}</b> · ${imp.data.length} ${imp.info?'article':'ligne'}${imp.data.length>1?'s':''} lu${imp.info?'':'e'}${imp.data.length>1?'s':''}${imp.info?` · <span class="muted">${esc(imp.info)}</span>`:''}</div>
  <h3 style="margin-top:6px">Correspondance des colonnes</h3>
  <p class="hint" style="margin:0 0 10px">Prismea a reconnu les colonnes qu'il pouvait. Corrigez-les si besoin.</p>
  <div class="map-grid">${CAT_FIELDS.map(([k,l,req])=>`<label>${l}${req?' <span class="req">*</span>':''}${sel(k)}</label>`).join('')}
    <label>Marque si absente du fichier<input id="imp-marque" value="${esc(imp.marque)}" placeholder="Ex. OZ" list="dl-imp-b"></label><datalist id="dl-imp-b">${S.marques.map(b=>`<option value="${esc(b.nom)}"></option>`).join('')}</datalist>
    <label>Fournisseur ${brandsOf().length>1?'des marques':'de la marque'}<select id="imp-four">${imp.fournisseurNom&&!S.fournisseurs.some(f=>normTxtF(f.nom)===normTxtF(imp.fournisseurNom))?`<option value="__opto" ${imp.fournisseurId==='__opto'?'selected':''}>Créer le fournisseur « ${esc(imp.fournisseurNom)} »</option>`:''}${fourOptions(imp.fournisseurId==='__opto'?'':imp.fournisseurId||(marqueOfName(imp.marque)||{}).fournisseurId||'',false)}</select></label>
    <label>Coefficient de la marque<span class="suffix"><input id="imp-coef" type="number" min="0" step="0.05" value="${esc(imp.coef)}" placeholder="${coefOf(imp.marque)?fmtCoef(coefOf(imp.marque)):'ex. 2,2'}"><span>× achat</span></span><span class="hint">Prix de vente = prix d'achat × coefficient, arrondi au centime. ${brandsOf().length>1?`Appliqué aux ${brandsOf().length} marques du fichier (${brandsOf().map(esc).join(', ')}) ; laissez vide pour garder le coefficient de chaque marque.`:'Enregistré pour la marque.'}</span></label></div>
  <h3 style="margin-top:18px">Aperçu</h3>
  <div class="table-wrap"><table><thead><tr><th>EAN</th><th>Marque</th><th>Modèle</th><th>Coloris</th><th>Matière</th><th>Taille</th><th class="num">Achat HT</th><th class="num">Vente HT</th></tr></thead><tbody>
  ${rows.slice(0,8).map(r=>{const bad=!(normEAN(r.ean).length>=8&&r.modele&&r.marque);return`<tr class="${bad?'bad-row':''}"><td class="mono">${esc(r.ean)||'<span class="warn-txt">manquant</span>'}</td><td>${esc(r.marque)||'<span class="warn-txt">manquante</span>'}</td><td>${esc(r.modele)||'<span class="warn-txt">manquant</span>'}</td><td>${esc(r.coloris)}</td><td>${esc(r.matiere)}</td><td class="mono">${esc([r.calibre,r.pont].filter(Boolean).join('□')+(r.branche?' '+r.branche:''))}</td><td class="num">${r.pa?money(r.pa):'—'}</td><td class="num">${r.pv?money(r.pv):'—'}</td></tr>`}).join('')}
  </tbody></table></div>
  <div class="imp-foot"><span class="muted">${ok.length} référence${ok.length>1?'s':''} importable${ok.length>1?'s':''}${exist?` dont ${exist} déjà connue${exist>1?'s':''} (mise${exist>1?'s':''} à jour)`:''}${rows.length-ok.length?` · ${rows.length-ok.length} ligne${rows.length-ok.length>1?'s':''} ignorée${rows.length-ok.length>1?'s':''} (EAN, marque ou modèle manquant)`:''}</span>
  <div class="row-btns"><button class="btn" data-act="imp-cancel">Annuler</button><button class="btn primary" data-act="imp-ok" ${ok.length?'':'disabled'}>Importer ${ok.length} référence${ok.length>1?'s':''}</button></div></div>`;
}
function runImport(){
  const rows=mappedRows().filter(r=>normEAN(r.ean).length>=8&&r.modele&&r.marque);
  const now=new Date().toISOString();let nw=0,up=0,ms=0;
  const cf=+String(imp.coef).replace(',','.');
  let fid=$('#imp-four')?.value||imp.fournisseurId||'';
  if(fid==='__opto'){const f=ensureFournisseur(imp.fournisseurNom);fid=f.id}
  [...new Set(rows.map(r=>r.marque))].forEach(n=>{const b=ensureMarque(n);if(cf>0)b.coef=r2(cf);if(fid)b.fournisseurId=fid;rows.forEach(r=>{if(r.marque===n)r.marque=b.nom})});
  const idx=new Map(S.catalogue.map((c,i)=>[normEAN(c.ean),i]));
  rows.forEach(r=>{const k=normEAN(r.ean);const e={...r,id:'e'+k,importe:now};
    if(idx.has(k)){S.catalogue[idx.get(k)]=e;up++}else{idx.set(k,S.catalogue.length);S.catalogue.push(e);nw++}
    const m=S.montures.find(x=>normEAN(x.ean)===k);
    if(m){['marque','modele','coloris','matiere','calibre','pont','branche'].forEach(f=>{if(!m[f]&&r[f])m[f]=r[f]});if(!m.pv&&r.pv)m.pv=r.pv;applyCoef(m);ms++}
  });
  save();imp=null;render();
  toast(`Catalogue importé : ${nw} nouvelle${nw>1?'s':''} référence${nw>1?'s':''}${up?`, ${up} mise${up>1?'s':''} à jour`:''}`);
}

document.addEventListener('click',e=>{
  const sr=e.target.closest('tr.row-link');
  if(sr&&!e.target.closest('[data-act]')){if(sr.dataset.fid){fournisseurForm(fourOf(sr.dataset.fid));return}if(sr.dataset.mid)montureForm(mon(sr.dataset.mid));else if(sr.dataset.rid)showRec(sr.dataset.rid);return}
  const b=e.target.closest('[data-act]');if(!b)return;const id=b.dataset.id;
  const setRq=(v,rel)=>{const l=rec.lignes.find(x=>x.montureId===id);if(!l)return;const q=rel?l.qte+v:v;if(q<=0)rec.lignes=rec.lignes.filter(x=>x!==l);else l.qte=q;drawRec()};
  switch(b.dataset.act){
    case's-tab':stockTab=b.dataset.k;render();break;
    case'etq-renum':{const n=oldCodes().length,ex=oldCodes()[0];
      openModal('Nouveaux codes étiquette',`${n} monture${n>1?'s':''} concernée${n>1?'s':''}`,`<p>Chaque ancienne monture recevra un code « 3 lettres de la marque + 3 chiffres », par exemple <b class="mono">${esc(ex.etiquette)}</b> → <b class="mono">${esc(prefixOf(ex.marque))}…</b>.</p><p>Les ventes, devis et entrées de stock passés afficheront le nouveau code. <b>Pensez à réimprimer les étiquettes</b> déjà collées sur les montures en stock : les anciens codes ne seront plus reconnus au scan (le code-barres EAN reste valable).</p>`,
        `<button class="btn" data-act="close">Annuler</button><button class="btn primary" id="renum-ok">Changer les codes</button>`,()=>{$('#renum-ok').onclick=async e2=>{e2.target.disabled=true;try{const k=await renumberOld();closeModal();render();toast(`${k} code${k>1?'s':''} étiquette mis à jour`)}catch(x){e2.target.disabled=false;toast('Connexion perdue : réessayez.')}}});
      break}
    case's-new':montureForm();break;
    case's-del':
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer la suppression';break}
      S.montures=S.montures.filter(m=>m.id!==id);save();closeModal();render();toast('Monture supprimée');break;
    case'r-add':recScan();break;
    case'rq+':setRq(1,true);break;
    case'rq-':setRq(-1,true);break;
    case'r-rm':setRq(0);break;
    case'r-ok':validateRec();break;
    case'r-cancel':rec=null;location.hash='stock';break;
    case'imp-ok':runImport();break;
    case'b-new':marqueForm();break;
    case'b-edit':marqueForm(mq(id));break;
    case'b-del':{const bm=mq(id);if(!bm)break;const n=S.montures.filter(m=>m.marque===bm.nom).length;
      if(n){toast(`Impossible : ${n} monture${n>1?'s':''} de cette marque existe${n>1?'nt':''} encore.`);break}
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer la suppression';break}
      S.marques=S.marques.filter(x=>x.id!==id);S.catalogue=S.catalogue.filter(c=>c.marque!==bm.nom);save();closeModal();render();toast('Marque '+bm.nom+' supprimée');break}
    case'f-new':fournisseurForm();break;
    case'f-del':{const n=S.receptions.filter(r=>r.fournisseurId===id).length;
      if(n){toast(`Impossible : ce fournisseur a ${n} entrée${n>1?'s':''} de stock enregistrée${n>1?'s':''}.`);break}
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer la suppression';break}
      S.marques.forEach(x=>{if(x.fournisseurId===id)x.fournisseurId=''});S.fournisseurs=S.fournisseurs.filter(f=>f.id!==id);save();closeModal();render();toast('Fournisseur supprimé');break}
    case'imp-cancel':imp=null;render();break;
    case'ph-cancel':if(phImp&&!phImp.busy){phImp=null;render()}break;
    case'ph-ok':runPhotoImport();break;
    case'cat-del':
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer';break}
      S.catalogue=S.catalogue.filter(c=>c.marque!==b.dataset.m);save();render();toast('Catalogue '+b.dataset.m+' retiré. Les montures déjà en stock sont conservées.');break;
  }
});
document.addEventListener('input',e=>{const id=e.target.id;if(id==='qs')fillStock();if(id==='r-doc'&&rec)rec.doc=e.target.value});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='fm'||t.id==='fa')fillStock();
  else if(t.id==='r-date'&&rec)rec.date=t.value;
  else if(t.dataset.rq){const l=rec.lignes.find(x=>x.montureId===t.dataset.rq);const q=Math.round(+t.value||0);if(l){if(q<=0)rec.lignes=rec.lignes.filter(x=>x!==l);else l.qte=q}drawRec()}
  else if(t.dataset.rp){const l=rec.lignes.find(x=>x.montureId===t.dataset.rp);if(l){l.pa=r2(Math.max(0,+t.value||0));drawRec()}}
  else if(t.dataset.map&&imp){imp.map[t.dataset.map]=t.value===''?null:+t.value;drawImport()}
  else if(t.id==='imp-marque'&&imp){imp.marque=t.value.trim();drawImport()}
  else if(t.id==='imp-four'&&imp){imp.fournisseurId=t.value}
  else if(t.id==='r-four'&&rec){if(t.value==='__new'){fournisseurForm(null,f=>{rec.fournisseurId=f.id;render()});t.value=rec.fournisseurId||''}else{rec.fournisseurId=t.value;render()}}
  else if(t.id==='ff')fillStock();
  else if(t.dataset.coef!=null){
    const bm=mq(t.dataset.coef);if(!bm)return;const b=bm.nom,v=+String(t.value).replace(',','.');
    bm.coef=v>0?r2(v):0;
    let n=0;S.montures.forEach(m=>{if(m.marque===b&&!m.pvManuel&&v>0){applyCoef(m);n++}});
    S.catalogue.forEach(c=>{if(c.marque===b&&v>0&&c.pa)c.pv=pvFrom(c.pa,v)});
    save();render();
    toast(v>0?`Coefficient ${b} : ×${fmtCoef(r2(v))}. ${n} prix de vente recalculé${n>1?'s':''}.`:`Coefficient ${b} retiré. Les prix actuels sont conservés.`);
  }
  else if(t.id==='imp-coef'&&imp){imp.coef=t.value;drawImport()}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='rscan'){e.preventDefault();recScan()}
  if(e.key==='Enter'&&e.target.matches('tr.row-link'))e.target.click();
});


/* ---------- Caisse : journal, règlements, factures, semaine ---------- */
const PAY_MODES=['Virement','Carte bancaire','Chèque','Espèces','Mobile Money'];
const PAY_LATER='À régler plus tard';
/* Champs de détail selon le mode : banque + référence pour un virement, banque + n° pour un chèque */
const PAY_DETAIL={Virement:['Banque émettrice','Référence du virement'],'Chèque':['Banque','N° de chèque']};
const regInfo=r=>[r.banque,r.ref].filter(Boolean).join(' · ');
function payDetailFields(mode,prefix,vals){
  const d=PAY_DETAIL[mode];vals=vals||{};
  if(!d)return`<label class="full">Référence<input id="${prefix}-ref" value="${esc(vals.ref||'')}" placeholder="Facultatif"></label>`;
  return`<label>${d[0]}<input id="${prefix}-banque" value="${esc(vals.banque||'')}" list="dl-banques" placeholder="Ex. BNP Paribas"></label>
  <label>${d[1]}<input id="${prefix}-ref" value="${esc(vals.ref||'')}" class="mono-in" spellcheck="false"></label>
  <datalist id="dl-banques">${[...new Set(S.reglements.map(r=>r.banque).filter(Boolean))].map(b=>`<option value="${esc(b)}"></option>`).join('')}</datalist>`;
}
S.reglements=S.reglements||[];S.clotures=S.clotures||[];S.seqFA=S.seqFA||0;
S.societe=S.societe||{nom:'',forme:'',capital:'',adresse:'',cp:'',ville:'',pays:'FR',siren:'',rcs:'',tvaIntra:'',tel:'',email:'',iban:'',bic:'',delai:30};
const isoD=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const weekStart=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
function factureFor(v){
  if(!v.facture){S.seqFA++;v.facture='FA'+new Date(v.date).getFullYear()+'-'+String(S.seqFA).padStart(4,'0')}
  if(!v.echeance)v.echeance=isoD(addDays(v.date,+S.societe.delai||30));
}
[...S.ventes].sort((a,b)=>a.date.localeCompare(b.date)).forEach(v=>{
  factureFor(v);
  if(!v.regMig){if(v.paiement&&v.paiement!=='Crédit client'&&v.paiement!==PAY_LATER&&!S.reglements.some(r=>r.venteId===v.id))
    S.reglements.push({id:'g'+v.id,venteId:v.id,clientId:v.clientId,date:v.date,montant:v.ttc,mode:v.paiement,ref:''});v.regMig=true}
});
save();
const paidOf=v=>r2(S.reglements.filter(r=>r.venteId===v.id).reduce((t,r)=>t+r.montant,0));
const resteOf=v=>Math.max(0,r2(v.ttc-paidOf(v)));
function statutOf(v){
  const p=paidOf(v),rest=resteOf(v);
  if(rest<=0.005)return'payee';
  if(isoD(new Date())>v.echeance)return'retard';
  return p>0?'partielle':'attente';
}
const STATUT={payee:['Payée','ok'],partielle:['Partielle','warn'],attente:['À régler','neutral'],retard:['En retard','bad']};
const statutPill=v=>{const[s,c]=STATUT[statutOf(v)];return`<span class="pill ${c}">${s}</span>`};
const encoursOf=cid=>r2(S.ventes.filter(v=>v.clientId===cid).reduce((t,v)=>t+resteOf(v),0));
const closedWeek=d=>S.clotures.some(c=>c.semaine===isoD(weekStart(d)));
const retardJ=v=>Math.floor((new Date(isoD(new Date()))-new Date(v.echeance))/864e5);

/* Fichiers : capacité de téléchargement de la page */
let dlNS=null;
dlNS={save:async({filename,data})=>{
  const blob=data instanceof Blob?data:new Blob([data],{type:/\.pdf$/i.test(filename)?'application/pdf':/\.json$/i.test(filename)?'application/json':'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);return{status:'saved'}}};
async function offerFile(filename,data){
  if(!dlNS){toast('Le téléchargement de fichiers n\'est pas disponible dans cette vue.');return}
  try{await dlNS.save({filename,data});toast('Fichier enregistré')}
  catch(e){const c=e&&e.code;if(c==='declined')return;toast(c==='rate_limited'?'Une demande d\'enregistrement est déjà ouverte.':'Le fichier n\'a pas pu être enregistré.')}
}
const csvCell=v=>{const s=String(v??'');return/[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
const csvNum=n=>String(r2(n)).replace('.',',');
function csvOf(rows){return'﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')}

/* Vue Caisse */
let caisseTab='journal';
const per={mode:'mois',ref:new Date()};
let semRef=weekStart(new Date());
function periodBounds(){
  const r=new Date(per.ref);r.setHours(0,0,0,0);
  if(per.mode==='jour')return[r,addDays(r,1)];
  if(per.mode==='semaine'){const a=weekStart(r);return[a,addDays(a,7)]}
  if(per.mode==='annee'){const a=new Date(r.getFullYear(),0,1);return[a,new Date(r.getFullYear()+1,0,1)]}
  const a=new Date(r.getFullYear(),r.getMonth(),1);return[a,new Date(r.getFullYear(),r.getMonth()+1,1)];
}
function periodLabel(){
  const[a,b]=periodBounds();
  if(per.mode==='jour')return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(a);
  if(per.mode==='semaine')return`Semaine du ${dF.format(a)} au ${dF.format(addDays(b,-1))}`;
  if(per.mode==='annee')return String(a.getFullYear());
  const s=new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'}).format(a);return s.charAt(0).toUpperCase()+s.slice(1);
}
function viewCaisse(){
  const tab=(k,l,n)=>`<button role="tab" aria-selected="${caisseTab===k}" data-act="k-tab" data-k="${k}">${l}${n?` <span class="tab-n">${n}</span>`:''}</button>`;
  const imp=S.ventes.filter(v=>resteOf(v)>0.005).length;
  const soc=S.societe.nom&&S.societe.siren&&S.societe.adresse;
  return`<a class="back" href="#">← Accueil</a>
  <div class="head"><div><h1>Caisse</h1><p>Ventes, règlements, factures et caisse de la semaine.</p></div><a class="btn" href="#parametres">Paramètres de la société</a></div>
  ${soc?'':`<div class="notice">Complétez les informations de votre société (raison sociale, adresse, SIREN, n° de TVA, IBAN) pour qu'elles figurent sur les factures. <button class="link" data-act="k-soc">Compléter</button></div>`}
  <div class="tabs" role="tablist">${tab('journal','Journal des ventes')}${tab('impayes','Règlements et impayés',imp)}${tab('semaine','Caisse de la semaine')}</div>
  ${caisseTab==='journal'?journalView():caisseTab==='impayes'?impayesView():semaineView()}`;
}
function journalRows(){
  const[a,b]=periodBounds(),cf=per.client||'',sf=per.statut||'';
  return S.ventes.filter(v=>{const d=new Date(v.date);return d>=a&&d<b&&(!cf||v.clientId===cf)&&(!sf||(sf==='justif'?['partiel','manquant'].includes(justifStatut(v)):statutOf(v)===sf))}).sort((x,y)=>y.date.localeCompare(x.date));
}
function journalView(){
  const vs=journalRows();
  const T=k=>vs.reduce((t,v)=>t+(v[k]||0),0),paid=vs.reduce((t,v)=>t+paidOf(v),0);
  const clients=[...S.clients].sort((x,y)=>x.nom.localeCompare(y.nom,'fr'));
  return`<div class="period">
    <div class="seg" role="group" aria-label="Période">${[['jour','Jour'],['semaine','Semaine'],['mois','Mois'],['annee','Année']].map(([k,l])=>`<button data-act="k-pmode" data-k="${k}" aria-pressed="${per.mode===k}">${l}</button>`).join('')}</div>
    <div class="pnav"><button class="icon-btn" data-act="k-prev" aria-label="Période précédente">‹</button><b>${periodLabel()}</b><button class="icon-btn" data-act="k-next" aria-label="Période suivante">›</button><button class="link" data-act="k-today">Aujourd'hui</button></div>
  </div>
  <div class="toolbar"><select id="j-client" aria-label="Client"><option value="">Tous les clients</option>${clients.map(c=>`<option value="${c.id}" ${per.client===c.id?'selected':''}>${esc(c.nom)}</option>`).join('')}</select>
    <select id="j-statut" aria-label="Statut"><option value="">Tous les statuts</option>${Object.entries(STATUT).map(([k,[l]])=>`<option value="${k}" ${per.statut===k?'selected':''}>${l}</option>`).join('')}<option value="justif" ${per.statut==='justif'?'selected':''}>Justificatifs TVA incomplets</option></select>
    <button class="btn" data-act="k-csv" ${vs.length?'':'disabled'}>Exporter (CSV)</button><button class="btn" data-act="k-dtva" ${vs.some(v=>regOf(v)!=='fr')?'':'disabled'} title="Liste des ventes exonérées avec leurs justificatifs, pour un contrôle fiscal">Dossier TVA (CSV)</button></div>
  <div class="kpis4"><div class="kpi"><span class="k">Ventes</span><span class="v">${vs.length}</span></div><div class="kpi"><span class="k">Total HT</span><span class="v">${money(T('ht'))}</span></div>
   <div class="kpi"><span class="k">TVA collectée</span><span class="v">${money(T('tva'))}</span></div><div class="kpi"><span class="k">Réglé / reste</span><span class="v">${money(paid)}</span><span class="d ${T('ttc')-paid>0.005?'down':''}">reste ${money(T('ttc')-paid)}</span></div></div>
  <div class="table-wrap"><table><thead><tr><th>Facture</th><th>Date</th><th>Client</th><th class="num">HT</th><th class="num">TVA</th><th class="num">TTC</th><th class="num">Réglé</th><th>Statut</th><th>Expédition</th><th>Justif. TVA</th></tr></thead><tbody>
  ${vs.length?vs.map(v=>`<tr class="row-link" data-vid="${v.id}" tabindex="0"><td class="mono">${v.facture}<span class="sub">${v.num}</span></td><td>${dF.format(new Date(v.date))}</td><td>${esc(cli(v.clientId)?.nom||'Client supprimé')}</td>
    <td class="num">${money(v.ht)}</td><td class="num">${v.tva?money(v.tva):'—'}</td><td class="num"><b>${money(v.ttc)}</b></td><td class="num">${money(paidOf(v))}</td><td>${statutPill(v)}</td><td>${expPill(v)||'<span class="sub-cell">—</span>'}${(v.documents||[]).length?`<span class="sub">${v.documents.length} document${v.documents.length>1?'s':''}</span>`:''}</td><td>${justifPill(v)}</td></tr>`).join('')
  :'<tr><td colspan="10"><div class="empty-state" style="padding:32px 12px"><p>Aucune vente sur cette période.</p></div></td></tr>'}
  </tbody>${vs.length?`<tfoot><tr><td colspan="3"><b>Total</b></td><td class="num"><b>${money(T('ht'))}</b></td><td class="num"><b>${money(T('tva'))}</b></td><td class="num"><b>${money(T('ttc'))}</b></td><td class="num"><b>${money(paid)}</b></td><td></td><td></td><td></td></tr></tfoot>`:''}</table></div>`;
}
function impayesView(){
  const open=S.ventes.filter(v=>resteOf(v)>0.005).sort((a,b)=>a.echeance.localeCompare(b.echeance));
  const tot=open.reduce((t,v)=>t+resteOf(v),0),late=open.filter(v=>statutOf(v)==='retard'),lateT=late.reduce((t,v)=>t+resteOf(v),0);
  const over=S.clients.filter(c=>c.plafond>0&&encoursOf(c.id)>c.plafond);
  const last=[...S.reglements].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
  return`<div class="kpis4"><div class="kpi"><span class="k">Reste à encaisser</span><span class="v">${money(tot)}</span><span class="d" style="color:var(--muted)">${open.length} facture${open.length>1?'s':''}</span></div>
   <div class="kpi"><span class="k">Dont en retard</span><span class="v ${lateT?'down':''}">${money(lateT)}</span><span class="d" style="color:var(--muted)">${late.length} facture${late.length>1?'s':''}</span></div>
   <div class="kpi"><span class="k">Clients au-delà du plafond</span><span class="v ${over.length?'down':''}">${over.length}</span><span class="d" style="color:var(--muted)">${over.map(c=>esc(c.nom)).join(', ')||'aucun'}</span></div>
   <div class="kpi"><span class="k">Encaissé ce mois</span><span class="v">${money(S.reglements.filter(r=>r.date.slice(0,7)===isoD(new Date()).slice(0,7)).reduce((t,r)=>t+r.montant,0))}</span></div></div>
  <section class="panel"><h3>Factures à encaisser</h3>
  ${open.length?`<div class="table-wrap"><table><thead><tr><th>Facture</th><th>Client</th><th>Échéance</th><th class="num">TTC</th><th class="num">Réglé</th><th class="num">Reste</th><th></th></tr></thead><tbody>
  ${open.map(v=>{const c=cli(v.clientId),rj=retardJ(v);return`<tr class="row-link" data-vid="${v.id}" tabindex="0"><td class="mono">${v.facture}<span class="sub">${dF.format(new Date(v.date))}</span></td>
    <td>${esc(c?.nom||'Client supprimé')}${c&&c.plafond>0&&encoursOf(c.id)>c.plafond?'<span class="sub warn-txt">Plafond de crédit dépassé</span>':''}</td>
    <td>${dF.format(new Date(v.echeance))}${rj>0?`<span class="sub warn-txt">${rj} jour${rj>1?'s':''} de retard</span>`:''}</td>
    <td class="num">${money(v.ttc)}</td><td class="num">${money(paidOf(v))}</td><td class="num"><b>${money(resteOf(v))}</b></td>
    <td class="num"><button class="btn small" data-act="k-pay" data-id="${v.id}">Encaisser</button></td></tr>`}).join('')}
  </tbody></table></div>`:'<p class="muted">Toutes les factures sont réglées.</p>'}</section>
  <section class="panel"><h3>Derniers règlements</h3>${last.length?regTable(last):'<p class="muted">Aucun règlement enregistré.</p>'}</section>`;
}
function regTable(list){
  return`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Facture</th><th>Client</th><th>Mode</th><th>Banque / référence</th><th class="num">Montant</th></tr></thead><tbody>
  ${list.map(r=>{const v=S.ventes.find(x=>x.id===r.venteId);return`<tr class="row-link" data-vid="${r.venteId}" tabindex="0"><td>${dF.format(new Date(r.date))}</td><td class="mono">${v?v.facture:'—'}</td><td>${esc(cli(r.clientId)?.nom||'—')}</td><td>${esc(r.mode)}</td><td>${esc(r.banque||'')}${r.ref?`<span class="sub mono">${esc(r.ref)}</span>`:''}</td><td class="num"><b>${money(r.montant)}</b></td></tr>`}).join('')}
  </tbody></table></div>`;
}
function semaineView(){
  const a=semRef,b=addDays(a,7),key=isoD(a),clo=S.clotures.find(c=>c.semaine===key);
  const vs=S.ventes.filter(v=>{const d=new Date(v.date);return d>=a&&d<b});
  const rs=S.reglements.filter(r=>{const d=new Date(r.date);return d>=a&&d<b}).sort((x,y)=>x.date.localeCompare(y.date));
  const T=k=>vs.reduce((t,v)=>t+(v[k]||0),0),enc=rs.reduce((t,r)=>t+r.montant,0);
  const byMode=PAY_MODES.map(m=>[m,rs.filter(r=>r.mode===m)]).filter(([,l])=>l.length);
  const ended=new Date()>=b;
  return`<div class="period"><div class="pnav"><button class="icon-btn" data-act="k-wprev" aria-label="Semaine précédente">‹</button><b>Semaine du ${dF.format(a)} au ${dF.format(addDays(b,-1))}</b><button class="icon-btn" data-act="k-wnext" aria-label="Semaine suivante">›</button><button class="link" data-act="k-wtoday">Cette semaine</button></div>
    <div class="row-btns">${clo?`<span class="pill ok">Clôturée le ${dF.format(new Date(clo.date))}</span>`:`<button class="btn ${ended?'primary':''}" data-act="k-close">Clôturer la semaine</button>`}<button class="btn" data-act="k-wcsv">Exporter (CSV)</button></div></div>
  <div class="kpis4"><div class="kpi"><span class="k">Ventes de la semaine</span><span class="v">${vs.length}</span><span class="d" style="color:var(--muted)">${money(T('ht'))} HT</span></div>
   <div class="kpi"><span class="k">Facturé TTC</span><span class="v">${money(T('ttc'))}</span><span class="d" style="color:var(--muted)">dont TVA ${money(T('tva'))}</span></div>
   <div class="kpi"><span class="k">Encaissé cette semaine</span><span class="v">${money(enc)}</span><span class="d" style="color:var(--muted)">${rs.length} règlement${rs.length>1?'s':''}</span></div>
   <div class="kpi"><span class="k">Reste dû sur la semaine</span><span class="v ${vs.reduce((t,v)=>t+resteOf(v),0)>0.005?'down':''}">${money(vs.reduce((t,v)=>t+resteOf(v),0))}</span></div></div>
  <div class="grid-2">
   <section class="panel"><h3>Encaissements par mode</h3>${byMode.length?`<dl class="totals">${byMode.map(([m,l])=>`<dt>${m} <span class="hint">(${l.length})</span></dt><dd>${money(l.reduce((t,r)=>t+r.montant,0))}</dd>`).join('')}<dt class="big">Total encaissé</dt><dd class="big">${money(enc)}</dd></dl>`:'<p class="muted">Aucun encaissement cette semaine.</p>'}</section>
   <section class="panel"><h3>Ventes de la semaine</h3>${vs.length?`<div class="docs">${vs.sort((x,y)=>x.date.localeCompare(y.date)).map(v=>`<button class="doc-row" data-act="k-open" data-id="${v.id}"><span><b class="mono">${v.facture}</b><span class="sub">${dF.format(new Date(v.date))} · ${esc(cli(v.clientId)?.nom||'')}</span></span><span class="num"><b>${money(v.ttc)}</b><span class="sub">${STATUT[statutOf(v)][0]}</span></span></button>`).join('')}</div>`:'<p class="muted">Aucune vente cette semaine.</p>'}</section>
  </div>
  <section class="panel"><h3>Règlements de la semaine</h3>${rs.length?regTable(rs):'<p class="muted">Aucun règlement cette semaine.</p>'}</section>
  ${clo?'<p class="hint">Semaine clôturée : ses règlements ne peuvent plus être ajoutés ni supprimés.</p>':''}`;
}

/* Colis d'une expédition : poids et dimensions ; poids volumétrique DHL Express = L × l × h / 5000 */
const volKg=c=>(+c.l&&+c.w&&+c.h)?(+c.l)*(+c.w)*(+c.h)/5000:0;
const nfk=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2});
function colisRows(list){
  return list.map((c,i)=>`<div class="colis-row" data-ci="${i}"><span class="mono">${i+1}</span>
    <input type="number" min="0" step="0.01" data-cf="kg" id="c${i}kg" value="${c.kg??''}" placeholder="0,0" aria-label="Poids du colis ${i+1} en kg">
    <input type="number" min="0" step="1" data-cf="l" id="c${i}l" value="${c.l??''}" placeholder="L" aria-label="Longueur du colis ${i+1}">
    <input type="number" min="0" step="1" data-cf="w" id="c${i}w" value="${c.w??''}" placeholder="l" aria-label="Largeur du colis ${i+1}">
    <input type="number" min="0" step="1" data-cf="h" id="c${i}h" value="${c.h??''}" placeholder="h" aria-label="Hauteur du colis ${i+1}">
    <button class="icon-btn" type="button" data-act="colis-rm" data-ci="${i}" aria-label="Retirer le colis ${i+1}" ${list.length<2?'disabled':''}>×</button></div>`).join('');
}
function readColis(){
  return [...document.querySelectorAll('#colis-rows .colis-row')].map(r=>{const g=f=>{const v=r.querySelector(`[data-cf="${f}"]`).value;return v===''?null:+v};return{kg:g('kg'),l:g('l'),w:g('w'),h:g('h')}})
    .filter(c=>c.kg!=null||c.l!=null||c.w!=null||c.h!=null);
}
function colisTotal(list){
  if(!list.length)return'';
  const reel=list.reduce((t,c)=>t+(+c.kg||0),0),vol=list.reduce((t,c)=>t+volKg(c),0),tax=list.reduce((t,c)=>t+Math.max(+c.kg||0,volKg(c)),0);
  return`${list.length} colis · poids réel <b>${nfk.format(reel)} kg</b>${vol?` · volumétrique ${nfk.format(vol)} kg · <span title="Poids retenu par DHL : le plus élevé des deux, colis par colis">taxable <b>${nfk.format(tax)} kg</b></span>`:''}`;
}

/* Détail d'une vente : onglets Facture · Règlements · Documents · Expédition */
let vdTab='facture';
let assetsNS=null;
assetsNS={
  upload:async(file,o)=>{const type=(o&&o.type)||file.type;
    const r=await fetch('/api/files',{method:'POST',credentials:'same-origin',headers:{'Content-Type':type,'X-Filename':encodeURIComponent(file.name)},body:file});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok)throw{code:r.status===413?'too_large':r.status===415?'unsupported_type':j.error||'upstream_error'};return j},
  delete:async id=>{await fetch('/api/files/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'});return{}}
};
const TRANSPORTEURS={
  DHL:n=>`https://www.dhl.com/fr-fr/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(n)}`,
  FedEx:n=>`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  UPS:n=>`https://www.ups.com/track?loc=fr_FR&tracknum=${encodeURIComponent(n)}`,
  Chronopost:n=>`https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${encodeURIComponent(n)}`,
  Autre:null
};
const EXP_STATUTS=[['preparer','À préparer','neutral'],['expedie','Expédié','acc'],['transit','En transit','acc'],['douane','En douane','warn'],['livre','Livré','ok'],['incident','Incident','bad']];
const expOf=v=>v.expedition||{};
const expPill=v=>{const e=expOf(v);if(!e.statut&&!e.suivi)return'';const s=EXP_STATUTS.find(x=>x[0]===(e.statut||'preparer'))||EXP_STATUTS[0];return`<span class="pill ${s[2]}">${s[1]}</span>`};
const DOC_CATS=['Bordereau DHL','Déclaration d\'export (DAE)','Avis de sortie','Preuve de livraison','Attestation de réception','Attestation envoyée (à signer)','Facture commerciale','Facture fournisseur','Photo','Autre'];
const fmtSize=b=>b>1048576?(b/1048576).toFixed(1).replace('.',',')+' Mo':Math.max(1,Math.round(b/1024))+' Ko';

let vdLast='';
function venteDetail(id,tab){
  const v=S.ventes.find(x=>x.id===id);if(!v)return;factureFor(v);
  if(tab)vdTab=tab;else if(id!==vdLast)vdTab='facture';vdLast=id;
  const c=cli(v.clientId),regs=S.reglements.filter(r=>r.venteId===v.id).sort((a,b)=>a.date.localeCompare(b.date));
  const docs=v.documents||[],e=expOf(v);
  const tb=(k,l,n)=>`<button role="tab" aria-selected="${vdTab===k}" data-act="vd-tab" data-k="${k}" data-id="${v.id}">${l}${n?` <span class="tab-n">${n}</span>`:''}</button>`;
  let body='';
  if(vdTab==='facture')body=`<div class="ticket-meta"><span>Échéance <b>${dF.format(new Date(v.echeance))}</b></span>${statutPill(v)}</div>
  <div class="table-wrap"><table><thead><tr><th>Monture</th><th class="num">Qté</th><th class="num">PU HT</th><th class="num">Montant HT</th></tr></thead><tbody>
  ${v.lignes.map(l=>`<tr><td><b>${esc(l.designation)}</b><span class="sub"><span class="mono">${esc(l.etiquette)}</span>${l.detail?' · '+esc(l.detail):''}</span></td><td class="num">${l.qte}</td><td class="num">${puCell(l)}</td><td class="num">${money(lineHT(l))}</td></tr>`).join('')}
  </tbody></table></div>
  <dl class="totals" style="max-width:320px;margin-left:auto">${remTotals(v)}${taxLines(v,regOf(v),v.tvaIntra)}</dl>${dioBlock(v,c)}`;
  else if(vdTab==='reglements')body=`${regs.length?`<div class="docs">${regs.map(r=>`<div class="doc-row static"><span><b>${money(r.montant)}</b><span class="sub">${dF.format(new Date(r.date))} · ${esc(r.mode)}${regInfo(r)?' · '+esc(regInfo(r)):''}</span>${r.justifBanque?`<span class="sub" style="color:var(--ok)">Justifié à la banque le ${dF.format(new Date(r.justifBanque.le))}</span>`:''}</span><span class="row-btns">${/Virement/.test(r.mode)?`<button class="btn small" data-act="bk-open" data-id="${v.id}" data-rid="${r.id}">${r.justifBanque?'Renvoyer à la banque':'Justifier à la banque'}</button>`:''}${closedWeek(r.date)?'<span class="hint">Semaine clôturée</span>':`<button class="link danger-link" data-act="k-regdel" data-id="${r.id}">Supprimer</button>`}</span></div>`).join('')}</div>`:'<p class="muted">Aucun règlement pour cette facture.</p>'}
  <dl class="totals" style="max-width:320px;margin-left:auto"><dt>Total facturé</dt><dd>${money(v.ttc)}</dd><dt>Réglé</dt><dd>${money(paidOf(v))}</dd><dt class="big">Reste à payer</dt><dd class="big">${money(resteOf(v))}</dd></dl>`;
  else if(vdTab==='documents')body=attBlock(v)+`${assetsNS?`<label class="drop small" id="vd-drop" for="vd-file"><b>Ajouter des documents</b><span>Bordereau DHL, facture, photo… · PDF ou image, 20 Mo maximum</span>
    <input id="vd-file" type="file" multiple accept=".pdf,image/*,.txt,.csv" hidden data-vid="${v.id}"></label><p class="scan-msg" id="vd-msg" role="status"></p>`
    :`<p class="notice" style="margin:0">L'ajout de documents n'est possible que pour le propriétaire de Prismea, dans claude.ai.</p>`}
  ${docs.length?`<div class="docs">${[...docs].sort((a,b)=>b.date.localeCompare(a.date)).map(d=>`<div class="doc-row static"><span class="doc-file"><span class="doc-ico">${/pdf/.test(d.type)?'PDF':/image/.test(d.type)?'IMG':'TXT'}</span><span><a href="/api/files/${esc(d.id)}" target="_blank" rel="noopener"><b>${esc(d.nom)}</b></a><span class="sub">${esc(d.cat)} · ${fmtSize(d.taille)} · ajouté le ${dF.format(new Date(d.date))}</span></span></span>
    <span class="row-btns"><select data-doccat="${esc(d.id)}" data-vid="${v.id}" aria-label="Type de document" id="dc-${esc(d.id)}">${DOC_CATS.map(x=>`<option ${x===d.cat?'selected':''}>${x}</option>`).join('')}</select>${assetsNS?`<button class="link danger-link" data-act="vd-docdel" data-id="${v.id}" data-doc="${esc(d.id)}">Retirer</button>`:''}</span></div>`).join('')}</div>`:'<p class="muted">Aucun document pour cette vente.</p>'}`;
  else if(vdTab==='douane')body=douaneTab(v);
  else{
    const link=e.suivi&&TRANSPORTEURS[e.transporteur||'DHL']?TRANSPORTEURS[e.transporteur||'DHL'](e.suivi):null;
    body=`<fieldset>
      <label>Transporteur<select id="x-tr">${Object.keys(TRANSPORTEURS).map(t=>`<option ${t===(e.transporteur||S.societe.transporteur||'DHL')?'selected':''}>${t}</option>`).join('')}</select></label>
      <label>N° de suivi (lettre de transport)<input id="x-suivi" value="${esc(e.suivi||'')}" class="mono-in" spellcheck="false" placeholder="Ex. 1234567890"></label>
      <label>Date d'expédition<input id="x-date" type="date" value="${esc(e.date||'')}"></label>
      <label>Statut<select id="x-st">${EXP_STATUTS.map(([k,l])=>`<option value="${k}" ${k===(e.statut||'preparer')?'selected':''}>${l}</option>`).join('')}</select></label>
      <label>Date de livraison<input id="x-liv" type="date" value="${esc(e.livraison||'')}"></label>
      <label class="full">Note<input id="x-note" value="${esc(e.note||'')}" placeholder="Ex. dédouanement à Libreville"></label></fieldset>
    <fieldset><legend>Colis</legend><div class="full colis-box">
      <div class="colis-head"><span>N°</span><span>Poids (kg)</span><span>Longueur (cm)</span><span>Largeur (cm)</span><span>Hauteur (cm)</span><span></span></div>
      <div id="colis-rows">${colisRows(e.colis&&e.colis.length?e.colis:[{}])}</div>
      <div class="row-between"><button class="btn small" type="button" data-act="colis-add">+ Ajouter un colis</button><span class="colis-tot" id="colis-tot">${colisTotal(e.colis||[])}</span></div>
      ${e.poids&&!(e.colis&&e.colis.length)?`<p class="hint" style="margin:0">Ancienne saisie : ${esc(e.poids)}</p>`:''}
    </div></fieldset>
    ${dhlBlock(v)}
    <div class="track-box">${link?`<div><b>Suivre le colis</b><span class="sub">${esc(e.transporteur||'DHL')} · <span class="mono">${esc(e.suivi)}</span></span></div><a class="btn primary" href="${link}" target="_blank" rel="noopener">Ouvrir le suivi ${esc(e.transporteur||'DHL')} ↗</a>`
      :`<span class="muted">Saisissez le n° de suivi puis enregistrez : un bouton ouvrira directement le suivi du colis sur le site du transporteur.</span>`}</div>`;
  }
  openModal('Facture '+v.facture,`${c?c.nom:''} · vente ${v.num} du ${dF.format(new Date(v.date))}`,
  `<div class="tabs" role="tablist">${tb('facture','Facture')}${tb('reglements','Règlements',regs.length)}${tb('documents','Documents',docs.length)}${tb('expedition','Expédition')}${regOf(v)!=='fr'?`<button role="tab" aria-selected="${vdTab==='douane'}" data-act="vd-tab" data-k="douane" data-id="${v.id}">Douane et TVA ${justifStatut(v)==='complet'?'<span class="tab-n ok-n">✓</span>':`<span class="tab-n warn-n">${justifs(v).filter(x=>x.ok).length}/${justifs(v).length}</span>`}</button>`:''}${expPill(v)?'<span class="tab-pill">'+expPill(v)+'</span>':''}</div>${body}`,
  vdTab==='douane'&&regOf(v)!=='fr'?`<button class="btn" data-act="close">Fermer</button><button class="btn primary" data-act="vd-dousave" data-id="${v.id}">Enregistrer</button>`
  :vdTab==='expedition'?`<button class="btn" data-act="close">Fermer</button><button class="btn primary" data-act="vd-expsave" data-id="${v.id}">Enregistrer l'expédition</button>`
  :`<button class="btn" data-act="k-pdf" data-id="${v.id}" ${dlNS?'':'disabled title="Téléchargement indisponible dans cette vue"'}>Télécharger la facture (PDF)</button>${resteOf(v)>0.005?`<button class="btn primary" data-act="k-pay" data-id="${v.id}">Encaisser</button>`:'<button class="btn primary" data-act="close">Fermer</button>'}`);
  $('.modal-card').classList.add('wide');
  const f=$('#vd-file'),dz=$('#vd-drop');
  if(f){f.addEventListener('change',()=>{uploadDocs(v.id,[...f.files]);f.value=''});
    ['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,x=>{x.preventDefault();dz.classList.add('over')}));
    ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,x=>{x.preventDefault();dz.classList.remove('over')}));
    dz.addEventListener('drop',x=>uploadDocs(v.id,[...x.dataTransfer.files]))}
}
async function uploadDocs(vid,files,forceCat,backTab){
  const v=S.ventes.find(x=>x.id===vid);if(!v||!files.length||!assetsNS)return;
  const msg=t=>{const m=$('#vd-msg');if(m)m.textContent=t};
  let ok=0;const errs=[];
  for(const file of files){
    msg(`Envoi de ${file.name}…`);
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    const type=file.type||({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',txt:'text/plain',csv:'text/csv'})[ext]||'';
    try{
      const r=await assetsNS.upload(file,type?{type}:undefined);
      v.documents=v.documents||[];
      v.documents.push({id:r.id,nom:file.name,type:r.contentType||type,taille:r.sizeBytes||file.size,date:new Date().toISOString(),cat:forceCat||(/dhl|awb|waybill|bordereau|lta/i.test(file.name)?'Bordereau DHL':/dae|ead|export|ecs|mrn|declaration/i.test(file.name)?'Déclaration d\'export (DAE)':/sortie|exit/i.test(file.name)?'Avis de sortie':/pod|livraison|delivery|reception|réception/i.test(file.name)?'Preuve de livraison':/facture|invoice/i.test(file.name)?'Facture commerciale':/image/.test(type)?'Photo':'Autre')});
      ok++;save();
    }catch(e){const c=e&&e.code;errs.push(`${file.name} : ${c==='too_large'?'fichier trop lourd (20 Mo maximum)':c==='unsupported_type'?'format non accepté (PDF, image ou texte uniquement)':c==='quota_or_state'?'espace de stockage plein':'envoi impossible pour le moment'}`)}
  }
  venteDetail(vid,backTab||'documents');
  const m=$('#vd-msg');if(m){m.textContent=errs.length?errs.join(' · '):`${ok} document${ok>1?'s':''} ajouté${ok>1?'s':''}.`;m.classList.toggle('bad',!!errs.length)}
}

async function dhlRefresh(id){
  const m=$('#dhl-msg');if(m)m.textContent='Interrogation de DHL…';
  try{await window.PrismeaSync.flush();
    const r=await fetch('/api/dhl/refresh/'+encodeURIComponent(id),{method:'POST',credentials:'same-origin'});const j=await r.json().catch(()=>({}));
    if(j.vente)window.PrismeaSync.applyRemote('ventes',id,j.vente);
    render();venteDetail(id,'expedition');
    toast(j.ok?'Suivi DHL actualisé':(j.erreur||'DHL n\'a pas répondu'));
  }catch(x){toast('Suivi DHL indisponible pour le moment.')}
}
function dhlBlock(v){
  const e=expOf(v),d=e.dhl;
  if(!window.__PRISMEA__.dhl||(e.transporteur&&e.transporteur!=='DHL'))return'';
  if(!e.suivi)return'<p class="hint" style="margin:0">Suivi DHL automatique activé : saisissez le n° de lettre de transport, le statut se mettra à jour tout seul.</p>';
  return`<div class="dhl-box"><div class="row-between"><div><b>Suivi DHL automatique</b><span class="sub">${d&&d.checkedAt?'Vérifié le '+dF.format(new Date(d.checkedAt))+' à '+new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(new Date(d.checkedAt)):'Pas encore vérifié'}</span></div>
    <button class="btn small" data-act="vd-dhl" data-id="${v.id}">Actualiser</button></div>
    <p class="scan-msg" id="dhl-msg" role="status">${d&&d.erreur?esc(d.erreur):''}</p>
    ${d&&d.texte?`<p style="margin:0"><b>${esc(d.texte)}</b>${d.lieu?' · '+esc(d.lieu):''}${d.date?' · '+dF.format(new Date(d.date)):''}${d.estimee?`<span class="sub">Livraison estimée : ${dF.format(new Date(d.estimee))}</span>`:''}</p>`:''}
    ${d&&d.evenements&&d.evenements.length?`<ol class="dhl-events">${d.evenements.map(x=>`<li><span>${x.date?dF.format(new Date(x.date))+' '+new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(new Date(x.date)):''}</span><b>${esc(x.texte)}</b>${x.lieu?`<em>${esc(x.lieu)}</em>`:''}</li>`).join('')}</ol>`:''}
  </div>`;
}

/* ---------- Paramètres ---------- */
/* ---------- Connexion DIOPTRA ----------
   La clé d'intégration est gardée par le serveur : le navigateur ne voit que « clé enregistrée oui / non ». */
let DIO={configured:false,loaded:false,url:'',keySet:false,keyHint:''};
async function loadDio(){try{const r=await fetch('/api/dioptra/config',{credentials:'same-origin'});if(r.ok){DIO={...await r.json(),loaded:true}}}catch(e){}return DIO}
loadDio().then(()=>{if(location.hash==='#parametres'&&!$('#dio-key')?.value)render()});
const dtF=new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
function dioBlock(v,c){
  const mag=c&&c.dioptraMagasin,d=v.dioptra||{};
  const nb=v.lignes.reduce((t,l)=>t+l.qte,0),sansEAN=v.lignes.filter(l=>!(mon(l.montureId)||{}).ean).length;
  const lines=[];let btn='';
  if(d.statut==='receptionnee'){
    lines.push(`<span class="dio-ok">Réceptionnée dans DIOPTRA</span><span class="sub">La livraison${d.ref?' '+esc(d.ref):''} a déjà été réceptionnée par l'opticien : elle ne peut plus être renvoyée.${d.le?' Envoyée le '+dtF.format(new Date(d.le))+'.':''}</span>`);
  }else if(d.statut==='envoye'){
    lines.push(`<span class="dio-ok">Envoyée à DIOPTRA le ${dtF.format(new Date(d.le))} par ${esc(String(d.par||'').split(' ')[0])}</span><span class="sub">Magasin « ${esc(d.magasin||mag||'')} » · ${d.articles||d.lignes} monture${(d.articles||d.lignes)>1?'s':''}${d.ref?' · réf. '+esc(d.ref):''}${d.envois>1?` · ${d.envois} envois`:''} · tant qu'elle n'est pas réceptionnée, un nouvel envoi met à jour la livraison.</span>`);
    btn=`<button class="btn small" data-act="dio-send" data-id="${v.id}" data-force="1" ${mag&&DIO.configured?'':'disabled'}>Renvoyer (mettre à jour)</button>`;
  }else if(mag){
    lines.push(`<span><b>DIOPTRA</b> · les ${nb} monture${nb>1?'s':''} arriveront en réception dans le magasin « ${esc(mag)} ».</span>`);
    btn=`<button class="btn primary small" data-act="dio-send" data-id="${v.id}" ${DIO.configured?'':'disabled'}>Envoyer à DIOPTRA</button>`;
  }else lines.push(`<span><b>DIOPTRA</b> · <span class="muted">ce client n'a pas de magasin DIOPTRA : renseignez-le dans sa fiche pour l'envoi automatique, ou téléchargez le fichier à importer à la main.</span></span>`);
  if(d.erreur&&d.statut!=='receptionnee')lines.push(`<span class="sub warn-txt">Dernier envoi refusé le ${dtF.format(new Date(d.erreur.le))} : ${esc(dioMsg(d.erreur))}</span>`);
  if(mag&&!DIO.configured&&DIO.loaded&&d.statut!=='receptionnee')lines.push('<span class="sub warn-txt">Connexion DIOPTRA non réglée : renseignez l\'adresse et la clé dans les Paramètres.</span>');
  if(sansEAN)lines.push(`<span class="sub warn-txt">${sansEAN} ligne${sansEAN>1?'s':''} sans code EAN : l'opticien devra les rapprocher à la main.</span>`);
  return`<div class="dio-box" id="dio-box"><span class="dio-txt">${lines.join('')}</span><span class="row-btns">${btn}<button class="btn small ghost" data-act="dio-dl" data-id="${v.id}" ${dlNS?'':'disabled'}>Télécharger pour DIOPTRA</button></span></div>`;
}
function dioMsg(e){
  if(e.http===401||e.http===403)return'Vérifiez la clé DIOPTRA dans les paramètres.';
  if(e.http===400)return e.message||'données refusées par DIOPTRA';
  if(e.http===409)return'la livraison a déjà été réceptionnée dans DIOPTRA.';
  if(e.http===404)return'adresse DIOPTRA introuvable : vérifiez l\'adresse d\'envoi dans les paramètres.';
  return e.message||(e.http?'erreur '+e.http:'envoi impossible');
}
async function dioSend(id,force,btn){
  btn.disabled=true;const old=btn.textContent;btn.textContent='Envoi en cours…';
  try{await window.PrismeaSync.flush()}catch(e){}
  let r,j={};try{r=await fetch('/api/dioptra/send/'+encodeURIComponent(id),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({force:!!force})});j=await r.json().catch(()=>({}))}
  catch(e){btn.disabled=false;btn.textContent=old;toast('Connexion perdue : rien n\'a été envoyé.');return}
  const v=S.ventes.find(x=>x.id===id);
  if(j.dioptra&&v){v.dioptra=j.dioptra;window.PrismeaSync.applyRemote('ventes',id,j.vente||v,false)}
  if(r.ok)toast(force?'Livraison mise à jour dans DIOPTRA':'Facture envoyée à DIOPTRA');
  else if(j.error==='magasin_manquant')toast('Renseignez le magasin DIOPTRA dans la fiche du client.');
  else if(j.error==='non_configure')toast('Réglez la connexion DIOPTRA dans les Paramètres.');
  else if(r.status===409)toast('Déjà réceptionnée dans DIOPTRA : la facture ne peut plus être renvoyée.');
  else toast('Envoi refusé : '+dioMsg(j.dioptra&&j.dioptra.erreur?j.dioptra.erreur:{http:j.http||r.status,message:j.message}));
  if(!$('#modal').hidden)venteDetail(id,'facture');
}
async function dioDownload(id){
  const v=S.ventes.find(x=>x.id===id);if(!v)return;
  try{await window.PrismeaSync.flush()}catch(e){}
  try{const r=await fetch('/api/dioptra/payload/'+encodeURIComponent(id),{credentials:'same-origin'});if(!r.ok)throw 0;const p=await r.json();
    offerFile(`DIOPTRA ${v.facture||v.num}.json`,JSON.stringify(p,null,2))}
  catch(e){toast('Le fichier n\'a pas pu être préparé, réessayez.')}
}
function viewParametres(){
  const s=S.societe,v=k=>esc(s[k]??'');
  const nbDocs=S.ventes.reduce((t,x)=>t+(x.documents||[]).length,0);
  return`<a class="back" href="#">← Accueil</a>
  <div class="head"><div><h1>Paramètres</h1><p>Les informations de votre société et les réglages de Prismea.</p></div></div>
  <div class="settings">
  <section class="panel"><h3>Ma société</h3><p class="muted" style="margin-bottom:12px">Elles figurent sur toutes les factures.</p>
    <fieldset>
      <label class="full">Raison sociale <span class="req">*</span><input id="s-nom" value="${v('nom')}"></label>
      <label>Forme juridique<input id="s-forme" value="${v('forme')}" placeholder="SAS, SARL…"></label>
      <label>Capital social<input id="s-capital" value="${v('capital')}" placeholder="Ex. 10 000 €"></label>
      <label class="full">Adresse <span class="req">*</span><input id="s-adresse" value="${v('adresse')}"></label>
      <label>Code postal<input id="s-cp" value="${v('cp')}"></label><label>Ville<input id="s-ville" value="${v('ville')}"></label>
      <label>Téléphone<input id="s-tel" value="${v('tel')}"></label><label>E-mail<input id="s-email" value="${v('email')}"></label>
    </fieldset></section>
  <section class="panel"><h3>Immatriculation</h3>
    <fieldset>
      <label>SIREN ou SIRET <span class="req">*</span><input id="s-siren" value="${v('siren')}" class="mono-in"></label>
      <label>RCS<input id="s-rcs" value="${v('rcs')}" placeholder="Ex. RCS Paris"></label>
      <label class="full">N° TVA intracommunautaire<input id="s-tva" value="${v('tvaIntra')}" class="mono-in" placeholder="FR…"></label>
    </fieldset></section>
  <section class="panel"><h3>Banque et facturation</h3>
    <fieldset>
      <label class="full">IBAN<input id="s-iban" value="${v('iban')}" class="mono-in"></label>
      <label>BIC<input id="s-bic" value="${v('bic')}" class="mono-in"></label>
      <label>Banque<input id="s-banque" value="${v('banque')}"></label>
      <label>E-mail du conseiller bancaire<input id="s-mailbq" type="email" value="${v('emailBanque')}" placeholder="Pour les justificatifs de virement"></label>
      <label>Délai de paiement<span class="suffix"><input id="s-delai" type="number" min="0" value="${s.delai??30}"><span>jours</span></span></label>
      <label>Transporteur par défaut<select id="s-transp">${Object.keys(TRANSPORTEURS).map(t=>`<option ${t===(s.transporteur||'DHL')?'selected':''}>${t}</option>`).join('')}</select></label>
    </fieldset></section>
  <div class="settings-save"><button class="btn primary" data-act="set-save">Enregistrer les paramètres</button></div>
  <section class="panel" id="dio-panel"><h3>Connexion DIOPTRA</h3>
    <p class="muted" style="margin-bottom:12px">Pour envoyer les factures en réception de stock dans DIOPTRA. La clé est gardée par le serveur de Prismea et n'est jamais affichée.</p>
    <fieldset>
      <label class="full">Adresse d'envoi<input id="dio-url" class="mono-in" value="${esc(DIO.url||'https://app.dioptra.pro/api/livraisons')}" spellcheck="false" autocomplete="off"></label>
      <label class="full">Clé d'intégration<input id="dio-key" type="password" class="mono-in" placeholder="${DIO.keySet?'Clé enregistrée ('+esc(DIO.keyHint)+') : laissez vide pour la garder':'dpt_…'}" autocomplete="new-password" spellcheck="false"><span class="hint" id="dio-st">${DIO.loaded?(DIO.keySet?'Connexion réglée.':'Aucune clé enregistrée.'):'Chargement…'}</span></label>
    </fieldset>
    <div class="row-btns" style="justify-content:flex-start;margin-top:12px"><button class="btn primary" data-act="dio-save">Enregistrer la connexion</button>${DIO.keySet?'<button class="btn danger" data-act="dio-del">Retirer la clé</button>':''}</div>
  </section>
  <section class="panel"><h3>Sauvegarde des données</h3>
    <p class="muted" style="margin-bottom:12px">Les données sont enregistrées en ligne et partagées entre Nicolas, Laurent et Jennifer. Vous pouvez télécharger une sauvegarde complète à tout moment. Restaurer une sauvegarde remplace les données pour tous les utilisateurs.</p>
    <div class="facts" style="border:0;padding:0;margin-bottom:14px">
      <div class="fact"><span>Clients</span><b>${S.clients.length}</b></div><div class="fact"><span>Montures</span><b>${S.montures.length}</b></div>
      <div class="fact"><span>Ventes</span><b>${S.ventes.length}</b></div><div class="fact"><span>Documents joints</span><b>${nbDocs}</b></div></div>
    <div class="row-btns" style="justify-content:flex-start"><button class="btn" data-act="set-backup" ${dlNS?'':'disabled'}>Télécharger une sauvegarde</button>
      <label class="btn" for="set-restore" style="cursor:pointer">Restaurer une sauvegarde<input id="set-restore" type="file" accept=".json,application/json" hidden></label></div>
    <p class="scan-msg" id="set-msg" role="status"></p></section>
  </div>`;
}

function payForm(id){
  const v=S.ventes.find(x=>x.id===id);if(!v)return;const c=cli(v.clientId);
  openModal('Encaisser la facture '+v.facture,`${c?c.nom:''} · reste à payer ${money(resteOf(v))}`,`
  <fieldset>
    <label>Date du règlement<input id="p-date" type="date" value="${isoD(new Date())}"></label>
    <label>Montant<span class="suffix"><input id="p-mt" type="number" min="0" step="0.01" value="${resteOf(v).toFixed(2)}"><span>€</span></span></label>
    <label class="full">Mode de règlement<select id="p-mode">${PAY_MODES.map(m=>`<option>${m}</option>`).join('')}</select></label>
  </fieldset>
  <fieldset id="p-detail">${payDetailFields('Virement','p')}</fieldset>`,
  `<button class="btn" data-act="k-open" data-id="${v.id}">Retour</button><button class="btn primary" id="p-ok">Enregistrer le règlement</button>`,()=>{
    $('#p-mt').focus();$('#p-mt').select();
    $('#p-mode').addEventListener('change',e=>{const keep={banque:$('#p-banque')?.value||'',ref:$('#p-ref')?.value||''};$('#p-detail').innerHTML=payDetailFields(e.target.value,'p',keep)});
    $('#p-ok').onclick=()=>{
      const d=$('#p-date').value,mt=r2(+$('#p-mt').value||0);
      if(!d){toast('Indiquez la date du règlement.');return}
      if(mt<=0){toast('Indiquez un montant supérieur à zéro.');return}
      if(mt>resteOf(v)+0.005){toast(`Le montant dépasse le reste à payer (${money(resteOf(v))}).`);return}
      if(closedWeek(d)){toast('Cette semaine est clôturée : choisissez une autre date.');return}
      const now=new Date();
      S.reglements.push({id:'g'+Date.now().toString(36),venteId:v.id,clientId:v.clientId,date:new Date(d+'T'+now.toTimeString().slice(0,8)).toISOString(),montant:mt,mode:$('#p-mode').value,banque:($('#p-banque')?.value||'').trim(),ref:($('#p-ref')?.value||'').trim()});
      save();closeModal();render();toast(`Règlement de ${money(mt)} enregistré${resteOf(v)<=0.005?' : facture soldée':''}`);
    };
  });
}

/* Facture PDF */
function invoicePDF(v){
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'mm',format:'a4'});
  const txt=s=>String(s??'').replace(/[  ]/g,' ').replace(/□/g,'/').replace(/−/g,'-');
  const eur=n=>txt(money(n));
  const s=S.societe,c=cli(v.clientId)||{},p=paysByCode(c.pays),reg=regOf(v);
  const W=210,L=16,R=W-16;let y=18;
  pdf.setFont('helvetica','bold');pdf.setFontSize(15);pdf.text(txt(s.nom||'Votre société'),L,y);
  pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(80);
  const sl=[[s.forme,s.capital?'au capital de '+s.capital:''].filter(Boolean).join(' '),s.adresse,[s.cp,s.ville].filter(Boolean).join(' '),[s.tel,s.email].filter(Boolean).join(' · '),
    s.siren?'SIREN '+s.siren+(s.rcs?' · '+s.rcs:''):'',s.tvaIntra?'N° TVA '+s.tvaIntra:''].filter(Boolean);
  sl.forEach((t,i)=>pdf.text(txt(t),L,y+5+i*4));
  pdf.setTextColor(0);pdf.setFont('helvetica','bold');pdf.setFontSize(20);pdf.text('FACTURE',R,y,{align:'right'});
  pdf.setFontSize(10);pdf.text(txt('N° '+v.facture),R,y+7,{align:'right'});
  pdf.setFont('helvetica','normal');pdf.setFontSize(9);
  pdf.text(txt('Date : '+dF.format(new Date(v.date))),R,y+12,{align:'right'});
  pdf.text(txt('Échéance : '+dF.format(new Date(v.echeance))),R,y+16.5,{align:'right'});
  pdf.text(txt('Vente '+v.num),R,y+21,{align:'right'});
  y=Math.max(y+5+sl.length*4,y+24)+8;
  pdf.setDrawColor(200);pdf.setFillColor(246,248,250);pdf.roundedRect(110,y,R-110,34,2,2,'F');
  pdf.setFontSize(8);pdf.setTextColor(100);pdf.text('FACTURÉ À',114,y+6);pdf.setTextColor(0);
  pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);pdf.text(txt(c.nom||''),114,y+12);
  pdf.setFont('helvetica','normal');pdf.setFontSize(8.8);
  const cl=[...(c.adresse||'').split('\n'),[c.ville,p?p[1]:''].filter(Boolean).join(', '),c.tvaIntra?'N° TVA '+c.tvaIntra:'',c.nif?'NIF '+c.nif:''].filter(Boolean).slice(0,4);
  cl.forEach((t,i)=>pdf.text(txt(t),114,y+17+i*4.2));
  y+=44;
  const hasRem=v.lignes.some(l=>remL(l));
  const body=v.lignes.map(l=>{const r=[txt(l.etiquette),txt(l.designation+(l.detail?' - '+l.detail:'')),String(l.qte),eur(l.pu)];if(hasRem)r.push(remL(l)?(isE(l.remT)?'-'+eur(remL(l)):'-'+txt(fmtPct(remL(l)))+' %'):'');r.push(eur(lineHT(l)));return r});
  if(pdf.autoTable){
    const head=['Réf.','Désignation','Qté','PU HT'];if(hasRem)head.push('Remise');head.push('Montant HT');
    const cs={0:{cellWidth:20},2:{halign:'right',cellWidth:12},3:{halign:'right',cellWidth:24}};
    if(hasRem){cs[4]={halign:'right',cellWidth:18};cs[5]={halign:'right',cellWidth:28}}else cs[4]={halign:'right',cellWidth:30};
    pdf.autoTable({startY:y,head:[head],body,margin:{left:L,right:16},
      styles:{font:'helvetica',fontSize:8.8,cellPadding:2.2},headStyles:{fillColor:[10,102,112],textColor:255},
      columnStyles:cs});
    y=pdf.lastAutoTable.finalY+6;
  }else{body.forEach(r=>{pdf.text(r.join('   '),L,y);y+=5});y+=4}
  const tot=[];if(v.rem||v.remLignes)tot.push(['Total brut HT',eur(v.brut)]);
  if(v.remLignes)tot.push(['Remises sur montures','-'+eur(v.remLignes)]);
  if(v.rem)tot.push([txt(remCliLabel(v)),'-'+eur(v.rem)]);
  tot.push(['Total HT',eur(v.ht)]);
  if(reg==='fr')tot.push(['TVA 20 %',eur(v.tva)],['Total TTC',eur(v.ttc)]);else tot.push(['TVA','Non applicable']);
  const paid=paidOf(v);if(paid>0)tot.push(['Déjà réglé','-'+eur(paid)]);
  tot.push(['Net à payer',eur(resteOf(v))]);
  tot.forEach(([k,val],i)=>{const last=i===tot.length-1;pdf.setFont('helvetica',last?'bold':'normal');pdf.setFontSize(last?11:9.2);
    if(last){pdf.setDrawColor(10,102,112);pdf.line(120,y-4,R,y-4)}pdf.text(txt(k),122,y);pdf.text(val,R,y,{align:'right'});y+=last?7:5});
  y+=4;pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);
  const legal=reg==='fr'?'':reg==='ue'?`Exonération de TVA, article 262 ter I du CGI (livraison intracommunautaire). Autoliquidation par le client${v.tvaIntra?', n° TVA '+v.tvaIntra:''}.`:'Exonération de TVA, article 262 I du CGI (exportation).';
  const lines=[legal,
    `Paiement au plus tard le ${dF.format(new Date(v.echeance))}${s.iban?', par virement : IBAN '+s.iban+(s.bic?' - BIC '+s.bic:''):''}.`,
    'Pas d\'escompte pour paiement anticipé. En cas de retard de paiement, des pénalités au taux de trois fois le taux d\'intérêt légal sont exigibles, ainsi qu\'une indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du Code de commerce).'].filter(Boolean);
  lines.forEach(t=>{const w=pdf.splitTextToSize(txt(t),R-L);if(y+w.length*4>285){pdf.addPage();y=20}pdf.text(w,L,y);y+=w.length*4+2});
  return pdf.output('arraybuffer');
}
function downloadInvoice(id){
  const v=S.ventes.find(x=>x.id===id);if(!v)return;
  if(!window.jspdf){toast('Le module PDF n\'a pas pu se charger. Vérifiez la connexion internet.');return}
  if(!S.societe.nom)toast('Astuce : complétez « Ma société » pour que vos informations figurent sur la facture.');
  const c=cli(v.clientId);
  offerFile(`Facture ${v.facture} - ${(c?c.nom:'client').replace(/[\\/:*?"<>|]/g,'')}.pdf`,invoicePDF(v));
}

/* Exports CSV */
function journalCSV(vs,name){
  const rows=[['Facture','Vente','Date','Client','Pays','Régime TVA','Total HT','TVA','Total TTC','Réglé','Reste','Échéance','Statut']];
  vs.forEach(v=>{const c=cli(v.clientId)||{};rows.push([v.facture,v.num,dF.format(new Date(v.date)),c.nom||'',(paysByCode(c.pays)||[])[1]||'',REGIME[regOf(v)],csvNum(v.ht),csvNum(v.tva),csvNum(v.ttc),csvNum(paidOf(v)),csvNum(resteOf(v)),dF.format(new Date(v.echeance)),STATUT[statutOf(v)][0]])});
  offerFile(name,csvOf(rows));
}
function weekCSV(){
  const a=semRef,b=addDays(a,7);
  const vs=S.ventes.filter(v=>{const d=new Date(v.date);return d>=a&&d<b});
  const rs=S.reglements.filter(r=>{const d=new Date(r.date);return d>=a&&d<b});
  const rows=[['Type','Date','Facture','Client','Mode','Banque','Référence','HT','TVA','TTC / Montant']];
  vs.forEach(v=>rows.push(['Vente',dF.format(new Date(v.date)),v.facture,cli(v.clientId)?.nom||'','','','',csvNum(v.ht),csvNum(v.tva),csvNum(v.ttc)]));
  rs.forEach(r=>{const v=S.ventes.find(x=>x.id===r.venteId);rows.push(['Règlement',dF.format(new Date(r.date)),v?v.facture:'',cli(r.clientId)?.nom||'',r.mode,r.banque||'',r.ref||'','','',csvNum(r.montant)])});
  offerFile(`Caisse semaine du ${isoD(a)}.csv`,csvOf(rows));
}

document.addEventListener('click',e=>{
  const row=e.target.closest('tr.row-link[data-vid]');
  if(row&&!e.target.closest('[data-act]')){venteDetail(row.dataset.vid);return}
  const b=e.target.closest('[data-act]');if(!b)return;const id=b.dataset.id;
  const shift=n=>{const r=new Date(per.ref);if(per.mode==='jour')r.setDate(r.getDate()+n);else if(per.mode==='semaine')r.setDate(r.getDate()+7*n);else if(per.mode==='annee')r.setFullYear(r.getFullYear()+n);else{r.setDate(1);r.setMonth(r.getMonth()+n)}per.ref=r;render()};
  switch(b.dataset.act){
    case'k-tab':caisseTab=b.dataset.k;render();break;
    case'k-pmode':per.mode=b.dataset.k;render();break;
    case'k-prev':shift(-1);break;
    case'k-next':shift(1);break;
    case'k-today':per.ref=new Date();render();break;
    case'k-wprev':semRef=addDays(semRef,-7);render();break;
    case'k-wnext':semRef=addDays(semRef,7);render();break;
    case'k-wtoday':semRef=weekStart(new Date());render();break;
    case'k-soc':location.hash='parametres';break;
    case'vd-tab':venteDetail(id,b.dataset.k);break;
    case'colis-add':{const l=readColis();const rows=[...document.querySelectorAll('#colis-rows .colis-row')].map(r=>({kg:r.querySelector('[data-cf=kg]').value,l:r.querySelector('[data-cf=l]').value,w:r.querySelector('[data-cf=w]').value,h:r.querySelector('[data-cf=h]').value}));
      const last=rows[rows.length-1]||{};rows.push({l:last.l,w:last.w,h:last.h});$('#colis-rows').innerHTML=colisRows(rows);$('#colis-tot').innerHTML=colisTotal(readColis());$(`#c${rows.length-1}kg`).focus();break}
    case'colis-rm':{const rows=[...document.querySelectorAll('#colis-rows .colis-row')].map(r=>({kg:r.querySelector('[data-cf=kg]').value,l:r.querySelector('[data-cf=l]').value,w:r.querySelector('[data-cf=w]').value,h:r.querySelector('[data-cf=h]').value}));
      rows.splice(+b.dataset.ci,1);$('#colis-rows').innerHTML=colisRows(rows.length?rows:[{}]);$('#colis-tot').innerHTML=colisTotal(readColis());break}
    case'vd-dousave':{const v=S.ventes.find(x=>x.id===id);if(!v||!saveDouane(v))break;save();render();venteDetail(id,'douane');toast(justifStatut(v)==='complet'?'Justificatifs complets':'Informations douanières enregistrées');break}
    case'vd-expsave':{const v=S.ventes.find(x=>x.id===id);if(!v)break;
      const e={transporteur:$('#x-tr').value,suivi:$('#x-suivi').value.trim().replace(/\s/g,''),date:$('#x-date').value,statut:$('#x-st').value,livraison:$('#x-liv').value,colis:readColis(),note:$('#x-note').value.trim()};
      if(!e.colis.length&&(v.expedition||{}).poids)e.poids=v.expedition.poids;
      if(e.colis.some(c=>c.kg!=null&&c.kg<=0)){toast('Le poids d\'un colis doit être supérieur à zéro.');break}
      if(e.suivi&&e.statut==='preparer')e.statut='expedie';
      if(e.suivi&&!e.date)e.date=isoD(new Date());
      if(e.livraison&&e.statut!=='incident')e.statut='livre';
      const old=v.expedition||{};if(old.dhl&&old.suivi===e.suivi)e.dhl=old.dhl;
      v.expedition=e;save();render();venteDetail(id,'expedition');toast('Expédition enregistrée');
      if(e.suivi&&(e.transporteur||'DHL')==='DHL'&&window.__PRISMEA__.dhl&&(!e.dhl||old.suivi!==e.suivi))dhlRefresh(id);break}
    case'vd-dhl':dhlRefresh(id);break;
    case'dio-send':dioSend(id,!!b.dataset.force,b);break;
    case'dio-dl':dioDownload(id);break;
    case'vd-docdel':{
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer';break}
      const v=S.ventes.find(x=>x.id===id),did=b.dataset.doc;if(!v)break;
      (async()=>{try{if(assetsNS)await assetsNS.delete(did)}catch(e){}
        v.documents=(v.documents||[]).filter(d=>d.id!==did);save();render();venteDetail(id,'documents');toast('Document retiré')})();break}
    case'set-save':{
      const m={nom:'s-nom',forme:'s-forme',capital:'s-capital',adresse:'s-adresse',cp:'s-cp',ville:'s-ville',tel:'s-tel',email:'s-email',siren:'s-siren',rcs:'s-rcs',tvaIntra:'s-tva',iban:'s-iban',emailBanque:'s-mailbq',bic:'s-bic',banque:'s-banque'};
      Object.entries(m).forEach(([k,i])=>S.societe[k]=$('#'+i).value.trim());
      S.societe.delai=Math.max(0,Math.round(+$('#s-delai').value||0));S.societe.transporteur=$('#s-transp').value;
      if(!S.societe.nom||!S.societe.adresse||!S.societe.siren)toast('Paramètres enregistrés. Pensez à compléter la raison sociale, l\'adresse et le SIREN.');else toast('Paramètres enregistrés');
      save();break}
    case'dio-save':case'dio-del':{
      const del=b.dataset.act==='dio-del';if(del&&!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer le retrait de la clé';break}
      const key=del?'':$('#dio-key').value.trim();if(!del&&key&&!/^dpt_/.test(key)){toast('La clé d\'intégration doit commencer par dpt_');break}
      b.disabled=true;
      fetch('/api/dioptra/config',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:$('#dio-url').value.trim(),key,removeKey:del})})
        .then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw j;DIO={...j,loaded:true};render();toast(del?'Clé DIOPTRA retirée':'Connexion DIOPTRA enregistrée')})
        .catch(j=>{b.disabled=false;toast(j&&j.error==='adresse_invalide'?'Adresse invalide : elle doit commencer par https://':j&&j.error==='cle_invalide'?'Clé invalide : elle doit commencer par dpt_ et ne contenir que lettres, chiffres, _ ou -':'Enregistrement impossible, réessayez.')});
      break}
    case'set-backup':offerFile(`Prismea sauvegarde ${isoD(new Date())}.json`,JSON.stringify(S,null,1));break;
    case'set-restore-ok':if(pendingRestore){b.disabled=true;b.textContent='Restauration…';
      fetch('/api/import',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:pendingRestore})})
        .then(r=>{if(!r.ok)throw 0;location.reload()}).catch(()=>{b.disabled=false;b.textContent='Confirmer la restauration';toast('La restauration a échoué.')})}break;
    case'k-open':venteDetail(id);break;
    case'k-pay':payForm(id);break;
    case'k-pdf':downloadInvoice(id);break;
    case'k-dtva':dossierTVA(journalRows(),`Dossier TVA - ${periodLabel()}.csv`);break;
    case'k-csv':journalCSV(journalRows(),`Journal des ventes - ${periodLabel()}.csv`);break;
    case'k-wcsv':weekCSV();break;
    case'k-regdel':{
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer';break}
      const r=S.reglements.find(x=>x.id===id);if(!r)break;if(closedWeek(r.date)){toast('Semaine clôturée : ce règlement ne peut plus être supprimé.');break}
      S.reglements=S.reglements.filter(x=>x.id!==id);save();render();venteDetail(r.venteId);toast('Règlement supprimé');break}
    case'k-close':{
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer la clôture';b.classList.add('primary');break}
      const a=semRef,bb=addDays(a,7),vs=S.ventes.filter(v=>{const d=new Date(v.date);return d>=a&&d<bb}),rs=S.reglements.filter(r=>{const d=new Date(r.date);return d>=a&&d<bb});
      S.clotures.push({id:'w'+isoD(a),semaine:isoD(a),date:new Date().toISOString(),ventes:vs.length,ht:r2(vs.reduce((t,v)=>t+v.ht,0)),ttc:r2(vs.reduce((t,v)=>t+v.ttc,0)),encaisse:r2(rs.reduce((t,r)=>t+r.montant,0)),
        parMode:Object.fromEntries(PAY_MODES.map(m=>[m,r2(rs.filter(r=>r.mode===m).reduce((t,r)=>t+r.montant,0))]))});
      save();render();toast('Semaine clôturée');break}
  }
});
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.cf){const t=$('#colis-tot');if(t)t.innerHTML=colisTotal(readColis())}});
let pendingRestore=null;
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.doccat){const v=S.ventes.find(x=>x.id===t.dataset.vid);const d=v&&(v.documents||[]).find(x=>x.id===t.dataset.doccat);if(d){d.cat=t.value;save()}return}
  if(t.id==='set-restore'&&t.files[0]){const fr=new FileReader();fr.onload=()=>{const m=$('#set-msg');
    try{const d=JSON.parse(fr.result);if(!d||!Array.isArray(d.clients)||!Array.isArray(d.montures))throw 0;pendingRestore=d;
      m.classList.remove('bad');m.innerHTML=`Sauvegarde lue : ${d.clients.length} clients, ${d.montures.length} montures, ${(d.ventes||[]).length} ventes. Elle remplacera toutes les données actuelles. <button class="btn small danger" data-act="set-restore-ok">Confirmer la restauration</button>`}
    catch(x){pendingRestore=null;m.classList.add('bad');m.textContent='Ce fichier n\'est pas une sauvegarde Prismea.'}};fr.readAsText(t.files[0]);t.value='';return}
  if(t.id==='j-client'){per.client=t.value;render()}
  else if(t.id==='j-statut'){per.statut=t.value;render()}
});

/* ---------- Statistique ---------- */
const st={mode:'mois',ref:new Date(),metric:'ca'};
const MOIS_C=new Intl.DateTimeFormat('fr-FR',{month:'short'});
const MOIS_L=new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'});
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function statBounds(){
  const r=new Date(st.ref);
  if(st.mode==='mois')return[new Date(r.getFullYear(),r.getMonth(),1),new Date(r.getFullYear(),r.getMonth()+1,1)];
  if(st.mode==='trimestre'){const q=Math.floor(r.getMonth()/3)*3;return[new Date(r.getFullYear(),q,1),new Date(r.getFullYear(),q+3,1)]}
  if(st.mode==='annee')return[new Date(r.getFullYear(),0,1),new Date(r.getFullYear()+1,0,1)];
  const e=new Date(r.getFullYear(),r.getMonth()+1,1);return[new Date(e.getFullYear(),e.getMonth()-12,1),e];
}
const statLen=()=>st.mode==='mois'?1:st.mode==='trimestre'?3:12;
function statPrev(){const[a]=statBounds();return[new Date(a.getFullYear(),a.getMonth()-statLen(),1),a]}
function statLabel(){
  const[a,b]=statBounds(),last=new Date(b.getFullYear(),b.getMonth()-1,1);
  if(st.mode==='mois')return cap(MOIS_L.format(a));
  if(st.mode==='trimestre')return`${Math.floor(a.getMonth()/3)+1}ᵉ trimestre ${a.getFullYear()}`;
  if(st.mode==='annee')return String(a.getFullYear());
  return`${cap(MOIS_L.format(a))} – ${MOIS_L.format(last)}`;
}
const inR=(d,[a,b])=>{const x=new Date(d);return x>=a&&x<b};
const paOf=l=>l.pa!=null?l.pa:((mon(l.montureId)||{}).pa||0);
/* Chiffres d'une liste de ventes : CA HT (remise déduite), marge brute, montures vendues */
function aggr(vs){
  let ca=0,marge=0,qte=0;
  vs.forEach(v=>{const n=v.lignes.reduce((t,l)=>t+lineHT(l),0),f=n?v.ht/n:1;ca+=v.ht;v.lignes.forEach(l=>{qte+=l.qte;marge+=l.qte*(puNet(l)*f-paOf(l))})});
  return{ca:r2(ca),marge:r2(marge),qte,n:vs.length};
}
function delta(cur,prev){
  if(!prev)return'<span class="d muted-d">Pas de comparaison</span>';
  const p=Math.round((cur-prev)/Math.abs(prev)*100);
  return`<span class="d ${p>=0?'pos':'neg'}">${p>=0?'▲ +':'▼ '}${p} % vs période précédente</span>`;
}
const niceStep=x=>{if(x<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(x))),n=x/p;return(n<=1?1:n<=2?2:n<=5?5:10)*p};
const shortN=v=>v>=1e6?nf2.format(r2(v/1e6)).replace(/,00$/,'')+' M':v>=1e4?Math.round(v/1e3)+' k':nf.format(v);
function monthSeries(){
  const[,b]=statBounds(),months=[];
  for(let i=12;i>=1;i--)months.push(new Date(b.getFullYear(),b.getMonth()-i,1));
  return months.map(m=>{const e=new Date(m.getFullYear(),m.getMonth()+1,1);const a=aggr(S.ventes.filter(v=>inR(v.date,[m,e])));return{m,v:st.metric==='ca'?a.ca:st.metric==='marge'?a.marge:a.qte}});
}
function barChart(series,range){
  const W=760,H=260,L=56,R=12,T=16,B=30,iw=W-L-R,ih=H-T-B;
  const vals=series.map(s=>s.v),mx=Math.max(1,...vals),step=niceStep(mx/4),top=Math.ceil(mx/step)*step;
  const fmtV=v=>st.metric==='qte'?nf.format(v)+' montures':money(v);
  let g='';
  for(let v=0;v<=top+1e-9;v+=step){const y=T+ih-ih*v/top;g+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="ax" x="${L-8}" y="${y+4}" text-anchor="end">${shortN(v)}</text>`}
  const bw=iw/series.length,gap=Math.max(4,bw*.28);
  series.forEach((s,i)=>{
    const h=Math.max(0,ih*Math.max(0,s.v)/top),x=L+i*bw+gap/2,w=bw-gap,y=T+ih-h,on=inR(s.m,range),rr=Math.min(4,w/2,h);
    const path=h>0?`M${x},${T+ih}V${y+rr}Q${x},${y} ${x+rr},${y}H${x+w-rr}Q${x+w},${y} ${x+w},${y+rr}V${T+ih}Z`:'';
    const tip=`${cap(MOIS_L.format(s.m))} : ${fmtV(s.v)}`;
    g+=`<g class="bar-g${on?' on':''}" data-tip="${esc(tip)}"><rect class="hit" x="${L+i*bw}" y="${T}" width="${bw}" height="${ih}"/>${path?`<path class="bar" d="${path}"/>`:''}</g>`;
    g+=`<text class="ax${on?' ax-on':''}" x="${(x+w/2).toFixed(1)}" y="${H-10}" text-anchor="middle">${MOIS_C.format(s.m).replace('.','')}</text>`;
  });
  return`<div class="chart-box"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution sur 12 mois">${g}</svg><div class="chart-tip" hidden></div></div>`;
}
function rankRows(rows,cols){
  if(!rows.length)return'<p class="muted">Aucune donnée sur la période.</p>';
  const mx=Math.max(...rows.map(r=>r.bar||0),1);
  return`<div class="table-wrap"><table class="rank"><thead><tr>${cols.map(c=>`<th class="${c.num?'num':''}">${c.t}</th>`).join('')}</tr></thead><tbody>
  ${rows.map(r=>`<tr>${cols.map((c,i)=>`<td class="${c.num?'num':''}">${i===0?`<div class="rank-l"><span>${r.cells[0]}</span><span class="mini"><i style="width:${(Math.max(0,r.bar||0)/mx*100).toFixed(1)}%"></i></span></div>`:r.cells[i]}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`;
}
function viewStats(){
  const range=statBounds(),prev=statPrev();
  const vs=S.ventes.filter(v=>inR(v.date,range)),vp=S.ventes.filter(v=>inR(v.date,prev));
  const A=aggr(vs),P=aggr(vp);
  const enc=S.reglements.filter(r=>inR(r.date,range)).reduce((t,r)=>t+r.montant,0);
  const reste=S.ventes.reduce((t,v)=>t+resteOf(v),0);
  const stockV=S.montures.reduce((t,m)=>t+Math.max(0,m.qte)*(m.pa||0),0);
  const actifs=new Set(vs.map(v=>v.clientId)).size;
  // clients
  const byC={};vs.forEach(v=>{const o=byC[v.clientId]=byC[v.clientId]||{ca:0,n:0,qte:0};o.ca+=v.ht;o.n++;o.qte+=v.lignes.reduce((t,l)=>t+l.qte,0)});
  const topC=Object.entries(byC).sort((a,b)=>b[1].ca-a[1].ca).slice(0,8).map(([id,o])=>{const c=cli(id);return{bar:o.ca,cells:[`<a class="plain" href="#client-${id}">${esc(c?c.nom:'Client supprimé')}</a>`,o.n,money(o.ca),A.ca?Math.round(o.ca/A.ca*100)+' %':'—']}});
  // marques et modèles
  const byB={},byM={},byMat={};
  vs.forEach(v=>{const n=v.lignes.reduce((t,l)=>t+lineHT(l),0),f=n?v.ht/n:1;v.lignes.forEach(l=>{const m=mon(l.montureId),b=m?m.marque:(l.designation||'').split(' ')[0]||'Autre';
    const ob=byB[b]=byB[b]||{ca:0,qte:0,marge:0};ob.ca+=lineHT(l)*f;ob.qte+=l.qte;ob.marge+=l.qte*(puNet(l)*f-paOf(l));
    const mt=(m&&m.matiere)||((m&&catByEAN(m.ean))||{}).matiere||'Non renseignée';const oq=byMat[mt]=byMat[mt]||{ca:0,qte:0,marge:0};oq.ca+=lineHT(l)*f;oq.qte+=l.qte;oq.marge+=l.qte*(puNet(l)*f-paOf(l));
    const om=byM[l.montureId]=byM[l.montureId]||{nom:l.designation,detail:l.detail,qte:0,ca:0};om.qte+=l.qte;om.ca+=lineHT(l)*f})});
  const topMat=Object.entries(byMat).sort((a,b)=>(a[0]==='Non renseignée')-(b[0]==='Non renseignée')||b[1].ca-a[1].ca).map(([k,o])=>({bar:o.ca,cells:[k==='Non renseignée'?'<span class="muted">Non renseignée</span>':esc(k),nf.format(o.qte),money(o.ca),A.ca?Math.round(o.ca/A.ca*100)+' %':'—',o.ca?Math.round(o.marge/o.ca*100)+' %':'—']}));
  const topB=Object.entries(byB).sort((a,b)=>b[1].ca-a[1].ca).slice(0,8).map(([b,o])=>({bar:o.ca,cells:[esc(b),nf.format(o.qte),money(o.ca),o.ca?Math.round(o.marge/o.ca*100)+' %':'—']}));
  const topM=Object.values(byM).sort((a,b)=>b.qte-a.qte||b.ca-a.ca).slice(0,8).map(o=>({bar:o.qte,cells:[`${esc(o.nom)}<span class="sub">${esc(o.detail||'')}</span>`,nf.format(o.qte),money(o.ca)]}));
  // géographie
  const byP={},byR={export:0,ue:0,fr:0};
  vs.forEach(v=>{const c=cli(v.clientId),p=c&&paysByCode(c.pays);const k=p?p[1]:'Non renseigné';byP[k]=(byP[k]||0)+v.ht;byR[regOf(v)]+=v.ht});
  const topP=Object.entries(byP).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([p,ca])=>({bar:ca,cells:[esc(p),money(ca),A.ca?Math.round(ca/A.ca*100)+' %':'—']}));
  // achats fournisseurs
  const byF={};S.receptions.filter(r=>inR(r.date,range)).forEach(r=>{const o=byF[r.fournisseur]=byF[r.fournisseur]||{n:0,qte:0,total:0};o.n++;o.qte+=r.lignes.reduce((t,l)=>t+l.qte,0);o.total+=r.total});
  const topF=Object.entries(byF).sort((a,b)=>b[1].total-a[1].total).map(([f,o])=>({bar:o.total,cells:[esc(f),o.n,nf.format(o.qte),money(o.total)]}));
  // montures sans vente depuis 90 jours
  const lim=addDays(new Date(),-90),last={};
  S.ventes.forEach(v=>v.lignes.forEach(l=>{if(!last[l.montureId]||v.date>last[l.montureId])last[l.montureId]=v.date}));
  const dorm=S.montures.filter(m=>m.qte>0&&(!last[m.id]||new Date(last[m.id])<lim)).sort((a,b)=>b.qte*(b.pa||0)-a.qte*(a.pa||0));
  const dormV=dorm.reduce((t,m)=>t+m.qte*(m.pa||0),0);
  const ruptures=S.montures.filter(m=>m.qte<=0).length,alertes=S.montures.filter(m=>m.qte>0&&m.qte<=m.seuil).length;
  const seg=(k,l,cur,act)=>`<button data-act="${act}" data-k="${k}" aria-pressed="${cur===k}">${l}</button>`;
  return`<a class="back" href="#">← Accueil</a>
  <div class="head"><div><h1>Statistique</h1><p>L'activité commerciale de la centrale, en HT.</p></div>
    <div class="seg" role="group" aria-label="Période">${seg('mois','Mois',st.mode,'st-mode')}${seg('trimestre','Trimestre',st.mode,'st-mode')}${seg('annee','Année',st.mode,'st-mode')}${seg('12m','12 derniers mois',st.mode,'st-mode')}</div></div>
  <div class="period"><div class="pnav">${st.mode==='12m'?'':'<button class="icon-btn" data-act="st-prev" aria-label="Période précédente">‹</button>'}<b>${statLabel()}</b>${st.mode==='12m'?'':'<button class="icon-btn" data-act="st-next" aria-label="Période suivante">›</button><button class="link" data-act="st-today">Aujourd\'hui</button>'}</div></div>
  <div class="kpis4">
    <div class="kpi"><span class="k">Chiffre d'affaires HT</span><span class="v">${money(A.ca)}</span>${delta(A.ca,P.ca)}</div>
    <div class="kpi"><span class="k">Marge brute</span><span class="v">${money(A.marge)}</span><span class="d muted-d">${A.ca?Math.round(A.marge/A.ca*100)+' % du CA':'—'}</span></div>
    <div class="kpi"><span class="k">Montures vendues</span><span class="v">${nf.format(A.qte)}</span>${delta(A.qte,P.qte)}</div>
    <div class="kpi"><span class="k">Panier moyen HT</span><span class="v">${money(A.n?A.ca/A.n:0)}</span><span class="d muted-d">${A.n} vente${A.n>1?'s':''} · ${actifs} client${actifs>1?'s':''}</span></div>
  </div>
  <div class="kpis4">
    <div class="kpi"><span class="k">Encaissé sur la période</span><span class="v">${money(enc)}</span></div>
    <div class="kpi"><span class="k">Reste à encaisser (total)</span><span class="v ${reste>0.005?'down':''}">${money(reste)}</span><a class="d plain" href="#caisse">Voir les impayés</a></div>
    <div class="kpi"><span class="k">Valeur du stock</span><span class="v">${money(stockV)}</span><span class="d muted-d">au prix d'achat</span></div>
    <div class="kpi"><span class="k">Stock dormant</span><span class="v">${money(dormV)}</span><span class="d muted-d">${dorm.length} réf. sans vente depuis 90 jours</span></div>
  </div>
  <section class="panel"><div class="row-between"><h3 style="margin:0">Sur 12 mois</h3>
    <div class="seg small" role="group" aria-label="Indicateur">${seg('ca','CA HT',st.metric,'st-metric')}${seg('marge','Marge',st.metric,'st-metric')}${seg('qte','Montures',st.metric,'st-metric')}</div></div>
    ${barChart(monthSeries(),range)}<p class="hint" style="margin:0">Les mois de la période choisie sont en couleur pleine.</p></section>
  <div class="grid-2">
    <section class="panel"><h3>Meilleurs clients</h3>${rankRows(topC,[{t:'Client'},{t:'Ventes',num:1},{t:'CA HT',num:1},{t:'Part',num:1}])}</section>
    <section class="panel"><h3>Marques</h3>${rankRows(topB,[{t:'Marque'},{t:'Qté',num:1},{t:'CA HT',num:1},{t:'Marge',num:1}])}</section>
    <section class="panel"><h3>Par matière</h3>${rankRows(topMat,[{t:'Matière'},{t:'Qté',num:1},{t:'CA HT',num:1},{t:'Part',num:1},{t:'Marge',num:1}])}${byMat['Non renseignée']?'<p class="hint" style="margin:10px 0 0">Complétez la matière dans la fiche des montures, ou réimportez le catalogue OPTO11 du fournisseur.</p>':''}</section>
    <section class="panel"><h3>Modèles les plus vendus</h3>${rankRows(topM,[{t:'Modèle'},{t:'Qté',num:1},{t:'CA HT',num:1}])}</section>
    <section class="panel"><h3>Par pays</h3>${rankRows(topP,[{t:'Pays'},{t:'CA HT',num:1},{t:'Part',num:1}])}
      ${A.ca?`<dl class="totals" style="margin-top:12px"><dt>Export hors UE</dt><dd>${money(byR.export)}</dd><dt>Union européenne</dt><dd>${money(byR.ue)}</dd><dt>France (TVA 20 %)</dt><dd>${money(byR.fr)}</dd></dl>`:''}</section>
    <section class="panel"><h3>Achats par fournisseur</h3>${rankRows(topF,[{t:'Fournisseur'},{t:'Entrées',num:1},{t:'Montures',num:1},{t:'Montant HT',num:1}])}</section>
    <section class="panel"><h3>Stock à surveiller</h3>
      <div class="facts" style="border:0;padding:0;margin-bottom:12px"><div class="fact bad"><span>Ruptures</span><b>${ruptures}</b></div><div class="fact"><span>En alerte</span><b>${alertes}</b></div><div class="fact"><span>Sans vente depuis 90 jours</span><b>${dorm.length}</b></div></div>
      ${dorm.length?rankRows(dorm.slice(0,6).map(m=>({bar:m.qte*(m.pa||0),cells:[`${esc(desig(m))}<span class="sub">${esc(m.coloris||'')} · ${esc(m.etiquette)}</span>`,m.qte,money(m.qte*(m.pa||0))]})),[{t:'Monture sans vente'},{t:'Stock',num:1},{t:'Valeur',num:1}]):'<p class="muted">Toutes les montures en stock se sont vendues récemment.</p>'}
    </section>
  </div>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act^="st-"]');if(!b)return;
  const r=new Date(st.ref),n=statLen();
  switch(b.dataset.act){
    case'st-mode':st.mode=b.dataset.k;break;
    case'st-metric':st.metric=b.dataset.k;break;
    case'st-prev':st.ref=new Date(r.getFullYear(),r.getMonth()-n,1);break;
    case'st-next':st.ref=new Date(r.getFullYear(),r.getMonth()+n,1);break;
    case'st-today':st.ref=new Date();break;
  }
  render();
});
document.addEventListener('mousemove',e=>{
  const box=e.target.closest&&e.target.closest('.chart-box');
  if(!box){document.querySelectorAll('.chart-tip:not([hidden])').forEach(t=>t.hidden=true);document.querySelectorAll('.bar-g.hover').forEach(x=>x.classList.remove('hover'));return}
  const tip=box.querySelector('.chart-tip'),g=e.target.closest('[data-tip]');
  box.querySelectorAll('.bar-g.hover').forEach(x=>x!==g&&x.classList.remove('hover'));
  if(!g){tip.hidden=true;return}
  g.classList.add('hover');tip.textContent=g.dataset.tip;tip.hidden=false;
  const rb=box.getBoundingClientRect();let x=e.clientX-rb.left+12;if(x+tip.offsetWidth>rb.width)x=e.clientX-rb.left-tip.offsetWidth-12;
  tip.style.left=Math.max(0,x)+'px';tip.style.top=Math.max(0,e.clientY-rb.top-36)+'px';
});

/* ---------- Achats : factures fournisseurs, paiements, échéances ---------- */
S.facturesF=S.facturesF||[];
const PAY_OUT=['Virement','Virement international (SWIFT)','Carte bancaire','Chèque','Espèces'];
const delaiOf=f=>{const m=String((f&&f.conditions)||'').match(/(\d+)\s*j/i);return m?+m[1]:30};
const paidF=f=>r2((f.paiements||[]).reduce((t,p)=>t+p.montant,0));
const resteF=f=>Math.max(0,r2(f.ttc-paidF(f)));
function statutF(f){
  if(resteF(f)<=0.005)return'payee';
  if(f.echeance&&isoD(new Date())>f.echeance)return'retard';
  return paidF(f)>0?'partielle':'apayer';
}
const STATUT_F={apayer:['À payer','neutral'],partielle:['Partiellement payée','warn'],retard:['En retard','bad'],payee:['Payée','ok']};
const statutFPill=f=>{const[l,c]=STATUT_F[statutF(f)];return`<span class="pill ${c}">${l}</span>`};
const ffOf=id=>S.facturesF.find(x=>x.id===id);
const joursAvant=d=>Math.round((new Date(d)-new Date(isoD(new Date())))/864e5);
const ach={statut:'',four:'',q:''};
const ICO_ACHAT='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.8h12v18.4l-3-1.8-3 1.8-3-1.8-3 1.8Z"/><path d="M9 7.5h6M9 11h6M9 14.5h3.5"/></svg>';
const ICO_SET='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.16V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 4.6 19.4l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 15.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.16l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 9h.09a2 2 0 1 1 0 4H21a1.65 1.65 0 0 0-1.6 2Z"/></svg>';

function viewAchats(){
  const all=S.facturesF;
  const open=all.filter(f=>resteF(f)>0.005);
  const tot=open.reduce((t,f)=>t+resteF(f),0),late=open.filter(f=>statutF(f)==='retard'),lateT=late.reduce((t,f)=>t+resteF(f),0);
  const soon=open.filter(f=>statutF(f)!=='retard'&&f.echeance&&joursAvant(f.echeance)<=7),soonT=soon.reduce((t,f)=>t+resteF(f),0);
  const mois=isoD(new Date()).slice(0,7),payeMois=all.reduce((t,f)=>t+(f.paiements||[]).filter(p=>p.date.slice(0,7)===mois).reduce((a,p)=>a+p.montant,0),0);
  const q=ach.q.toLowerCase().trim();
  const list=all.filter(f=>(!ach.statut||statutF(f)===ach.statut||(ach.statut==='ouvertes'&&resteF(f)>0.005))&&(!ach.four||f.fournisseurId===ach.four)
    &&(!q||[f.ref,(fourOf(f.fournisseurId)||{}).nom,f.note].join(' ').toLowerCase().includes(q)))
    .sort((a,b)=>{const ra=resteF(a)>0.005,rb=resteF(b)>0.005;if(ra!==rb)return ra?-1:1;return ra?(a.echeance||'').localeCompare(b.echeance||''):b.date.localeCompare(a.date)});
  const fours=[...S.fournisseurs].sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
  return`<a class="back" href="#">← Accueil</a>
  <div class="head"><div><h1>Achats</h1><p>Les factures de vos fournisseurs, leurs échéances et leurs paiements.</p></div>
    <button class="btn primary" data-act="ff-new">Nouvelle facture fournisseur</button></div>
  <div class="kpis4">
    <div class="kpi"><span class="k">Reste à payer</span><span class="v">${money(tot)}</span><span class="d muted-d">${open.length} facture${open.length>1?'s':''}</span></div>
    <div class="kpi"><span class="k">En retard</span><span class="v ${lateT?'down':''}">${money(lateT)}</span><span class="d muted-d">${late.length} facture${late.length>1?'s':''}</span></div>
    <div class="kpi"><span class="k">À payer sous 7 jours</span><span class="v">${money(soonT)}</span><span class="d muted-d">${soon.length} facture${soon.length>1?'s':''}</span></div>
    <div class="kpi"><span class="k">Payé ce mois-ci</span><span class="v">${money(payeMois)}</span></div>
  </div>
  <label class="drop small" id="ff-drop" for="ff-file"><b>Déposer une facture fournisseur</b><span>Glissez le PDF ici ou choisissez-le : la fiche s'ouvre pour la compléter</span>
    <input id="ff-file" type="file" accept=".pdf,image/*" hidden></label>
  <div class="toolbar"><input id="ff-q" type="search" value="${esc(ach.q)}" placeholder="Rechercher un n° de facture ou un fournisseur" aria-label="Rechercher une facture">
    <select id="ff-st" aria-label="Statut"><option value="">Toutes les factures</option><option value="ouvertes" ${ach.statut==='ouvertes'?'selected':''}>Non soldées</option>${Object.entries(STATUT_F).map(([k,[l]])=>`<option value="${k}" ${ach.statut===k?'selected':''}>${l}</option>`).join('')}</select>
    <select id="ff-four" aria-label="Fournisseur"><option value="">Tous les fournisseurs</option>${fours.map(f=>`<option value="${f.id}" ${ach.four===f.id?'selected':''}>${esc(f.nom)}</option>`).join('')}</select></div>
  <div class="table-wrap"><table><thead><tr><th>Fournisseur</th><th>N° facture</th><th>Date</th><th>Échéance</th><th class="num">Montant TTC</th><th class="num">Payé</th><th class="num">Reste</th><th>Statut</th></tr></thead><tbody>
  ${list.length?list.map(f=>{const fo=fourOf(f.fournisseurId),j=f.echeance?joursAvant(f.echeance):null,st=statutF(f);return`<tr class="row-link" data-ffid="${f.id}" tabindex="0">
    <td><b>${esc(fo?fo.nom:'Fournisseur supprimé')}</b>${(f.documents||[]).length?'<span class="sub">PDF joint</span>':''}</td><td class="mono">${esc(f.ref)}</td><td>${dF.format(new Date(f.date))}</td>
    <td>${f.echeance?dF.format(new Date(f.echeance)):'—'}${st==='retard'?`<span class="sub warn-txt">${-j} jour${-j>1?'s':''} de retard</span>`:st!=='payee'&&j!=null&&j<=7?`<span class="sub">dans ${j} jour${j>1?'s':''}</span>`:''}</td>
    <td class="num">${money(f.ttc)}</td><td class="num">${money(paidF(f))}</td><td class="num"><b>${resteF(f)>0.005?money(resteF(f)):'—'}</b></td><td>${statutFPill(f)}</td></tr>`}).join('')
  :`<tr><td colspan="8"><div class="empty-state" style="padding:32px 12px"><p>${all.length?'Aucune facture ne correspond à ces filtres.':'Aucune facture fournisseur pour l\'instant. Déposez le PDF d\'une facture ou créez-la avec le bouton ci-dessus.'}</p></div></td></tr>`}
  </tbody></table></div>`;
}

/* Fiche facture (création / modification) */
function ffForm(f,pendingDoc,lu){
  const isNew=!f||!f.id;f={fournisseurId:ach.four||'',date:isoD(new Date()),receptions:[],documents:pendingDoc?[pendingDoc]:[],...(f||{})};
  const st={docs:[...(f.documents||[])]};
  const recOpts=fid=>{
    const taken=new Set(S.facturesF.filter(x=>x.id!==f.id).flatMap(x=>x.receptions||[]));
    const rs=S.receptions.filter(r=>r.fournisseurId===fid&&!taken.has(r.id)).sort((a,b)=>b.date.localeCompare(a.date));
    return rs.length?rs.map(r=>`<label class="check"><input type="checkbox" data-ffrec="${r.id}" ${(f.receptions||[]).includes(r.id)?'checked':''}> ${r.num} du ${dF.format(new Date(r.date))}${r.doc?' · '+esc(r.doc):''} · <b>${money(r.total)}</b></label>`).join('')
      :'<span class="hint">Aucune entrée de stock de ce fournisseur à rattacher.</span>';
  };
  const docsHtml=()=>st.docs.length?st.docs.map(d=>`<div class="doc-row static"><span class="doc-file"><span class="doc-ico">${/pdf/.test(d.type)?'PDF':'IMG'}</span><span><a href="/api/files/${esc(d.id)}" target="_blank" rel="noopener"><b>${esc(d.nom)}</b></a><span class="sub">${fmtSize(d.taille)}</span></span></span><button class="link danger-link" type="button" data-ffdocrm="${esc(d.id)}">Retirer</button></div>`).join(''):'<span class="hint">Aucun fichier joint.</span>';
  const NOMS={fournisseurId:'fournisseur',ref:'n° de facture',date:'date',echeance:'échéance',ht:'montant HT',tva:'TVA',ttc:'total TTC'};
  const luMsg=!lu?'':lu.scan?'<div class="lu-box warn">Ce fichier ne contient pas de texte lisible (facture scannée ou photo) : complétez la fiche à la main.</div>'
    :lu.erreur?'<div class="lu-box warn">Le PDF n\'a pas pu être lu automatiquement : complétez la fiche à la main.</div>'
    :lu.found&&lu.found.length?`<div class="lu-box">Lu automatiquement dans le PDF : <b>${lu.found.map(k=>NOMS[k]).join(', ')}</b>. Vérifiez les champs surlignés avant d'enregistrer.${['fournisseurId','ref','date','ht'].filter(k=>!lu.found.includes(k)).length?` <span>À compléter : ${['fournisseurId','ref','date','ht'].filter(k=>!lu.found.includes(k)).map(k=>NOMS[k]).join(', ')}.</span>`:''}</div>`
    :'<div class="lu-box warn">Aucune information reconnue dans ce PDF : complétez la fiche à la main.</div>';
  openModal(isNew?'Nouvelle facture fournisseur':'Facture '+(f.ref||''),isNew?'':(fourOf(f.fournisseurId)||{}).nom||'',`${luMsg}
  <fieldset>
    <label class="full">Fournisseur <span class="req">*</span><select id="ff-f">${fourOptions(f.fournisseurId,true)}</select></label>
    <label>N° de facture fournisseur <span class="req">*</span><input id="ff-ref" value="${esc(f.ref||'')}" class="mono-in" spellcheck="false"></label>
    <label>Date de la facture <span class="req">*</span><input id="ff-date" type="date" value="${esc(f.date||'')}"></label>
    <label>Échéance<input id="ff-ech" type="date" value="${esc(f.echeance||'')}"><span class="hint" id="ff-echhint"></span></label>
  </fieldset>
  <fieldset><legend>Entrées de stock concernées</legend><div class="full brand-checks" id="ff-recs">${recOpts(f.fournisseurId)}</div></fieldset>
  <fieldset class="three"><legend>Montants</legend>
    <label>Montant HT <span class="req">*</span><span class="suffix"><input id="ff-ht" type="number" min="0" step="0.01" value="${f.ht!=null?(+f.ht).toFixed(2):''}"><span>€</span></span></label>
    <label>TVA<span class="suffix"><input id="ff-tva" type="number" min="0" step="0.01" value="${f.tva!=null?(+f.tva).toFixed(2):''}" placeholder="0"><span>€</span></span><span class="hint" id="ff-tvahint"></span></label>
    <label>Total TTC<span class="suffix"><input id="ff-ttc" type="number" min="0" step="0.01" value="${f.ttc??''}" readonly><span>€</span></span></label>
  </fieldset>
  <fieldset><legend>Facture (PDF)</legend><div class="full" id="ff-docs">${docsHtml()}</div>
    <label class="btn full" for="ff-up" style="justify-content:center;cursor:pointer">Joindre un fichier<input id="ff-up" type="file" accept=".pdf,image/*" hidden></label><p class="scan-msg full" id="ff-upmsg"></p></fieldset>
  <fieldset><label class="full">Note<input id="ff-note" value="${esc(f.note||'')}" placeholder="Ex. facture en attente de l'avoir pour 2 montures cassées"></label></fieldset>`,
  `${isNew?'':`<button class="btn danger" data-act="ff-del" data-id="${f.id}" style="margin-right:auto">Supprimer</button>`}<button class="btn" data-act="close">Annuler</button><button class="btn primary" id="ff-ok">${isNew?'Enregistrer la facture':'Enregistrer'}</button>`,()=>{
    $('.modal-card').classList.add('wide');
    const fo=()=>fourOf($('#ff-f').value);
    const sync=src=>{
      const four=fo(),ht=+$('#ff-ht').value||0;
      if(src==='four'||src==='date'){if(four&&$('#ff-date').value&&(!f.echeance||src==='four'||src==='date')){$('#ff-ech').value=isoD(addDays($('#ff-date').value,delaiOf(four)))}}
      if(src!=='tva'&&four&&(src==='four'||src==='ht'||src==='recs')){$('#ff-tva').value=four.pays==='FR'?r2(ht*0.2).toFixed(2):'0.00'}
      $('#ff-echhint').textContent=four?`Délai du fournisseur : ${delaiOf(four)} jours${four.conditions&&normTxt(four.conditions)!==normTxt(delaiOf(four)+' jours')?' ('+four.conditions+')':''}`:'';
      $('#ff-tvahint').textContent=four?(four.pays==='FR'?'Fournisseur français : TVA 20 % récupérable':'Fournisseur hors de France : pas de TVA facturée en général'):'';
      $('#ff-ttc').value=r2(ht+(+$('#ff-tva').value||0)).toFixed(2);
    };
    $('#ff-f').addEventListener('change',e=>{
      if(e.target.value==='__new'){const keep={ref:$('#ff-ref').value,date:$('#ff-date').value,ht:$('#ff-ht').value,docs:st.docs};
        fournisseurForm(null,nf=>{ffForm({...f,fournisseurId:nf.id,ref:keep.ref,date:keep.date,ht:keep.ht===''?undefined:+keep.ht,documents:keep.docs})});return}
      f.receptions=[];$('#ff-recs').innerHTML=recOpts(e.target.value);sync('four');
    });
    $('#ff-date').addEventListener('change',()=>sync('date'));
    $('#ff-ht').addEventListener('input',()=>sync('ht'));
    $('#ff-tva').addEventListener('input',()=>sync('tva'));
    $('#ff-recs').addEventListener('change',()=>{const ids=[...document.querySelectorAll('[data-ffrec]:checked')].map(x=>x.dataset.ffrec);
      const sum=r2(S.receptions.filter(r=>ids.includes(r.id)).reduce((t,r)=>t+r.total,0));if(sum>0){$('#ff-ht').value=sum.toFixed(2)}sync('recs')});
    $('#ff-docs').addEventListener('click',e=>{const b=e.target.closest('[data-ffdocrm]');if(!b)return;const id=b.dataset.ffdocrm;st.docs=st.docs.filter(d=>d.id!==id);
      if(!(f.documents||[]).some(d=>d.id===id)&&assetsNS)assetsNS.delete(id).catch(()=>{});$('#ff-docs').innerHTML=docsHtml()});
    $('#ff-up').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;
      $('#ff-upmsg').textContent='Envoi du fichier…';try{st.docs.push(await uploadFF(file));$('#ff-docs').innerHTML=docsHtml();$('#ff-upmsg').textContent=''}catch(x){$('#ff-upmsg').textContent=x.message||'Le fichier n\'a pas pu être envoyé.'}});
    if(isNew&&f.fournisseurId&&!lu)sync('four');else sync('init');
    if(lu&&lu.found){const ids={fournisseurId:'ff-f',ref:'ff-ref',date:'ff-date',echeance:'ff-ech',ht:'ff-ht',tva:'ff-tva'};lu.found.forEach(k=>{const el=ids[k]&&$('#'+ids[k]);if(el)el.classList.add('auto')})}
    (isNew?$('#ff-f'):$('#ff-ref')).focus();
    $('#ff-ok').onclick=()=>{
      const four=fo(),ref=$('#ff-ref').value.trim(),date=$('#ff-date').value,ht=r2(+$('#ff-ht').value||0),tva=r2(+$('#ff-tva').value||0);
      if(!four){toast('Choisissez le fournisseur.');return}
      if(!ref){toast('Indiquez le n° de la facture du fournisseur.');$('#ff-ref').focus();return}
      if(!date){toast('Indiquez la date de la facture.');return}
      if(ht<=0){toast('Indiquez le montant HT de la facture.');$('#ff-ht').focus();return}
      if(S.facturesF.some(x=>x.id!==f.id&&x.fournisseurId===four.id&&x.ref.toLowerCase()===ref.toLowerCase())){toast('Cette facture de ce fournisseur est déjà enregistrée.');return}
      const d={fournisseurId:four.id,ref,date,echeance:$('#ff-ech').value||isoD(addDays(date,delaiOf(four))),ht,tva,ttc:r2(ht+tva),
        receptions:[...document.querySelectorAll('[data-ffrec]:checked')].map(x=>x.dataset.ffrec),documents:st.docs,note:$('#ff-note').value.trim()};
      if(d.ttc<paidF(f)-0.005){toast('Le montant est inférieur à ce qui a déjà été payé.');return}
      let rec;
      if(isNew){rec={id:'ff'+Date.now().toString(36),cree:new Date().toISOString(),paiements:[],...d};S.facturesF.push(rec)}
      else{rec=ffOf(f.id);Object.assign(rec,d)}
      save();closeModal();render();toast(isNew?`Facture ${ref} enregistrée`:'Facture mise à jour');
    };
  });
}
async function uploadFF(file){
  if(!assetsNS)throw new Error('Envoi de fichiers indisponible.');
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  const type=file.type||({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'})[ext]||'';
  try{const r=await assetsNS.upload(file,type?{type}:undefined);return{id:r.id,nom:file.name,type:r.contentType||type,taille:r.sizeBytes||file.size,date:new Date().toISOString()}}
  catch(e){const c=e&&e.code;throw new Error(c==='too_large'?'Fichier trop lourd (20 Mo maximum).':c==='unsupported_type'?'Format non accepté : PDF ou image uniquement.':'Le fichier n\'a pas pu être envoyé.')}
}

/* Détail d'une facture fournisseur */
function ffDetail(id){
  const f=ffOf(id);if(!f)return;const fo=fourOf(f.fournisseurId),ps=[...(f.paiements||[])].sort((a,b)=>a.date.localeCompare(b.date));
  const recs=S.receptions.filter(r=>(f.receptions||[]).includes(r.id));
  openModal('Facture '+f.ref,`${fo?fo.nom:''} · du ${dF.format(new Date(f.date))}`,`
  <div class="ticket-meta"><span>Échéance <b>${f.echeance?dF.format(new Date(f.echeance)):'—'}</b>${fo&&fo.conditions?' · '+esc(fo.conditions):''}</span>${statutFPill(f)}</div>
  ${(f.documents||[]).length?`<div class="docs">${f.documents.map(d=>`<div class="doc-row static"><span class="doc-file"><span class="doc-ico">${/pdf/.test(d.type)?'PDF':'IMG'}</span><span><a href="/api/files/${esc(d.id)}" target="_blank" rel="noopener"><b>${esc(d.nom)}</b></a><span class="sub">${fmtSize(d.taille)}</span></span></span><a class="btn small" href="/api/files/${esc(d.id)}" target="_blank" rel="noopener">Ouvrir</a></div>`).join('')}</div>`:'<p class="hint" style="margin:0">Aucun PDF joint. Ajoutez-le avec « Modifier ».</p>'}
  ${recs.length?`<p style="margin:0;font-size:14px">Entrées de stock : ${recs.map(r=>`<b class="mono">${r.num}</b> (${money(r.total)})`).join(', ')}</p>`:''}
  ${f.note?`<p style="margin:0;font-size:14px;color:var(--muted)">${esc(f.note)}</p>`:''}
  <dl class="totals" style="max-width:320px;margin-left:auto"><dt>Montant HT</dt><dd>${money(f.ht)}</dd><dt>TVA</dt><dd>${f.tva?money(f.tva):'—'}</dd><dt class="big">Total TTC</dt><dd class="big">${money(f.ttc)}</dd></dl>
  <h3 style="font-size:16px">Paiements</h3>
  ${ps.length?`<div class="docs">${ps.map(p=>`<div class="doc-row static"><span><b>${money(p.montant)}</b><span class="sub">${dF.format(new Date(p.date))} · ${esc(p.mode)}${[p.banque,p.ref].filter(Boolean).length?' · '+esc([p.banque,p.ref].filter(Boolean).join(' · ')):''}</span></span><button class="link danger-link" data-act="ff-paydel" data-id="${f.id}" data-pid="${p.id}">Supprimer</button></div>`).join('')}</div>`:'<p class="muted">Aucun paiement enregistré.</p>'}
  <dl class="totals" style="max-width:320px;margin-left:auto"><dt>Payé</dt><dd>${money(paidF(f))}</dd><dt class="big">Reste à payer</dt><dd class="big">${money(resteF(f))}</dd></dl>`,
  `<button class="btn" data-act="ff-edit" data-id="${f.id}">Modifier</button>${resteF(f)>0.005?`<button class="btn primary" data-act="ff-pay" data-id="${f.id}">Enregistrer un paiement</button>`:'<button class="btn primary" data-act="close">Fermer</button>'}`);
  $('.modal-card').classList.add('wide');
}
function ffPayForm(id){
  const f=ffOf(id);if(!f)return;const fo=fourOf(f.fournisseurId);
  const lastBank=[...S.facturesF.flatMap(x=>x.paiements||[])].sort((a,b)=>b.date.localeCompare(a.date)).map(p=>p.banque).find(Boolean)||S.societe.banque||'';
  openModal('Payer la facture '+f.ref,`${fo?fo.nom:''} · reste à payer ${money(resteF(f))}`,`
  <fieldset>
    <label>Date du paiement<input id="fp-date" type="date" value="${isoD(new Date())}"></label>
    <label>Montant<span class="suffix"><input id="fp-mt" type="number" min="0" step="0.01" value="${resteF(f).toFixed(2)}"><span>€</span></span></label>
    <label class="full">Mode de paiement<select id="fp-mode">${PAY_OUT.map(m=>`<option ${fo&&fo.pays!=='FR'&&m.startsWith('Virement international')?'selected':''}>${m}</option>`).join('')}</select></label>
    <label>Banque débitée<input id="fp-banque" value="${esc(lastBank)}" placeholder="Votre banque"></label>
    <label>Référence<input id="fp-ref" class="mono-in" placeholder="N° de virement, de chèque…"></label>
  </fieldset>`,
  `<button class="btn" data-act="ff-open" data-id="${f.id}">Retour</button><button class="btn primary" id="fp-ok">Enregistrer le paiement</button>`,()=>{
    $('#fp-mt').focus();$('#fp-mt').select();
    $('#fp-ok').onclick=()=>{
      const d=$('#fp-date').value,mt=r2(+$('#fp-mt').value||0);
      if(!d){toast('Indiquez la date du paiement.');return}
      if(mt<=0){toast('Indiquez un montant supérieur à zéro.');return}
      if(mt>resteF(f)+0.005){toast(`Le montant dépasse le reste à payer (${money(resteF(f))}).`);return}
      f.paiements=f.paiements||[];
      f.paiements.push({id:'p'+Date.now().toString(36),date:d,montant:mt,mode:$('#fp-mode').value,banque:$('#fp-banque').value.trim(),ref:$('#fp-ref').value.trim()});
      save();render();ffDetail(f.id);toast(`Paiement de ${money(mt)} enregistré${resteF(f)<=0.005?' : facture soldée':''}`);
    };
  });
}
document.addEventListener('click',e=>{
  const row=e.target.closest('tr.row-link[data-ffid]');
  if(row&&!e.target.closest('[data-act]')){ffDetail(row.dataset.ffid);return}
  const b=e.target.closest('[data-act^="ff-"]');if(!b)return;const id=b.dataset.id;
  switch(b.dataset.act){
    case'ff-new':ffForm();break;
    case'ff-open':ffDetail(id);break;
    case'ff-edit':ffForm(ffOf(id));break;
    case'ff-pay':ffPayForm(id);break;
    case'ff-paydel':{if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer';break}
      const f=ffOf(id);f.paiements=(f.paiements||[]).filter(p=>p.id!==b.dataset.pid);save();render();ffDetail(id);toast('Paiement supprimé');break}
    case'ff-del':{if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer la suppression';break}
      const f=ffOf(id);if(assetsNS)(f.documents||[]).forEach(d=>assetsNS.delete(d.id).catch(()=>{}));
      S.facturesF=S.facturesF.filter(x=>x.id!==id);save();closeModal();render();toast('Facture supprimée');break}
  }
});
document.addEventListener('input',e=>{if(e.target.id==='ff-q'){ach.q=e.target.value;const pos=e.target.selectionStart;render();const i=$('#ff-q');if(i){i.focus();i.setSelectionRange(pos,pos)}}});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='ff-st'){ach.statut=t.value;render()}
  else if(t.id==='ff-four'){ach.four=t.value;render()}
  else if(t.id==='ff-file'&&t.files[0]){const file=t.files[0];t.value='';await dropFF(file)}
});
async function dropFF(file){
  toast('Lecture de la facture…');
  let doc,lu;
  try{[doc,lu]=await Promise.all([uploadFF(file),readInvoiceFile(file)])}catch(x){toast(x.message);return}
  const pre={};
  if(lu&&lu.found)lu.found.forEach(k=>{if(k!=='ttc')pre[k]=lu[k]});
  if(!pre.ref){const m=String(file.name).match(/(?:fact(?:ure)?|inv(?:oice)?|n°|no)[\s_\-]*([A-Z0-9][A-Z0-9\-\/]{2,})/i);if(m&&/\d/.test(m[1]))pre.ref=m[1]}
  const four=fourOf(pre.fournisseurId);
  if(four&&pre.date&&!pre.echeance)pre.echeance=isoD(addDays(pre.date,delaiOf(four)));
  if(four&&pre.ht!=null&&pre.tva==null)pre.tva=four.pays==='FR'?r2(pre.ht*0.2):0;
  if(pre.ht!=null)pre.ttc=r2(pre.ht+(pre.tva||0));
  if(four&&pre.ht!=null){const taken=new Set(S.facturesF.flatMap(x=>x.receptions||[]));
    const rc=S.receptions.find(r=>r.fournisseurId===four.id&&!taken.has(r.id)&&Math.abs(r.total-pre.ht)<0.5);if(rc)pre.receptions=[rc.id]}
  ffForm(pre,doc,lu);
}
document.addEventListener('dragover',e=>{const dz=e.target.closest&&e.target.closest('#ff-drop');if(dz){e.preventDefault();dz.classList.add('over')}});
document.addEventListener('dragleave',e=>{const dz=e.target.closest&&e.target.closest('#ff-drop');if(dz)dz.classList.remove('over')});
document.addEventListener('drop',e=>{const dz=e.target.closest&&e.target.closest('#ff-drop');if(!dz)return;e.preventDefault();dz.classList.remove('over');const f=e.dataTransfer.files[0];if(f)dropFF(f)});

/* ---------- Lecture automatique des factures fournisseurs (texte du PDF) ---------- */
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let pdfjsReady=null;
function loadPdfjs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(!pdfjsReady)pdfjsReady=new Promise((ok,ko)=>{const s=document.createElement('script');s.src=PDFJS;
    s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;ok(window.pdfjsLib)};s.onerror=()=>{pdfjsReady=null;ko(new Error('pdf'))};document.head.appendChild(s)});
  return pdfjsReady;
}
/* Texte du PDF, ligne par ligne (les éléments d'une même hauteur sont réunis) */
async function pdfLines(file){
  const lib=await loadPdfjs();
  const pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const lines=[];
  for(let p=1;p<=Math.min(pdf.numPages,5);p++){
    const tc=await (await pdf.getPage(p)).getTextContent(),rows=[];
    tc.items.forEach(it=>{const s=(it.str||'').trim();if(!s)return;const y=it.transform[5],x=it.transform[4];
      let r=rows.find(r=>Math.abs(r.y-y)<3);if(!r){r={y,items:[]};rows.push(r)}r.items.push({x,s})});
    rows.sort((a,b)=>b.y-a.y).forEach(r=>lines.push(r.items.sort((a,b)=>a.x-b.x).map(i=>i.s).join(' ').replace(/\s+/g,' ')));
  }
  return lines;
}
const MOIS_FR=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const MOIS_EN=['january','february','march','april','may','june','july','august','september','october','november','december'];
const MOIS_IT=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
function findDates(line){
  const out=[];let m;
  const re1=/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g;
  while((m=re1.exec(line))){let y=+m[3];if(y<100)y+=2000;const d=+m[1],mo=+m[2];if(mo>=1&&mo<=12&&d>=1&&d<=31&&y>2000)out.push({iso:`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`,i:m.index,len:m[0].length})}
  const re2=/\b(\d{4})-(\d{2})-(\d{2})\b/g;
  while((m=re2.exec(line)))out.push({iso:`${m[1]}-${m[2]}-${m[3]}`,i:m.index,len:m[0].length});
  const names=[...MOIS_FR,...MOIS_EN,...MOIS_IT].join('|');
  const re3=new RegExp(`\\b(\\d{1,2})(?:er)?\\s+(${names})\\s+(\\d{4})\\b`,'gi');
  while((m=re3.exec(line))){const n=m[2].toLowerCase(),mo=[MOIS_FR,MOIS_EN,MOIS_IT].map(a=>a.indexOf(n)).find(i=>i>=0)+1;out.push({iso:`${m[3]}-${String(mo).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`,i:m.index,len:m[0].length})}
  const re4=new RegExp(`\\b(${MOIS_EN.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`,'gi');
  while((m=re4.exec(line))){const mo=MOIS_EN.indexOf(m[1].toLowerCase())+1;out.push({iso:`${m[3]}-${String(mo).padStart(2,'0')}-${String(+m[2]).padStart(2,'0')}`,i:m.index,len:m[0].length})}
  return out.sort((a,b)=>a.i-b.i);
}
function parseAmount(s){
  s=String(s).replace(/[\s\u00A0\u202F']/g,'');
  if(/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s))s=s.replace(/\./g,'').replace(',','.');
  else if(/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(s))s=s.replace(/,/g,'');
  else if(/^\d+,\d{1,2}$/.test(s))s=s.replace(',','.');
  const n=parseFloat(s);return isFinite(n)?n:null;
}
/* Montants d'une ligne (avec décimales), en ignorant les dates et les pourcentages */
function findAmounts(line){
  let l=line;findDates(line).forEach(d=>{l=l.slice(0,d.i)+' '.repeat(d.len)+l.slice(d.i+d.len)});
  const re=/(?<![\d.,])(\d{1,3}(?:[ \u00A0\u202F.,']\d{3})+[.,]\d{2}|\d+[.,]\d{2})(?![\d]|\s*%)/g,out=[];let m;
  while((m=re.exec(l))){const v=parseAmount(m[1]);if(v!=null)out.push(v)}
  return out;
}
const LBL={
  ttc:/(total\s*t\.?t\.?c|montant\s*t\.?t\.?c|net\s*à\s*payer|total\s*à\s*payer|reste\s*à\s*payer|total\s*due|amount\s*due|balance\s*due|grand\s*total|invoice\s*total|total\s*amount|total\s*(?:incl|including)|totale\s*(?:fattura|documento|da\s*pagare)?|importo\s*totale)/i,
  ht:/(total\s*h\.?t|montant\s*h\.?t|total\s*hors\s*taxes?|base\s*h\.?t|net\s*amount|sub\s*-?\s*total|total\s*net|total\s*(?:excl|excluding)|imponibile|totale\s*imponibile)/i,
  tva:/(\bt\.?v\.?a\b|\bvat\b|\biva\b|\btax\b|\bmwst\b)/i
};
function amountFor(lines,re,exclude){
  let best=null;
  lines.forEach((ln,i)=>{if(!re.test(ln)||(exclude&&exclude.test(ln)&&!/total/i.test(ln.replace(exclude,''))))return;
    let a=findAmounts(ln);if(!a.length&&lines[i+1])a=findAmounts(lines[i+1]);if(a.length)best=a[a.length-1]});
  return best;
}
const normTxt=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
function parseInvoice(lines){
  const text=lines.join('\n'),flat=normTxt(text),r={};
  // fournisseur : n° de TVA, puis nom
  const ownTva=normTxt(S.societe.tvaIntra);
  let four=S.fournisseurs.find(f=>f.tvaIntra&&normTxt(f.tvaIntra).length>5&&normTxt(f.tvaIntra)!==ownTva&&flat.includes(normTxt(f.tvaIntra)));
  if(!four)four=[...S.fournisseurs].sort((a,b)=>b.nom.length-a.nom.length).find(f=>normTxt(f.nom).length>=3&&flat.includes(normTxt(f.nom)));
  if(!four){const mk=S.marques.find(b=>b.fournisseurId&&normTxt(b.nom).length>=3&&new RegExp('\\b'+b.nom.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(text));if(mk)four=fourOf(mk.fournisseurId)}
  if(four)r.fournisseurId=four.id;
  // n° de facture
  const reRef=/(?:facture|invoice|fattura|rechnung|factura)\s*(?:n[°oº.]?|no\.?|nr\.?|num[ée]ro|number|#)?\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\-\/._]{2,})/i;
  for(const ln of lines){const m=ln.match(reRef);if(m&&/\d/.test(m[1])&&!/^(du|date|of|del)$/i.test(m[1])){r.ref=m[1].replace(/[.:]$/,'');break}}
  if(!r.ref){for(const ln of lines){const m=ln.match(/\b(?:n[°oº]|no\.?|nr\.?)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-\/._]{2,})/i);if(m&&/\d/.test(m[1])){r.ref=m[1];break}}}
  // dates
  const near=re=>{for(const ln of lines){if(re.test(ln)){const d=findDates(ln);if(d.length)return d[d.length-1].iso}}return null};
  r.echeance=near(/(échéance|echeance|due\s*date|payable|à\s*payer\s*avant|scadenza|date\s*limite)/i);
  r.date=near(/(date\s*(de\s*)?(la\s*)?facture|invoice\s*date|date\s*d'?émission|data\s*(fattura|documento)|^date\b|\bdate\s*:|\bdu\s+\d)/i);
  if(!r.date){const all=lines.flatMap(findDates).map(d=>d.iso).filter(d=>d!==r.echeance);if(all.length)r.date=all[0]}
  // montants
  r.ttc=amountFor(lines,LBL.ttc);
  r.ht=amountFor(lines,LBL.ht);
  r.tva=amountFor(lines,LBL.tva,/(n°|no\.?|number|intracom|identification|numéro|p\.?\s*iva|partita)/i);
  if(r.tva!=null&&r.ht!=null&&r.ttc!=null&&Math.abs(r.ht+r.tva-r.ttc)>0.05)r.tva=r2(r.ttc-r.ht);
  if(r.ht!=null&&r.ttc!=null&&r.tva==null)r.tva=r2(r.ttc-r.ht);
  if(r.ht==null&&r.ttc!=null&&r.tva!=null)r.ht=r2(r.ttc-r.tva);
  if(r.ht==null&&r.ttc!=null&&(!four||four.pays!=='FR')&&!LBL.tva.test(text)){r.ht=r.ttc;r.tva=0}
  if(r.ht!=null&&r.tva!=null&&r.ttc==null)r.ttc=r2(r.ht+r.tva);
  r.found=['fournisseurId','ref','date','echeance','ht','tva','ttc'].filter(k=>r[k]!=null);
  r.textLen=text.replace(/\s/g,'').length;
  return r;
}
async function readInvoiceFile(file){
  if(!/pdf$/i.test(file.type)&&!/\.pdf$/i.test(file.name))return{scan:true};
  try{const lines=await pdfLines(file);const r=parseInvoice(lines);if(r.textLen<30)return{scan:true};return r}
  catch(e){return{erreur:true}}
}

/* ---------- Douane et justificatifs d'exonération de TVA ---------- */
const INCOTERMS=['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'];
const MRN_RE=/^\d{2}[A-Z]{2}[A-Z0-9]{13}\d$/;
const docsCat=(v,cat)=>(v.documents||[]).filter(d=>d.cat===cat);
/* Pièces attendues selon le régime de la vente */
function justifs(v){
  const reg=regOf(v),d=v.douane||{},e=expOf(v);
  if(reg==='export')return[
    {k:'mrn',t:'N° de déclaration d\'export (MRN)',ok:!!d.mrn,info:d.mrn},
    {k:'sortie',t:'Sortie de l\'Union européenne confirmée',ok:!!d.dateSortie,info:d.dateSortie?'le '+dF.format(new Date(d.dateSortie)):''},
    {k:'doc',cat:'Déclaration d\'export (DAE)',t:'Déclaration d\'export (DAE) en PDF',ok:docsCat(v,'Déclaration d\'export (DAE)').length>0},
    {k:'doc',cat:'Avis de sortie',t:'Avis de sortie (« exit notice »)',ok:docsCat(v,'Avis de sortie').length>0},
    {k:'doc',cat:'Bordereau DHL',t:'Lettre de transport (LTA / AWB)',ok:docsCat(v,'Bordereau DHL').length>0,info:e.suivi?'n° '+e.suivi:''},
  ];
  if(reg==='ue')return[
    {k:'vies',t:'N° de TVA du client vérifié sur VIES',ok:!!d.viesDate,info:d.viesDate?(v.tvaIntra||'')+' · le '+dF.format(new Date(d.viesDate)):''},
    {k:'doc',cat:'Bordereau DHL',t:'Lettre de transport (LTA / AWB)',ok:docsCat(v,'Bordereau DHL').length>0,info:e.suivi?'n° '+e.suivi:''},
    {k:'doc',cat:'Preuve de livraison',t:'Preuve de livraison ou attestation de réception signée par le client',ok:docsCat(v,'Preuve de livraison').length+docsCat(v,'Attestation de réception').length>0},
  ];
  return[];
}
function justifStatut(v){
  const j=justifs(v);if(!j.length)return null;
  const n=j.filter(x=>x.ok).length;
  return n===j.length?'complet':n?'partiel':'manquant';
}
function justifPill(v){
  const s=justifStatut(v);if(!s)return'<span class="sub-cell">TVA facturée</span>';
  const j=justifs(v),n=j.filter(x=>x.ok).length;
  return s==='complet'?'<span class="pill ok">Justifiée</span>':`<span class="pill ${s==='partiel'?'warn':'bad'}">${n}/${j.length} pièces</span>`;
}
function douaneTab(v){
  const reg=regOf(v),d=v.douane||{},c=cli(v.clientId)||{},p=paysByCode(c.pays);
  if(reg==='fr')return`<p class="muted">Vente soumise à la TVA française (20 %) : aucun justificatif d'exonération n'est nécessaire.</p>`;
  const j=justifs(v),n=j.filter(x=>x.ok).length;
  const legal=reg==='export'?'Exonération de TVA, article 262 I du CGI (exportation hors de l\'Union européenne)':'Exonération de TVA, article 262 ter I du CGI (livraison intracommunautaire)';
  const fields=reg==='export'?`
    <label>Incoterm<select id="dz-inco"><option value="">—</option>${INCOTERMS.map(i=>`<option ${i===d.incoterm?'selected':''}>${i}</option>`).join('')}</select></label>
    <label>Déclarant / commissionnaire<input id="dz-decl" value="${esc(d.declarant||(expOf(v).transporteur||''))}" placeholder="Ex. DHL Express"></label>
    <label>N° MRN de la déclaration d'export<input id="dz-mrn" value="${esc(d.mrn||'')}" class="mono-in" spellcheck="false" placeholder="Ex. 26FR000123456789A1" maxlength="18"><span class="hint" id="dz-mrnhint">18 caractères, indiqué sur le DAE</span></label>
    <label>Date de la déclaration<input id="dz-ddecl" type="date" value="${esc(d.dateDecl||'')}"></label>
    <label>Bureau de douane de sortie<input id="dz-bureau" value="${esc(d.bureau||'')}" placeholder="Ex. FR003220 Roissy fret"></label>
    <label>Date de sortie de l'UE<input id="dz-sortie" type="date" value="${esc(d.dateSortie||'')}"><span class="hint">Date de l'avis de sortie</span></label>`
    :`
    <label>Incoterm<select id="dz-inco"><option value="">—</option>${INCOTERMS.map(i=>`<option ${i===d.incoterm?'selected':''}>${i}</option>`).join('')}</select></label>
    <label>N° de TVA du client<input value="${esc(v.tvaIntra||c.tvaIntra||'')}" class="mono-in" disabled></label>
    <label>Vérifié sur VIES le<input id="dz-vies" type="date" value="${esc(d.viesDate||'')}"><span class="hint"><a href="https://ec.europa.eu/taxation_customs/vies/" target="_blank" rel="noopener">Vérifier sur le site VIES ↗</a></span></label>
    <label>Date de réception par le client<input id="dz-recep" type="date" value="${esc(d.dateReception||'')}"></label>`;
  return`<div class="lu-box">${legal}. Destination : <b>${esc(p?p[1]:'pays non renseigné')}</b>.</div>
  <fieldset>${fields}<label class="full">Note<input id="dz-note" value="${esc(d.note||'')}" placeholder="Ex. dédouanement par DHL Express, DAE reçu par e-mail le…"></label></fieldset>
  <div class="row-between"><h3 style="font-size:16px;margin:0">Pièces justificatives</h3><span class="${n===j.length?'pill ok':'pill warn'}">${n}/${j.length}</span></div>
  <div class="checklist">${j.map(x=>`<div class="ck ${x.ok?'ok':''}"><span class="ck-ico" aria-hidden="true">${x.ok?'✓':''}</span><span><b>${x.t}</b>${x.info?`<span class="sub">${esc(x.info)}</span>`:''}${x.k==='doc'&&x.ok?`<span class="sub">${docsCat(v,x.cat).map(dd=>`<a href="/api/files/${esc(dd.id)}" target="_blank" rel="noopener">${esc(dd.nom)}</a>`).join(', ')}</span>`:''}</span>
    ${x.k==='doc'&&assetsNS?`<label class="btn small" style="cursor:pointer">${x.ok?'Ajouter':'Joindre'}<input type="file" hidden accept=".pdf,image/*" data-dzcat="${esc(x.cat)}" data-vid="${v.id}"></label>`:''}</div>`).join('')}</div>
  <p class="scan-msg" id="vd-msg" role="status"></p>`;
}
function saveDouane(v){
  const g=id=>{const el=$('#'+id);return el?el.value.trim():undefined};
  const d={...(v.douane||{})};
  [['incoterm','dz-inco'],['declarant','dz-decl'],['dateDecl','dz-ddecl'],['bureau','dz-bureau'],['dateSortie','dz-sortie'],['viesDate','dz-vies'],['dateReception','dz-recep'],['note','dz-note']].forEach(([k,id])=>{const x=g(id);if(x!==undefined)d[k]=x});
  const mrn=g('dz-mrn');
  if(mrn!==undefined){const m=mrn.toUpperCase().replace(/\s/g,'');if(m&&!MRN_RE.test(m)){toast('Le n° MRN doit faire 18 caractères (ex. 26FR000123456789A1).');return false}d.mrn=m}
  v.douane=d;return true;
}
function dossierTVA(vs,name){
  const rows=[['Facture','Date','Client','Pays','N° TVA client','Régime','Mention','Total HT','Incoterm','MRN','Date déclaration','Bureau de sortie','Date de sortie','VIES vérifié le','Date de réception','LTA / AWB','Pièces jointes','Justificatif']];
  vs.filter(v=>regOf(v)!=='fr').forEach(v=>{const c=cli(v.clientId)||{},d=v.douane||{},e=expOf(v);
    rows.push([v.facture,dF.format(new Date(v.date)),c.nom||'',(paysByCode(c.pays)||[])[1]||'',v.tvaIntra||'',REGIME[regOf(v)],regOf(v)==='export'?'Art. 262 I CGI':'Art. 262 ter I CGI',csvNum(v.ht),
      d.incoterm||'',d.mrn||'',d.dateDecl?dF.format(new Date(d.dateDecl)):'',d.bureau||'',d.dateSortie?dF.format(new Date(d.dateSortie)):'',d.viesDate?dF.format(new Date(d.viesDate)):'',d.dateReception?dF.format(new Date(d.dateReception)):'',
      e.suivi||'',(v.documents||[]).map(x=>x.cat+' : '+x.nom).join(' | '),{complet:'Complet',partiel:'Incomplet',manquant:'Manquant'}[justifStatut(v)]])});
  offerFile(name,csvOf(rows));
}
document.addEventListener('change',async e=>{
  const t=e.target;if(!t.dataset||!t.dataset.dzcat||!t.files[0])return;
  const vid=t.dataset.vid,cat=t.dataset.dzcat,file=t.files[0];t.value='';
  const v=S.ventes.find(x=>x.id===vid);if(v&&saveDouane(v))save();
  await uploadDocs(vid,[file],cat,t.dataset.back||'douane');
});

/* ---------- Attestation de réception (à faire signer par le client) ---------- */
function attestationPDF(v){
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'mm',format:'a4'});
  const txt=s=>String(s??'').replace(/[  ]/g,' ').replace(/□/g,'/').replace(/[−–]/g,'-').replace(/[«»]/g,'"');
  const s=S.societe,c=cli(v.clientId)||{},p=paysByCode(c.pays),e=expOf(v),reg=regOf(v);
  const L=18,R=192;let y=20;
  pdf.setFont('helvetica','bold');pdf.setFontSize(17);pdf.text('ATTESTATION DE RÉCEPTION',L,y);
  pdf.setFont('helvetica','italic');pdf.setFontSize(10.5);pdf.setTextColor(90);pdf.text('Proof of receipt of goods',L,y+6);pdf.setTextColor(0);
  pdf.setFont('helvetica','normal');pdf.setFontSize(9.5);
  pdf.text(txt(`Facture / Invoice n° ${v.facture} du ${dF.format(new Date(v.date))}`),R,y,{align:'right'});
  pdf.text(txt(`Vente / Sale ${v.num}`),R,y+5,{align:'right'});
  y+=16;
  const block=(title,lines,x)=>{pdf.setFontSize(8);pdf.setTextColor(110);pdf.text(title,x,y);pdf.setTextColor(0);pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);pdf.text(txt(lines[0]||''),x,y+5.5);
    pdf.setFont('helvetica','normal');pdf.setFontSize(9);lines.slice(1).filter(Boolean).forEach((t,i)=>pdf.text(txt(t),x,y+10.5+i*4.4))};
  block('VENDEUR / SELLER',[s.nom,s.adresse,[s.cp,s.ville].filter(Boolean).join(' ')+(s.ville?', France':''),s.tvaIntra?'TVA / VAT : '+s.tvaIntra:''],L);
  block('ACHETEUR / BUYER',[c.nom,...(c.adresse||'').split('\n'),[c.ville,p?p[1]:''].filter(Boolean).join(', '),v.tvaIntra||c.tvaIntra?'TVA / VAT : '+(v.tvaIntra||c.tvaIntra):''],108);
  y+=38;
  const transp=[e.transporteur||'DHL',e.suivi?`lettre de transport n° ${e.suivi}`:'',e.date?`expédiées le ${dF.format(new Date(e.date))}`:''].filter(Boolean).join(', ');
  const transpEn=[e.transporteur||'DHL',e.suivi?`waybill no. ${e.suivi}`:'',e.date?`shipped on ${dF.format(new Date(e.date))}`:''].filter(Boolean).join(', ');
  pdf.setFontSize(10);
  let w=pdf.splitTextToSize(txt(`Nous soussignés, ${c.nom||'le client'}, attestons avoir reçu les marchandises désignées ci-dessous, transportées depuis la France par ${transp}.`),R-L);pdf.text(w,L,y);y+=w.length*4.8+1;
  pdf.setFont('helvetica','italic');pdf.setTextColor(90);pdf.setFontSize(9);
  w=pdf.splitTextToSize(txt(`We, the undersigned, hereby certify that we have received the goods listed below, transported from France by ${transpEn}.`),R-L);pdf.text(w,L,y);y+=w.length*4.3+4;
  pdf.setFont('helvetica','normal');pdf.setTextColor(0);
  const body=v.lignes.map(l=>[txt(l.etiquette),txt(l.designation+(l.detail?' - '+l.detail:'')),String(l.qte)]);
  const nb=v.lignes.reduce((t,l)=>t+l.qte,0);
  if(pdf.autoTable){pdf.autoTable({startY:y,head:[['Réf.','Désignation / Description','Qté / Qty']],body,foot:[['','Total montures / Total frames',String(nb)]],margin:{left:L,right:210-R},
    styles:{font:'helvetica',fontSize:9,cellPadding:2},headStyles:{fillColor:[10,102,112],textColor:255},footStyles:{fillColor:[240,243,245],textColor:20,fontStyle:'bold'},columnStyles:{0:{cellWidth:22},2:{halign:'right',cellWidth:24}},showFoot:'lastPage'});y=pdf.lastAutoTable.finalY+10}
  else{body.forEach(r=>{pdf.text(r.join('   '),L,y);y+=5});y+=6}
  if(y>200){pdf.addPage();y=24}
  const field=(fr,en,x,wid)=>{pdf.setFontSize(9);pdf.text(txt(fr),x,y);pdf.setFont('helvetica','italic');pdf.setTextColor(110);pdf.setFontSize(8);pdf.text(en,x,y+4);pdf.setFont('helvetica','normal');pdf.setTextColor(0);pdf.setDrawColor(150);pdf.line(x,y+12,x+wid,y+12)};
  field('Date de réception','Date of receipt',L,78);field('Lieu de réception (ville, pays)','Place of receipt (city, country)',108,84);y+=20;
  field('Nom et qualité du signataire','Name and position of signatory',L,78);y+=20;
  pdf.setFontSize(9);pdf.text('Signature et cachet de l\'entreprise',L,y);pdf.setFont('helvetica','italic');pdf.setTextColor(110);pdf.setFontSize(8);pdf.text('Signature and company stamp',L,y+4);
  pdf.setTextColor(0);pdf.setFont('helvetica','normal');pdf.setDrawColor(150);pdf.roundedRect(L,y+7,90,32,2,2);y+=48;
  pdf.setFontSize(8);pdf.setTextColor(100);
  const foot=[`Merci de retourner ce document daté, signé et revêtu de votre cachet${s.email?' à '+s.email:''}. / Please return this document dated, signed and stamped${s.email?' to '+s.email:''}.`,
    reg==='ue'?'Attestation établie conformément à l\'article 45 bis du règlement d\'exécution (UE) n° 282/2011 (livraison intracommunautaire, article 262 ter I du CGI).':''].filter(Boolean);
  foot.forEach(t=>{const ww=pdf.splitTextToSize(txt(t),R-L);pdf.text(ww,L,Math.min(y,282));y+=ww.length*3.8+1});
  return pdf.output('arraybuffer');
}
const abToB64=ab=>{let s='';const b=new Uint8Array(ab);for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)};
const attFile=v=>`Attestation de reception ${v.facture}.pdf`;
function attBlock(v){
  const a=v.attestation||{},signed=docsCat(v,'Attestation de réception');
  const st=signed.length?`<span class="pill ok">Signée reçue</span>`:a.envoyeeLe?`<span class="pill warn">Envoyée, en attente de signature</span>`:`<span class="pill neutral">Pas encore envoyée</span>`;
  return`<div class="att-box"><div class="row-between"><div><b>Attestation de réception</b><span class="sub">${a.envoyeeLe?`Envoyée le ${dF.format(new Date(a.envoyeeLe))}${a.a?' à '+esc(a.a):''}${a.mode==='messagerie'?' (via votre messagerie)':''}`:'À faire signer par le client à la réception des montures.'}</span></div>${st}</div>
    <div class="row-btns" style="justify-content:flex-start">
      <button class="btn small${a.envoyeeLe?'':' primary'}" data-act="att-send" data-id="${v.id}">${a.envoyeeLe?'Renvoyer':'Préparer et envoyer'}</button>
      <button class="btn small" data-act="att-pdf" data-id="${v.id}">Télécharger le PDF</button>
      ${assetsNS?`<label class="btn small${a.envoyeeLe&&!signed.length?' primary':''}" style="cursor:pointer">Joindre l'attestation signée<input type="file" hidden accept=".pdf,image/*" data-dzcat="Attestation de réception" data-vid="${v.id}" data-back="documents"></label>`:''}
    </div></div>`;
}
function attForm(id){
  const v=S.ventes.find(x=>x.id===id);if(!v)return;const c=cli(v.clientId)||{},mail=window.__PRISMEA__.mail||{};
  if(!window.jspdf){toast('Le module PDF n\'a pas pu se charger. Vérifiez la connexion internet.');return}
  const sig=(window.__PRISMEA__.user||{}).nom||'';
  const msg=`Bonjour,\n\nVeuillez trouver ci-joint l'attestation de réception relative à notre facture ${v.facture}${expOf(v).suivi?' (envoi DHL n° '+expOf(v).suivi+')':''}.\n\nÀ réception des montures, merci de nous la retourner datée, signée et revêtue de votre cachet, en réponse à ce message.\n\nNous vous remercions par avance.\n\nCordialement,\n${sig}\n${S.societe.nom||''}`;
  openModal('Envoyer l\'attestation de réception',`${c.nom||''} · facture ${v.facture}`,`
  <fieldset>
    <label class="full">E-mail du client<input id="at-to" type="email" value="${esc(c.email||'')}" placeholder="adresse@client.com"><span class="hint">${c.email?'Repris de la fiche client':'Aucun e-mail dans la fiche client : saisissez-le (il sera ajouté à la fiche)'}</span></label>
    <label class="full">Objet<input id="at-subj" value="${esc(`Attestation de réception – facture ${v.facture}`)}"></label>
    <label class="full">Message<textarea id="at-msg" rows="9">${esc(msg)}</textarea></label>
  </fieldset>
  <p class="hint" style="margin:0">L'attestation PDF (${esc(attFile(v))}) est jointe automatiquement et une copie est rangée dans les documents de la vente.</p>
  ${mail.configured?'':'<div class="lu-box warn">L\'envoi direct depuis Prismea n\'est pas encore activé. Le bouton ci-dessous télécharge le PDF et ouvre votre messagerie avec le message prêt : il vous restera à y joindre le PDF.</div>'}`,
  `<button class="btn" data-act="k-open" data-id="${v.id}">Retour</button><button class="btn primary" id="at-ok">${mail.configured?'Envoyer':'Télécharger et ouvrir ma messagerie'}</button>`,()=>{
    $('#at-to').focus();
    $('#at-ok').onclick=async()=>{
      const to=$('#at-to').value.trim(),subj=$('#at-subj').value.trim(),text=$('#at-msg').value;
      if(!/^\S+@\S+\.\S+$/.test(to)){toast('Saisissez une adresse e-mail valide.');$('#at-to').focus();return}
      const btn=$('#at-ok');btn.disabled=true;btn.textContent='Préparation…';
      const ab=attestationPDF(v);
      if(c.id&&!c.email){const cc=cli(c.id);if(cc)cc.email=to}
      try{
        if(mail.configured){
          btn.textContent='Envoi…';
          const r=await fetch('/api/mail',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,subject:subj,text,replyTo:S.societe.email||'',attachments:[{name:attFile(v),content:abToB64(ab)}]})});
          if(!r.ok)throw new Error('envoi');
        }else{
          await offerFile(attFile(v),new Blob([ab],{type:'application/pdf'}));
          const a=document.createElement('a');a.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(text)}`;a.click();
        }
        if(assetsNS){try{const up=await assetsNS.upload(new File([ab],attFile(v),{type:'application/pdf'}),{type:'application/pdf'});
          v.documents=v.documents||[];v.documents.push({id:up.id,nom:attFile(v),type:'application/pdf',taille:up.sizeBytes||ab.byteLength,date:new Date().toISOString(),cat:'Attestation envoyée (à signer)'})}catch(x){}}
        v.attestation={envoyeeLe:new Date().toISOString(),a:to,mode:mail.configured?'prismea':'messagerie'};
        save();render();venteDetail(v.id,'documents');toast(mail.configured?`Attestation envoyée à ${to}`:'PDF téléchargé : joignez-le au message ouvert dans votre messagerie');
      }catch(x){btn.disabled=false;btn.textContent=mail.configured?'Envoyer':'Télécharger et ouvrir ma messagerie';toast('L\'envoi a échoué. Vérifiez l\'adresse ou réessayez.')}
    };
  });
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act^="att-"]');if(!b)return;const v=S.ventes.find(x=>x.id===b.dataset.id);if(!v)return;
  if(b.dataset.act==='att-send')attForm(v.id);
  if(b.dataset.act==='att-pdf'){if(!window.jspdf){toast('Le module PDF n\'a pas pu se charger.');return}offerFile(attFile(v),new Blob([attestationPDF(v)],{type:'application/pdf'}))}
});

/* ---------- Justificatif de virement pour la banque ---------- */
const PDFLIB='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
let pdfLibReady=null;
function loadPdfLib(){
  if(window.PDFLib)return Promise.resolve(window.PDFLib);
  if(!pdfLibReady)pdfLibReady=new Promise((ok,ko)=>{const s=document.createElement('script');s.src=PDFLIB;s.onload=()=>ok(window.PDFLib);s.onerror=()=>{pdfLibReady=null;ko(new Error('pdf-lib'))};document.head.appendChild(s)});
  return pdfLibReady;
}
/* Pièces du dossier, dans l'ordre où la banque les lira */
function bankPieces(v){
  const pick=cats=>(v.documents||[]).filter(d=>cats.includes(d.cat));
  return[
    {k:'facture',t:'Facture '+v.facture,gen:true,ok:true},
    {k:'awb',t:'Bordereau DHL (lettre de transport)',docs:pick(['Bordereau DHL'])},
    {k:'dae',t:'Déclaration d\'export',docs:pick(['Déclaration d\'export (DAE)'])},
    {k:'sortie',t:'Preuve de sortie de l\'Union européenne',docs:pick(['Avis de sortie'])},
    {k:'recep',t:'Preuve de réception par le client',docs:pick(['Attestation de réception','Preuve de livraison'])},
  ].map(p=>({...p,ok:p.gen||p.docs.length>0}));
}
function bankCover(v,r,pieces){
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'mm',format:'a4'});
  const txt=s=>String(s??'').replace(/[  ]/g,' ').replace(/□/g,'/').replace(/[−–]/g,'-');
  const s=S.societe,c=cli(v.clientId)||{},p=paysByCode(c.pays),e=expOf(v),d=v.douane||{};
  const L=18,R=192;let y=22;
  pdf.setFont('helvetica','bold');pdf.setFontSize(16);pdf.text('JUSTIFICATIF DE VIREMENT REÇU',L,y);
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(90);pdf.text(txt(`${s.nom||''}${s.siren?' · SIREN '+s.siren:''}${s.tvaIntra?' · TVA '+s.tvaIntra:''}`),L,y+6);pdf.setTextColor(0);
  y+=18;
  const sec=t=>{pdf.setFont('helvetica','bold');pdf.setFontSize(11);pdf.text(txt(t),L,y);pdf.setDrawColor(10,102,112);pdf.line(L,y+1.5,R,y+1.5);y+=7;pdf.setFont('helvetica','normal');pdf.setFontSize(9.5)};
  const row=(k,val)=>{if(!val)return;pdf.setTextColor(100);pdf.text(txt(k),L,y);pdf.setTextColor(0);const w=pdf.splitTextToSize(txt(val),R-L-58);pdf.text(w,L+58,y);y+=Math.max(1,w.length)*4.8};
  sec('Le virement');
  row('Montant reçu',money(r.montant).replace(/[  ]/g,' '));
  row('Date de réception',dF.format(new Date(r.date)));
  row('Donneur d\'ordre',c.nom);row('Pays',p?p[1]:'');
  row('Banque émettrice',r.banque);row('Référence du virement',r.ref);
  y+=3;sec('L\'opération commerciale');
  row('Nature','Vente de montures optiques (marchandises), code douanier SH 9003');
  row('Facture',`${v.facture} du ${dF.format(new Date(v.date))}`);
  row('Montant de la facture',`${money(v.ttc).replace(/[  ]/g,' ')} ${regOf(v)==='fr'?'TTC':'(hors taxes, '+(regOf(v)==='ue'?'livraison intracommunautaire':'exportation')+')'}`);
  row('Quantité',`${v.lignes.reduce((t,l)=>t+l.qte,0)} montures`);
  row('Client',[c.nom,c.ville,p?p[1]:''].filter(Boolean).join(', '));
  if(c.nif||c.rccm||c.tvaIntra)row('Identifiants du client',[c.tvaIntra?'TVA '+c.tvaIntra:'',c.nif?'NIF '+c.nif:'',c.rccm?'RCCM '+c.rccm:''].filter(Boolean).join(' · '));
  y+=3;sec('Le transport et la livraison');
  row('Transporteur',e.transporteur||(e.suivi?'DHL':''));
  row('Lettre de transport',e.suivi);
  row('Date d\'expédition',e.date?dF.format(new Date(e.date)):'');
  if(d.mrn)row('Déclaration d\'export (MRN)',d.mrn);
  if(d.dateSortie)row('Sortie de l\'UE',dF.format(new Date(d.dateSortie)));
  row('Livraison',e.livraison?dF.format(new Date(e.livraison)):d.dateReception?dF.format(new Date(d.dateReception)):'');
  y+=3;sec('Pièces jointes à ce dossier');
  pieces.forEach((pc,i)=>{pdf.text(txt(`${i+1}. ${pc.t}${pc.ok?'':' — non disponible'}`),L,y);y+=5});
  y+=6;pdf.setFontSize(8.5);pdf.setTextColor(100);
  pdf.text(pdf.splitTextToSize(txt(`Document établi le ${dF.format(new Date())} par ${s.nom||'la société'} pour justifier l'origine des fonds reçus. Contact : ${[s.email,s.tel].filter(Boolean).join(' · ')}`),R-L),L,y);
  return pdf.output('arraybuffer');
}
async function bankDossier(v,r,keys){
  const lib=await loadPdfLib();const out=await lib.PDFDocument.create();
  const pieces=bankPieces(v).filter(p=>keys.includes(p.k));
  const addPdf=async ab=>{try{const src=await lib.PDFDocument.load(ab,{ignoreEncryption:true});const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(pg=>out.addPage(pg));return true}catch(e){return false}};
  const addImg=async(ab,type)=>{const img=/png/.test(type)?await out.embedPng(ab):await out.embedJpg(ab);const A4=[595.28,841.89],m=36,sc=Math.min((A4[0]-2*m)/img.width,(A4[1]-2*m)/img.height,1);
    const pg=out.addPage(A4);pg.drawImage(img,{x:(A4[0]-img.width*sc)/2,y:A4[1]-m-img.height*sc,width:img.width*sc,height:img.height*sc})};
  await addPdf(bankCover(v,r,pieces));
  const skipped=[];
  for(const pc of pieces){
    if(pc.gen){await addPdf(invoicePDF(v));continue}
    for(const d of pc.docs){
      try{const res=await fetch('/api/files/'+encodeURIComponent(d.id),{credentials:'same-origin'});if(!res.ok)throw 0;const ab=await res.arrayBuffer();
        if(/pdf/.test(d.type)){if(!await addPdf(ab))skipped.push(d.nom)}else if(/png|jpe?g/.test(d.type))await addImg(ab,d.type);else skipped.push(d.nom)}
      catch(e){skipped.push(d.nom)}
    }
  }
  return{bytes:await out.save(),skipped};
}
const bankFile=v=>`Justificatif virement ${v.facture}.pdf`;
function bankForm(vid,rid){
  const v=S.ventes.find(x=>x.id===vid),r=S.reglements.find(x=>x.id===rid);if(!v||!r)return;
  if(!window.jspdf){toast('Le module PDF n\'a pas pu se charger. Vérifiez la connexion internet.');return}
  const c=cli(v.clientId)||{},p=paysByCode(c.pays),e=expOf(v),mail=window.__PRISMEA__.mail||{},pieces=bankPieces(v),sig=(window.__PRISMEA__.user||{}).nom||'';
  const msg=`Bonjour,\n\nNous avons reçu le ${dF.format(new Date(r.date))} un virement de ${money(r.montant)} de la part de notre client ${c.nom||''}${p?' ('+p[1]+')':''}${r.banque?', émis par '+r.banque:''}${r.ref?', référence '+r.ref:''}.\n\nCe virement correspond au règlement de notre facture ${v.facture} du ${dF.format(new Date(v.date))}, pour la vente de ${v.lignes.reduce((t,l)=>t+l.qte,0)} montures optiques${e.suivi?', expédiées par '+(e.transporteur||'DHL')+' (lettre de transport n° '+e.suivi+')':''}.\n\nVous trouverez ci-joint le dossier justificatif réunissant :\n${pieces.filter(x=>x.ok).map(x=>'- '+x.t).join('\n')}\n\nNous restons à votre disposition pour tout complément.\n\nCordialement,\n${sig}\n${S.societe.nom||''}`.replace(/[  ]/g,' ');
  openModal('Justifier le virement auprès de la banque',`${money(r.montant)} reçu le ${dF.format(new Date(r.date))} · facture ${v.facture}`,`
  <fieldset>
    <label class="full">E-mail de votre conseiller bancaire<input id="bk-to" type="email" value="${esc(S.societe.emailBanque||'')}" placeholder="conseiller@banque.fr"><span class="hint">${S.societe.emailBanque?'Repris des Paramètres':'Il sera enregistré dans les Paramètres pour la prochaine fois'}</span></label>
    <label class="full">Objet<input id="bk-subj" value="${esc(`Justificatif du virement reçu de ${c.nom||'notre client'} – ${money(r.montant)}`.replace(/[  ]/g,' '))}"></label>
  </fieldset>
  <div><h3 style="font-size:15px;margin:0 0 8px">Pièces du dossier</h3><div class="checklist">${pieces.map(pc=>`<label class="ck ${pc.ok?'ok':''}"><input type="checkbox" data-bk="${pc.k}" ${pc.ok?'checked':'disabled'} style="width:auto;margin:0"><span><b>${pc.t}</b><span class="sub">${pc.gen?'Générée par Prismea':pc.ok?pc.docs.map(d=>esc(d.nom)).join(', '):'Non disponible : à ajouter dans les documents de la vente'}</span></span><span></span></label>`).join('')}</div></div>
  <label>Message<textarea id="bk-msg" rows="12">${esc(msg)}</textarea></label>
  <p class="hint" style="margin:0">Les pièces sont réunies en un seul PDF, précédé d'une page de synthèse : ${esc(bankFile(v))}.</p>
  ${mail.configured?'':'<div class="lu-box warn">L\'envoi direct n\'est pas activé : le dossier PDF sera téléchargé et votre messagerie s\'ouvrira avec le message prêt. Il vous restera à joindre le PDF.</div>'}`,
  `<button class="btn" data-act="k-open" data-id="${v.id}">Retour</button><button class="btn" id="bk-dl">Télécharger le dossier</button><button class="btn primary" id="bk-ok">${mail.configured?'Envoyer à la banque':'Télécharger et ouvrir ma messagerie'}</button>`,()=>{
    $('.modal-card').classList.add('wide');
    const keys=()=>[...document.querySelectorAll('[data-bk]:checked')].map(x=>x.dataset.bk);
    const build=async btn=>{const old=btn.textContent;btn.disabled=true;btn.textContent='Préparation du dossier…';
      try{const d=await bankDossier(v,r,keys());if(d.skipped.length)toast('Non intégré(s) au dossier : '+d.skipped.join(', '));return d}
      catch(e){toast('Le dossier n\'a pas pu être préparé. Vérifiez la connexion internet.');return null}finally{btn.disabled=false;btn.textContent=old}};
    $('#bk-dl').onclick=async()=>{const d=await build($('#bk-dl'));if(d)offerFile(bankFile(v),new Blob([d.bytes],{type:'application/pdf'}))};
    $('#bk-ok').onclick=async()=>{
      const to=$('#bk-to').value.trim(),subj=$('#bk-subj').value.trim(),text=$('#bk-msg').value;
      if(!/^\S+@\S+\.\S+$/.test(to)){toast('Saisissez l\'e-mail de votre conseiller bancaire.');$('#bk-to').focus();return}
      const btn=$('#bk-ok'),d=await build(btn);if(!d)return;
      try{
        if(mail.configured){btn.disabled=true;btn.textContent='Envoi…';
          const res=await fetch('/api/mail',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,subject:subj,text,replyTo:S.societe.email||'',attachments:[{name:bankFile(v),content:abToB64(d.bytes)}]})});
          if(!res.ok)throw 0}
        else{await offerFile(bankFile(v),new Blob([d.bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(text)}`;a.click()}
        if(!S.societe.emailBanque)S.societe.emailBanque=to;
        r.justifBanque={le:new Date().toISOString(),a:to,mode:mail.configured?'prismea':'messagerie'};
        save();render();venteDetail(v.id,'reglements');toast(mail.configured?`Dossier envoyé à ${to}`:'Dossier téléchargé : joignez-le au message ouvert dans votre messagerie');
      }catch(x){btn.disabled=false;btn.textContent=mail.configured?'Envoyer à la banque':'Télécharger et ouvrir ma messagerie';toast('L\'envoi a échoué. Réessayez ou téléchargez le dossier.')}
    };
  });
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act="bk-open"]');if(b)bankForm(b.dataset.id,b.dataset.rid)});

/* ---------- Routeur et événements ---------- */
function render(){
  const r=location.hash.slice(1);
  if(r==='clients'){$('#app').innerHTML=viewClients();if(S.clients.length)fillRows()}
  else if(r.startsWith('client-'))$('#app').innerHTML=viewClient(r.slice(7));
  else if(r.startsWith('vente-')||r.startsWith('devis-')){const k=r.slice(0,5);$('#app').innerHTML=viewDoc(k,r.slice(6));if(doc){drawDoc();$('#scan')?.focus()}}
  else if(r==='stock'){$('#app').innerHTML=viewStock();fillStock()}
  else if(r==='entree'){$('#app').innerHTML=viewEntree();drawRec();$('#rscan')?.focus()}
  else if(r==='catalogue'){$('#app').innerHTML=viewCatalogue();bindImport();if(imp)drawImport()}
  else if(r==='caisse')$('#app').innerHTML=viewCaisse();
  else if(r==='parametres')$('#app').innerHTML=viewParametres();
  else if(r==='statistiques')$('#app').innerHTML=viewStats();
  else if(r==='achats')$('#app').innerHTML=viewAchats();
  else $('#app').innerHTML=viewHome();
}
window.addEventListener('hashchange',()=>{closeModal();render();window.scrollTo(0,0)});
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('img.thumb[data-zoom]');if(!t||t.closest('#modal'))return;e.stopPropagation();e.preventDefault();photoView(mon(t.dataset.zoom))},true);
document.addEventListener('input',e=>{if(e.target.id==='q')fillRows()});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='fp')fillRows();
  else if(t.dataset.dq){setDq(t.dataset.dq,Math.max(0,Math.round(+t.value||0)))}
  else if(t.dataset.drem&&doc){const l=doc.lignes.find(x=>x.montureId===t.dataset.drem);if(l){let v=Math.max(0,Math.round((+String(t.value).replace(',','.')||0)*100)/100);v=isE(l.remT)?Math.min(v,+l.pu||0):Math.min(100,v);if(v)l.rem=v;else delete l.rem;drawDoc()}}
  else if(t.id==='d-rem'){const v=Math.max(0,Math.round((+String(t.value).replace(',','.')||0)*100)/100);doc.remise=isE(doc.remiseT)?v:Math.min(100,v);drawDoc()}
  else if(t.id==='d-pay'){doc.paiement=t.value;drawDoc()}
  else if(t.id==='d-banque'&&doc)doc.banque=t.value.trim();
  else if(t.id==='d-ref'&&doc)doc.ref=t.value.trim();
  else if(t.id==='d-val')doc.validite=t.value;
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#modal').hidden)closeModal();
  if(e.key==='Enter'&&e.target.id==='scan'){e.preventDefault();scanAdd()}
  if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.drem){e.preventDefault();e.target.blur();const sc=$('#scan');if(sc)sc.focus()}
  if(e.key==='Enter'&&e.target.matches('tr.click'))location.hash='client-'+e.target.dataset.id;
});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('click',e=>{
  const soon=e.target.closest('[data-soon]');if(soon){$('#note').textContent='Le module '+soon.dataset.soon+' sera construit à une prochaine étape.';return}
  const tr=e.target.closest('tr.click');if(tr){location.hash='client-'+tr.dataset.id;return}
  const b=e.target.closest('[data-act]');if(!b)return;
  const id=b.dataset.id;
  switch(b.dataset.act){
    case'close':closeModal();break;
    case'new':clientForm();break;
    case'edit':clientForm(cli(id));break;
    case'del':
      if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Confirmer la suppression';break}
      S.clients=S.clients.filter(c=>c.id!==id);save();closeModal();location.hash='clients';toast('Client supprimé');break;
    case'sale':location.hash='vente-'+id;break;
    case'quote':location.hash='devis-'+id;break;
    case'scan-add':scanAdd();break;
    case'dq+':setDq(id,1,true);break;
    case'dq-':setDq(id,-1,true);break;
    case'drm':setDq(id,0);break;
    case'drem-u':{const l=doc&&doc.lignes.find(x=>x.montureId===id);if(l){if(isE(l.remT))delete l.remT;else l.remT='€';delete l.rem;drawDoc();const i=document.querySelector(`[data-drem="${id}"]`);if(i)i.focus()}break}
    case'd-rem-u':if(doc){if(isE(doc.remiseT))delete doc.remiseT;else doc.remiseT='€';doc.remise=0;drawDoc();const i=$('#d-rem');if(i)i.focus()}break;
    case'doc-ok':validateDoc();break;
    case'doc-cancel':{const c=doc&&doc.clientId;doc=null;location.hash=c?'client-'+c:'clients';break}
    case'showdoc':showDoc(id);break;
  }
});
const d=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
$('#date').textContent=d.charAt(0).toUpperCase()+d.slice(1);
render();
window.__prismeaRemote=()=>{
  const a=document.activeElement,typing=a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)&&a.id!=='qs'&&a.id!=='q';
  if($('#modal').hidden&&!doc&&!rec&&!imp&&!typing)render();
};
})();

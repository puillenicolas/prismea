/* Prismea — connexion, chargement des données et synchronisation avec le serveur */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KINDS=['clients','montures','ventes','devis','receptions','reglements','clotures','catalogue','marques','fournisseurs','facturesF'];
const normEAN=v=>String(v??'').replace(/\D/g,'').replace(/^0+/,'');

async function api(path,opt){
  opt=opt||{};
  const o={method:opt.method||'GET',credentials:'same-origin',headers:{}};
  if(opt.body!==undefined){o.body=JSON.stringify(opt.body);o.headers['Content-Type']='application/json'}
  const r=await fetch(path,o);let j=null;try{j=await r.json()}catch(e){}
  if(r.status===401&&!opt.noRedirect){location.reload();throw{code:'non_connecte'}}
  if(!r.ok)throw{code:(j&&j.error)||'erreur',status:r.status};
  return j;
}

/* ---------- Écrans de connexion ---------- */
function authCard(inner){
  document.body.classList.add('auth');
  $('#app').innerHTML=`<section class="auth-card"><div class="auth-brand">${$('.brand svg').outerHTML}<b>Prismea</b></div>${inner}</section>`;
}
function showLogin(err){
  authCard(`<h1>Connexion</h1><p class="muted">Gestion commerciale de la centrale.</p>
  <form id="login-f" class="auth-form" novalidate>
    <label>Identifiant<input id="l-login" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="nicolas, laurent ou jennifer" required></label>
    <label>Mot de passe<input id="l-pw" type="password" autocomplete="current-password" required></label>
    <p class="auth-err" id="l-err" role="alert">${esc(err||'')}</p>
    <button class="btn primary block" type="submit">Se connecter</button>
  </form>`);
  $('#l-login').focus();
  $('#login-f').addEventListener('submit',async e=>{
    e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;$('#l-err').textContent='';
    try{const j=await api('/api/login',{method:'POST',body:{login:$('#l-login').value,password:$('#l-pw').value},noRedirect:true});start(j.user)}
    catch(x){btn.disabled=false;$('#l-err').textContent=x.code==='trop_de_tentatives'?'Trop de tentatives. Réessayez dans 5 minutes.':'Identifiant ou mot de passe incorrect.';$('#l-pw').select()}
  });
}
function showChangePw(user){
  authCard(`<h1>Bienvenue ${esc(user.nom.split(' ')[0])}</h1><p class="muted">Pour votre première connexion, choisissez votre mot de passe personnel (8 caractères minimum).</p>
  <form id="pw-f" class="auth-form" novalidate>
    <label>Nouveau mot de passe<input id="p1" type="password" autocomplete="new-password" minlength="8" required></label>
    <label>Confirmer le mot de passe<input id="p2" type="password" autocomplete="new-password" minlength="8" required></label>
    <p class="auth-err" id="p-err" role="alert"></p>
    <button class="btn primary block" type="submit">Enregistrer et continuer</button>
  </form>`);
  $('#p1').focus();
  $('#pw-f').addEventListener('submit',async e=>{
    e.preventDefault();const a=$('#p1').value,b=$('#p2').value,err=$('#p-err');
    if(a.length<8){err.textContent='Le mot de passe doit faire au moins 8 caractères.';return}
    if(a!==b){err.textContent='Les deux mots de passe ne sont pas identiques.';return}
    try{const j=await api('/api/password',{method:'POST',body:{password:a}});start(j.user)}
    catch(x){err.textContent=x.code==='identique_initial'?'Choisissez un mot de passe différent du mot de passe provisoire.':'Le mot de passe n\'a pas pu être enregistré.'}
  });
}

/* ---------- Synchronisation ---------- */
const Sync={snap:new Map(),since:null,timer:null,busy:null,dirty:false,state:null,status:'ok'};
function recId(kind,r){
  if(r.id)return String(r.id);
  if(kind==='clotures'&&r.semaine)r.id='w'+r.semaine;
  else if(kind==='catalogue'&&r.ean)r.id='e'+normEAN(r.ean);
  else r.id=kind.slice(0,2)+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  return r.id;
}
function current(){
  const m=new Map(),S=Sync.state;
  for(const [k,v] of Object.entries(S)){
    if(typeof v==='function'||v===undefined)continue;
    if(KINDS.includes(k)&&Array.isArray(v)){for(const r of v){if(r&&typeof r==='object')m.set(k+'\u0001'+recId(k,r),JSON.stringify(r))}}
    else if(!Array.isArray(v))m.set('meta\u0001'+k,JSON.stringify({v}));
  }
  return m;
}
function setStatus(st,txt){
  Sync.status=st;const el=$('#sync');if(!el)return;
  el.className='sync '+st;el.title=txt;el.querySelector('span').textContent=txt;
}
async function flush(){
  if(Sync.busy){try{await Sync.busy}catch(e){}}
  clearTimeout(Sync.timer);Sync.pending=false;
  const cur=current(),ups=[],dels=[];
  for(const [k,v] of cur){if(Sync.snap.get(k)!==v){const [kind,id]=k.split('\u0001');ups.push({kind,id,data:JSON.parse(v),_k:k,_v:v})}}
  for(const k of Sync.snap.keys()){if(!cur.has(k)){const [kind,id]=k.split('\u0001');if(kind!=='meta')dels.push({kind,id,_k:k})}}
  if(!ups.length&&!dels.length){setStatus('ok','Enregistré');return}
  setStatus('busy','Enregistrement…');
  Sync.busy=(async()=>{
    try{
      for(let i=0;i<Math.max(ups.length,1);i+=400){
        const chunkU=ups.slice(i,i+400),chunkD=i===0?dels:[];
        await api('/api/sync',{method:'POST',body:{upserts:chunkU.map(({kind,id,data,_k})=>{const o={kind,id,data};if(kind==='montures'&&Sync.snap.has(_k)){try{o.base={qte:JSON.parse(Sync.snap.get(_k)).qte}}catch(e){}}return o}),deletes:chunkD.map(({kind,id})=>({kind,id}))}});
        chunkU.forEach(u=>Sync.snap.set(u._k,u._v));chunkD.forEach(d=>Sync.snap.delete(d._k));
      }
      setStatus('ok','Enregistré');
    }catch(e){
      setStatus('off','Hors connexion, nouvel essai…');
      clearTimeout(Sync.timer);Sync.timer=setTimeout(flush,5000);
      throw e;
    }finally{Sync.busy=null}
  })();
  return Sync.busy;
}
function schedule(){Sync.pending=true;setStatus('busy','Enregistrement…');clearTimeout(Sync.timer);Sync.timer=setTimeout(()=>flush().catch(()=>{}),350)}
function applyRemote(kind,id,data,deleted){
  const S=Sync.state,key=kind+'\u0001'+id;
  if(kind==='meta'){
    const local=JSON.stringify({v:S[id]});if(Sync.snap.has(key)&&local!==Sync.snap.get(key))return false;
    S[id]=data.v;Sync.snap.set(key,JSON.stringify({v:data.v}));return true;
  }
  if(!Array.isArray(S[kind]))S[kind]=[];
  const arr=S[kind],i=arr.findIndex(r=>r&&String(r.id)===id);
  if(i>=0&&Sync.snap.has(key)&&JSON.stringify(arr[i])!==Sync.snap.get(key))return false; // modification locale pas encore envoyée
  if(deleted){if(i>=0)arr.splice(i,1);Sync.snap.delete(key);return i>=0}
  const js=JSON.stringify(data);
  if(i>=0){if(JSON.stringify(arr[i])===js){Sync.snap.set(key,js);return false}arr[i]=data}else arr.push(data);
  Sync.snap.set(key,js);return true;
}
async function poll(){
  if(document.hidden){Sync.pollT=setTimeout(poll,15000);return}
  try{
    const j=await api('/api/changes?since='+encodeURIComponent(Sync.since));
    Sync.since=j.now;let changed=false;
    for(const r of j.records)if(applyRemote(r.kind,r.id,r.data,r.deleted))changed=true;
    if(changed&&window.__prismeaRemote)window.__prismeaRemote();
    if(Sync.status==='off')flush().catch(()=>{});
  }catch(e){if(e.code!=='non_connecte')setStatus('off','Hors connexion, nouvel essai…')}
  Sync.pollT=setTimeout(poll,12000);
}
async function alloc(name,min){const j=await api('/api/seq/'+name,{method:'POST',body:{min:min||0}});return j.value}

window.PrismeaSync={schedule,flush,alloc,applyRemote};
window.addEventListener('beforeunload',e=>{if(Sync.pending||Sync.busy||Sync.status==='off'){e.preventDefault();e.returnValue=''}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Sync.since){clearTimeout(Sync.pollT);poll()}});

/* ---------- Démarrage ---------- */
async function start(user){
  if(!user){showLogin();return}
  if(user.mustChange){showChangePw(user);return}
  document.body.classList.remove('auth');
  $('#app').innerHTML='<p class="muted" style="padding:40px 0">Chargement des données…</p>';
  const [st,dh]=await Promise.all([api('/api/state'),api('/api/dhl/status').catch(()=>({configured:false}))]);
  Sync.state=st.state;Sync.since=st.now;Sync.snap=current();
  window.__PRISMEA__={state:st.state,user,dhl:!!dh.configured};
  const tr=$('#test-reset');if(tr)tr.hidden=false;
  const u=$('#user');u.hidden=false;
  u.querySelector('b').textContent=user.nom.split(' ')[0];
  $('#logout').onclick=async()=>{try{await flush()}catch(e){}await fetch('/api/logout',{method:'POST',credentials:'same-origin'});location.hash='';location.reload()};
  const s=document.createElement('script');s.src='/app.js?v=4';
  s.onload=()=>{flush().catch(()=>{});Sync.pollT=setTimeout(poll,12000)};
  document.body.appendChild(s);
}
function testBanner(){
  if(document.querySelector('.test-banner'))return;
  const b=document.createElement('div');b.className='test-banner';
  b.innerHTML='<div class="test-in"><span><b>Version test</b> · données fictives, à utiliser librement pour essayer. Rien n\'est lié à la vraie Prismea.</span><button class="link" id="test-reset" type="button" hidden>Remettre les données de test à zéro</button></div>';
  document.querySelector('.top').after(b);
  const btn=b.querySelector('#test-reset');
  btn.onclick=async()=>{
    if(!btn.dataset.sure){btn.dataset.sure='1';btn.textContent='Confirmer la remise à zéro (toutes les données de test seront remplacées)';return}
    btn.disabled=true;btn.textContent='Remise à zéro…';
    try{await api('/api/test/reset',{method:'POST',body:{}});Sync.snap=new Map();location.hash='';location.reload()}catch(e){btn.disabled=false;btn.textContent='La remise à zéro a échoué, réessayer'}
  };
}
api('/api/me',{noRedirect:true}).then(j=>{if(j.env==='test'){document.body.classList.add('env-test');testBanner()}start(j.user)}).catch(()=>{authCard('<h1>Prismea est injoignable</h1><p class="muted">Vérifiez la connexion internet puis rechargez la page.</p>')});
})();

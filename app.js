
const $=id=>document.getElementById(id);
const KEY='dj_inventur_v5_step1', HIST='dj_inventur_history_v5';
let products=[],locations=['Salon','Keller'],recent=[],current=null,scanner=null,articleScanner=null,fullScanner=null,lastScan='',theme='dark',activeLocationDetail=null,scanProduct=null,scanRestartAfterSave=false,fullFacing='environment';

const num=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:0};
const tx=v=>String(v??'').trim();
const euro=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v||0);
const total=p=>Object.values(p.counts||{}).reduce((a,b)=>a+num(b),0);
const diff=p=>total(p)-p.expected;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),1500)}
function save(){localStorage.setItem(KEY,JSON.stringify({products,locations,recent}));$('saveBadge').textContent='Gespeichert'}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d){products=d.products||[];locations=d.locations?.length?d.locations:['Salon','Keller'];recent=d.recent||[]}}catch(e){}}
function go(p){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));$('page-'+p).classList.add('active');document.querySelector(`.nav-item[data-page="${p}"]`)?.classList.add('active');const names={dashboard:['Dashboard','Dein Lagerbestand auf einen Blick.'],inventory:['Inventur','Scannen, zählen und direkt vergleichen.'],articles:['Artikel','Produkte, Preise und Mindestbestände.'],locations:['Lagerorte','Bestände nach Bereichen.'],stats:['Auswertung','Lagerwerte und Bestellbedarf.'],history:['Historie','Abgeschlossene Inventuren.'],settings:['Einstellungen','App und lokale Daten verwalten.']};$('pageHeading').textContent=names[p][0];$('pageSubheading').textContent=names[p][1];window.scrollTo({top:0,behavior:'smooth'})}
function find(q){q=tx(q).toLowerCase();return products.find(p=>(p.barcode||'').toLowerCase()===q)||products.find(p=>p.name.toLowerCase().includes(q))}
function detect(r,names){const ks=Object.keys(r);for(const n of names){let k=ks.find(x=>x.toLowerCase().replace(/[\s_-]/g,'')===n.toLowerCase().replace(/[\s_-]/g,''));if(k)return r[k]}for(const k of ks){if(names.some(n=>k.toLowerCase().includes(n.toLowerCase())))return r[k]}return''}
function mapRows(rows){
 products=rows.map((r,i)=>({id:crypto.randomUUID?crypto.randomUUID():'p'+i,name:tx(detect(r,['Artikel','Artikelname','Produkt','Produktname','Bezeichnung','Name']))||'Unbenannter Artikel',barcode:tx(detect(r,['Barcode','EAN','GTIN','Artikelnummer','Code'])),expected:num(detect(r,['Bestand','Soll','Lagerbestand','Warenbestand','Menge','Stock'])),buy:num(detect(r,['Einkaufspreis','EK','Purchase Price'])),sell:num(detect(r,['Verkaufspreis','VK','Retail Price'])),min:num(detect(r,['Mindestbestand','Minimum','Min Bestand'])),counts:{}}));recent=[];save();render();toast(products.length+' Artikel geladen');go('inventory')
}
function demo(){products=[
{id:'1',name:'Shampoo Repair 250 ml',barcode:'4000000000011',expected:10,buy:6.2,sell:14.9,min:4,counts:{Salon:5}},
{id:'2',name:'Conditioner Color 200 ml',barcode:'4000000000028',expected:6,buy:7.1,sell:16.9,min:3,counts:{Salon:6}},
{id:'3',name:'Haarspray Strong 300 ml',barcode:'4000000000035',expected:8,buy:5.7,sell:13.5,min:3,counts:{Keller:3}},
{id:'4',name:'Styling Paste Matt 100 ml',barcode:'4000000000042',expected:4,buy:8.4,sell:18.9,min:2,counts:{}},
{id:'5',name:'Haaröl Premium 100 ml',barcode:'4000000000059',expected:5,buy:9.8,sell:22.5,min:2,counts:{Salon:2,Keller:2}}
];recent=[{name:'Haaröl Premium 100 ml',qty:2,loc:'Keller',at:'10:18'},{name:'Conditioner Color 200 ml',qty:6,loc:'Salon',at:'10:12'}];save();render();toast('Demo-Daten geladen')}
function renderLocations(){
 const s=$('locationSelect'),cur=s.value;
 s.innerHTML=locations.map(l=>`<option>${esc(l)}</option>`).join('');
 if(locations.includes(cur))s.value=cur;
 const ss=$('scanLocation'); if(ss){const cur2=ss.value;ss.innerHTML=locations.map(l=>`<option>${esc(l)}</option>`).join(''); if(locations.includes(cur2))ss.value=cur2; else if(locations.includes(s.value))ss.value=s.value}
}
function render(){
 renderLocations();
 const counted=products.filter(p=>total(p)>0).length,diffs=products.filter(p=>total(p)>0&&diff(p)!==0).length,pct=products.length?Math.round(counted/products.length*100):0,value=products.reduce((a,p)=>a+total(p)*p.buy,0),below=products.filter(p=>p.min&&total(p)<p.min).length;
 $('dTotal').textContent=products.length;$('dValue').textContent=euro(value);$('dPercent').textContent=pct+' %';$('dDiffs').textContent=diffs;$('dProgressText').textContent=`${counted} von ${products.length} Artikeln`;$('progressBar').style.width=pct+'%';$('ringValue').textContent=pct+'%';$('progressRing').style.background=`conic-gradient(var(--gold2) ${pct*3.6}deg,#28231b 0deg)`;$('activeState').textContent=products.length?'Aktiv':'Bereit';$('belowMin').textContent=below;$('openCount').textContent=Math.max(0,products.length-counted);
 $('recentOverview').innerHTML=recent.length?recent.slice(0,5).map(r=>`<div class="activity-row"><div><strong>${esc(r.name)}</strong><small style="display:block;color:#777">${esc(r.loc)} · ${r.at}</small></div><b style="color:var(--gold)">+${r.qty}</b></div>`).join(''):'Noch nichts erfasst.';
 $('recentOverview').classList.toggle('empty',!recent.length);
 $('locationOverview').innerHTML=locations.map(loc=>{const countedLoc=products.filter(p=>num((p.counts||{})[loc])>0).length,p=products.length?Math.round(countedLoc/products.length*100):0;return `<div class="location-row"><div class="location-title"><span>${esc(loc)}</span><span>${p}%</span></div><div class="mini-progress"><i style="width:${p}%"></i></div></div>`}).join('')||'Keine Lagerorte.';
 $('inventoryCards').innerHTML=products.length?products.map(p=>productCard(p,true)).join(''):'<p style="color:#777">Noch keine Daten geladen.</p>';
 renderArticles();renderStats();renderLocationsPage();renderHistory()
}
function productCard(p,inventory=false){const c=total(p),d=diff(p),cl=c===0?'':d===0?'diff-good':'diff-bad';return `<article class="product-card"><h4>${esc(p.name)}</h4><div class="meta">${esc(p.barcode||'ohne Barcode')}</div><div class="numbers"><div><small>Soll</small><strong>${p.expected}</strong></div><div><small>Ist</small><strong>${c}</strong></div><div><small>Diff.</small><strong class="${cl}">${c?(d>0?'+':'')+d:'–'}</strong></div></div></article>`}

function renderSuggestions(){
 const box=$('searchSuggestions'),q=tx($('articleSearch').value).toLowerCase();
 if(!q){box.classList.add('hidden');box.innerHTML='';return}
 const matches=products.filter(p=>p.name.toLowerCase().includes(q)||(p.barcode||'').toLowerCase().includes(q)).slice(0,7);
 if(!matches.length){box.innerHTML='<div style="padding:12px;color:#777">Kein passender Artikel gefunden.</div>';box.classList.remove('hidden');return}
 box.innerHTML=matches.map(p=>`<button class="suggestion-item" data-id="${p.id}">
   <div><strong>${esc(p.name)}</strong><small>${esc(p.barcode||'ohne Barcode')}</small></div>
   <span class="suggestion-stock">Ist ${total(p)}</span>
 </button>`).join('');
 box.classList.remove('hidden');
 box.querySelectorAll('.suggestion-item').forEach(b=>b.addEventListener('click',()=>{
   const p=products.find(x=>String(x.id)===String(b.dataset.id)); if(!p)return;
   $('articleSearch').value=p.name; box.classList.add('hidden'); renderArticles();
   setTimeout(()=>document.querySelector(`[data-product-id="${CSS.escape(String(p.id))}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),50);
 }));
}
async function startArticleScanner(){
 if(typeof Html5Qrcode==='undefined'){toast('Scanner konnte nicht geladen werden');return}
 $('articleScannerModal').classList.remove('hidden');
 try{
   articleScanner=new Html5Qrcode('articleReader');
   await articleScanner.start({facingMode:'environment'},{fps:12,qrbox:{width:280,height:160}},async code=>{
     const p=find(code);
     if(!p){toast('Barcode nicht im Bestand gefunden');return}
     $('articleSearch').value=p.name;
     await stopArticleScanner();
     renderArticles();
     toast(p.name);
     setTimeout(()=>document.querySelector(`[data-product-id="${CSS.escape(String(p.id))}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),80);
   });
 }catch(e){toast('Kamera konnte nicht gestartet werden');$('articleScannerModal').classList.add('hidden')}
}
async function stopArticleScanner(){
 try{if(articleScanner){await articleScanner.stop();await articleScanner.clear();articleScanner=null}}catch(e){}
 $('articleScannerModal').classList.add('hidden');
}
function renderArticles(){const q=tx($('articleSearch').value).toLowerCase(),list=products.filter(p=>!q||p.name.toLowerCase().includes(q)||(p.barcode||'').includes(q));$('articleCards').innerHTML=list.length?list.map(p=>{const c=total(p),order=Math.max(0,(p.min||0)-c);return `<article class="product-card" data-product-id="${esc(p.id)}"><h4>${esc(p.name)}</h4><div class="meta">${esc(p.barcode||'–')}</div><div class="numbers"><div><small>Ist</small><strong>${c}</strong></div><div><small>EK</small><strong>${p.buy?euro(p.buy):'–'}</strong></div><div><small>Nachbest.</small><strong class="${order?'diff-bad':'diff-good'}">${order||'OK'}</strong></div></div></article>`}).join(''):'<p style="color:#777">Keine Artikel.</p>'}
function renderStats(){let ev=0,cv=0,rv=0;products.forEach(p=>{ev+=p.expected*p.buy;cv+=total(p)*p.buy;rv+=total(p)*p.sell});$('sExpected').textContent=euro(ev);$('sCounted').textContent=euro(cv);$('sRetail').textContent=euro(rv);$('sMargin').textContent=euro(rv-cv);const orders=products.map(p=>({p,n:Math.max(0,(p.min||0)-total(p))})).filter(x=>x.n>0);$('orders').innerHTML=orders.length?orders.map(x=>`<div class="order-row"><span>${esc(x.p.name)}</span><b class="diff-bad">${x.n} Stk.</b></div>`).join(''):'<p style="color:#777">Keine Bestellvorschläge.</p>';$('locationStats').innerHTML=locations.map(l=>{const pcs=products.reduce((a,p)=>a+num((p.counts||{})[l]),0),v=products.reduce((a,p)=>a+num((p.counts||{})[l])*p.buy,0);return `<div class="order-row"><span>${esc(l)}</span><b>${pcs} Stk. · ${euro(v)}</b></div>`}).join('')}
function renderLocationsPage(){
 $('locationPage').innerHTML=locations.map(l=>{
   const pcs=products.reduce((a,p)=>a+num((p.counts||{})[l]),0),
         items=products.filter(p=>num((p.counts||{})[l])>0).length,
         value=products.reduce((a,p)=>a+num((p.counts||{})[l])*p.buy,0);
   return `<article class="location-card" data-location="${esc(l)}">
     <span class="kicker gold">LAGERORT</span>
     <h3>${esc(l)}</h3>
     <strong>${pcs} Stück</strong>
     <p style="color:#777">${items} Artikel · ${euro(value)} EK-Wert</p>
     <span class="open-location">Produkte anzeigen →</span>
   </article>`
 }).join('');

 document.querySelectorAll('.location-card[data-location]').forEach(card=>{
   card.addEventListener('click',()=>showLocationDetail(card.dataset.location));
 });

 if(activeLocationDetail && locations.includes(activeLocationDetail)) showLocationDetail(activeLocationDetail,false);
}
function showLocationDetail(loc,scroll=true){
 activeLocationDetail=loc;
 const rows=products.filter(p=>num((p.counts||{})[loc])>0).sort((a,b)=>a.name.localeCompare(b.name,'de'));
 const pieces=rows.reduce((a,p)=>a+num((p.counts||{})[loc]),0);
 const value=rows.reduce((a,p)=>a+num((p.counts||{})[loc])*p.buy,0);
 $('locationDetailTitle').textContent=loc;
 $('locationDetailMeta').textContent=`${rows.length} verschiedene Artikel · ${pieces} Stück · ${euro(value)} EK-Wert`;
 $('locationProducts').innerHTML=rows.length?rows.map(p=>{
   const locCount=num((p.counts||{})[loc]), totalAll=total(p);
   return `<article class="location-product">
      <h4>${esc(p.name)}</h4>
      <div class="lp-meta">Barcode: ${esc(p.barcode||'–')}</div>
      <div class="lp-count"><div><span>in ${esc(loc)}</span><strong>${locCount}</strong></div><div style="text-align:right"><span>gesamt gezählt</span><strong style="color:#ddd">${totalAll}</strong></div></div>
   </article>`
 }).join(''):'<p style="color:#777">In diesem Lagerort wurde noch kein Produkt gezählt.</p>';
 $('locationDetail').classList.remove('hidden');
 if(scroll) $('locationDetail').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderHistory(){let h=[];try{h=JSON.parse(localStorage.getItem(HIST)||'[]')}catch(e){};$('history').innerHTML=h.length?h.map(x=>`<div class="order-row"><div><strong>${esc(x.title)}</strong><small style="display:block;color:#777">${esc(x.date)}</small></div><b>${x.counted}/${x.total}</b></div>`).join(''):'<p style="color:#777">Noch keine abgeschlossene Inventur.</p>'}
function selectProduct(){const p=find($('searchInput').value);if(!p){toast('Artikel nicht gefunden');return}current=p;$('countPanel').classList.remove('hidden');$('countName').textContent=p.name;$('countMeta').textContent=`Soll ${p.expected} · bisher Ist ${total(p)} · ${$('locationSelect').value}`;$('qty').value=1}
function saveCount(){if(!current)return;const q=Math.max(0,num($('qty').value)),loc=$('locationSelect').value;current.counts=current.counts||{};current.counts[loc]=num(current.counts[loc])+q;recent.unshift({name:current.name,qty:q,loc,at:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})});recent=recent.slice(0,8);$('countPanel').classList.add('hidden');$('searchInput').value='';current=null;save();render();toast('Menge gespeichert')}

function openScanProduct(p,restart=true){
 scanProduct=p;scanRestartAfterSave=restart;
 $('scanProductName').textContent=p.name;
 $('scanProductBarcode').textContent='Barcode: '+(p.barcode||'–');
 $('scanSoll').textContent=p.expected;
 $('scanIst').textContent=total(p);
 const d=diff(p);
 $('scanDiff').textContent=total(p)?((d>0?'+':'')+d):'–';
 $('scanDiff').className=d===0&&total(p)>0?'diff-good':'diff-bad';
 renderLocations();
 $('scanLocation').value=$('locationSelect').value||locations[0]||'Salon';
 $('scanQty').value=1;
 $('scanProductDialog').showModal();
}

function saveScanProduct(restart){
 if(!scanProduct)return;
 const qty=Math.max(0,num($('scanQty').value)),loc=$('scanLocation').value||'Salon';
 scanProduct.counts=scanProduct.counts||{};
 scanProduct.counts[loc]=num(scanProduct.counts[loc])+qty;
 recent.unshift({name:scanProduct.name,qty,loc,at:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})});
 recent=recent.slice(0,8);
 $('locationSelect').value=loc;
 $('scanProductDialog').close();
 scanProduct=null;
 save();render();toast('Artikel gespeichert');
 if(navigator.vibrate)navigator.vibrate(80);
 try{const A=window.AudioContext||window.webkitAudioContext,c=new A(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.025;o.start();o.stop(c.currentTime+.07)}catch(e){}
 if(restart)setTimeout(()=>openFullScanner(),250);
}

async function openFullScanner(){
 if(typeof Html5Qrcode==='undefined'){toast('Scanner konnte nicht geladen werden');return}
 $('fullScannerModal').classList.remove('hidden');
 try{
   fullScanner=new Html5Qrcode('fullReader');
   await fullScanner.start({facingMode:fullFacing},{fps:14,qrbox:{width:300,height:180}},async code=>{
      if(code===lastScan)return;
      lastScan=code;setTimeout(()=>lastScan='',1300);
      const p=find(code);
      if(!p){toast('Barcode nicht im Bestand gefunden');return}
      await closeFullScanner(false);
      openScanProduct(p,true);
   });
 }catch(e){
   toast('Kamera konnte nicht gestartet werden');
   $('fullScannerModal').classList.add('hidden');
 }
}

async function closeFullScanner(showIdle=true){
 try{if(fullScanner){await fullScanner.stop();await fullScanner.clear();fullScanner=null}}catch(e){}
 $('fullScannerModal').classList.add('hidden');
}

async function switchFullCamera(){
 fullFacing=fullFacing==='environment'?'user':'environment';
 await closeFullScanner(false);
 setTimeout(()=>openFullScanner(),180);
}

async function toggleTorch(){
 try{
   if(!fullScanner){toast('Scanner ist nicht aktiv');return}
   const caps=fullScanner.getRunningTrackCapabilities?.();
   if(!caps?.torch){toast('Taschenlampe wird von dieser Kamera nicht unterstützt');return}
   const settings=fullScanner.getRunningTrackSettings?.();
   await fullScanner.applyVideoConstraints({advanced:[{torch:!settings?.torch}]});
 }catch(e){toast('Taschenlampe konnte nicht geschaltet werden')}
}
async function startScanner(){if(typeof Html5Qrcode==='undefined'){toast('Scanner konnte nicht geladen werden');return}$('scannerIdle').classList.add('hidden');$('scannerLive').classList.remove('hidden');try{scanner=new Html5Qrcode('reader');await scanner.start({facingMode:'environment'},{fps:12,qrbox:{width:280,height:160}},code=>{if(code===lastScan)return;lastScan=code;setTimeout(()=>lastScan='',1200);$('searchInput').value=code;selectProduct()})}catch(e){toast('Kamera konnte nicht gestartet werden')}}
async function stopScanner(){try{if(scanner){await scanner.stop();await scanner.clear();scanner=null}}catch(e){}$('scannerIdle').classList.remove('hidden');$('scannerLive').classList.add('hidden')}
async function importFile(f){if(!f)return;try{const ext=f.name.split('.').pop().toLowerCase();if(ext==='csv'){const raw=await f.text(),head=raw.split(/\r?\n/)[0],sep=(head.match(/;/g)||[]).length>(head.match(/,/g)||[]).length?';':',';const lines=raw.split(/\r?\n/).filter(Boolean),headers=lines[0].split(sep).map(x=>x.replace(/^"|"$/g,'').trim());mapRows(lines.slice(1).map(line=>{const vals=line.split(sep).map(x=>x.replace(/^"|"$/g,'').trim());return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']))}))}else{const buf=await f.arrayBuffer(),wb=XLSX.read(buf,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];mapRows(XLSX.utils.sheet_to_json(ws,{defval:''}))}}catch(e){toast('Datei konnte nicht gelesen werden')}}
function exportCsv(){if(!products.length){toast('Keine Daten');return}const rows=[['Artikel','Barcode','Soll','Ist','Differenz','EK','VK','Lagerorte']];products.forEach(p=>rows.push([p.name,p.barcode,p.expected,total(p),diff(p),p.buy,p.sell,Object.entries(p.counts||{}).map(([k,v])=>`${k}:${v}`).join('|')]));const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='inventur-ergebnis.csv';a.click()}
function finish(){if(!products.length){toast('Keine Inventur');return}let h=[];try{h=JSON.parse(localStorage.getItem(HIST)||'[]')}catch(e){};const d=new Date();h.unshift({title:'Inventur '+d.toLocaleDateString('de-DE'),date:d.toLocaleString('de-DE'),counted:products.filter(p=>total(p)>0).length,total:products.length});localStorage.setItem(HIST,JSON.stringify(h));renderHistory();exportCsv();toast('Inventur abgeschlossen')}

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$('themeBtn').addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';if(theme==='light')document.documentElement.dataset.theme='light';else delete document.documentElement.dataset.theme});
$('demoBtn').addEventListener('click',demo);$('dashImport').addEventListener('change',e=>importFile(e.target.files[0]));$('inventoryImport').addEventListener('change',e=>importFile(e.target.files[0]));
$('addLocation').addEventListener('click',()=>{const l=tx($('newLocation').value);if(l&&!locations.includes(l)){locations.push(l);$('newLocation').value='';save();render()}});
$('findProduct').addEventListener('click',()=>{const p=find($('searchInput').value);if(!p){toast('Artikel nicht gefunden');return}openScanProduct(p,false)});
$('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){const p=find($('searchInput').value);if(!p){toast('Artikel nicht gefunden');return}openScanProduct(p,false)}});$('plus').addEventListener('click',()=>$('qty').value=num($('qty').value)+1);$('minus').addEventListener('click',()=>$('qty').value=Math.max(0,num($('qty').value)-1));$('saveCount').addEventListener('click',saveCount);
$('startScanner').addEventListener('click',openFullScanner);$('stopScanner').addEventListener('click',stopScanner);$('articleSearch').addEventListener('input',()=>{renderArticles();renderSuggestions()});$('exportCsv').addEventListener('click',exportCsv);$('finishInventory').addEventListener('click',finish);
$('resetData').addEventListener('click',()=>{if(confirm('Laufende Inventur wirklich löschen?')){products=[];recent=[];localStorage.removeItem(KEY);render();toast('Inventur gelöscht')}});
$('closeLocationDetail').addEventListener('click',()=>{$('locationDetail').classList.add('hidden');activeLocationDetail=null});
$('articleScanBtn').addEventListener('click',startArticleScanner);
$('articleScanClose').addEventListener('click',stopArticleScanner);
$('closeFullScanner').addEventListener('click',()=>closeFullScanner());
$('scannerCancelBtn').addEventListener('click',()=>closeFullScanner());
$('scannerSwitchBtn').addEventListener('click',switchFullCamera);
$('scannerFlashBtn').addEventListener('click',toggleTorch);
$('closeProductDialog').addEventListener('click',()=>{$('scanProductDialog').close();scanProduct=null});
$('scanPlus').addEventListener('click',()=>$('scanQty').value=num($('scanQty').value)+1);
$('scanMinus').addEventListener('click',()=>$('scanQty').value=Math.max(0,num($('scanQty').value)-1));
$('scanSaveContinue').addEventListener('click',()=>saveScanProduct(true));
$('scanSaveStop').addEventListener('click',()=>saveScanProduct(false));
document.addEventListener('click',e=>{if(!e.target.closest('.article-search-wrap'))$('searchSuggestions').classList.add('hidden')});

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
load();render();

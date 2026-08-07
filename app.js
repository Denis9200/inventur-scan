
const $=id=>document.getElementById(id);
const KEY='inventur_scan_v4', HIST='inventur_scan_history_v4', SETTINGS='inventur_scan_settings_v4';
let products=[],locations=['Salon','Keller'],recent=[],showDiffOnly=false,currentProduct=null,scanner=null,lastScan='';
let settings={vibration:true,beep:true,theme:'light'};

const n=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:0};
const text=v=>String(v??'').trim();
const eur=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const total=p=>Object.values(p.counts||{}).reduce((a,b)=>a+n(b),0);
const difference=p=>total(p)-p.expected;

function toast(msg){$('toast').textContent=msg;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),1500)}
function vibrate(){if(settings.vibration&&navigator.vibrate)navigator.vibrate(70)}
function beep(){if(!settings.beep)return;try{const A=window.AudioContext||window.webkitAudioContext,c=new A(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=900;g.gain.value=.025;o.start();o.stop(c.currentTime+.07)}catch(e){}}
function save(){localStorage.setItem(KEY,JSON.stringify({products,locations,recent,updated:new Date().toISOString()}));$('saveBadge').textContent='Gespeichert'}
function load(){
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){products=s.products||[];locations=s.locations?.length?s.locations:['Salon','Keller'];recent=s.recent||[]}}catch(e){}
 try{settings={...settings,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch(e){}
 document.documentElement.dataset.theme=settings.theme;
 $('vibrationToggle').checked=settings.vibration;$('beepToggle').checked=settings.beep
}
function saveSettings(){settings.vibration=$('vibrationToggle').checked;settings.beep=$('beepToggle').checked;localStorage.setItem(SETTINGS,JSON.stringify(settings))}
function go(page){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));$('page-'+page).classList.add('active');document.querySelector(`.nav-btn[data-page="${page}"]`)?.classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function detect(row,names){const ks=Object.keys(row);for(const name of names){let k=ks.find(x=>x.toLowerCase().replace(/[\s_-]/g,'')===name.toLowerCase().replace(/[\s_-]/g,''));if(k)return row[k]}for(const k of ks){if(names.some(x=>k.toLowerCase().includes(x.toLowerCase())))return row[k]}return''}
function mapRows(rows){
 products=rows.map((r,i)=>({id:crypto.randomUUID?crypto.randomUUID():'p'+Date.now()+i,name:text(detect(r,['Artikel','Artikelname','Produkt','Produktname','Bezeichnung','Name']))||'Unbenannter Artikel',barcode:text(detect(r,['Barcode','EAN','GTIN','Artikelnummer','Code'])),expected:n(detect(r,['Bestand','Soll','Lagerbestand','Warenbestand','Menge','Stock'])),buy:n(detect(r,['Einkaufspreis','EK','Purchase Price'])),sell:n(detect(r,['Verkaufspreis','VK','Retail Price'])),min:n(detect(r,['Mindestbestand','Min Bestand','Minimum'])),counts:{}})).filter(p=>p.name||p.barcode);
 recent=[];currentProduct=null;save();render();toast(products.length+' Artikel geladen');go('inventory')
}
function demo(){
 products=[
 {id:'1',name:'Shampoo Repair 250 ml',barcode:'4000000000011',expected:10,buy:6.2,sell:14.9,min:4,counts:{}},
 {id:'2',name:'Conditioner Color 200 ml',barcode:'4000000000028',expected:6,buy:7.1,sell:16.9,min:3,counts:{}},
 {id:'3',name:'Haarspray Strong 300 ml',barcode:'4000000000035',expected:8,buy:5.7,sell:13.5,min:3,counts:{}},
 {id:'4',name:'Styling Paste Matt 100 ml',barcode:'4000000000042',expected:4,buy:8.4,sell:18.9,min:2,counts:{}},
 {id:'5',name:'Haaröl Premium 100 ml',barcode:'4000000000059',expected:5,buy:9.8,sell:22.5,min:2,counts:{}}
 ];recent=[];save();render();toast('Demo-Daten geladen')
}
function findProduct(q){q=text(q).toLowerCase();if(!q)return null;return products.find(p=>(p.barcode||'').toLowerCase()===q)||products.find(p=>p.name.toLowerCase().includes(q))||null}
function selectProduct(p){
 currentProduct=p;$('countCard').classList.remove('hidden');$('countName').textContent=p.name;$('countMeta').textContent=`Soll ${p.expected} · Ist ${total(p)} · ${p.barcode||'ohne Barcode'} · ${$('locationSelect').value}`;
 const d=difference(p),c=total(p);$('countStatus').className='status '+(c===0?'open':d===0?'good':'bad');$('countStatus').textContent=c===0?'Offen':d===0?'Passt':'Abweichung';$('qtyInput').value=1
}
function selectFromSearch(){
 const p=findProduct($('searchInput').value);
 if(!p){$('npBarcode').value=/^\d+$/.test($('searchInput').value)?$('searchInput').value:'';$('npName').value=/^\d+$/.test($('searchInput').value)?'':$('searchInput').value;$('productDialog').showModal();return}
 selectProduct(p)
}
function saveCount(){
 if(!currentProduct)return;
 const qty=Math.max(0,n($('qtyInput').value)),loc=$('locationSelect').value||'Salon';
 currentProduct.counts=currentProduct.counts||{};currentProduct.counts[loc]=n(currentProduct.counts[loc])+qty;
 recent.unshift({name:currentProduct.name,qty,loc,at:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})});recent=recent.slice(0,8);
 toast(`${currentProduct.name}: +${qty}`);vibrate();beep();$('searchInput').value='';$('countCard').classList.add('hidden');currentProduct=null;save();render()
}
function renderLocations(){const s=$('locationSelect'),cur=s.value;s.innerHTML=locations.map(x=>`<option>${esc(x)}</option>`).join('');if(locations.includes(cur))s.value=cur}
function render(){
 renderLocations();
 const count=products.filter(p=>total(p)>0).length,match=products.filter(p=>total(p)>0&&difference(p)===0).length,diffs=products.filter(p=>total(p)>0&&difference(p)!==0).length,pct=products.length?Math.round(count/products.length*100):0,value=products.reduce((a,p)=>a+total(p)*p.buy,0);
 ['dTotal','iTotal'].forEach(id=>$(id).textContent=products.length);['dCounted','iCounted'].forEach(id=>$(id).textContent=count);$('iMatch').textContent=match;['dDiffs','iDiff'].forEach(id=>$(id).textContent=diffs);$('dPercent').textContent=pct+' % fertig';$('dValue').textContent=eur(value);$('progressLabel').textContent=pct+' %';$('dashProgress').style.width=pct+'%';
 const recentHtml=recent.length?recent.map(r=>`<div class="list-row"><div><strong>${esc(r.name)}</strong><small>${esc(r.loc)} · ${r.at}</small></div><strong>+${r.qty}</strong></div>`).join(''):'Noch nichts erfasst.';
 $('dashRecent').innerHTML=recentHtml;$('recentList').innerHTML=recentHtml;
 let list=showDiffOnly?products.filter(p=>total(p)>0&&difference(p)!==0):products;
 $('inventoryBody').innerHTML=list.length?list.map(p=>{const c=total(p),d=difference(p),st=c===0?['open','Offen']:d===0?['good','Passt']:['bad','Abweichung'],locs=Object.entries(p.counts||{}).filter(x=>x[1]>0).map(([k,v])=>`${esc(k)}: ${v}`).join(', ')||'–';return `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.barcode||'–')}</td><td>${p.expected}</td><td>${c}</td><td>${c?(d>0?'+':'')+d:'–'}</td><td>${locs}</td><td><span class="status ${st[0]}">${st[1]}</span></td></tr>`}).join(''):'<tr><td colspan="7">Noch keine Daten.</td></tr>';
 renderArticles();renderStats();renderHistory()
}
function renderArticles(){
 const q=text($('articleSearch').value).toLowerCase(),list=products.filter(p=>!q||p.name.toLowerCase().includes(q)||(p.barcode||'').includes(q));
 $('articleBody').innerHTML=list.length?list.map(p=>{const c=total(p),order=Math.max(0,(p.min||0)-c);return `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.barcode||'–')}</td><td>${p.expected}</td><td>${c}</td><td>${p.buy?eur(p.buy):'–'}</td><td>${p.sell?eur(p.sell):'–'}</td><td>${p.min||'–'}</td><td>${order>0?`<span class="status bad">${order} nachbestellen</span>`:'<span class="status good">OK</span>'}</td></tr>`}).join(''):'<tr><td colspan="8">Keine Artikel.</td></tr>'
}
function renderStats(){
 let ev=0,cv=0,rv=0;products.forEach(p=>{ev+=p.expected*p.buy;cv+=total(p)*p.buy;rv+=total(p)*p.sell});$('sExpected').textContent=eur(ev);$('sCounted').textContent=eur(cv);$('sRetail').textContent=eur(rv);$('sMargin').textContent=eur(rv-cv);
 $('locationStats').innerHTML=locations.map(loc=>{const pieces=products.reduce((a,p)=>a+n((p.counts||{})[loc]),0),val=products.reduce((a,p)=>a+n((p.counts||{})[loc])*p.buy,0);return `<div class="list-row"><span>${esc(loc)}</span><strong>${pieces} Stk. · ${eur(val)}</strong></div>`}).join('')||'Noch keine Daten.';
 const orders=products.map(p=>({p,n:Math.max(0,(p.min||0)-total(p))})).filter(x=>x.n>0);$('orderSuggestions').innerHTML=orders.length?orders.map(x=>`<div class="list-row"><span>${esc(x.p.name)}</span><strong>${x.n} Stk.</strong></div>`).join(''):'Keine Vorschläge.'
}
function renderHistory(){let h=[];try{h=JSON.parse(localStorage.getItem(HIST)||'[]')}catch(e){};$('historyList').innerHTML=h.length?h.map(x=>`<div class="list-row"><div><strong>${esc(x.title)}</strong><small>${esc(x.date)}</small></div><div><strong>${x.counted}/${x.total}</strong><small>${x.diffs} Abweichungen</small></div></div>`).join(''):'Noch keine abgeschlossene Inventur.'}
function exportCSV(){
 if(!products.length){toast('Keine Daten');return}
 const rows=[['Artikel','Barcode','Soll','Ist','Differenz','Einkaufspreis','Verkaufspreis','Mindestbestand','Lagerorte']];
 products.forEach(p=>rows.push([p.name,p.barcode,p.expected,total(p),difference(p),p.buy||'',p.sell||'',p.min||'',Object.entries(p.counts||{}).map(([k,v])=>`${k}:${v}`).join('|')]));
 const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');download(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),'inventur-ergebnis.csv')
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function finish(){
 if(!products.length){toast('Keine Inventur vorhanden');return}
 let h=[];try{h=JSON.parse(localStorage.getItem(HIST)||'[]')}catch(e){};const now=new Date();h.unshift({title:'Inventur '+now.toLocaleDateString('de-DE'),date:now.toLocaleString('de-DE'),total:products.length,counted:products.filter(p=>total(p)>0).length,diffs:products.filter(p=>total(p)>0&&difference(p)!==0).length});localStorage.setItem(HIST,JSON.stringify(h.slice(0,30)));renderHistory();exportCSV();toast('Inventur abgeschlossen')
}
async function startScanner(){
 if(typeof Html5Qrcode==='undefined'){toast('Scanner nicht geladen');return}$('scannerIdle').classList.add('hidden');$('scannerLive').classList.remove('hidden');
 try{scanner=new Html5Qrcode('reader');await scanner.start({facingMode:'environment'},{fps:12,qrbox:{width:280,height:160}},code=>{if(code===lastScan)return;lastScan=code;setTimeout(()=>lastScan='',1200);$('searchInput').value=code;const p=findProduct(code);if(p){selectProduct(p);vibrate();beep()}else{$('npBarcode').value=code;$('productDialog').showModal()}})}catch(e){toast('Kamera konnte nicht gestartet werden');$('scannerIdle').classList.remove('hidden');$('scannerLive').classList.add('hidden')}
}
async function stopScanner(){try{if(scanner){await scanner.stop();await scanner.clear();scanner=null}}catch(e){}$('scannerIdle').classList.remove('hidden');$('scannerLive').classList.add('hidden')}
async function importFile(f){
 if(!f)return;try{const ext=f.name.split('.').pop().toLowerCase();if(ext==='csv'){const raw=await f.text(),head=raw.split(/\r?\n/)[0],sep=(head.match(/;/g)||[]).length>(head.match(/,/g)||[]).length?';':',';const lines=raw.split(/\r?\n/).filter(Boolean),headers=lines[0].split(sep).map(x=>x.replace(/^"|"$/g,'').trim());mapRows(lines.slice(1).map(line=>{const vals=line.split(sep).map(x=>x.replace(/^"|"$/g,'').trim());return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']))}))}else{const buf=await f.arrayBuffer(),wb=XLSX.read(buf,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];mapRows(XLSX.utils.sheet_to_json(ws,{defval:''}))}}catch(e){toast('Datei konnte nicht gelesen werden')}}
function backup(){download(new Blob([JSON.stringify({version:4,products,locations,recent,history:JSON.parse(localStorage.getItem(HIST)||'[]')},null,2)],{type:'application/json'}),'inventur-scan-backup.json')}
async function restoreBackup(f){try{const d=JSON.parse(await f.text());products=d.products||[];locations=d.locations||['Salon','Keller'];recent=d.recent||[];if(d.history)localStorage.setItem(HIST,JSON.stringify(d.history));save();render();toast('Backup importiert')}catch(e){toast('Backup ungültig')}}

document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$('heroStart').addEventListener('click',()=>go('inventory'));$('demoBtn').addEventListener('click',demo);
$('fileInputDashboard').addEventListener('change',e=>importFile(e.target.files[0]));$('findBtn').addEventListener('click',selectFromSearch);$('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')selectFromSearch()});
$('plusBtn').addEventListener('click',()=>$('qtyInput').value=n($('qtyInput').value)+1);$('minusBtn').addEventListener('click',()=>$('qtyInput').value=Math.max(0,n($('qtyInput').value)-1));$('countSaveBtn').addEventListener('click',saveCount);
$('addLocationBtn').addEventListener('click',()=>{const x=text($('newLocation').value);if(x&&!locations.includes(x)){locations.push(x);$('newLocation').value='';save();render();$('locationSelect').value=x}});
$('locationSelect').addEventListener('change',()=>{if(currentProduct)selectProduct(currentProduct)});$('saveBtn').addEventListener('click',()=>{save();toast('Inventur gespeichert')});$('diffFilterBtn').addEventListener('click',()=>{showDiffOnly=!showDiffOnly;$('diffFilterBtn').textContent=showDiffOnly?'Alle Artikel':'Nur Abweichungen';render()});$('finishBtn').addEventListener('click',finish);
$('articleSearch').addEventListener('input',renderArticles);$('exportBtn').addEventListener('click',exportCSV);$('newProductBtn').addEventListener('click',()=>$('productDialog').showModal());$('closeDialog').addEventListener('click',()=>$('productDialog').close());
$('saveProductBtn').addEventListener('click',()=>{const name=text($('npName').value);if(!name){toast('Artikelname fehlt');return}const loc=$('locationSelect').value||'Salon',qty=n($('npQty').value),p={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,barcode:text($('npBarcode').value),expected:n($('npStock').value),buy:n($('npBuy').value),sell:n($('npSell').value),min:n($('npMin').value),counts:{}};p.counts[loc]=qty;products.push(p);recent.unshift({name:p.name,qty,loc,at:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})});['npName','npBarcode','npStock','npBuy','npSell','npMin'].forEach(id=>$(id).value='');$('npQty').value=1;$('productDialog').close();save();render();toast('Artikel angelegt')});
$('scanBtn').addEventListener('click',startScanner);$('stopScanBtn').addEventListener('click',stopScanner);
$('themeBtn').addEventListener('click',()=>{settings.theme=settings.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=settings.theme;localStorage.setItem(SETTINGS,JSON.stringify(settings))});
$('vibrationToggle').addEventListener('change',saveSettings);$('beepToggle').addEventListener('change',saveSettings);$('backupBtn').addEventListener('click',backup);$('backupImport').addEventListener('change',e=>restoreBackup(e.target.files[0]));
$('resetBtn').addEventListener('click',()=>{if(confirm('Laufende Inventur wirklich löschen?')){products=[];recent=[];currentProduct=null;localStorage.removeItem(KEY);render();toast('Inventur gelöscht')}});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
load();render();


const $=id=>document.getElementById(id);
const KEY='dj_lager_v8';
let state={products:[],locations:['Salon','Keller'],history:[],inventories:[],activeInventoryId:null,theme:'dark'};
let scannerMode='stock',scannerActive=false,scanCandidate='',scanCount=0,scanLastAt=0,scanConfirming=false,pendingBarcode='',dialogProduct=null,activeProductId=null;

const num=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:0};
const tx=v=>String(v??'').trim();
const euro=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();
const now=()=>new Date().toISOString();
const stockTotal=p=>Object.values(p.stockByLocation||{}).reduce((a,b)=>a+num(b),0);
const roleLabels={retail:'Kundenverkauf',employee:'MA Verkauf',cabinet:'Kabinettware',asset:'Inventar'};

function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),1600)}
function save(){localStorage.setItem(KEY,JSON.stringify(state));$('saveBadge').textContent='Gespeichert'}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)state={...state,...s}}catch(e){} document.documentElement.dataset.theme=state.theme}
function ensureProduct(p){
 p.brand=p.brand||'';p.group=p.group||'';p.barcode=p.barcode||'';p.buy=num(p.buy);p.sell=num(p.sell);p.min=num(p.min);p.roles=Array.isArray(p.roles)?p.roles:['retail'];p.employeePricing=p.employeePricing||'ek_vat';p.vatRate=('vatRate'in p)?num(p.vatRate):19;p.employeePrice=num(p.employeePrice);p.assetCount=num(p.assetCount);p.packageGrams=num(p.packageGrams);p.stockByLocation=p.stockByLocation||{};state.locations.forEach(l=>{if(!(l in p.stockByLocation))p.stockByLocation[l]=0});if(!('cabinetOpen'in p))p.cabinetOpen=null;
}
function addHistory(type,p,delta=0,unit='Stk.',details={}){
 const item={id:uid(),date:now(),type,productId:p?.id||'',productName:p?.name||details.productName||'',delta,unit,...details};
 state.history.unshift(item);save();
}
function go(page){
 document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
 $('page-'+page).classList.add('active');
 document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
 const labels={dashboard:['Dashboard','Lager, Betrieb und Inventuren sauber getrennt.'],operations:['Betrieb','Kabinettware, MA-Verkauf und Inventar.'],stock:['Lagerbestand','Der aktuelle operative Bestand.'],inventory:['Inventur','Eigene benannte Snapshots des Lagerbestands.'],history:['Historie','Alle Warenbewegungen nachvollziehen.'],settings:['Einstellungen','Lagerorte und lokale Daten.']};
 $('pageHeading').textContent=labels[page][0];$('pageSubheading').textContent=labels[page][1];render();window.scrollTo({top:0,behavior:'smooth'})
}
function findProduct(q){q=tx(q).toLowerCase();return state.products.find(p=>(p.barcode||'').toLowerCase()===q)||state.products.find(p=>p.name.toLowerCase().includes(q))}
function roles(p){return p.roles.map(r=>`<span class="usage-chip">${roleLabels[r]||r}</span>`).join('')}

function render(){state.products.forEach(ensureProduct);renderDashboard();renderStock();renderInventorySessions();renderOperations();renderHistory();renderSettings()}
function renderDashboard(){
 $('dashProducts').textContent=state.products.length;
 $('dashStockValue').textContent=euro(state.products.reduce((a,p)=>a+stockTotal(p)*p.buy,0));
 $('dashCabinet').textContent=state.products.filter(p=>p.cabinetOpen).length;
 $('dashAssets').textContent=state.products.reduce((a,p)=>a+p.assetCount,0);
 $('dashHistory').innerHTML=state.history.length?state.history.slice(0,7).map(historyRow).join(''):'Noch keine Bewegungen.';
 $('dashInventories').innerHTML=state.inventories.length?state.inventories.slice(0,6).map(i=>`<div class="activity-row"><div><strong>${esc(i.name)}</strong><small>${new Date(i.createdAt).toLocaleString('de-DE')}</small></div><span class="status ${i.status==='done'?'done':''}">${i.status==='done'?'abgeschlossen':'offen'}</span></div>`).join(''):'Noch keine Inventur.'
}
function productCard(p){
 return `<article class="product-card" data-product="${esc(p.id)}"><h4>${esc(p.name)}</h4><div class="meta">${esc(p.brand||'–')} · ${esc(p.group||'–')} · ${esc(p.barcode||'kein Barcode')}</div><div class="usage-chips">${roles(p)}</div><div class="numbers"><div><small>Lager</small><strong>${stockTotal(p)}</strong></div><div><small>Inventar</small><strong>${p.assetCount}</strong></div><div><small>EK</small><strong>${euro(p.buy)}</strong></div></div></article>`
}
function attachProductOpen(root=document){root.querySelectorAll('[data-product]').forEach(el=>el.addEventListener('click',()=>{const p=state.products.find(x=>x.id===el.dataset.product);if(p)openProductDialog(p)}))}
function renderStock(){
 const q=tx($('stockSearch')?.value||'').toLowerCase();
 const list=state.products.filter(p=>!q||p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.group.toLowerCase().includes(q)||p.barcode.includes(q));
 $('stockCards').innerHTML=list.length?list.map(productCard).join(''):'<p class="muted">Keine Artikel.</p>';
 attachProductOpen($('stockCards'))
}
function renderOperations(){
 $('operationStockCards').innerHTML=state.products.slice(0,12).map(productCard).join('')||'<p class="muted">Keine Artikel.</p>';
 attachProductOpen($('operationStockCards'));
 const open=state.products.filter(p=>p.cabinetOpen);
 $('openCabinetList').innerHTML=open.length?open.map(p=>{const rem=num(p.cabinetOpen.remainingGrams),pkg=Math.max(1,p.packageGrams),pct=Math.round(rem/pkg*100);return `<div class="cabinet-item" data-cabinet="${p.id}"><div class="cabinet-item-top"><div><strong>${esc(p.name)}</strong><small>${esc(p.cabinetOpen.location)} · ${pct}% Rest</small></div><strong>${Math.round(rem)} g</strong></div><div class="cabinet-progress"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></div></div>`}).join(''):'Noch keine offene Kabinettware.';
 document.querySelectorAll('[data-cabinet]').forEach(el=>el.addEventListener('click',()=>openCabinet(state.products.find(p=>p.id===el.dataset.cabinet))));
 $('cabinetHistory').innerHTML=filterHistoryTypes(['cabinet_open','cabinet_use','cabinet_waste','cabinet_empty']).slice(0,8).map(historyRow).join('')||'Noch keine Bewegung.';
 $('employeeHistory').innerHTML=filterHistoryTypes(['employee_sale']).slice(0,10).map(historyRow).join('')||'Noch keine Verkäufe.';
 const assets=state.products.filter(p=>p.assetCount>0);
 $('assetList').innerHTML=assets.length?assets.map(p=>`<div class="activity-row" data-asset="${p.id}"><div><strong>${esc(p.name)}</strong><small>${esc(p.brand||'')} · ${esc(p.group||'')}</small></div><strong>${p.assetCount} Stk.</strong></div>`).join(''):'Noch keine Arbeitsmittel.';
 document.querySelectorAll('[data-asset]').forEach(el=>el.addEventListener('click',()=>openAssetRemove(state.products.find(p=>p.id===el.dataset.asset))))
}
function filterHistoryTypes(types){return state.history.filter(h=>types.includes(h.type))}
function historyLabel(t){return {stock_import:'Bestandsimport',employee_sale:'MA Verkauf',cabinet_open:'Kabinett geöffnet',cabinet_use:'Kabinettverbrauch',cabinet_waste:'Schwund / Verlust',cabinet_empty:'Gebinde leer',asset_issue:'Ins Inventar',asset_remove:'Aus Inventar',asset_return:'Zurück ins Lager',stock_adjust:'Bestandsänderung'}[t]||t}
function historyRow(h){const cls=num(h.delta)>0?'positive':num(h.delta)<0?'negative':'';return `<div class="history-row"><div><span class="history-type">${esc(historyLabel(h.type))}</span><strong>${esc(h.productName||'–')}</strong><small>${new Date(h.date).toLocaleString('de-DE')} · ${esc(h.location||h.area||'')}${h.reason?' · '+esc(h.reason):''}${h.note?' · '+esc(h.note):''}</small></div><span class="history-delta ${cls}">${h.delta?((h.delta>0?'+':'')+h.delta+' '+esc(h.unit||'')):''}</span></div>`}
function renderHistory(){
 const q=tx($('historySearch')?.value||'').toLowerCase(),type=$('historyType')?.value||'';
 const list=state.history.filter(h=>(!type||h.type===type)&&(!q||JSON.stringify(h).toLowerCase().includes(q)));
 $('historyList').innerHTML=list.length?list.map(historyRow).join(''):'Noch keine passenden Bewegungen.'
}
function renderSettings(){$('locationList').innerHTML=state.locations.map(l=>`<div class="activity-row"><strong>${esc(l)}</strong><span>${state.products.reduce((a,p)=>a+num(p.stockByLocation[l]),0)} Stk.</span></div>`).join('')}
function setOpMode(mode){document.querySelectorAll('.operation-mode').forEach(b=>b.classList.toggle('active',b.dataset.opmode===mode));document.querySelectorAll('.operation-panel').forEach(p=>p.classList.remove('active'));$('op-'+mode).classList.add('active')}

function employeePrice(p){return p.employeePricing==='fixed'?p.employeePrice:p.buy*(1+p.vatRate/100)}
function fillLocations(id,p,showStock=true){const s=$(id);s.innerHTML=state.locations.map(l=>`<option value="${esc(l)}">${esc(l)}${showStock?' ('+num(p?.stockByLocation?.[l])+' verfügbar)':''}</option>`).join('')}
function openProductDialog(p=null,barcode=''){
 dialogProduct=p?structuredClone(p):{id:uid(),name:'',brand:'',group:'',barcode,roles:['retail'],buy:0,sell:0,min:0,packageGrams:0,employeePricing:'ek_vat',vatRate:19,employeePrice:0,assetCount:0,stockByLocation:{}};
 ensureProduct(dialogProduct);
 $('productDialog').dataset.new=p?'0':'1';$('pdTitle').textContent=p?'Artikel bearbeiten':'Neuer Artikel';$('pdName').value=dialogProduct.name;$('pdBarcode').value=dialogProduct.barcode;$('pdBrand').value=dialogProduct.brand;$('pdGroup').value=dialogProduct.group;$('pdBuy').value=dialogProduct.buy;$('pdSell').value=dialogProduct.sell;$('pdMin').value=dialogProduct.min;$('pdPackageGrams').value=dialogProduct.packageGrams;$('pdRetail').checked=dialogProduct.roles.includes('retail');$('pdEmployee').checked=dialogProduct.roles.includes('employee');$('pdCabinet').checked=dialogProduct.roles.includes('cabinet');$('pdAsset').checked=dialogProduct.roles.includes('asset');$('pdEmployeePricing').value=dialogProduct.employeePricing;$('pdVat').value=dialogProduct.vatRate;$('pdEmployeePrice').value=dialogProduct.employeePrice;$('pdLocations').innerHTML=state.locations.map(l=>`<label class="edit-location-row"><strong>${esc(l)}</strong><input data-pd-loc="${esc(l)}" type="number" min="0" value="${num(dialogProduct.stockByLocation[l])}"></label>`).join('');
 $('productDialog').showModal()
}
function saveProduct(){
 if(!dialogProduct)return;
 const isNew=$('productDialog').dataset.new==='1',name=tx($('pdName').value);
 if(!name){toast('Artikelname fehlt');return}
 dialogProduct.name=name;dialogProduct.barcode=tx($('pdBarcode').value);dialogProduct.brand=tx($('pdBrand').value);dialogProduct.group=tx($('pdGroup').value);dialogProduct.buy=Math.max(0,num($('pdBuy').value));dialogProduct.sell=Math.max(0,num($('pdSell').value));dialogProduct.min=Math.max(0,num($('pdMin').value));dialogProduct.packageGrams=Math.max(0,num($('pdPackageGrams').value));dialogProduct.roles=[];
 if($('pdRetail').checked)dialogProduct.roles.push('retail');if($('pdEmployee').checked)dialogProduct.roles.push('employee');if($('pdCabinet').checked)dialogProduct.roles.push('cabinet');if($('pdAsset').checked)dialogProduct.roles.push('asset');if(!dialogProduct.roles.length)dialogProduct.roles=['retail'];
 dialogProduct.employeePricing=$('pdEmployeePricing').value;dialogProduct.vatRate=Math.max(0,num($('pdVat').value));dialogProduct.employeePrice=Math.max(0,num($('pdEmployeePrice').value));dialogProduct.stockByLocation={};document.querySelectorAll('[data-pd-loc]').forEach(i=>dialogProduct.stockByLocation[i.dataset.pdLoc]=Math.max(0,num(i.value)));
 if(isNew){state.products.push(dialogProduct);addHistory('stock_adjust',dialogProduct,stockTotal(dialogProduct),'Stk.',{reason:'Artikel angelegt'})}
 else{const old=state.products.find(p=>p.id===dialogProduct.id),before=stockTotal(old);Object.assign(old,dialogProduct);const delta=stockTotal(old)-before;if(delta)addHistory('stock_adjust',old,delta,'Stk.',{reason:'Manuelle Bestandsänderung'})}
 $('productDialog').close();dialogProduct=null;save();render();toast(isNew?'Artikel angelegt':'Artikel gespeichert')
}
function deleteProduct(){if(!dialogProduct||$('productDialog').dataset.new==='1'){$('productDialog').close();return}if(!confirm('Artikel wirklich löschen?'))return;state.products=state.products.filter(p=>p.id!==dialogProduct.id);$('productDialog').close();dialogProduct=null;save();render();toast('Artikel gelöscht')}

async function importFile(f){
 if(!f)return;
 try{
   const raw=await f.text(),wb=XLSX.read(raw,{type:'string',raw:true}),ws=wb.Sheets[wb.SheetNames[0]],matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
   const hi=matrix.findIndex(r=>{const l=r.map(x=>String(x).trim().toLowerCase());return l.includes('name')&&l.includes('einkaufspreis')&&l.includes('bestand')});
   if(hi<0)throw new Error('Kopfzeile nicht gefunden');
   const headers=matrix[hi].map(x=>String(x).trim()),rows=matrix.slice(hi+1).filter(r=>r.some(v=>tx(v))).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
   const firstLoc=state.locations[0]||'Salon';
   state.products=rows.map(r=>{const p={id:uid(),name:tx(r.Name)||'Unbenannt',brand:tx(r.Produktmarke),group:tx(r.Produktgruppe),barcode:tx(r.Barcode||r.EAN),buy:num(String(r.Einkaufspreis).replace(/[^\d,.-]/g,'')),sell:num(String(r.Preis).replace(/[^\d,.-]/g,'')),min:0,packageGrams:0,roles:/farbe/i.test(tx(r.Produktgruppe))?['retail','cabinet']:['retail'],employeePricing:'ek_vat',vatRate:19,employeePrice:0,assetCount:0,stockByLocation:{},cabinetOpen:null};p.stockByLocation[firstLoc]=Math.max(0,num(String(r.Bestand).replace(/[^\d,.-]/g,'')));ensureProduct(p);return p});
   state.products.forEach(p=>addHistory('stock_import',p,stockTotal(p),'Stk.',{location:firstLoc,reason:'CSV-Import'}));
   save();render();toast(state.products.length+' Artikel importiert')
 }catch(e){console.error(e);toast('CSV konnte nicht gelesen werden')}
}

function createInventory(){
 const name=tx($('newInvName').value)||'Inventur '+new Date().toLocaleDateString('de-DE');
 const items=state.products.map(p=>({productId:p.id,name:p.name,barcode:p.barcode,brand:p.brand,group:p.group,expectedByLocation:structuredClone(p.stockByLocation),counts:{}}));
 const inv={id:uid(),name,createdAt:now(),status:'open',items,locations:[...state.locations]};
 state.inventories.unshift(inv);state.activeInventoryId=inv.id;$('newInventoryDialog').close();$('newInvName').value='';save();render();toast('Inventur gestartet')
}
function activeInventory(){return state.inventories.find(i=>i.id===state.activeInventoryId)}
function invExpected(item){return Object.values(item.expectedByLocation||{}).reduce((a,b)=>a+num(b),0)}
function invCount(item){return Object.values(item.counts||{}).reduce((a,b)=>a+num(b),0)}
function renderInventorySessions(){
 $('inventorySessionList').innerHTML=state.inventories.length?state.inventories.map(i=>{const counted=i.items.filter(x=>invCount(x)>0).length;return `<div class="inventory-session"><div><strong>${esc(i.name)}</strong><small>${new Date(i.createdAt).toLocaleString('de-DE')} · ${counted}/${i.items.length} gezählt</small></div><div class="session-actions"><span class="status ${i.status==='done'?'done':''}">${i.status==='done'?'abgeschlossen':'offen'}</span><button class="btn dark-btn" data-open-inv="${i.id}">Öffnen</button></div></div>`}).join(''):'<p class="muted">Noch keine Inventur.</p>';
 document.querySelectorAll('[data-open-inv]').forEach(b=>b.addEventListener('click',()=>{state.activeInventoryId=b.dataset.openInv;save();renderInventorySessions()}));
 const inv=activeInventory();$('activeInventoryArea').classList.toggle('hidden',!inv);if(!inv)return;
 $('invTitle').textContent=inv.name;$('invMeta').textContent=`Snapshot vom ${new Date(inv.createdAt).toLocaleString('de-DE')} · Status: ${inv.status==='done'?'abgeschlossen':'offen'}`;$('inventoryLocation').innerHTML=inv.locations.map(l=>`<option>${esc(l)}</option>`).join('');
 const counted=inv.items.filter(i=>invCount(i)>0).length,diffs=inv.items.filter(i=>invCount(i)>0&&invCount(i)!==invExpected(i)).length,pct=inv.items.length?Math.round(counted/inv.items.length*100):0;
 $('invTotal').textContent=inv.items.length;$('invCounted').textContent=counted;$('invDiffs').textContent=diffs;$('invPercent').textContent=pct+' %';
 $('inventoryCards').innerHTML=inv.items.map(i=>{const c=invCount(i),e=invExpected(i),d=c-e;return `<article class="product-card" data-inv-item="${i.productId}"><h4>${esc(i.name)}</h4><div class="meta">${esc(i.barcode||'kein Barcode')}</div><div class="numbers"><div><small>Soll</small><strong>${e}</strong></div><div><small>Ist</small><strong>${c}</strong></div><div><small>Diff.</small><strong class="${d===0&&c>0?'positive':d!==0&&c>0?'negative':''}">${c?((d>0?'+':'')+d):'–'}</strong></div></div></article>`}).join('');
 document.querySelectorAll('[data-inv-item]').forEach(el=>el.addEventListener('click',()=>openCountDialog(el.dataset.invItem)))
}
function openCountDialog(productId){
 const inv=activeInventory();if(!inv||inv.status==='done'){toast('Inventur ist abgeschlossen');return}
 const item=inv.items.find(x=>x.productId===productId);if(!item)return;activeProductId=productId;$('countName').textContent=item.name;$('countMeta').textContent=`Soll gesamt ${invExpected(item)} · bisher Ist ${invCount(item)}`;$('countLocation').innerHTML=inv.locations.map(l=>`<option>${esc(l)}</option>`).join('');$('countLocation').value=$('inventoryLocation').value;$('countQty').value=1;$('countDialog').showModal()
}
function saveCount(){const inv=activeInventory(),item=inv?.items.find(x=>x.productId===activeProductId);if(!item)return;const loc=$('countLocation').value;item.counts[loc]=num(item.counts[loc])+Math.max(0,num($('countQty').value));$('countDialog').close();activeProductId=null;save();renderInventorySessions();toast('Zählung gespeichert')}
function finishInventory(){const inv=activeInventory();if(!inv)return;if(!confirm('Inventur wirklich abschließen? Der Lagerbestand wird dadurch NICHT automatisch verändert.'))return;inv.status='done';inv.finishedAt=now();save();render();toast('Inventur abgeschlossen')}

function openEmployee(p){ensureProduct(p);if(!p.roles.includes('employee')){toast('Artikel ist nicht für MA Verkauf freigegeben');return}if(stockTotal(p)<=0){toast('Kein Lagerbestand');return}dialogProduct=p;$('esName').textContent=p.name;fillLocations('esLocation',p);$('esQty').value=1;$('esPrice').value=employeePrice(p).toFixed(2);$('esEmployee').value='';$('esEk').textContent=euro(p.buy);updateEmployeeTotal();$('employeeDialog').showModal()}
function updateEmployeeTotal(){if(!dialogProduct)return;const q=Math.max(1,num($('esQty').value)),pr=Math.max(0,num($('esPrice').value));$('esUnit').textContent=euro(pr);$('esTotal').textContent=euro(q*pr)}
function saveEmployee(){const p=dialogProduct,loc=$('esLocation').value,q=Math.max(1,num($('esQty').value)),avail=num(p.stockByLocation[loc]);if(q>avail){toast('Nicht genug Bestand');return}p.stockByLocation[loc]=avail-q;addHistory('employee_sale',p,-q,'Stk.',{location:loc,employee:tx($('esEmployee').value),unitPrice:num($('esPrice').value),note:'Mitarbeiterverkauf'});$('employeeDialog').close();dialogProduct=null;save();render();toast('MA Verkauf gebucht')}
function openAssetIssue(p){ensureProduct(p);if(!p.roles.includes('asset')){toast('Artikel ist nicht als Inventar freigegeben');return}if(stockTotal(p)<=0){toast('Kein Lagerbestand');return}dialogProduct=p;$('aiName').textContent=p.name;fillLocations('aiLocation',p);$('aiQty').value=1;$('aiArea').value='';$('aiNote').value='';$('assetIssueDialog').showModal()}
function saveAssetIssue(){const p=dialogProduct,loc=$('aiLocation').value,q=Math.max(1,num($('aiQty').value)),avail=num(p.stockByLocation[loc]);if(q>avail){toast('Nicht genug Bestand');return}p.stockByLocation[loc]=avail-q;p.assetCount+=q;addHistory('asset_issue',p,-q,'Stk.',{location:loc,area:tx($('aiArea').value),note:tx($('aiNote').value)});$('assetIssueDialog').close();dialogProduct=null;save();render();toast('Ins Inventar ausgegeben')}
function openAssetRemove(p){dialogProduct=p;$('arName').textContent=p.name;$('arQty').value=1;$('arReason').value='defekt';fillLocations('arLocation',p,false);$('arNote').value='';$('assetRemoveDialog').showModal()}
function saveAssetRemove(){const p=dialogProduct,q=Math.max(1,num($('arQty').value));if(q>p.assetCount){toast('Nicht so viele Stück im Inventar');return}const reason=$('arReason').value,loc=$('arLocation').value;p.assetCount-=q;if(reason==='return'){p.stockByLocation[loc]=num(p.stockByLocation[loc])+q;addHistory('asset_return',p,q,'Stk.',{location:loc,reason:'Zurück ins Lager',note:tx($('arNote').value)})}else addHistory('asset_remove',p,-q,'Stk.',{reason,note:tx($('arNote').value)});$('assetRemoveDialog').close();dialogProduct=null;save();render();toast('Inventar aktualisiert')}

function openCabinet(p){
 ensureProduct(p);if(!p.roles.includes('cabinet')){toast('Artikel ist nicht als Kabinettware freigegeben');return}
 dialogProduct=p;$('cuName').textContent=p.name;$('cuMeta').textContent=p.barcode||'kein Barcode';$('cabinetOpenBlock').classList.toggle('hidden',!!p.cabinetOpen);$('cabinetUseBlock').classList.toggle('hidden',!p.cabinetOpen);
 if(!p.cabinetOpen){$('cuPackage').value=p.packageGrams||60;fillLocations('cuOpenLocation',p)}
 else{fillLocations('cuLocation',p,false);$('cuLocation').value=p.cabinetOpen.location;$('cuPackageShow').textContent=Math.round(p.packageGrams)+' g';$('cuRemaining').textContent=Math.round(p.cabinetOpen.remainingGrams)+' g';$('cuUsed').textContent=Math.round(p.cabinetOpen.usedGrams)+' g';$('cuGrams').value=Math.min(10,Math.max(1,Math.round(p.cabinetOpen.remainingGrams)));$('cuType').value='use';$('cuNote').value=''}
 $('cabinetDialog').showModal()
}
function openCabinetPackage(){const p=dialogProduct,loc=$('cuOpenLocation').value,pkg=Math.max(1,num($('cuPackage').value)),avail=num(p.stockByLocation[loc]);if(avail<1){toast('Keine volle VE im Lager');return}p.stockByLocation[loc]=avail-1;p.packageGrams=pkg;p.cabinetOpen={location:loc,remainingGrams:pkg,usedGrams:0,openedAt:now()};addHistory('cabinet_open',p,-1,'VE',{location:loc,note:'Neues Gebinde geöffnet'});$('cabinetDialog').close();save();render();openCabinet(p)}
function saveCabinet(markEmpty=false){const p=dialogProduct;if(!p?.cabinetOpen)return;const loc=$('cuLocation').value,before=num(p.cabinetOpen.remainingGrams);if(markEmpty){addHistory('cabinet_empty',p,-before,'g',{location:loc,reason:'Manuell als leer bestätigt',note:tx($('cuNote').value)});p.cabinetOpen=null}else{const g=Math.min(before,Math.max(0,num($('cuGrams').value))),type=$('cuType').value;p.cabinetOpen.remainingGrams=before-g;p.cabinetOpen.usedGrams=num(p.cabinetOpen.usedGrams)+g;p.cabinetOpen.location=loc;addHistory(type==='waste'?'cabinet_waste':'cabinet_use',p,-g,'g',{location:loc,note:tx($('cuNote').value)});if(p.cabinetOpen.remainingGrams<=0)p.cabinetOpen=null}$('cabinetDialog').close();dialogProduct=null;save();render();toast('Kabinettware aktualisiert')}

function validChecksum(code){const d=String(code).replace(/\D/g,'');if(![8,12,13].includes(d.length))return true;const a=d.split('').map(Number),check=a.pop();let s=0;if(d.length===13)a.forEach((n,i)=>s+=n*(i%2===0?1:3));else a.forEach((n,i)=>s+=n*(i%2===0?3:1));return (10-s%10)%10===check}
function resetScan(){scanCandidate='';scanCount=0;scanLastAt=0}
function stableScan(code,format){const t=Date.now();if(/ean|upc/i.test(format||'')&&!validChecksum(code))return false;if(t-scanLastAt>1200||code!==scanCandidate){scanCandidate=code;scanCount=1;scanLastAt=t;return false}scanCount++;scanLastAt=t;const known=!!state.products.find(p=>p.barcode===code);return scanCount>=(known?2:4)}
async function startScanner(mode){
 scannerMode=mode;resetScan();scanConfirming=false;$('scannerTitle').textContent={stock:'Artikel suchen',inventory:'Inventur scannen',employee:'MA Verkauf scannen',asset:'Inventar scannen',cabinet:'Kabinettware scannen'}[mode]||'Barcode scannen';$('scannerModal').classList.remove('hidden');
 try{
   await new Promise((res,rej)=>Quagga.init({inputStream:{type:'LiveStream',target:$('quaggaReader'),constraints:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}},area:{top:'20%',right:'5%',left:'5%',bottom:'20%'}},locator:{patchSize:'medium',halfSample:false},numOfWorkers:0,frequency:10,decoder:{readers:['ean_reader','ean_8_reader','upc_reader','upc_e_reader','code_128_reader','code_39_reader','i2of5_reader']},locate:true},e=>e?rej(e):res()));
   Quagga.offDetected(onDetected);Quagga.onDetected(onDetected);Quagga.start();scannerActive=true
 }catch(e){console.error(e);$('scannerModal').classList.add('hidden');toast('Kamera konnte nicht gestartet werden')}
}
function onDetected(r){const code=tx(r?.codeResult?.code),format=r?.codeResult?.format||'';if(!code||scanConfirming||!stableScan(code,format))return;scanConfirming=true;document.querySelector('.scan-frame')?.classList.add('detected');setTimeout(()=>document.querySelector('.scan-frame')?.classList.remove('detected'),400);closeScanner(false).then(()=>routeScan(code))}
async function closeScanner(){try{if(scannerActive){Quagga.offDetected(onDetected);Quagga.stop()}}catch(e){}scannerActive=false;$('quaggaReader').innerHTML='';$('scannerModal').classList.add('hidden');resetScan();scanConfirming=false}
function routeScan(code){
 const p=state.products.find(x=>x.barcode===code);
 if(!p){pendingBarcode=code;$('unknownCode').textContent=code;$('unknownDialog').showModal();return}
 if(scannerMode==='inventory'){const inv=activeInventory(),item=inv?.items.find(x=>x.productId===p.id);if(!item){toast('Artikel ist nicht in diesem Inventur-Snapshot');return}openCountDialog(p.id)}
 else if(scannerMode==='employee')openEmployee(p);
 else if(scannerMode==='asset')openAssetIssue(p);
 else if(scannerMode==='cabinet')openCabinet(p);
 else openProductDialog(p)
}
function continueUnknown(){const m=scannerMode;$('unknownDialog').close();pendingBarcode='';setTimeout(()=>startScanner(m),200)}
function openAssign(){$('unknownDialog').close();$('assignSearch').value='';renderAssign();$('assignDialog').showModal()}
function renderAssign(){const q=tx($('assignSearch').value).toLowerCase(),list=state.products.filter(p=>!q||p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.group.toLowerCase().includes(q)).slice(0,50);$('assignResults').innerHTML=list.map(p=>`<div class="assign-result" data-assign="${p.id}"><strong>${esc(p.name)}</strong><small>${esc(p.brand)} · ${esc(p.group)} · ${p.barcode?'Barcode '+esc(p.barcode):'noch kein Barcode'}</small></div>`).join('');document.querySelectorAll('[data-assign]').forEach(el=>el.addEventListener('click',()=>{const p=state.products.find(x=>x.id===el.dataset.assign);p.barcode=pendingBarcode;pendingBarcode='';$('assignDialog').close();save();render();toast('Barcode zugeordnet')}))}
function createUnknown(){$('unknownDialog').close();const b=pendingBarcode;pendingBarcode='';openProductDialog(null,b)}

function downloadCsv(rows,name){const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download=name;a.click()}
function exportStock(){const rows=[['Artikel','Marke','Gruppe','Barcode','Lagerbestand','EK','VK','Inventar','Rollen','Lagerorte']];state.products.forEach(p=>rows.push([p.name,p.brand,p.group,p.barcode,stockTotal(p),p.buy,p.sell,p.assetCount,p.roles.join('|'),Object.entries(p.stockByLocation).map(([k,v])=>`${k}:${v}`).join('|')]));downloadCsv(rows,'lagerbestand.csv')}
function exportHistory(){const rows=[['Datum','Typ','Artikel','Delta','Einheit','Lagerort','Grund','Notiz','Mitarbeiter','Bereich']];state.history.forEach(h=>rows.push([h.date,historyLabel(h.type),h.productName,h.delta,h.unit,h.location,h.reason,h.note,h.employee,h.area]));downloadCsv(rows,'historie.csv')}

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
document.querySelectorAll('.operation-mode').forEach(b=>b.addEventListener('click',()=>setOpMode(b.dataset.opmode)));
$('themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;save()});
$('stockSearch').addEventListener('input',renderStock);$('stockImport').addEventListener('change',e=>importFile(e.target.files[0]));$('newArticleBtn').addEventListener('click',()=>openProductDialog());$('exportStock').addEventListener('click',exportStock);$('stockScanBtn').addEventListener('click',()=>startScanner('stock'));
$('pdClose').addEventListener('click',()=>$('productDialog').close());$('pdCancel').addEventListener('click',()=>$('productDialog').close());$('pdSave').addEventListener('click',saveProduct);$('pdDelete').addEventListener('click',deleteProduct);
$('newInventoryBtn').addEventListener('click',()=>{$('newInvName').value='';$('newInventoryDialog').showModal()});$('newInvClose').addEventListener('click',()=>$('newInventoryDialog').close());$('createInventoryBtn').addEventListener('click',createInventory);$('inventoryScanBtn').addEventListener('click',()=>startScanner('inventory'));$('inventoryFindBtn').addEventListener('click',()=>{const p=findProduct($('inventorySearch').value);if(p)openCountDialog(p.id);else toast('Artikel nicht gefunden')});$('inventoryFinishBtn').addEventListener('click',finishInventory);$('countClose').addEventListener('click',()=>$('countDialog').close());$('countMinus').addEventListener('click',()=>$('countQty').value=Math.max(0,num($('countQty').value)-1));$('countPlus').addEventListener('click',()=>$('countQty').value=num($('countQty').value)+1);$('countSave').addEventListener('click',saveCount);
$('employeeFindBtn').addEventListener('click',()=>{const p=findProduct($('employeeSearch').value);if(p)openEmployee(p);else toast('Artikel nicht gefunden')});$('employeeScanBtn').addEventListener('click',()=>startScanner('employee'));$('esClose').addEventListener('click',()=>$('employeeDialog').close());$('esQty').addEventListener('input',updateEmployeeTotal);$('esPrice').addEventListener('input',updateEmployeeTotal);$('esSave').addEventListener('click',saveEmployee);
$('assetFindBtn').addEventListener('click',()=>{const p=findProduct($('assetSearch').value);if(p)openAssetIssue(p);else toast('Artikel nicht gefunden')});$('assetScanBtn').addEventListener('click',()=>startScanner('asset'));$('aiClose').addEventListener('click',()=>$('assetIssueDialog').close());$('aiSave').addEventListener('click',saveAssetIssue);$('arClose').addEventListener('click',()=>$('assetRemoveDialog').close());$('arSave').addEventListener('click',saveAssetRemove);
$('cabinetFindBtn').addEventListener('click',()=>{const p=findProduct($('cabinetSearch').value);if(p)openCabinet(p);else toast('Artikel nicht gefunden')});$('cabinetScanBtn').addEventListener('click',()=>startScanner('cabinet'));$('cuClose').addEventListener('click',()=>$('cabinetDialog').close());$('cuOpenPackage').addEventListener('click',openCabinetPackage);$('cuMinus').addEventListener('click',()=>$('cuGrams').value=Math.max(0,num($('cuGrams').value)-1));$('cuPlus').addEventListener('click',()=>$('cuGrams').value=num($('cuGrams').value)+1);$('cuSave').addEventListener('click',()=>saveCabinet(false));$('cuEmpty').addEventListener('click',()=>saveCabinet(true));
$('historySearch').addEventListener('input',renderHistory);$('historyType').addEventListener('change',renderHistory);$('exportHistory').addEventListener('click',exportHistory);
$('addLocationBtn').addEventListener('click',()=>{const l=tx($('newLocation').value);if(!l||state.locations.includes(l))return;state.locations.push(l);state.products.forEach(p=>p.stockByLocation[l]=0);$('newLocation').value='';save();render()});$('resetData').addEventListener('click',()=>{if(confirm('Wirklich alle lokalen Daten löschen?')){localStorage.removeItem(KEY);location.reload()}});
$('scannerClose').addEventListener('click',()=>closeScanner());$('scannerCancel').addEventListener('click',()=>closeScanner());
$('unknownContinue').addEventListener('click',continueUnknown);$('unknownAssign').addEventListener('click',openAssign);$('unknownCreate').addEventListener('click',createUnknown);$('assignClose').addEventListener('click',()=>$('assignDialog').close());$('assignSearch').addEventListener('input',renderAssign);

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
load();render();

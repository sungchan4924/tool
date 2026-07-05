const KEY='h6300-tool-equipment-pro-v2';
const $=id=>document.getElementById(id);
let deferredPrompt=null;
let state=load();
let currentView='home';
let currentLocationFilter='전체';
let currentProduct=state.products[0]||'';

function initialTools(){return Array.from({length:150},(_,i)=>({
  id:i+1,pocket:i+1,location:'빈포켓',tValue:`T${String(i+1).padStart(3,'0')}`,name:'',product:'',toolLength:'',hValue:'',usedCount:0,changeCycle:0,status:'정상',note:'',updatedAt:''
}));}
function load(){try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.tools?.length===150)return parsed;}}catch(e){}
return {machineNo:'H6300-1호기',products:['BODY','COVER','SHAFT'],tools:initialTools(),repairs:[]};}
function save(){state.savedAt=new Date().toLocaleString('ko-KR');localStorage.setItem(KEY,JSON.stringify(state));renderAll();}
function today(){return new Date().toISOString().slice(0,10)}
function nearReplacement(t){const cycle=Number(t.changeCycle||0), used=Number(t.usedCount||0);return cycle>0 && used>=cycle*0.9;}
function actualStatus(t){if(t.location==='빈포켓')return '빈포켓'; if(t.status==='파손')return '파손'; if(t.status==='교체필요'||nearReplacement(t))return '교체필요'; if(t.status==='마모주의')return '마모주의'; return '정상';}
function badge(text){return `<span class="badge b-${text}">${text}</span>`}
function setView(v){currentView=v;document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===v));document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('active',el.dataset.view===v));renderAll();}

document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>setView(btn.dataset.view));
document.body.addEventListener('click',e=>{const go=e.target.closest('[data-go]');if(go)setView(go.dataset.go);});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false;});
$('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').hidden=true;}};

$('machineNo').onchange=e=>{state.machineNo=e.target.value;save();};
$('addProductBtn').onclick=()=>{const name=$('newProductName').value.trim();if(!name)return alert('제품이름을 입력하세요.');if(!state.products.includes(name))state.products.push(name);currentProduct=name;$('newProductName').value='';save();setView('product');};
$('productSelect').onchange=e=>{currentProduct=e.target.value;renderProduct();};
$('addProductToolBtn').onclick=()=>{const empty=state.tools.find(t=>t.location==='빈포켓')||state.tools[0];openEdit(empty.id,currentProduct);};
$('toolSearch').oninput=renderTools;
document.querySelectorAll('.filter').forEach(btn=>btn.onclick=()=>{currentLocationFilter=btn.dataset.location;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===btn));renderTotal();});
$('addRepairBtn').onclick=()=>{const date=$('repairDate').value||today();const content=$('repairContent').value.trim();const person=$('repairPerson').value.trim();if(!content)return alert('정비내용을 입력하세요.');state.repairs.unshift({id:Date.now(),date,content,person,machineNo:state.machineNo});$('repairDate').value='';$('repairContent').value='';$('repairPerson').value='';save();};
$('exportBtn').onclick=exportData;
$('shareBtn').onclick=shareData;
$('importFile').onchange=importData;
$('saveToolBtn').onclick=e=>{e.preventDefault();saveEdit();$('editDialog').close();};

function renderAll(){
  $('machineNo').value=state.machineNo||'';
  renderHome();renderProduct();renderTools();renderTotal();renderRepairs();
}
function renderHome(){
  $('productButtons').innerHTML=state.products.map(p=>`<button class="productBtn" onclick="currentProduct='${escAttr(p)}';setView('product')">📦 ${esc(p)}</button>`).join('')||'<p class="muted">제품을 추가하세요.</p>';
  const inside=state.tools.filter(t=>t.location==='장비안').length;
  const outside=state.tools.filter(t=>t.location==='기계밖보관').length;
  const empty=state.tools.filter(t=>t.location==='빈포켓').length;
  const warn=state.tools.filter(t=>nearReplacement(t)||t.status==='교체필요').length;
  $('summaryBox').innerHTML=`<div class="summaryItem">장비 안<b>${inside}</b></div><div class="summaryItem">기계 밖<b>${outside}</b></div><div class="summaryItem">빈 포켓<b>${empty}</b></div><div class="summaryItem">교체 임박<b>${warn}</b></div>`;
}
function renderProduct(){
  $('productSelect').innerHTML=state.products.map(p=>`<option ${p===currentProduct?'selected':''}>${esc(p)}</option>`).join('');
  $('selectedProductTitle').textContent=currentProduct?`${currentProduct} 제품 공구`: '제품 선택';
  const rows=state.tools.filter(t=>t.product===currentProduct && t.location!=='빈포켓').sort((a,b)=>a.pocket-b.pocket);
  $('productToolRows').innerHTML=rows.map(t=>`<tr onclick="openEdit(${t.id})"><td>P${String(t.pocket).padStart(3,'0')}</td><td>${badge(t.location)}</td><td>${esc(t.tValue)}</td><td>${esc(t.name)||'-'}</td><td>${esc(t.toolLength)||'-'}</td><td>${esc(t.hValue)||'-'}</td><td>${t.usedCount||0}/${t.changeCycle||'-'}</td><td>${badge(actualStatus(t))}</td></tr>`).join('')||'<tr><td colspan="8">이 제품에 등록된 공구가 없습니다. “이 제품에 공구 추가”를 누르세요.</td></tr>';
}
function renderTools(){
  const q=($('toolSearch')?.value||'').toLowerCase().trim();
  const list=state.tools.filter(t=>!q||`${t.pocket} ${t.tValue} ${t.name} ${t.product} ${t.hValue}`.toLowerCase().includes(q));
  $('toolCards').innerHTML=list.map(t=>toolCard(t)).join('');
}
function toolCard(t){return `<div class="toolCard"><div class="toolHead"><div><div class="pocket">P${String(t.pocket).padStart(3,'0')}</div><div class="muted">${esc(t.tValue)}</div></div>${badge(t.location)}</div><div class="toolMeta"><b>${esc(t.name)||'공구 없음'}</b><br>제품: ${esc(t.product)||'-'}<br>공구길이: ${esc(t.toolLength)||'-'} / H값: ${esc(t.hValue)||'-'}<br>사용: ${t.usedCount||0} / 교체주기: ${t.changeCycle||'-'}<br>상태: ${badge(actualStatus(t))}</div><div class="toolActions"><button onclick="openEdit(${t.id})">수정</button><button onclick="markOutside(${t.id})">기계밖</button><button onclick="markBroken(${t.id})" class="danger">파손</button></div></div>`}
function renderTotal(){
  let list=state.tools;
  if(currentLocationFilter==='장비안')list=list.filter(t=>t.location==='장비안');
  if(currentLocationFilter==='기계밖보관')list=list.filter(t=>t.location==='기계밖보관');
  if(currentLocationFilter==='빈포켓')list=list.filter(t=>t.location==='빈포켓');
  if(currentLocationFilter==='교체임박')list=list.filter(t=>nearReplacement(t)||t.status==='교체필요'||t.status==='마모주의');
  $('totalRows').innerHTML=list.map(t=>`<tr onclick="openEdit(${t.id})"><td>P${String(t.pocket).padStart(3,'0')}</td><td>${badge(t.location)}</td><td>${esc(t.tValue)}</td><td>${esc(t.name)||'-'}</td><td>${esc(t.product)||'-'}</td><td>${esc(t.hValue)||'-'}</td><td>${t.usedCount||0}</td><td>${t.changeCycle||'-'}</td><td>${badge(actualStatus(t))}</td></tr>`).join('');
}
function renderRepairs(){
  $('repairList').innerHTML=state.repairs.map(r=>`<div class="listItem"><b>${esc(r.date)} · ${esc(r.machineNo||state.machineNo)}</b><br>${esc(r.content)}<br><span class="muted">수리한 사람: ${esc(r.person||'-')}</span></div>`).join('')||'<p class="muted">정비기록이 없습니다.</p>';
}
function openEdit(id,productName=''){
  const t=state.tools.find(x=>x.id===id);if(!t)return;
  $('editId').value=t.id;$('editPocket').value=`P${String(t.pocket).padStart(3,'0')}`;$('editLocation').value=t.location;$('editT').value=t.tValue;$('editName').value=t.name;$('editProduct').value=productName||t.product;$('editLength').value=t.toolLength;$('editH').value=t.hValue;$('editUsed').value=t.usedCount||0;$('editCycle').value=t.changeCycle||'';$('editStatus').value=t.status;$('editNote').value=t.note||'';$('modalTitle').textContent=`P${String(t.pocket).padStart(3,'0')} 공구 수정`;$('editDialog').showModal();
}
function saveEdit(){
  const id=Number($('editId').value);const t=state.tools.find(x=>x.id===id);if(!t)return;
  Object.assign(t,{location:$('editLocation').value,tValue:$('editT').value.trim(),name:$('editName').value.trim(),product:$('editProduct').value.trim(),toolLength:$('editLength').value.trim(),hValue:$('editH').value.trim(),usedCount:Number($('editUsed').value||0),changeCycle:Number($('editCycle').value||0),status:$('editStatus').value,note:$('editNote').value.trim(),updatedAt:new Date().toLocaleString('ko-KR')});
  if(t.product&&!state.products.includes(t.product))state.products.push(t.product);
  save();
}
function markOutside(id){const t=state.tools.find(x=>x.id===id);if(t){t.location='기계밖보관';t.updatedAt=new Date().toLocaleString('ko-KR');save();}}
function markBroken(id){const t=state.tools.find(x=>x.id===id);if(t){t.status='파손';t.updatedAt=new Date().toLocaleString('ko-KR');save();}}
function exportData(){download(`H6300_공구장비관리_${today()}.json`,JSON.stringify(state,null,2));}
async function shareData(){
  const file=new File([JSON.stringify(state,null,2)],`H6300_공구장비관리_${today()}.json`,{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'H6300 공구·장비관리 데이터',text:'현재 H6300 공구·장비관리 데이터입니다.',files:[file]});}
  else{exportData();alert('공유 기능을 지원하지 않는 브라우저라 백업파일로 저장했습니다. 이 파일을 카카오톡/문자로 공유하세요.');}
}
function importData(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data.tools||data.tools.length!==150)throw new Error();state=data;save();alert('불러오기 완료');}catch{alert('올바른 H6300 백업파일이 아닙니다.');}};r.readAsText(file,'utf-8');e.target.value='';}
function download(name,content){const blob=new Blob([content],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function escAttr(s){return String(s??'').replace(/'/g,"\\'").replace(/</g,'&lt;');}
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js');}
$('repairDate').value=today();
renderAll();

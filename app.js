const defaultData={
  kids:["Aimar","Beñat","Danel","Ekain","Eneko","Hodei","Iker","Jon","Luken","Markel","Oier","Peru","Unax","Xuban"],
  families:[
    {id:1,name:"Aimar",seats:5,score:8,availability:{mon:"both",wed:"none",fri:"back",match:"both"}},
    {id:2,name:"Beñat",seats:7,score:5,availability:{mon:"both",wed:"both",fri:"none",match:"out"}},
    {id:3,name:"Danel",seats:5,score:6,availability:{mon:"out",wed:"both",fri:"both",match:"none"}},
    {id:4,name:"Ekain",seats:7,score:3,availability:{mon:"none",wed:"out",fri:"both",match:"both"}},
    {id:5,name:"Eneko",seats:5,score:9,availability:{mon:"back",wed:"none",fri:"out",match:"back"}},
    {id:6,name:"Hodei",seats:5,score:2,availability:{mon:"both",wed:"both",fri:"none",match:"both"}},
    {id:7,name:"Iker",seats:7,score:7,availability:{mon:"none",wed:"back",fri:"both",match:"none"}},
    {id:8,name:"Jon",seats:5,score:4,availability:{mon:"out",wed:"both",fri:"back",match:"both"}},
  ],
  events:[
    {id:"mon",day:"LUN",date:"31",title:"Entrenamiento",time:"17:30 · Atxuri",kids:14},
    {id:"wed",day:"MIÉ",date:"02",title:"Entrenamiento",time:"17:30 · Atxuri",kids:14},
    {id:"fri",day:"VIE",date:"04",title:"Entrenamiento",time:"17:30 · Atxuri",kids:14},
    {id:"match",day:"SÁB",date:"05",title:"Partido vs. Eibar",time:"10:30 · Unbe",kids:13,isMatch:true}
  ]
};
let data=JSON.parse(localStorage.getItem('sora-v0')||'null')||structuredClone(defaultData);
const $=s=>document.querySelector(s); const eventsEl=$('#events'),familiesEl=$('#families');
function save(){localStorage.setItem('sora-v0',JSON.stringify(data));render()}
function modeAllows(mode,leg){return mode==='both'||mode===leg}
function capacity(f){return Math.max(0,f.seats-1)}
function solve(event,leg){
  const available=data.families.filter(f=>modeAllows(f.availability[event.id],leg)).sort((a,b)=>a.score-b.score||capacity(b)-capacity(a));
  let need=event.kids, chosen=[];
  for(const f of available){if(need<=0)break; chosen.push(f); need-=capacity(f)}
  return {chosen,missing:Math.max(0,need),capacity:chosen.reduce((n,f)=>n+capacity(f),0)}
}
function statusFor(e){const o=solve(e,'out'),b=solve(e,'back'); if(!o.missing&&!b.missing)return ['Cubierto','ok']; const miss=Math.max(o.missing,b.missing);return [`Faltan ${miss} plazas`,miss<5?'pending':'bad']}
function carsText(sol){if(sol.missing)return `${sol.chosen.length} coches · faltan ${sol.missing}`;return `${sol.chosen.length} coches · ${sol.capacity} plazas`}
function render(){
  eventsEl.innerHTML=''; let covered=0;
  for(const e of data.events){const [st,cl]=statusFor(e); if(cl==='ok')covered++; const out=solve(e,'out'),back=solve(e,'back');
    const div=document.createElement('article');div.className='event card';div.innerHTML=`
      <div class="event-top"><div class="date-badge"><div><span>${e.day}</span><b>${e.date}</b></div></div>
      <div class="event-info"><h3>${e.title}</h3><div class="event-meta">${e.time} · ${e.kids} niños</div></div><span class="status ${cl}">${st}</span></div>
      <div class="transport"><div class="leg"><small>IDA</small><strong>${carsText(out)}</strong></div><div class="leg"><small>VUELTA</small><strong>${carsText(back)}</strong></div></div>
      <div class="event-actions"><button class="pill-btn" data-view="${e.id}">Ver reparto</button><button class="pill-btn primary" data-edit-event="${e.id}">Disponibilidad</button></div>`;
    eventsEl.appendChild(div)
  }
  $('#coveredCount').textContent=`${covered}/${data.events.length}`;
  familiesEl.innerHTML='';
  for(const f of data.families){const div=document.createElement('article');div.className='family card';div.innerHTML=`<div class="avatar">${f.name[0]}</div><div class="family-main"><strong>Familia ${f.name}</strong><span>Coche de ${f.seats} plazas · ${capacity(f)} pasajeros</span></div><div class="score"><b>${f.score} pts</b><span class="muted">aportación</span></div>`;div.onclick=()=>editFamily(f.id);familiesEl.appendChild(div)}
}
function openSheet(html){$('#sheetContent').innerHTML=html;$('#sheet').classList.remove('hidden');$('#sheetBackdrop').classList.remove('hidden');$('#sheet').setAttribute('aria-hidden','false')}
function closeSheet(){$('#sheet').classList.add('hidden');$('#sheetBackdrop').classList.add('hidden');$('#sheet').setAttribute('aria-hidden','true')}
$('#sheetBackdrop').onclick=closeSheet;
function labelMode(v){return {none:'No puedo',out:'Solo ida',back:'Solo vuelta',both:'Ida y vuelta'}[v]}
function editFamily(id){const f=data.families.find(x=>x.id===id);openSheet(`<h3>Familia ${f.name}</h3><p>Configura el coche y la disponibilidad semanal.</p><div class="field"><label>Plazas del coche</label><select id="seats"><option ${f.seats===5?'selected':''}>5</option><option ${f.seats===7?'selected':''}>7</option></select></div>${data.events.map(e=>`<div class="field"><label>${e.day} · ${e.title}</label><select data-av="${e.id}">${['none','out','back','both'].map(v=>`<option value="${v}" ${f.availability[e.id]===v?'selected':''}>${labelMode(v)}</option>`).join('')}</select></div>`).join('')}<button class="save" id="saveFamily">Guardar</button>`);
  $('#saveFamily').onclick=()=>{f.seats=+$('#seats').value;document.querySelectorAll('[data-av]').forEach(s=>f.availability[s.dataset.av]=s.value);save();closeSheet()}
}
function viewAllocation(id){const e=data.events.find(x=>x.id===id);const renderLeg=(leg,title)=>{const s=solve(e,leg);let kids=[...data.kids].slice(0,e.kids),lines='';for(const f of s.chosen){const assigned=kids.splice(0,capacity(f));lines+=`<div class="carline"><strong>${f.name}</strong> · coche ${f.seats} plazas<br>${assigned.join(', ')||'—'}</div>`}if(s.missing)lines+=`<div class="carline"><strong>⚠ Faltan ${s.missing} plazas</strong></div>`;return `<div class="allocation"><strong>${title}</strong>${lines}</div>`};openSheet(`<h3>${e.title}</h3><p>${e.day} ${e.date} · ${e.time}</p>${renderLeg('out','Ida')}${renderLeg('back','Vuelta')}`)}
function eventAvailability(id){const e=data.events.find(x=>x.id===id);openSheet(`<h3>${e.title}</h3><p>Disponibilidad de las familias para este evento.</p>${data.families.map(f=>`<div class="family" style="padding-left:0;padding-right:0"><div class="avatar">${f.name[0]}</div><div class="family-main"><strong>${f.name}</strong><span>${f.seats} plazas</span></div><div><strong>${labelMode(f.availability[e.id])}</strong></div></div>`).join('')}`)}
document.addEventListener('click',e=>{const v=e.target.closest('[data-view]');if(v)viewAllocation(v.dataset.view);const ed=e.target.closest('[data-edit-event]');if(ed)eventAvailability(ed.dataset.editEvent)});
$('#addMatchBtn').onclick=()=>openSheet(`<h3>Añadir partido</h3><p>Los partidos se pueden cargar cuando se asignan durante la semana.</p><div class="field"><label>Rival</label><input id="rival" placeholder="Ej. Bergara"></div><div class="grid2"><div class="field"><label>Día</label><input id="mday" placeholder="DOM"></div><div class="field"><label>Fecha</label><input id="mdate" placeholder="06"></div></div><div class="field"><label>Hora y campo</label><input id="mtime" placeholder="11:30 · Agorrosin"></div><button class="save" id="saveMatch">Crear partido</button>`); setTimeout(()=>$('#saveMatch').onclick=()=>{const old=data.events.findIndex(e=>e.id==='match');const ev={id:'match',day:$('#mday').value||'DOM',date:$('#mdate').value||'06',title:`Partido vs. ${$('#rival').value||'Rival'}`,time:$('#mtime').value||'11:30 · Campo',kids:14,isMatch:true};if(old>=0)data.events[old]=ev;else data.events.push(ev);save();closeSheet()},0)};
$('#resetBtn').onclick=()=>{if(confirm('¿Reiniciar la demo?')){data=structuredClone(defaultData);save()}};
render();

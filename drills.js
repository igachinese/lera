/* Движок интерактивных заданий: отрисовка (exercise) и обработка нажатий и перетаскивания.
   Данные заданий — в exercises.js. */
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const shufNot=a=>{if(a.length<2)return a.slice();let b;do b=shuf(a);while(b.join('|')===a.join('|'));return b};
const norm=s=>s.replace(/[\s，。？！、,.?!—\-\/]/g,'');
const chip=(v,extra='')=>`<button type="button" class="chip zh" data-v="${v}" ${extra}>${v}</button>`;

const EXR={
  pick(x){
    return `<div class="plist">${x.items.map(([s,opts,a])=>{const [pre,post]=s.split('＿');
      return `<div class="prow" data-a="${a}"><span class="ps zh">${pre}<span class="gap">?</span>${post??''}</span><span class="popts">${shuf(opts).map(o=>`<button type="button" class="opt zh" data-o="${o}">${o}</button>`).join('')}</span></div>`}).join('')}</div>`;
  },
  build(x){
    return x.items.map(([ru,t,alt])=>{const tiles=t.split('|');const ans=[tiles.join(''),...(alt?alt.split(';'):[])];
      return `<div class="brow unit" data-ans="${ans.join(';')}">
        <div class="bru">${ru} <button type="button" class="minibtn hintbtn">Подсказка</button><span class="bans zh" hidden>${ans[0]}</span></div>
        <div class="zone line" aria-label="Строка ответа"></div>
        <div class="zone bank">${shufNot(tiles).map(v=>chip(v)).join('')}</div></div>`}).join('');
  },
  fill(x){
    const ans=[];
    const lines=x.lines.map(s=>s.replace(/\{(.+?)\}/g,(m,w)=>{ans.push(w);return `<span class="zone gap1" data-max="1" data-a="${w}"></span>`}));
    return `<div class="unit"><div class="zone bank">${shuf(ans.concat(x.extra||[])).map(v=>chip(v)).join('')}</div>
      <div class="flines zh">${lines.map(s=>`<div>${s}</div>`).join('')}</div></div>`+checkBar();
  },
  sort(x){
    return `<div class="unit"><div class="zone bank">${shuf(x.items).map(([s,b])=>chip(s,`data-b="${b}"`)).join('')}</div>
      <div class="buckets" style="--n:${x.buckets.length}">${x.buckets.map((b,i)=>`<div class="bucket"><div class="bname">${b}</div><div class="zone bzone" data-i="${i}"></div></div>`).join('')}</div></div>`+checkBar();
  },
  tf(x){
    const sc=x.scene&&x.scene.bars?`<div class="bars">${x.scene.bars.map(([n,v])=>`<div class="barc"><span class="bv">${v} см</span><i style="height:${(v-110)*1.6}px"></i><span class="bn zh">${n}</span></div>`).join('')}</div>`:'';
    return sc+`<div class="plist">${x.items.map(([s,ok,fix])=>`<div class="prow tfrow" data-ok="${ok}"><span class="ps zh">${s}${fix?`<span class="fix" hidden>→ ${fix}</span>`:''}</span><span class="popts"><button type="button" class="opt tfb" data-v="true">${x.labels[0]}</button><button type="button" class="opt tfb" data-v="false">${x.labels[1]}</button></span></div>`).join('')}</div>`;
  },
  match(x,l){
    const pairs=x.pairs||shuf(l[x.from]).slice(0,x.n||6).map(w=>[w[0],w[2]]);
    const col=(side,k)=>shuf(pairs.map((p,i)=>[p[k],i])).map(([t,i])=>`<button type="button" class="mc ${k?'':'zh'}" data-k="${i}" data-side="${side}">${t}</button>`).join('');
    return `<div class="mgrid"><div class="mcol">${col('a',0)}</div><div class="mcol">${col('b',1)}</div></div>`;
  },
  say(x){
    return `<div class="slist">${x.items.map(([q,a])=>`<div class="srow"><span class="sq zh">${q}</span><button type="button" class="minibtn sayb">Ответ</button><span class="sa zh" hidden>${a}</span></div>`).join('')}</div>`;
  },
  check(x){
    return `<div class="clist">${x.items.map(([v,o,e])=>`<div class="crow" data-v="${v}" data-o="${o}"><span class="ce">${e}</span><span class="cp zh">${v}${o}</span><span class="popts"><button type="button" class="opt ckb" data-y="1" aria-label="Да">✓</button><button type="button" class="opt ckb" data-y="0" aria-label="Нет">✗</button></span><span class="cout zh"></span></div>`).join('')}</div>`;
  },
  bingo(x){
    return `<div class="bingo">${x.cells.map(([e,w])=>`<button type="button" class="bgc" aria-pressed="false"><span class="be">${e}</span><span class="bw zh">${w}</span><span class="bq zh">${x.q.replace('{}',w)}</span></button>`).join('')}</div>`;
  }
};
function checkBar(){return `<div class="exbar"><button type="button" class="go exchk">Проверить</button><button type="button" class="minibtn exans">Показать ответ</button></div>`}

function exercise(x,l,i){
  return `<div class="exh"><span class="exn">${i+1}</span><div class="ext"><h4>${x.title}</h4>${x.hint?`<p class="exhint">${x.hint}</p>`:''}</div><button type="button" class="minibtn" data-reset>Заново</button></div>
  <div class="exb ex-${x.t}">${EXR[x.t](x,l)}</div><p class="res" aria-live="polite"></p>`;
}

/* --- helpers --- */
function res(ex,text,good){const r=ex.querySelector(':scope > .res');r.textContent=text;r.classList.toggle('good',!!good)}
function allDone(ex,sel,doneSel){const rows=ex.querySelectorAll(sel);if([...rows].every(r=>r.matches(doneSel))){const first=[...rows].filter(r=>!r.dataset.miss).length;res(ex,`Готово! С первой попытки: ${first} из ${rows.length}`,first===rows.length)}}
function clearMarks(unit){unit.querySelectorAll('.ok,.bad').forEach(e=>e.classList.remove('ok','bad'));const ex=unit.closest('.exer');if(ex&&!ex.querySelector('.ex-build'))res(ex,'')}

function place(c,zone,before){
  const unit=zone.closest('.unit'),bank=unit.querySelector('.bank');
  if(zone.dataset.max==='1'){const cur=[...zone.querySelectorAll('.chip')].find(x=>x!==c);if(cur)bank.appendChild(cur)}
  if(before&&before!==c&&before.parentElement===zone)zone.insertBefore(c,before);else zone.appendChild(c);
  c.classList.remove('sel');
  if(unit.classList.contains('brow'))checkBuild(unit);else clearMarks(unit);
}
function checkBuild(u){
  const line=u.querySelector('.line');line.classList.remove('ok','bad');
  if(u.querySelector('.bank .chip'))return;
  const v=norm([...line.children].map(c=>c.dataset.v).join(''));
  const ok=u.dataset.ans.split(';').some(a=>norm(a)===v);
  line.classList.add(ok?'ok':'bad');
  if(ok)u.classList.add('done');else u.dataset.miss=1;
  const ex=u.closest('.exer');allDone(ex,'.brow','.done');
}
function tapChip(c){
  const unit=c.closest('.unit');if(!unit||unit.classList.contains('done'))return;
  const bank=unit.querySelector('.bank'),sel=unit.querySelector('.chip.sel');
  if(c.parentElement!==bank){ if(sel&&sel!==c)place(sel,c.parentElement,c);else place(c,bank); return }
  if(unit.classList.contains('brow')){place(c,unit.querySelector('.line'));return}
  const was=c.classList.contains('sel');unit.querySelectorAll('.chip.sel').forEach(x=>x.classList.remove('sel'));if(!was)c.classList.add('sel');
}

/* --- drag (мышь и палец) --- */
let D=null;
document.addEventListener('pointerdown',e=>{
  const c=e.target.closest('.chip');if(!c||e.button>0||c.closest('.done'))return;
  D={c,x:e.clientX,y:e.clientY,moved:false,g:null};
});
document.addEventListener('pointermove',e=>{
  if(!D)return;
  if(!D.moved){if(Math.hypot(e.clientX-D.x,e.clientY-D.y)<6)return;
    D.moved=true;const r=D.c.getBoundingClientRect();D.dx=D.x-r.left;D.dy=D.y-r.top;
    D.g=D.c.cloneNode(true);D.g.classList.add('ghost');D.g.style.width=r.width+'px';document.body.appendChild(D.g);D.c.classList.add('dragging')}
  D.g.style.transform=`translate(${e.clientX-D.dx}px,${e.clientY-D.dy}px)`;
  document.querySelectorAll('.zone.over').forEach(z=>z.classList.remove('over'));
  const z=zoneAt(e);if(z)z.classList.add('over');
});
function zoneAt(e){const el=document.elementFromPoint(e.clientX,e.clientY);const z=el&&el.closest('.zone');return z&&z.closest('.unit')===D.c.closest('.unit')?z:null}
function endDrag(e,cancel){
  if(!D)return;const d=D;D=null;
  document.querySelectorAll('.zone.over').forEach(z=>z.classList.remove('over'));
  if(!d.moved){if(!cancel)tapChip(d.c);return}
  d.g.remove();d.c.classList.remove('dragging');
  if(cancel)return;
  const el=document.elementFromPoint(e.clientX,e.clientY);const z=el&&el.closest('.zone');
  if(z&&z.closest('.unit')===d.c.closest('.unit'))place(d.c,z,el.closest('.chip'));
}
document.addEventListener('pointerup',e=>endDrag(e,false));
document.addEventListener('pointercancel',e=>endDrag(e,true));

/* --- нажатия --- */
document.addEventListener('click',e=>{
  const t=e.target;let b;
  if((b=t.closest('.chip'))){ if(e.detail===0)tapChip(b); return }  // клавиатура; мышь и палец — через pointerup
  const ex=t.closest('.exer');if(!ex)return;
  const x=EX[ex.dataset.l][ex.dataset.i];

  if(t.closest('[data-reset]')){ex.innerHTML=exercise(x,L[ex.dataset.l-1],+ex.dataset.i);return}

  if((b=t.closest('.zone'))){const sel=b.closest('.unit').querySelector('.chip.sel');if(sel)place(sel,b);return}

  if((b=t.closest('.opt:not(.tfb):not(.ckb)'))){const row=b.closest('.prow');if(row.classList.contains('ok'))return;
    if(b.dataset.o===row.dataset.a){row.classList.add('ok');b.classList.add('ok');row.querySelector('.gap').textContent=row.dataset.a==='—'?'∅':row.dataset.a;allDone(ex,'.prow','.ok')}
    else{b.classList.add('bad');row.dataset.miss=1}
    return}

  if((b=t.closest('.tfb'))){const row=b.closest('.prow');if(row.classList.contains('ok'))return;
    if(b.dataset.v===row.dataset.ok){row.classList.add('ok');b.classList.add('ok');const f=row.querySelector('.fix');if(f)f.hidden=false;allDone(ex,'.prow','.ok')}
    else{b.classList.add('bad');row.dataset.miss=1}
    return}

  if((b=t.closest('.mc'))){if(b.classList.contains('ok'))return;
    const other=ex.querySelector(`.mc.sel:not([data-side="${b.dataset.side}"])`);
    ex.querySelectorAll(`.mc.sel[data-side="${b.dataset.side}"]`).forEach(m=>m!==b&&m.classList.remove('sel'));
    if(!other){b.classList.toggle('sel');return}
    other.classList.remove('sel');
    if(other.dataset.k===b.dataset.k){[b,other].forEach(m=>{m.classList.add('ok');m.disabled=true});
      if(!ex.querySelector('.mc:not(.ok)'))res(ex,'Все пары найдены!',true)}
    else{[b,other].forEach(m=>{m.classList.add('bad');setTimeout(()=>m.classList.remove('bad'),600)})}
    return}

  if((b=t.closest('.sayb'))){const a=b.nextElementSibling;a.hidden=!a.hidden;b.textContent=a.hidden?'Ответ':'Скрыть';return}

  if((b=t.closest('.ckb'))){const row=b.closest('.crow'),y=b.dataset.y==='1';
    row.querySelectorAll('.ckb').forEach(k=>k.classList.toggle('on',k===b));
    row.querySelector('.cout').textContent=y?`我昨天${row.dataset.v}了${row.dataset.o}。`:`我昨天没${row.dataset.v}${row.dataset.o}。`;
    row.classList.toggle('yes',y);row.classList.toggle('no',!y);return}

  if((b=t.closest('.bgc'))){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);
    const cells=[...ex.querySelectorAll('.bgc')],p=cells.map(c=>c.getAttribute('aria-pressed')==='true');
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].filter(l=>l.every(i=>p[i]));
    cells.forEach(c=>c.classList.remove('win'));lines.flat().forEach(i=>cells[i].classList.add('win'));
    res(ex,lines.length?'宾果！ Бинго!':'',lines.length>0);return}

  if((b=t.closest('.hintbtn'))){const a=b.nextElementSibling;a.hidden=!a.hidden;b.closest('.brow').dataset.miss=1;return}

  if(t.closest('.exchk')){const u=ex.querySelector('.unit');let ok=0,n=0;
    if(x.t==='fill'){u.querySelectorAll('.gap1').forEach(g=>{n++;const c=g.querySelector('.chip');g.classList.remove('ok','bad');if(c&&c.dataset.v===g.dataset.a){g.classList.add('ok');ok++}else g.classList.add('bad')})}
    else{n=x.items.length;u.querySelectorAll('.bzone .chip').forEach(c=>{const good=c.dataset.b===c.parentElement.dataset.i;c.classList.remove('ok','bad');c.classList.add(good?'ok':'bad');if(good)ok++})}
    res(ex,ok===n?`Всё верно! ${ok} из ${n}`:`Верно ${ok} из ${n}. Исправь красное и проверь ещё раз.`,ok===n);return}

  if(t.closest('.exans')){const u=ex.querySelector('.unit'),bank=u.querySelector('.bank');
    if(x.t==='fill'){u.querySelectorAll('.gap1').forEach(g=>{const c=g.querySelector('.chip');if(c&&c.dataset.v!==g.dataset.a)bank.appendChild(c)});
      u.querySelectorAll('.gap1').forEach(g=>{if(!g.querySelector('.chip')){const c=[...bank.querySelectorAll('.chip')].find(c=>c.dataset.v===g.dataset.a);if(c)g.appendChild(c)}})}
    else u.querySelectorAll('.chip').forEach(c=>u.querySelector(`.bzone[data-i="${c.dataset.b}"]`).appendChild(c));
    clearMarks(u);u.querySelectorAll('.chip.sel').forEach(c=>c.classList.remove('sel'));res(ex,'Ответ показан. Нажми «Заново», чтобы попробовать самой.');return}
});

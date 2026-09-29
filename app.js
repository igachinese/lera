const $=s=>document.querySelector(s);
const main=$('#main');
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

function tabs(active){
  let h=`<button class="tab" role="tab" data-go="plan" aria-selected="${active==='plan'}"><span class="k">3 недели</span><span class="v">Программа</span></button>`;
  L.forEach(l=>{h+=`<button class="tab" role="tab" data-go="l${l.n}" aria-selected="${active==='l'+l.n}"><span class="k">Нед. ${l.week} · ${l.day.slice(0,2)}</span><span class="v">${l.n}. ${l.title}</span></button>`});
  $('#tabs').innerHTML=h;
  $('#tabs').querySelectorAll('.tab').forEach(b=>b.onclick=()=>go(b.dataset.go));
  const a=$('#tabs [aria-selected="true"]'); if(a) a.scrollIntoView({inline:'nearest',block:'nearest'});
}

function cards(ws,id){
  return `<div class="cardbar"><p class="sub">Карточки · нажми — откроется и прозвучит</p><button class="minibtn" data-hide="${id}">Скрыть пиньинь и перевод</button></div>
  <div class="cards" id="${id}">${ws.map(w=>`<button class="wc" data-say="${w[0]}"><span class="h">${w[0]}</span><span class="p">${w[1]}</span><span class="r">${w[2]}</span></button>`).join('')}</div>`;
}
function steps(a){return `<ul class="steps">${a.map(x=>`<li>${x}</li>`).join('')}</ul>`}
function formula(f){return f.map(p=>`<span class="${p[1]||''}">${p[0]}</span>`).join('')}
function blockHead(key,l){
  const [z,t]=BLOCKS[key];
  return `<div class="bhead"><span class="bz">${z}</span><span class="bt">${t}</span><span class="bmin">${l.min[key]} мин</span><button class="go t-only" data-timer="${key}">▶ Таймер</button></div>`;
}

function exList(l,place){
  let num=0;
  return (EX[l.n]||[]).map((x,i)=>(x.place||'drill')===place?`<div class="exer" data-l="${l.n}" data-i="${i}" data-num="${++num}">${exercise(x,l,i,num)}</div>`:'').join('');
}
function lesson(l){
  const g=l.gram;
  const segs=Object.keys(BLOCKS).map(k=>`<button class="seg" style="flex:${l.min[k]}" data-jump="b-${k}"><span class="z">${BLOCKS[k][0]}</span><span class="m">${BLOCKS[k][1]} · ${l.min[k]}′</span></button>`).join('');
  let h=`<section class="lhead">
    <span class="eyebrow">Неделя ${l.week} · ${l.day} · урок ${l.n} из 6</span>
    <h2>${l.title}</h2><span class="bigzh">${l.zh}</span>
    <p class="goal">${l.goal}</p>
    <span class="cando"><b>Итог урока</b>${l.cando}</span>
    <div class="stars" id="stars" aria-live="polite"></div>
  </section>
  <div class="strip">${segs}</div>

  <aside class="teacher t-only">
    <div>
      <h3>Подготовить до урока</h3>
      <div class="prep">${l.prep.map((p,i)=>{const id=`p${l.n}-${i}`;return `<label><input type="checkbox" id="${id}" ${store.get(id)==='1'?'checked':''}><span class="tg">${p[0]}</span><span class="tx">${p[1]}</span></label>`}).join('')}</div>
      ${l.prompt?`<div class="prompt"><p class="sub" style="margin:0">Промпт для Gemini</p><p id="pr${l.n}">${l.prompt}</p><button class="minibtn" data-copy="pr${l.n}">Копировать</button></div>`:''}
    </div>
    <div class="watch"><h3>На что смотреть</h3>${l.watch.map(w=>`<p>• ${w}</p>`).join('')}</div>
  </aside>

  <section class="block" id="b-review">${blockHead('review',l)}<div class="bbody">
    <div class="t-only">${steps(l.review)}</div>
    ${cards(l.rwords,'rw'+l.n)}
    ${exList(l,'review')}
  </div></section>

  <section class="block" id="b-neu">${blockHead('neu',l)}<div class="bbody">
    <div class="gram">
      <h3>${g.name}</h3>
      <div class="formula"><span class="lab">Формула</span>${formula(g.formula)}</div>
      ${g.neg?`<div class="formula"><span class="lab">Отрицание</span>${formula(g.neg)}</div>`:''}
      <p class="explain">${g.explain}</p>
      <div class="ex">${g.ex.map(e=>`<div class="exrow"><div><div class="z">${spk(e[0])}${e[0]}</div><div class="py">${e[1]}</div></div><div class="ru">${e[2]}</div></div>`).join('')}</div>
      ${g.trap?`<div class="trap">${g.trap}</div>`:''}
    </div>
    ${cards(l.words,'nw'+l.n)}
    ${exList(l,'neu')}
  </div></section>

  <section class="block" id="b-drill">${blockHead('drill',l)}<div class="bbody">
    <div class="t-only"><p class="sub">Как провести</p>${steps(l.drill)}</div>
    ${exList(l,'drill')}
  </div></section>

  <section class="block" id="b-talk">${blockHead('talk',l)}<div class="bbody">
    <p style="margin:0;max-width:75ch">${l.talk.task}</p>
    <div><p class="sub">Каркас ответа</p><div class="frame">${l.talk.frame.map(f=>`<div class="sayable" data-say="${f[0]}" tabindex="0">${f[0]}<small>${f[1]}</small></div>`).join('')}</div></div>
    <div><p class="sub">Вопросы · нажми, чтобы услышать</p><div class="qs">${l.talk.qs.map(q=>`<span class="sayable" data-say="${q}" tabindex="0">${q}</span>`).join('')}</div></div>
    ${recorder()}
  </div></section>

  <section class="block" id="b-hw">${blockHead('hw',l)}<div class="bbody">${steps(l.hw)}</div></section>`;
  return h;
}

function overview(){
  const wk=[1,2,3].map(w=>`<div class="wk"><span class="wn">Неделя ${w}</span>${L.filter(l=>l.week===w).map(l=>`<button class="lnk" data-go="l${l.n}"><span class="d">${l.day} · урок ${l.n}</span><span class="t">${l.title}</span><span class="g">${l.gram.name.split(' ')[0]==='Как'?'采访':l.gram.name.split(' — ')[0]}</span></button>`).join('')}</div>`).join('');
  const mx=`<table><thead><tr><th>Конструкция</th>${L.map(l=>`<th>Урок ${l.n}</th>`).join('')}</tr></thead><tbody>${MATRIX.map(r=>`<tr><td>${r[0]}</td>${r[1].map(c=>`<td>${c?`<span class="dot ${c}" title="${c==='i'?'ввод':'повтор'}"></span>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return `<div class="ov">
    <div><h2>Из фраз — в рассказ о себе</h2>
    <p class="lede">Три недели после HSK1, 6 уроков по 60 минут. Каждый урок вводит одну грамматическую конструкцию уровня HSK2 и держит одну схему: 复习 → 新课 → 练习 → 会话 → 作业. Финал — интервью с носителем языка.</p></div>
    <div class="weeks">${wk}</div>
    <div class="panel"><h3>Интервальное повторение конструкций</h3><div class="mx">${mx}</div>
      <div class="legend"><span><i class="dot i"></i>ввод</span><span><i class="dot r"></i>повтор в блоке 复习 или 会话</span><span>Интервалы: 2 → 5 → 7 дней</span></div></div>
    <div class="two">
      <div class="panel"><h3>К концу третьей недели Лера</h3>${steps(['говорит 1 минуту о своих выходных без каркаса (了, 先…然后);','сравнивает людей и вещи (比, 没有, 一样, 最);','рассказывает о хобби и объясняет почему (会, 因为…所以);','отвечает на 你怎么去学校？ и 你去过…吗？ полным ответом;','выдерживает 15 минут разговора с носителем, пользуясь «спасательными фразами»;','переводит ~75 новых слов в актив.'])}</div>
      <div class="panel t-only"><h3>Проверить до старта</h3>${steps(['<b>Результаты пробного HSK1:</b> слабый раздел вставить в 复习 уроков 1–2.','<b>Отчёт теста-актуализации:</b> 10–12 слабых слов → урок 1.','<b>Носитель на урок 6:</b> договориться до урока 4, подтвердить до урока 5.','<b>Новый учебник:</b> решить к концу недели 3, чтобы урок 7 уже шёл по нему.'])}</div>
    </div>
    <div class="panel t-only"><h3>Взгляд методиста</h3>${steps(['<b>Нагрузка плотная:</b> пять конструкций за три недели для 12 лет — верхняя граница. Страховка: одна конструкция на урок и возврат к ней 2–3 раза. Если урок 1 или 5 идёт тяжело, 离 и 从…到… спокойно переезжают в следующий цикл.','<b>Разговор — 15 минут из 60.</b> Это главная смена после учебника: раньше доминировал ввод слов, теперь продукция. Следи, чтобы блок 会话 не съедался отработкой.','<b>Масштабирование:</b> схема 复习 10 → 新课 15 → 练习 15 → 会话 15 → 作业 5 и набор из пяти конструкций подходят любому ученику после HSK1. Меняются только слова, картинки и темы разговора.'])}</div>
  </div>`;
}

function go(id,noScroll){
  if(id!=='plan' && !/^l[1-6]$/.test(id)) id='plan';
  tabs(id);
  if(id==='plan') main.innerHTML=overview();
  else main.innerHTML=lesson(L[+id.slice(1)-1]);
  try{history.replaceState(null,'','#'+id)}catch(e){}
  if(!noScroll) window.scrollTo(0,0);
  bind(id);
  if(id!=='plan'){updateStars(+id.slice(1));initExercises(main)}
}

function bind(id){
  main.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  main.querySelectorAll('.wc').forEach(c=>c.onclick=()=>{c.classList.toggle('open');speak(c.dataset.say)});
  main.querySelectorAll('[data-hide]').forEach(b=>b.onclick=()=>{const g=document.getElementById(b.dataset.hide);const on=g.classList.toggle('hidden-meta');g.querySelectorAll('.wc').forEach(c=>c.classList.remove('open'));b.textContent=on?'Показать всё':'Скрыть пиньинь и перевод'});
  main.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.jump).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'}));
  main.querySelectorAll('.prep input').forEach(i=>i.onchange=()=>store.set(i.id,i.checked?'1':'0'));
  main.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{const t=document.getElementById(b.dataset.copy).textContent;
    const ok=()=>{b.textContent='Скопировано';setTimeout(()=>b.textContent='Копировать',1500)};
    try{navigator.clipboard.writeText(t).then(ok,()=>sel(b.dataset.copy))}catch(e){sel(b.dataset.copy)}});
  main.querySelectorAll('[data-timer]').forEach(b=>b.onclick=()=>{const l=L[+id.slice(1)-1];startTimer(b.dataset.timer,l.min[b.dataset.timer])});
}
function sel(id){const r=document.createRange();r.selectNodeContents(document.getElementById(id));const s=getSelection();s.removeAllRanges();s.addRange(r)}

/* timer */
let T={left:0,total:0,run:false,h:null};
function fmt(s){const neg=s<0;s=Math.abs(s);return (neg?'+':'')+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function draw(){$('#clock').textContent=fmt(T.left);$('#tbar').style.width=Math.min(100,(1-T.left/T.total)*100)+'%';$('#timer').classList.toggle('late',T.left<0)}
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator(),g=a.createGain();o.frequency.value=660;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.4)}catch(e){}}
function tick(){T.left--; if(T.left===0) beep(); draw()}
function startTimer(key,m){clearInterval(T.h);T={left:m*60,total:m*60,run:true,h:setInterval(tick,1000)};$('#tz').textContent=BLOCKS[key][0];$('#tn').textContent=BLOCKS[key][1];$('#tpause').textContent='Пауза';$('#timer').hidden=false;draw()}
$('#tpause').onclick=()=>{if(T.run){clearInterval(T.h);T.run=false;$('#tpause').textContent='Дальше'}else{T.h=setInterval(tick,1000);T.run=true;$('#tpause').textContent='Пауза'}};
$('#tplus').onclick=()=>{T.left+=60;T.total+=60;draw()};
$('#tstop').onclick=()=>{clearInterval(T.h);$('#timer').hidden=true};

/* sound */
function setSnd(on){SND.on=on;$('#snd').setAttribute('aria-pressed',on);$('#snd').textContent=on?'🔊 Звук':'🔇 Без звука';store.set('snd',on?'1':'0')}
$('#snd').onclick=()=>setSnd(!SND.on);
setSnd(store.get('snd')!=='0');
if(!canSpeak)$('#snd').hidden=true;

/* mode */
function setMode(m){document.body.classList.toggle('student',m==='student');$('#m-teacher').setAttribute('aria-pressed',m!=='student');$('#m-student').setAttribute('aria-pressed',m==='student');store.set('mode',m)}
$('#m-teacher').onclick=()=>setMode('teacher');
$('#m-student').onclick=()=>setMode('student');
setMode(store.get('mode')==='student'?'student':'teacher');

go((location.hash||'#plan').slice(1),true);

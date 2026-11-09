/* Лера practice center: local progress, finite rounds, shared speech and stroke data. */
(() => {
  'use strict';
  function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  const pyKey=s=>String(s||'').toLowerCase().replace(/[\s'’·]/g,'');
  function normalizeWords(rows){const seen=new Set();return rows.filter(w=>w[0]&&w[2]&&!seen.has(w[0])&&seen.add(w[0])).map(w=>({hz:w[0],py:w[1]||'',ru:w[2],id:w[0]}))}
  const meanings=s=>String(s).toLowerCase().replace(/\([^)]*\)/g,'').split(/[;／/]/).map(x=>x.trim()).filter(Boolean);
  function optionsFor(target,pool,all,count=4,audio=false){
    const candidates=[...shuffle(pool),...shuffle(all)].filter(w=>w.hz!==target.hz&&!meanings(w.ru).some(k=>meanings(target.ru).includes(k))&&(!audio||pyKey(w.py)!==pyKey(target.py)));
    const seen=new Set(meanings(target.ru));const unique=candidates.filter(w=>{const keys=meanings(w.ru);if(keys.some(k=>seen.has(k)))return false;keys.forEach(k=>seen.add(k));return true});
    return shuffle([target,...unique.slice(0,count-1)]);
  }
  function sameSentence(actual,expected){return actual.length===expected.length&&actual.every((t,i)=>t===expected[i])}
  function freshProgress(){return {completedRounds:0,words:{},rounds:[],days:[],writing:{},correct:0,attempts:0}}
  function recordAnswer(progress,word,correct,date){
    progress.attempts++;if(correct)progress.correct++;
    if(!progress.days.includes(date))progress.days.push(date);
    if(!word)return;
    const item=progress.words[word.hz]||{correct:0,wrong:0,weak:false,streak:0};
    if(correct){item.correct++;item.streak++;if(item.streak>=2)item.weak=false}else{item.wrong++;item.streak=0;item.weak=true}
    progress.words[word.hz]=item;
  }
  if(typeof module!=='undefined'&&module.exports){module.exports={shuffle,pyKey,normalizeWords,optionsFor,sameSentence,freshProgress,recordAnswer};return}

  const $=id=>document.getElementById(id),Speech=window.LearningSpeech;
  const ICONS={home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>',book:'<path d="M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H3zm9 3a3 3 0 0 1 3-3h6v15h-5a4 4 0 0 0-4 2"/>',game:'<path d="M7 7h10c3 0 5 12 3 13s-4-3-5-3H9c-1 0-3 4-5 3S4 7 7 7zM7 10v5m-2-2.5h4m7-1h.1m2 3h.1"/>',pen:'<path d="m15 3 6 6L9 21H3v-6zm-10 11 6 6m2-15 6 6"/>',chart:'<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',volume:'<path d="m11 4-5 4H3v8h3l5 4zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m3-17a3 3 0 0 1 0 6m1 5a5 5 0 0 1 3 5"/>',search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',play:'<path d="m8 4 12 8-12 8z"/>',check:'<path d="m5 12 4 4L19 6"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',headphones:'<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',puzzle:'<path d="M3 3h6v3a2 2 0 1 0 4 0V3h8v7h-3a2 2 0 1 0 0 4h3v7h-8v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3z"/>',ball:'<circle cx="12" cy="12" r="9"/><path d="m12 8 4 3-1.5 5h-5L8 11zm0-5v5m9 2-5 1m3 5 2 4m-8-4-2 4m-4-10 5 1"/>',cards:'<rect x="4" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12M8 11h5m-5 5h3"/>',flag:'<path d="M4 22V3m0 1c6-4 10 4 16 0v11c-6 4-10-4-16 0"/>',balloon:'<ellipse cx="12" cy="9" rx="7" ry="8"/><path d="m12 17-2 3h4zm0 3v3"/>',tone:'<path d="M3 6h7m4 1 7-4M3 18l4-5 4 5m4-4 6 6"/>'};
  const icon=n=>'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[n]||ICONS.spark)+'</svg>';
  const quantity=(n,one,few,many)=>n+' '+(n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many);
  const wordsCount=n=>quantity(n,'слово','слова','слов');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
  Speech.bind({voiceSelect:$('voice-choice'),rateSelect:$('voice-speed'),status:$('voice-status'),testButton:$('voice-test'),testPhrase:'你好，莉拉！加油！'});
  const KEY='lera.practice.v2';let persistent=true,progress;
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');progress=raw&&typeof raw.words==='object'&&Array.isArray(raw.rounds)?{...freshProgress(),...raw}:freshProgress()}catch{progress=freshProgress();persistent=false}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(progress))}catch{persistent=false}$('device-note').innerHTML=persistent?'Прогресс хранится в этом браузере. Персональные отчёты и баланс уроков — в <a href="index.html#parents">личном кабинете</a>.':'Браузер не разрешает сохранять прогресс. Можно заниматься; результаты будут доступны до закрытия страницы.'}
  const day=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow'}).format(new Date());
  const GRAMMAR=[{"topics": ["time"], "ru": "Сейчас половина третьего.", "tokens": ["现在", "两点", "半"], "blank": 2, "choices": ["半", "岁", "口"], "rule": "两点半 — два часа и половина: 2:30."}, {"topics": ["time"], "ru": "Сейчас четверть десятого.", "tokens": ["现在", "九点", "一刻"], "blank": 2, "choices": ["一刻", "一个", "一点"], "rule": "九点一刻 — 9:15. 一刻 — четверть часа."}, {"topics": ["routine", "time"], "ru": "Я в семь часов встаю.", "tokens": ["我", "七点", "起床"], "blank": 1, "choices": ["七点", "七岁", "七个"], "rule": "Время ставится перед действием: кто + когда + что делает."}, {"topics": ["transport", "extra"], "ru": "Я еду в школу на автобусе.", "tokens": ["我", "坐", "公共汽车", "去", "学校"], "blank": 1, "choices": ["坐", "喝", "穿"], "rule": "坐 + транспорт: ехать на автобусе, поезде или такси."}, {"topics": ["transport", "extra"], "ru": "От моего дома до школы десять минут.", "tokens": ["从", "我家", "到", "学校", "十分钟"], "blank": 0, "choices": ["从", "在", "有"], "rule": "从…到… обозначает начальную и конечную точку."}, {"topics": ["transport", "extra"], "ru": "Мой дом недалеко от школы.", "tokens": ["我家", "离", "学校", "不远"], "blank": 1, "choices": ["离", "到", "从"], "rule": "A 离 B 不远 — A находится недалеко от B."}, {"topics": ["capy"], "ru": "Капибара любит воду.", "tokens": ["水豚", "喜欢", "水"], "blank": 1, "choices": ["喜欢", "叫", "是"], "rule": "喜欢 — любить что-то. 水 — вода."}, {"topics": ["clothes"], "ru": "Я хочу купить эту одежду.", "tokens": ["我", "想", "买", "这件", "衣服"], "blank": 1, "choices": ["想", "在", "是"], "rule": "想 + действие — хотеть что-то сделать. 件 — счётное слово для одежды."},
    {topics:['jobs','self','extra'],ru:'Он врач.',tokens:['他','是','医生'],blank:1,choices:['是','有','在'],rule:'Кто кем является: кто + 是 + профессия.'},
    {topics:['jobs','family'],ru:'Моя мама — учитель.',tokens:['我','妈妈','是','老师'],blank:2,choices:['是','有','吗'],rule:'是 связывает человека и его профессию.'},
    {topics:['jobs','extra'],ru:'Я не юрист.',tokens:['我','不','是','律师'],blank:1,choices:['不','没','也'],rule:'Отрицаем профессию: 不是 — «не является».'},
    {topics:['jobs','family'],ru:'Мой папа врач.',tokens:['我','爸爸','是','医生'],blank:2,choices:['是','有','几'],rule:'Человек + 是 + профессия.'},
    {topics:['family','family','self'],ru:'В моей семье четыре человека.',tokens:['我家','有','四','口','人'],blank:3,choices:['口','个','岁'],rule:'Когда считаем членов семьи, используем 口.'},
    {topics:['family','self'],ru:'У меня есть младший брат.',tokens:['我','有','一个','弟弟'],blank:1,choices:['有','是','在'],rule:'有 означает «есть, иметь».'},
    {topics:['family','family'],ru:'У меня нет старшей сестры.',tokens:['我','没有','姐姐'],blank:1,choices:['没有','不是','不'],rule:'«Нет кого-то или чего-то» — 没有.'},
    {topics:['family','family','self'],ru:'Сколько человек в твоей семье?',tokens:['你家','有','几','口','人'],blank:2,choices:['几','谁','哪儿'],rule:'几 — «сколько», когда ожидаем небольшое число.'},
    {topics:['self','greetings','extra'],ru:'Как тебя зовут?',tokens:['你','叫','什么','名字'],blank:2,choices:['什么','几','谁'],rule:'你叫什么名字？ — готовый вопрос «Как тебя зовут?».'},
    {topics:['self','greetings','extra'],ru:'Меня зовут Лера.',tokens:['我','叫','莉拉'],blank:0,choices:['我','你','他'],rule:'Когда спрашивают 你… («ты»), про себя отвечаем 我… («я»).'},
    {topics:['age','numbers','self'],ru:'Моей младшей сестре семь лет.',tokens:['妹妹','七','岁'],blank:2,choices:['岁','人','口'],rule:'Возраст: кто + число + 岁. 是 здесь не нужно.'},
    {topics:['age','self'],ru:'Сколько тебе лет?',tokens:['你','几','岁'],blank:1,choices:['几','谁','哪儿'],rule:'你几岁？ — вопрос о возрасте ребёнка.'},
    {topics:['countries','transport','self'],ru:'Он живёт в Пекине.',tokens:['他','住在','北京'],blank:1,choices:['住在','喜欢','叫'],rule:'住在 + место — «жить где-то».'},
    {topics:['countries','transport'],ru:'Где ты живёшь?',tokens:['你','住在','哪儿'],blank:2,choices:['哪儿','谁','几岁'],rule:'哪儿 — «где». Оно стоит на месте ответа о месте.'},
    {topics:['extra','extra'],ru:'Я люблю футбол.',tokens:['我','喜欢','足球'],blank:1,choices:['喜欢','叫','是'],rule:'喜欢 + что-то — «нравится, люблю».'},
    {topics:['extra','extra'],ru:'Я тоже люблю футбол.',tokens:['我','也','喜欢','足球'],blank:1,choices:['也','吗','的'],rule:'也 («тоже») ставим перед действием.'},
    {topics:['extra','school'],ru:'У меня есть мяч.',tokens:['我','有','球'],blank:1,choices:['有','是','叫'],rule:'有 — «есть, иметь». 我有球 — «У меня есть мяч».'},
    {topics:['time'],ru:'Который сейчас час?',tokens:['现在','几','点'],blank:2,choices:['点','岁','口'],rule:'几点 — «который час». 现在 — «сейчас».'},
    {topics:['time','numbers'],ru:'Сейчас два часа.',tokens:['现在','两','点'],blank:1,choices:['两','二','也'],rule:'Перед 点 («час») говорим 两点, а не 二点.'},
    {topics:['routine','school'],ru:'Я пью воду.',tokens:['我','喝','水'],blank:1,choices:['喝','吃','是'],rule:'喝 — «пить», 吃 — «есть».'},
    {topics:['school','extra'],ru:'Я ем яблоко.',tokens:['我','吃','苹果'],blank:1,choices:['吃','喝','住'],rule:'Кто + действие + предмет: 我吃苹果.'},
    {topics:['extra'],ru:'Конь ходит.',tokens:['马','走'],blank:1,choices:['走','喝','是'],rule:'走 — «ходить». В шахматах — делать ход.'},
    {topics:['self','extra'],ru:'Я ученик.',tokens:['我','是','学生'],blank:1,choices:['是','有','在'],rule:'我是学生 — «Я ученик».'},
    {topics:['family','family'],ru:'Это мой младший брат.',tokens:['他','是','我','弟弟'],blank:0,choices:['他','我','你'],rule:'他 — «он». Говорим о другом человеке.'},
    {topics:['dates','extra'],ru:'Сегодня воскресенье.',tokens:['今天','是','星期天'],blank:0,choices:['今天','今年','明天'],rule:'今天 — «сегодня», 今年 — «в этом году».'},
    {topics:['phones','extra'],ru:'Какой у тебя номер телефона?',tokens:['你的','电话号码','是','多少'],blank:3,choices:['多少','几岁','哪儿'],rule:'多少 спрашивает число или количество. 几岁 — только возраст.'}
  ];
  const MODES=[
    {id:'cards',group:'words',name:'Сначала познакомимся',short:'Карточки',desc:'Послушай слово, открой перевод и скажи его вслух.',icon:'cards',time:'5 слов',tag:'Лучше начать здесь'},
    {id:'choice',group:'words',name:'Угадай перевод',short:'Перевод',desc:'Посмотри на иероглифы и найди значение по-русски.',icon:'book',time:'До 6 вопросов',tag:'Запоминаем слова'},
    {id:'reverse',group:'words',name:'Найди иероглиф',short:'Иероглифы',desc:'Прочитай перевод и выбери китайское слово.',icon:'search',time:'До 6 вопросов',tag:'Узнаём на письме'},
    {id:'listen',group:'listen',name:'Слушаем и узнаём',short:'Аудирование',desc:'Сначала только звук. Узнай слово и выбери перевод.',icon:'headphones',time:'До 6 вопросов',tag:'Тренируем слух'},
    {id:'sentence',group:'phrases',name:'Собери фразу',short:'Конструктор фраз',desc:'Поставь слова по порядку. Подсказка будет по-русски.',icon:'puzzle',time:'До 5 фраз',tag:'Говорим предложениями'},
    {id:'gap',group:'phrases',name:'Какое слово пропало?',short:'Простая грамматика',desc:'Выбери нужное слово и узнай простое правило.',icon:'pen',time:'До 5 вопросов',tag:'Разбираемся в грамматике'},
    {id:'traps',group:'words',name:'Не попадись в ловушку',short:'Ловушки',desc:'Отличи похожие слова. После ответа — объяснение.',icon:'flag',time:'До 6 вопросов',tag:'Персональные трудности'},
    {id:'memory',group:'games',name:'Найди пару',short:'Парные карточки',desc:'Открой карточки: китайское слово и его перевод.',icon:'cards',time:'4 пары',tag:'Память и слова'},
    {id:'penalty',group:'games',name:'Точный бросок',short:'Пенальти',desc:'Узнай слово и выбери мяч с правильным переводом.',icon:'ball',time:'5 ударов',tag:'Слова и внимание'},
    {id:'balloons',group:'games',name:'Лопай шарики',short:'Шарики',desc:'Прочитай перевод. Найди китайское слово на шарике.',icon:'balloon',time:'5 шариков',tag:'Ищем нужное слово'},
    {id:'tones',group:'listen',name:'Кунг-фу тонов',short:'Тоны',desc:'Послушай один слог. Выбери ровный тон, подъём, ямку или падение.',icon:'tone',time:'6 звуков',tag:'Общая разминка слуха'},
    {id:'sprint',group:'games',name:'Минутка скорости',short:'Блиц',desc:'Верный ли перевод? Одна минута — только если хочется.',icon:'clock',time:'60 секунд',tag:'Игра на скорость'},
    {id:'writing',group:'writing',name:'Пишем по чертам',short:'Письмо',desc:'Посмотри порядок черт и напиши иероглиф сама.',icon:'pen',time:'Без спешки',tag:'Кисть и внимание'}
  ];
  const categories={all:'Все темы',self:'Числа и о себе',family:'Семья и люди',daily:'Повседневное',hobby:'Речь и открытия'};
  const groups={all:'Все занятия',words:'Слова',listen:'Слушаем',phrases:'Фразы',games:'Игры',writing:'Пишем'};
  const topicCategory=id=>['numbers','greetings','age','phones','contacts','self','pointers'].includes(id)?'self':['family','jobs','professions','body'].includes(id)?'family':['extra','phrases','capy'].includes(id)?'hobby':'daily';
  let data,topics=[],allWords=[],wordMap=new Map(),category='all',modeGroup='all',selectedTopic='transport',session=null,sessionSerial=0,writer=null,strokePromise=null,writingEpoch=0,writingChars=[],writingWord=null,writingChar='',writingData=null,strokeCursor=0,writingBusy=false,lastRoute='topics',missionQueue=[];
  const getTopic=id=>topics.find(t=>t.id===id)||topics[0];
  function weakWords(){return allWords.filter(w=>progress.words[w.hz]?.weak)}
  function mark(word,correct){recordAnswer(progress,word,correct,day());save()}
  function setView(id){['hub-view','topic-view','games-view','writing-view','progress-view','session-view'].forEach(x=>$(x).hidden=x!==id);document.body.classList.toggle('session-active',id==='session-view');document.querySelectorAll('[data-route]').forEach(a=>{const route=id==='hub-view'||id==='topic-view'?'topics':id.replace('-view','');const active=a.dataset.route===route;a.classList.toggle('active',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')})}
  function topicOptions(select){select.replaceChildren();topics.forEach(t=>select.add(new Option(t.title,t.id)));select.value=selectedTopic}
  function renderTopics(){
    const q=$('topic-search').value.trim().toLocaleLowerCase();
    const filtered=topics.filter(t=>(category==='all'||topicCategory(t.id)===category)&&(!q||[t.title,t.cn,...t.words.flatMap(w=>[w.hz,w.py,w.ru])].join(' ').toLocaleLowerCase().includes(q)));
    $('topics-grid').innerHTML=filtered.map(t=>`<button class="card topic-card ${t.id==='transport'?'recommended':''}" data-topic="${esc(t.id)}"><img class="topic-art" src="assets/topics/${esc(t.id)}.webp" alt="" width="480" height="480" loading="lazy" decoding="async"><div class="topic-top"><span class="topic-icon" aria-hidden="true">${esc(t.em)}</span><small>${t.id==='transport'?'Сейчас изучаем':t.lesson?'Тема '+t.lesson:'Мои открытия'}</small></div><h3>${esc(t.title)}</h3><p class="topic-cn" lang="zh-CN">${esc(t.cn)}</p><div class="topic-footer"><span>${wordsCount(t.words.length)} · выбрать</span>${icon('arrow')}</div></button>`).join('');
    $('no-topics').hidden=filtered.length>0;$('search-count').textContent=filtered.length+' из '+topics.length+' тем';
    document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>location.hash='topic/'+b.dataset.topic));
  }
  function buildFilters(container,items,current,onSelect){container.innerHTML=Object.entries(items).map(([id,title])=>`<button type="button" data-filter="${id}" class="${current===id?'active':''}" aria-pressed="${current===id}">${title}</button>`).join('');container.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>onSelect(b.dataset.filter)))}
  function modeMarkup(m){return `<button class="card mode-card" data-mode="${m.id}" data-group="${m.group}"><div class="mode-top"><span class="mode-icon">${icon(m.icon)}</span><small>${m.time}</small></div><h3>${m.name}</h3><p>${m.desc}</p><div class="mode-footer"><span>${m.tag}</span>${icon('arrow')}</div></button>`}
  function connectModes(container,topic){container.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.mode;if(m==='writing'){selectedTopic=topic;location.hash='writing/'+topic}else launch(topic,m)}))}
  function wordCard(w){return `<div class="word-item"><div><div class="hz" lang="zh-CN">${esc(w.hz)}</div><div class="py">${esc(w.py)}</div><div class="ru">${esc(w.ru)}</div></div><button class="audio-mini" data-word-audio="${esc(w.hz)}" aria-label="Послушать ${esc(w.hz)} · ${esc(w.ru)}">${icon('volume')}</button></div>`}
  function bindWordAudio(container){container.querySelectorAll('[data-word-audio]').forEach(b=>b.addEventListener('click',()=>Speech.speak(b.dataset.wordAudio)))}
  function renderTopic(id){
    const t=getTopic(id);selectedTopic=t.id;setView('topic-view');$('breadcrumb-current').textContent=t.title;
    $('topic-title').textContent=t.title;$('topic-meta').textContent=wordsCount(t.words.length)+' · '+t.cn+' · выбери один короткий раунд';$('topic-emoji').innerHTML=`<img class="topic-detail-art" src="assets/topics/${esc(t.id)}.webp" alt="" width="104" height="104">`;
    buildFilters($('mode-filters'),groups,modeGroup,value=>{modeGroup=value;renderTopic(id)});
    $('mode-grid').innerHTML=MODES.filter(m=>modeGroup==='all'||m.group===modeGroup).map(modeMarkup).join('');connectModes($('mode-grid'),t.id);
    $('dictionary-title').textContent='Словарик темы · '+wordsCount(t.words.length);$('word-list').innerHTML=t.words.map(wordCard).join('');bindWordAudio($('word-list'));
    $('topic-start').onclick=()=>launch(t.id,'cards');
  }
  function renderGames(){setView('games-view');$('breadcrumb-current').textContent='Игры для повторения';topicOptions($('game-topic'));$('games-grid').innerHTML=MODES.filter(m=>m.group==='games'||m.id==='tones').map(modeMarkup).join('');connectModes($('games-grid'),selectedTopic)}
  function renderProgress(){
    setView('progress-view');$('breadcrumb-current').textContent='Мои успехи';const weak=weakWords();
    $('progress-stats').innerHTML=[[progress.completedRounds||progress.rounds.length,'Раунды завершены'],[progress.correct,'Верные ответы'],[weak.length,'Слова на повторение'],[Object.keys(progress.writing).length,'Написанные иероглифы']].map(([n,t])=>`<div class="card progress-stat"><strong>${n}</strong><span>${t}</span></div>`).join('');
    $('review-start').hidden=!weak.length;$('review-list').innerHTML=weak.length?weak.map(wordCard).join(''):'<p class="muted">Здесь пока пусто. После ошибок появятся слова для повторения. Ошибаться нормально!</p>';bindWordAudio($('review-list'));
    $('round-history').innerHTML=progress.rounds.length?[...progress.rounds].reverse().slice(0,12).map(r=>`<div class="round-row"><div><b>${esc(r.mode)} · ${esc(r.topic)}</b><small>${new Date(r.time).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long'})}</small></div><span>${r.correct} / ${r.total} ${r.kind==='memory'?'пар':'ответов'}</span></div>`).join(''):'<p class="muted">Пройди первый раунд — и его результат появится здесь.</p>';
  }
  function cleanupSession(){sessionSerial++;if(session?.timer)clearInterval(session.timer);if(session?.delay)clearTimeout(session.delay);session=null;Speech.stop()}
  function launch(topic,mode,opts={}){
    if(!opts.mission)missionQueue=[];
    const marker='#train/'+topic+'/'+mode;
    if(location.hash===marker){startSession(topic,mode,opts)}else{window.__leraLaunch=opts;location.hash=marker}
  }
  function route(){
    if(!topics.length)return;
    const parts=decodeURIComponent(location.hash.slice(1)).split('/');const kind=parts[0]||'topics';
    if(kind!=='train'){cleanupSession();missionQueue=[];writer?.cancelQuiz();writer?.pauseAnimation();writingEpoch++}
    if(kind==='topic'){lastRoute='topic/'+(parts[1]||'jobs');renderTopic(parts[1]);}
    else if(kind==='games'){lastRoute='games';renderGames()}
    else if(kind==='writing'){selectedTopic=parts[1]&&getTopic(parts[1])?.id||selectedTopic;lastRoute='writing';renderWriting()}
    else if(kind==='progress'){lastRoute='progress';renderProgress()}
    else if(kind==='train'){const opts=window.__leraLaunch||{};delete window.__leraLaunch;startSession(parts[1],parts[2],opts)}
    else{lastRoute='topics';setView('hub-view');$('breadcrumb-current').textContent='Практика и игры';renderTopics()}
    window.scrollTo({top:0,behavior:'instant'});
  }
  function setSessionMeta(){
    const s=session;if(!s)return;const completed=s.mode==='memory'?s.matched:s.index;
    $('session-context').textContent=s.review?'Повторяем сложные слова':s.mode==='tones'?'Общая разминка тонов':s.topic.title;
    $('session-count').textContent=s.mode==='sprint'?'60 секунд':s.mode==='memory'?s.matched+' / '+s.total+' пар':Math.min(completed+1,s.total)+' / '+s.total;
    $('session-track-fill').style.width=Math.min(100,completed/s.total*100)+'%';
  }
  const tones=[['妈','mā',1],['麻','má',2],['马','mǎ',3],['骂','mà',4],['八','bā',1],['十','shí',2],['五','wǔ',3],['四','sì',4],['哥','gē',1],['国','guó',2],['水','shuǐ',3],['弟','dì',4]];
  function makeQueue(s){
    let pool=s.pool;
    if(s.mode==='sentence'||s.mode==='gap'){const rows=GRAMMAR.filter(q=>q.topics.includes(s.topic.id));s.generalGrammar=!rows.length;return shuffle(rows.length?rows:GRAMMAR.filter(q=>q.topics.includes('extra'))).slice(0,5)}
    if(s.mode==='tones')return shuffle(tones).slice(0,6).map(([hz,py,tone])=>({hz,py,tone}));
    if(s.mode==='traps'){
      const pairs=data.traps.filter(t=>t.w.some(w=>s.pool.some(x=>x.hz===w[0])));s.generalTraps=!pairs.length;
      return shuffle(pairs.length?pairs:data.traps).slice(0,6).map(t=>({trap:t,word:normalizeWords(t.w)[Math.floor(Math.random()*t.w.length)]}));
    }
    return shuffle(pool).slice(0,['cards','penalty','balloons'].includes(s.mode)?5:6);
  }
  function startSession(topicID,mode,opts={}){
    cleanupSession();if(!MODES.some(m=>m.id===mode)||mode==='writing'){location.hash='topic/'+(topicID||'jobs');return}
    const topic=getTopic(topicID);selectedTopic=topic.id;
    const review=opts.review?weakWords():null;if(opts.review&&!review.length){location.hash='progress';return}
    const s=session={id:sessionSerial,topic,mode,pool:review?.length?review:topic.words,review:Boolean(review),index:0,correct:0,attempts:0,mistakes:[],locked:false,done:false,mission:Boolean(opts.mission)};
    s.queue=makeQueue(s);s.total=s.queue.length;
    setView('session-view');$('breadcrumb-current').textContent=MODES.find(m=>m.id===mode).short;$('session-next').hidden=true;$('session-feedback').hidden=true;
    $('show-pinyin').closest('label').hidden=['listen','tones','memory','sentence','gap'].includes(mode);
    $('exercise-arena').className='card exercise-arena';
    if(mode==='memory'){s.total=Math.min(4,s.pool.length);renderMemory();return}
    if(mode==='sprint'){renderSprintStart();return}
    renderQuestion();
  }
  function heading(title,instruction){return `<div class="eyebrow">${esc(session.topic.title)}</div><h1 id="exercise-title">${title}</h1><p class="instruction">${instruction}</p>`}
  function currentWord(){const s=session;const item=s.queue[s.index];return s.mode==='traps'?item.word:['sentence','gap','tones'].includes(s.mode)?null:item}
  function resetQuestion(){session.locked=false;$('session-next').hidden=true;$('session-feedback').hidden=true;$('session-feedback').className='feedback';setSessionMeta();}
  function revealFeedback(correct,title,body){const box=$('session-feedback');box.className='feedback'+(correct?'':' bad');box.innerHTML=icon(correct?'check':'spark')+'<div><b>'+esc(title)+'</b>'+esc(body)+'</div>';box.hidden=false;$('session-next').hidden=false;}
  function recordQuestion(correct,word,explanation){
    const s=session;if(!s||s.locked||s.done)return false;s.locked=true;s.attempts++;if(correct)s.correct++;else if(word&&!s.mistakes.some(w=>w.hz===word.hz))s.mistakes.push(word);
    mark(word,correct);if(['sentence','gap'].includes(s.mode)){/* Grammar answers count as practice, not word mastery. */}
    const text=word?word.hz+' · '+word.py+' — '+word.ru:explanation;
    revealFeedback(correct,correct?'Верно! Отличная работа.':'Ничего страшного — разберём вместе.',explanation&&word?text+' '+explanation:text);
    $('exercise-arena').querySelectorAll('.option,.token,.sentence-check').forEach(b=>b.disabled=true);
    return true;
  }
  function markOption(button,correct,targetID){button.classList.add(correct?'correct':'wrong');$('exercise-arena').querySelectorAll('[data-answer]').forEach(b=>{if(b.dataset.answer===targetID)b.classList.add('correct');b.disabled=true})}
  function wordDisplay(w,translation=false){return `<div class="hz" lang="zh-CN">${esc(w.hz)}</div><div class="py">${esc(w.py)}</div>${translation?'<div class="ru">'+esc(w.ru)+'</div>':''}`}
  function renderQuestion(){
    const s=session;if(!s||s.done)return;if(s.index>=s.queue.length){finish();return}
    resetQuestion();const arena=$('exercise-arena'),item=s.queue[s.index];arena.classList.toggle('no-pinyin',!$('show-pinyin').checked);
    if(s.mode==='cards'){renderCards(item);return}
    if(s.mode==='sentence'){renderSentence(item);return}
    if(s.mode==='gap'){renderGap(item);return}
    if(s.mode==='tones'){renderTones(item);return}
    if(s.mode==='listen'){renderListening(item);return}
    if(s.mode==='traps'){renderTraps(item);return}
    const reverse=['reverse','balloons'].includes(s.mode);
    const options=optionsFor(item,s.pool,allWords,s.mode==='penalty'?3:4);
    if(s.mode==='penalty'){
      arena.innerHTML=heading('Точный бросок','Посмотри на слово. Выбери мяч с его переводом.')+`<div class="penalty-field"><div class="goal-frame"><div class="panda-avatar" aria-hidden="true"></div></div>${wordDisplay(item)}<button class="text-button" id="question-audio">${icon('volume')}Послушать слово</button><div class="options">${options.map(w=>`<button class="option ball-option" data-answer="${esc(w.hz)}">${esc(w.ru)}</button>`).join('')}</div></div>`;
    }else{
      arena.innerHTML=heading(s.mode==='balloons'?'Лопай нужный шарик':reverse?'Найди китайское слово':'Что это значит?',s.mode==='balloons'?'Прочитай перевод и выбери шарик с китайским словом. Звук — дополнительная подсказка.':reverse?'Выбери китайское слово для этого перевода.':'Посмотри на слово и выбери перевод по-русски.')+(reverse?`<div class="question-ru">${esc(item.ru)}</div>`:wordDisplay(item))+`<button class="text-button" id="question-audio">${icon('volume')}Послушать слово</button><div class="options ${s.mode==='balloons'?'balloons-options':''}">${options.map(w=>`<button class="option ${s.mode==='balloons'?'balloon-option':''}" data-answer="${esc(w.hz)}">${reverse?`<span class="hz" lang="zh-CN">${esc(w.hz)}</span><span class="py">${esc(w.py)}</span>`:esc(w.ru)}</button>`).join('')}</div>`;
    }
    $('question-audio').onclick=()=>Speech.speak(item.hz);
    arena.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{const correct=b.dataset.answer===item.hz;if(recordQuestion(correct,item,'')){markOption(b,correct,item.hz);if(s.mode==='penalty')$('session-feedback').querySelector('b').textContent=correct?'Точно! Слово узнано.':'Посмотри подсказку — попробуем следующее.'}}));
  }
  function renderCards(w){
    const arena=$('exercise-arena');session.revealed=false;
    arena.innerHTML=heading('Познакомься со словом','Послушай, скажи вслух, затем открой перевод.')+`<button class="flashcard" id="flip-card" aria-label="Открыть перевод" aria-expanded="false">${wordDisplay(w)}<div class="ru" id="card-translation" hidden>${esc(w.ru)}</div><div class="card-prompt" id="card-prompt">Нажми, чтобы открыть перевод</div></button><button class="btn btn-light" id="card-audio">${icon('volume')}Послушать</button><div class="exercise-buttons"><button class="btn btn-outline" id="card-again" disabled>Ещё повторю</button><button class="btn" id="card-known" disabled>Помню это слово ${icon('check')}</button></div>`;
    $('flip-card').onclick=()=>{session.revealed=true;$('card-translation').hidden=false;$('card-prompt').textContent='Проговори слово вслух.';$('flip-card').setAttribute('aria-expanded','true');$('card-again').disabled=false;$('card-known').disabled=false};
    $('card-audio').onclick=()=>Speech.speak(w.hz);
    function next(known){if(session.locked||!session.revealed)return;session.locked=true;session.attempts++;if(known){session.correct++;const stat=progress.words[w.hz]||{correct:0,wrong:0,weak:false,streak:0};stat.selfKnown=true;progress.words[w.hz]=stat}else{const stat=progress.words[w.hz]||{correct:0,wrong:0,weak:false,streak:0};stat.weak=true;stat.selfKnown=false;progress.words[w.hz]=stat;if(!session.mistakes.some(x=>x.hz===w.hz))session.mistakes.push(w)}if(!progress.days.includes(day()))progress.days.push(day());save();session.index++;renderQuestion()}
    $('card-known').onclick=()=>next(true);$('card-again').onclick=()=>next(false);
  }
  function grammarInfo(){return session.generalGrammar?'В этой теме пока нет отдельных фраз. Повторим базовые фразы для диалога.':'Фразы по выбранной теме. Перевод поможет проверить смысл.'}
  function renderSentence(q){
    const arena=$('exercise-arena');const tokens=shuffle(q.tokens.map((text,id)=>({text,id})));let chosen=[];
    arena.innerHTML=heading('Собери фразу',grammarInfo())+`<div class="question-ru">${esc(q.ru)}</div><div class="sentence-answer" id="sentence-answer" aria-label="Твоя фраза"></div><div class="token-bank" id="token-bank" aria-label="Слова для фразы"></div><button class="text-button" id="sentence-reset">Начать фразу заново</button><br><button class="btn sentence-check" id="sentence-check" disabled>Проверить фразу</button>`;
    function render(){
      $('sentence-answer').innerHTML=chosen.length?chosen.map(id=>`<button class="token" data-remove="${id}" aria-label="Убрать ${esc(q.tokens[id])}">${esc(q.tokens[id])}</button>`).join(''):'<span class="sentence-empty">Нажимай на слова снизу — они появятся здесь</span>';
      $('token-bank').innerHTML=tokens.filter(t=>!chosen.includes(t.id)).map(t=>`<button class="token" data-token="${t.id}" lang="zh-CN">${esc(t.text)}</button>`).join('');
      $('sentence-check').disabled=chosen.length!==q.tokens.length;
      $('token-bank').querySelectorAll('button').forEach(b=>b.onclick=()=>{chosen.push(Number(b.dataset.token));render()});
      $('sentence-answer').querySelectorAll('button').forEach(b=>b.onclick=()=>{chosen=chosen.filter(n=>n!==Number(b.dataset.remove));render()});
    }
    render();$('sentence-reset').onclick=()=>{if(session.locked)return;chosen=[];render()};
    $('sentence-check').onclick=()=>{const correct=sameSentence(chosen.map(id=>q.tokens[id]),q.tokens);if(recordQuestion(correct,null,q.tokens.join('')+' — '+q.ru+' '+q.rule)){$('sentence-reset').disabled=true;if(correct)Speech.speak(q.tokens.join(''))}};
  }
  function renderGap(q){
    const arena=$('exercise-arena'),correct=q.tokens[q.blank];
    arena.innerHTML=heading('Какое слово пропало?',grammarInfo())+`<div class="question-ru">${esc(q.ru)}</div><div class="gap-sentence" lang="zh-CN">${q.tokens.map((t,i)=>i===q.blank?'<span class="gap">?</span>':esc(t)).join(' ')}</div><div class="options">${shuffle(q.choices).map(t=>`<button class="option" data-answer="${esc(t)}"><span class="hz" lang="zh-CN">${esc(t)}</span></button>`).join('')}</div>`;
    arena.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const ok=b.dataset.answer===correct;if(recordQuestion(ok,null,q.tokens.join('')+' — '+q.ru+' '+q.rule))markOption(b,ok,correct)});
  }
  function renderTraps(q){
    const arena=$('exercise-arena'),w=q.word,pair=normalizeWords(q.trap.w);
    arena.innerHTML=heading('Не попадись в ловушку',session.generalTraps?'Повторяем персональные ловушки Леры из разных тем.':'Похожие слова из этой темы: сначала смысл, потом внимательный выбор.')+`<div class="question-ru">${esc(w.ru)}</div><div class="options">${shuffle(pair).map(x=>`<button class="option" data-answer="${esc(x.hz)}"><span class="hz" lang="zh-CN">${esc(x.hz)}</span><span class="py">${esc(x.py)}</span></button>`).join('')}</div>`;
    arena.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const correct=b.dataset.answer===w.hz;if(recordQuestion(correct,w,q.trap.note))markOption(b,correct,w.hz)});
  }
  function audioGate(render){
    const s=session;const token=s.id;
    Speech.ready().then(ok=>{if(session?.id!==token)return;if(ok)render();else{
      $('exercise-arena').innerHTML=heading('Сначала включим звук','Для этого задания нужен китайский голос.')+`<div class="audio-unavailable"><b>Китайская озвучка пока недоступна</b><p>Выберите голос в верхней панели и нажмите «Проверить звук». Если голоса нет, можно открыть сайт в Edge. Карточки и игры с текстом доступны сейчас.</p><button class="btn btn-outline" id="audio-retry">Проверить ещё раз</button> <button class="btn" id="audio-cards">К карточкам</button></div>`;
      $('audio-retry').onclick=()=>audioGate(render);$('audio-cards').onclick=()=>launch(s.topic.id,'cards');
    }});
  }
  function renderListening(w){audioGate(()=>{
    const arena=$('exercise-arena'),s=session;let heard=false;
    arena.innerHTML=heading('Слушаем и узнаём','Нажми на звук. Сначала слушай — затем выбирай перевод.')+`<button class="big-sound" id="listen-audio" aria-label="Послушать китайское слово">${icon('volume')}</button><p class="audio-progress" id="audio-progress">Нажми, чтобы послушать</p><div class="options">${optionsFor(w,s.pool,allWords,4,true).map(x=>`<button class="option" data-answer="${esc(x.hz)}" disabled>${esc(x.ru)}</button>`).join('')}</div>`;
    $('listen-audio').onclick=async()=>{
      $('audio-progress').textContent='Слушаем…';const ok=await Speech.speak(w.hz);if(session!==s)return;
      if(ok){heard=true;$('audio-progress').textContent='Можно ответить или послушать ещё раз.';if(!s.locked)arena.querySelectorAll('[data-answer]').forEach(b=>b.disabled=false)}else{$('audio-progress').textContent='Звук не запустился. Выбери другой голос сверху.'}
    };
    arena.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(!heard)return;const correct=b.dataset.answer===w.hz;if(recordQuestion(correct,w,''))markOption(b,correct,w.hz)});
  })}
  function renderTones(w){audioGate(()=>{
    const arena=$('exercise-arena'),s=session;let heard=false;
    const toneLabels=[['—','1-й тон','Ровный'],['↗','2-й тон','Вверх'],['∨','3-й тон','Ямка'],['↘','4-й тон','Вниз']];
    arena.innerHTML=heading('Кунг-фу тонов','Тренируем один слог отдельно. Слушай направление голоса — знак и пиньинь пока спрятаны.')+`<button class="big-sound" id="tone-audio" aria-label="Послушать слог">${icon('volume')}</button><p class="audio-progress" id="audio-progress">Нажми, чтобы послушать</p><div class="options tone-options">${toneLabels.map((t,i)=>`<button class="option" data-answer="${i+1}" disabled><span class="tone-symbol">${t[0]}</span><span class="tone-name">${t[1]}<small>${t[2]}</small></span></button>`).join('')}</div>`;
    $('tone-audio').onclick=async()=>{const ok=await Speech.speak(w.hz);if(session!==s)return;heard=heard||ok;$('audio-progress').textContent=ok?'Как двигался голос?':'Звук не запустился. Выбери другой голос сверху.';if(heard&&!s.locked)arena.querySelectorAll('[data-answer]').forEach(b=>b.disabled=false)};
    arena.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(!heard)return;const correct=Number(b.dataset.answer)===w.tone;if(recordQuestion(correct,null,w.hz+' · '+w.py+' — '+w.tone+'-й тон: '+toneLabels[w.tone-1][2].toLowerCase()+'.'))markOption(b,correct,String(w.tone))});
  })}
  function renderMemory(){
    const s=session;s.matched=0;s.moves=0;s.flipped=[];s.waiting=false;setSessionMeta();
    const seenMeanings=new Set();const words=shuffle(s.pool).filter(w=>{const keys=meanings(w.ru);if(keys.some(k=>seenMeanings.has(k)))return false;keys.forEach(k=>seenMeanings.add(k));return true}).slice(0,s.total);s.total=words.length;setSessionMeta();const cards=shuffle(words.flatMap(w=>[{word:w,side:'zh'},{word:w,side:'ru'}]));
    $('exercise-arena').innerHTML=heading('Найди пару','Соедини китайское слово и его перевод. Можно слушать открытые китайские карточки.')+`<div class="memory-board">${cards.map((c,i)=>`<button class="memory-tile" data-memory="${i}" aria-label="Закрытая карточка ${i+1}" aria-pressed="false">${icon('cards')}</button>`).join('')}</div><p class="memory-count" id="memory-count">0 из ${s.total} пар · 0 попыток</p>`;
    const buttons=[...$('exercise-arena').querySelectorAll('[data-memory]')];
    function content(i){const c=cards[i];return c.side==='zh'?`<span class="hz" lang="zh-CN">${esc(c.word.hz)}</span><span class="py">${esc(c.word.py)}</span>`:`<span class="ru">${esc(c.word.ru)}</span>`}
    buttons.forEach((b,i)=>b.onclick=()=>{
      if(session!==s||s.done||s.waiting||b.disabled||s.flipped.includes(i))return;
      b.classList.add('flipped');b.innerHTML=content(i);b.setAttribute('aria-label',cards[i].side==='zh'?cards[i].word.hz:cards[i].word.ru);b.setAttribute('aria-pressed','true');s.flipped.push(i);if(cards[i].side==='zh')Speech.speak(cards[i].word.hz);
      if(s.flipped.length!==2)return;
      const [a,z]=s.flipped;s.moves++;const correct=cards[a].word.hz===cards[z].word.hz&&cards[a].side!==cards[z].side;
      if(correct){[a,z].forEach(n=>{buttons[n].classList.add('matched');buttons[n].disabled=true});s.matched++;s.correct++;s.attempts++;mark(cards[a].word,true);s.flipped=[];setSessionMeta();if(s.matched===s.total){s.delay=setTimeout(()=>{if(session===s)finish()},550)}}
      else{s.waiting=true;s.attempts++;mark(cards[a].word,false);mark(cards[z].word,false);[cards[a].word,cards[z].word].forEach(w=>{if(!s.mistakes.some(x=>x.hz===w.hz))s.mistakes.push(w)});s.delay=setTimeout(()=>{if(session!==s)return;[a,z].forEach(n=>{buttons[n].classList.remove('flipped');buttons[n].innerHTML=icon('cards');buttons[n].setAttribute('aria-label','Закрытая карточка '+(n+1));buttons[n].setAttribute('aria-pressed','false')});s.flipped=[];s.waiting=false},950)}
      $('memory-count').textContent=s.matched+' из '+s.total+' пар · '+s.moves+' попыток';
    });
  }
  function renderSprintStart(){
    const arena=$('exercise-arena');$('session-count').textContent='60 секунд';$('session-track-fill').style.width='0%';
    arena.innerHTML=heading('Минутка скорости','Посмотри на слово и перевод. Верно они соединены или нет? Можно остановиться в любой момент.')+`<div class="result-emblem">${icon('clock')}</div><p class="instruction">Время идёт только после нажатия. При уходе с вкладки таймер встанет на паузу.</p><button class="btn" id="sprint-start">Начать 60 секунд ${icon('play')}</button>`;
    $('sprint-start').onclick=()=>{session.remaining=60000;session.deadline=Date.now()+60000;session.paused=false;session.timer=setInterval(tickSprint,200);sprintQuestion()};
  }
  function tickSprint(){const s=session;if(!s||s.mode!=='sprint'||s.done||s.paused)return;s.remaining=Math.max(0,s.deadline-Date.now());if($('sprint-seconds'))$('sprint-seconds').textContent=Math.ceil(s.remaining/1000);$('session-track-fill').style.width=(1-s.remaining/60000)*100+'%';if(s.remaining<=0)finish()}
  function sprintQuestion(){
    const s=session;if(!s||s.done)return;s.locked=false;$('session-feedback').hidden=true;$('session-next').hidden=true;
    const w=shuffle(s.pool)[0],truth=Math.random()<.5;const falseOptions=allWords.filter(x=>!meanings(x.ru).some(k=>meanings(w.ru).includes(k)));const shown=truth?w.ru:shuffle(falseOptions)[0].ru;
    s.sprintQuestion={word:w,truth};
    $('exercise-arena').innerHTML=heading('Верный перевод?',s.paused?'Пауза. Вернись на вкладку, когда будешь готов.':'Отвечай спокойно. Каждый ответ — новая попытка.')+`<div class="sprint-clock">${icon('clock')}<span id="sprint-seconds">${Math.ceil(s.remaining/1000)}</span> с</div>${wordDisplay(w)}<div class="question-ru">${esc(shown)}</div><div class="options"><button class="option" data-truth="false">Нет, другой перевод</button><button class="option" data-truth="true">Да, верно</button></div><p class="memory-count">Верных ответов: ${s.correct}</p>`;
    $('exercise-arena').querySelectorAll('[data-truth]').forEach(b=>b.onclick=()=>{
      if(s.locked||s.paused||s.done)return;s.locked=true;const correct=(b.dataset.truth==='true')===truth;s.attempts++;if(correct)s.correct++;else if(!s.mistakes.some(x=>x.hz===w.hz))s.mistakes.push(w);mark(w,correct);
      $('exercise-arena').querySelectorAll('[data-truth]').forEach(x=>x.disabled=true);
      const feedback=$('session-feedback');feedback.className='feedback'+(correct?'':' bad');feedback.innerHTML=icon(correct?'check':'spark')+'<div><b>'+ (correct?'Верно!':'Запомним правильный перевод:')+'</b>'+esc(w.hz+' · '+w.py+' — '+w.ru)+'</div>';feedback.hidden=false;
      s.delay=setTimeout(()=>{if(session===s&&!s.done)sprintQuestion()},correct?650:1600);
    });
  }
  function finish(){
    const s=session;if(!s||s.done)return;s.done=true;s.locked=true;clearInterval(s.timer);clearTimeout(s.delay);Speech.stop();
    progress.completedRounds=(progress.completedRounds||progress.rounds.length)+1;progress.rounds.push({mode:MODES.find(m=>m.id===s.mode).short,topic:s.review?'Сложные слова':s.topic.title,correct:s.correct,total:s.mode==='memory'?s.total:s.attempts,time:Date.now(),kind:s.mode});progress.rounds=progress.rounds.slice(-100);save();
    $('session-feedback').hidden=true;$('session-next').hidden=true;$('session-track-fill').style.width='100%';$('session-count').textContent='Раунд завершён';$('show-pinyin').closest('label').hidden=true;
    const needReview=s.mistakes.filter(w=>progress.words[w.hz]?.weak);const nextMission=s.mission&&missionQueue.length?missionQueue[0]:null;
    const resultLabel=s.mode==='cards'?'слов ты отметил как знакомые':s.mode==='memory'?'пар найдено':'верных ответов';
    $('exercise-arena').innerHTML=`<div class="result-card"><div class="result-emblem">${icon(s.correct?'spark':'flag')}</div><h1 id="exercise-title">${s.mode==='memory'?'Все пары на месте!':'Ещё один маленький шаг!'}</h1><div class="result-number">${s.correct} / ${s.mode==='memory'?s.total:s.attempts}</div><p class="result-subtitle">${resultLabel}. ${s.mode==='cards'?'Это твоя отметка; проверить себя можно в заданиях.':'Ошибки помогают понять, что повторить.'}</p>${needReview.length?'<div class="mistake-list"><b>Повторим без спешки:</b><br>'+needReview.map(w=>esc(w.hz+' · '+w.py+' — '+w.ru)).join('<br>')+'</div>':''}<div class="result-actions">${nextMission?`<button class="btn" id="mission-next">Дальше: ${esc(MODES.find(m=>m.id===nextMission).short)} ${icon('arrow')}</button>`:''}<button class="btn ${nextMission?'btn-outline':''}" id="round-again">Ещё раунд</button>${needReview.length?'<button class="btn btn-light" id="round-review">Повторить сложные</button>':''}<button class="btn btn-outline" id="round-back">Выбрать занятие</button></div></div>`;
    $('round-again').onclick=()=>launch(s.topic.id,s.mode,{review:s.review});$('round-back').onclick=()=>location.hash='topic/'+s.topic.id;
    if($('round-review'))$('round-review').onclick=()=>launch(s.topic.id,'cards',{review:true});
    if($('mission-next'))$('mission-next').onclick=async()=>{let mode=missionQueue.shift();if(mode==='listen'&&!await Speech.ready())mode='choice';launch(s.topic.id,mode,{mission:true})};
  }
  $('session-next').onclick=()=>{if(!session||!session.locked||session.done)return;session.index++;renderQuestion()};
  $('session-exit').onclick=()=>{if(session?.mode==='sprint'&&!session.done&&session.attempts){finish()}else location.hash=lastRoute||'topic/'+selectedTopic};
  $('show-pinyin').addEventListener('change',e=>$('exercise-arena').classList.toggle('no-pinyin',!e.target.checked));
  document.addEventListener('visibilitychange',()=>{const s=session;if(s?.mode==='sprint'&&s.timer&&!s.done){if(document.hidden){s.remaining=Math.max(0,s.deadline-Date.now());s.paused=true;Speech.stop()}else{s.deadline=Date.now()+s.remaining;s.paused=false;tickSprint()}}});

  async function loadStrokes(){if(!strokePromise)strokePromise=fetch('data/hanzi-strokes.json').then(r=>{if(!r.ok)throw Error('stroke load');return r.json()}).catch(e=>{strokePromise=null;throw e});return strokePromise}
  async function renderWriting(){
    setView('writing-view');$('breadcrumb-current').textContent='Пишем иероглифы';topicOptions($('writing-topic'));
    const topic=getTopic(selectedTopic);$('writing-word').replaceChildren();topic.words.forEach(w=>$('writing-word').add(new Option(w.hz+' · '+w.py+' — '+w.ru,w.hz)));
    try{writingData=await loadStrokes();if($('writing-view').hidden)return;const current=getTopic(selectedTopic);if(!current.words.some(w=>w.hz===$('writing-word').value))return;chooseWritingWord($('writing-word').value)}catch{$('writing-status').textContent='Не удалось загрузить порядок черт. Проверьте интернет и выберите тему ещё раз.'}
  }
  function chooseWritingWord(hz){
    writer?.cancelQuiz();writer?.pauseAnimation();writingWord=wordMap.get(hz)||getTopic(selectedTopic).words.find(w=>w.hz===hz);
    writingChars=[...new Set([...hz].filter(c=>writingData[c]))];
    $('char-chips').innerHTML=writingChars.map(c=>`<button data-char="${esc(c)}" lang="zh-CN" aria-label="Писать ${esc(c)}">${esc(c)}</button>`).join('');
    $('char-chips').querySelectorAll('button').forEach(b=>b.onclick=()=>chooseCharacter(b.dataset.char));
    if(writingChars.length)chooseCharacter(writingChars[0]);else{$('writer-target').replaceChildren();$('writing-status').textContent='Для этого слова пока нет схемы черт. Выбери другое слово.'}
  }
  function writingControls(disabled){['writing-animate','writing-quiz','writing-stroke'].forEach(id=>$(id).disabled=disabled);writingBusy=disabled}
  function chooseCharacter(char){
    const epoch=++writingEpoch;writer?.cancelQuiz();writer?.pauseAnimation();writingChar=char;strokeCursor=0;$('writer-target').replaceChildren();
    $('char-chips').querySelectorAll('button').forEach(b=>{const active=b.dataset.char===char;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
    writingControls(false);const size=Math.min(280,$('writer-grid').clientWidth);$('writer-grid').style.height=size+'px';
    if(!window.HanziWriter){$('writing-status').textContent='Не удалось запустить показ иероглифа. Обновите страницу.';writingControls(true);return}
    writer=window.HanziWriter.create('writer-target',char,{width:size,height:size,padding:22,strokeColor:'#27634e',radicalColor:'#b78a3c',outlineColor:'#e0ded1',drawingColor:'#365a42',highlightColor:'#c89a4b',strokeAnimationSpeed:.65,delayBetweenStrokes:450,showCharacter:true,showOutline:true,charDataLoader:()=>writingData[char],onLoadCharDataSuccess:()=>{if(epoch===writingEpoch)$('writing-status').textContent=char+' · '+quantity(writingData[char].strokes.length,'черта','черты','черт')+'. Посмотри порядок или попробуй написать.'},onLoadCharDataError:()=>{if(epoch===writingEpoch){$('writing-status').textContent='Не удалось открыть этот иероглиф. Выбери другой.';writingControls(true)}}});
    $('writer-target').setAttribute('aria-label','Иероглиф '+char+' · поле для обводки');
  }
  $('writing-animate').onclick=async()=>{
    if(!writer||writingBusy)return;const epoch=writingEpoch;writer.cancelQuiz();writingControls(true);$('writing-status').textContent='Смотри, как кисть рисует '+writingChar+' по порядку.';
    try{await writer.animateCharacter();if(epoch===writingEpoch)$('writing-status').textContent='Теперь твоя очередь. Нажми «Попробовать самому».'}finally{if(epoch===writingEpoch)writingControls(false)}
  };
  $('writing-stroke').onclick=async()=>{
    if(!writer||writingBusy)return;const epoch=writingEpoch;writer.cancelQuiz();writingControls(true);const index=strokeCursor;const count=writingData[writingChar].strokes.length;
    if(index===0)await writer.hideCharacter();
    $('writing-status').textContent='Черта '+(index+1)+' из '+count+'. Следи за направлением кисти.';
    try{await writer.animateStroke(index);strokeCursor=(index+1)%count}finally{if(epoch===writingEpoch)writingControls(false)}
  };
  $('writing-quiz').onclick=()=>{
    if(!writer||writingBusy)return;const epoch=writingEpoch,char=writingChar;strokeCursor=0;writer.cancelQuiz();
    $('writing-status').textContent='Обведи '+char+' по порядку. Подсказка появится после двух попыток.';
    writer.quiz({showHintAfterMisses:2,acceptBackwardsStrokes:false,onCorrectStroke:d=>{if(epoch!==writingEpoch)return;$('writing-status').textContent='Отлично! Осталось черт: '+d.strokesRemaining+'.'},onMistake:()=>{if(epoch===writingEpoch)$('writing-status').textContent='Попробуй ещё раз: посмотри, где начинается и куда идёт черта.'},onComplete:d=>{if(epoch!==writingEpoch)return;progress.writing[char]=(progress.writing[char]||0)+1;if(!progress.days.includes(day()))progress.days.push(day());save();$('writing-status').textContent='Получилось! '+char+' написан по порядку. Попробуй ещё раз или выбери следующий иероглиф.'}});
  };
  $('writing-speak').onclick=()=>writingWord&&Speech.speak(writingWord.hz);
  $('writing-word').onchange=e=>chooseWritingWord(e.target.value);
  $('writing-topic').onchange=e=>{selectedTopic=e.target.value;renderWriting()};
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!$('writing-view').hidden&&writingChar&&writingData)chooseCharacter(writingChar)},200)});

  let helperOpener=null;document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>{helperOpener=b;$('help-dialog').showModal()});$('help-close').onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('close',()=>helperOpener?.focus());
  $('game-topic').onchange=e=>{selectedTopic=e.target.value;renderGames()};
  $('topic-search').addEventListener('input',renderTopics);
  $('review-start').onclick=()=>launch(selectedTopic,'cards',{review:true});
  $('start-mission').onclick=()=>{missionQueue=['listen','memory'];launch('transport','cards',{mission:true})};
  async function init(){
    $('load-error').hidden=true;$('app-loading').hidden=false;
    try{
      const response=await fetch('data/lera.json');if(!response.ok)throw Error('dictionary');data=await response.json();data.topics=data.topics.map(t=>({...t,t:t.t||t.title,cn:t.cn||t.title_cn,w:t.w||t.words}));data.traps=(data.traps||[]).map(t=>({...t,t:t.t||t.group,w:t.w||t.words,note:t.note||'Посмотри на звучание и перевод каждого слова.'}));
      if(!Array.isArray(data.topics)||!data.topics.length)throw Error('empty');
      topics=data.topics.map(t=>({id:t.id,title:t.t,cn:t.cn,em:t.em||'📖',lesson:t.lesson,words:normalizeWords(t.w)}));allWords=normalizeWords(data.topics.flatMap(t=>t.w));wordMap=new Map(allWords.map(w=>[w.hz,w]));
      $('topic-total').textContent=topics.length+' тем · '+wordsCount(allWords.length);
      function initCategory(){buildFilters($('category-filters'),categories,category,value=>{category=value;initCategory();renderTopics()});renderTopics()}
      initCategory();$('app-loading').hidden=true;save();route();
    }catch(error){$('app-loading').hidden=true;$('load-error').hidden=false;console.error('Practice dictionary could not load',error)}
  }
  $('reload-data').onclick=init;window.addEventListener('hashchange',route);window.addEventListener('pagehide',()=>{cleanupSession();writer?.cancelQuiz();writer?.pauseAnimation()});init();
})();

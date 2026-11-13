'use strict';

const byId = id => document.getElementById(id);
const themes = [
  ['Дорога и поездки', 'От дома до вокзала'],
  ['Связки и диалоги', 'Говорилка 2.0'],
  ['Планы и сравнения', 'Говорилка 3.0'],
];
const words = JSON.parse(byId('word-data').textContent).flatMap(([, entries], group) =>
  entries.map(([zh, py, ru, example, help]) => ({group, zh, py, ru, example, help}))
);
const reviewKey = 'lera.homework.2026-11-18.review';
const stampKey = 'lera.homework.2026-11-18.stamps';
const saved = readSet(reviewKey);
const stamps = readSet(stampKey);
const chinese = 'zh-CN';
let deck = [];
let position = 0;
let roundMisses = new Set();
let roundGroups = [];
let answered = false;
let correctCount = 0;
let item;
let mode;
let run = 0;
let pairRound;
const modes = [
  {name:'Значение', title:'Что значит это слово?', prompt:'Выбери перевод.', key:'ru', word:w=>w.zh, hint:w=>w.py, lang:chinese},
  {name:'Аудирование', title:'Что ты услышала?', prompt:'Прослушай слово и найди его на табло.', key:'zh', word:()=> '♪', hint:w=>w.py, lang:'ru'},
  {name:'Реплика', title:'Вставь слово в реплику', prompt:'Подбери слово по смыслу. Подсказка уточнит, что хотела сказать героиня.', key:'zh', word:w=>w.example.replace(w.zh,'＿＿'), hint:w=>w.ru, lang:chinese},
  {name:'Перевод', title:'Как сказать по-китайски?', prompt:'Найди нужное слово на китайском.', key:'zh', word:w=>w.ru, hint:w=>w.py, lang:'ru'},
];

function readSet(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(value)) return new Set(value);
  } catch {}
  return new Set();
}

function saveSet(key, values) {
  try { localStorage.setItem(key, JSON.stringify([...values])); } catch {}
}

function shuffled(items) {
  const copy = [...items];
  for (let i=copy.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]] = [copy[j],copy[i]];
  }
  return copy;
}

function element(tag, content, className = '') {
  const node = document.createElement(tag);
  node.textContent = content;
  node.className = className;
  return node;
}

function button(label, handler, className) {
  const node = element('button', label, className);
  node.type = 'button';
  node.addEventListener('click',handler);
  return node;
}

function show(panel) {
  for (const name of ['start','round','end']) byId(name+'-panel').hidden = panel !== name;
}

function nextStop() {
  return themes.findIndex((_, group)=>!stamps.has(group));
}

function startStop(group) {
  start(words.filter(w=>w.group===group),[group]);
}

function paintStops() {
  const pass = themes.map(([title, source], group)=>{
    const earned = stamps.has(group);
    const seal = element('span',earned?'✓':String(group+1),earned?'earned':'');
    seal.title = title + (earned?' · штамп получен':' · ждёт прохождения');
    return seal;
  });
  byId('passport').replaceChildren(...pass);
  byId('stamp-count').textContent = pass.filter((_,group)=>stamps.has(group)).length+' из 3 штампов';
  const stops = themes.map(([title, source],group)=>{
    const stop = button('',()=>startStop(group),'stop');
    const earned = stamps.has(group);
    stop.dataset.earned = String(earned);
    const picture = element('span','','stop-art');
    picture.setAttribute('aria-hidden','true');
    const detail = element('span','','stop-body');
    detail.append(element('small',source),element('strong',title),
      element('small',earned?'✓ Штамп получен':words.filter(w=>w.group===group).length+' слов','stop-status'));
    stop.append(picture,detail);
    return stop;
  });
  byId('groups').replaceChildren(...stops);
  const count = words.filter(w=>saved.has(w.zh)).length;
  byId('review-saved').disabled = count===0;
  byId('review-caption').textContent = count ? 'Слов на повторение: '+count : 'Здесь появятся слова, на которых ты ошиблась';
  byId('start-next').firstChild.textContent = nextStop()<0 ? 'Пройти ещё раз ' : stamps.size ? 'Продолжить путешествие ' : 'Начать путешествие ';
}

function paintRail(group) {
  byId('rail-stops').replaceChildren(...themes.map(([title],index)=>{
    const stop = element('div','','rail-stop');
    stop.title = title;
    if (index===group) stop.setAttribute('aria-current','step');
    stop.append(element('span',stamps.has(index)?'✓':String(index+1)),element('b',title));
    return stop;
  }));
}

function openRound() {
  run++;
  roundMisses = new Set();
  correctCount = 0;
  show('round');
  window.scrollTo(0,0);
}

function home() {
  run++;
  window.LearningSpeech.stop();
  show('start');
  paintStops();
  window.scrollTo(0,0);
  byId('start-next').focus({preventScroll:true});
}

function start(entries, groups = []) {
  if (!entries.length) return;
  deck = shuffled(entries);
  position = 0;
  pairRound = null;
  roundGroups = groups;
  openRound();
  draw();
}

function setProgress(done,total,label,showNext=false) {
  byId('counter').textContent = label;
  byId('progress').max = total;
  byId('progress').value = done;
  byId('next').hidden = !showNext;
}

function clearFeedback() {
  byId('feedback').textContent = '';
  byId('example').hidden = true;
  byId('audio-status').hidden = true;
  byId('next').hidden = true;
}

function draw() {
  item = deck[position];
  mode = modes[position % modes.length];
  answered = false;
  paintRail(item.group);
  byId('group-name').textContent = themes[item.group][0];
  setProgress(position,deck.length,(position+1)+' из '+deck.length);
  byId('mode-label').textContent = mode.name;
  byId('question').textContent = mode.title;
  byId('prompt').textContent = mode.prompt;
  byId('word-card').hidden = false;
  byId('word-card').dataset.mode = ['meaning','listen','gap','reverse'][position % modes.length];
  byId('word').textContent = mode.word(item);
  byId('word').lang = mode.lang;
  byId('listen').hidden = mode===modes[2] || mode===modes[3];
  byId('hint').textContent = mode===modes[2]?'Подсказка по смыслу':'Показать пиньинь';
  byId('hint').setAttribute('aria-expanded','false');
  byId('pinyin').textContent = mode.hint(item);
  byId('pinyin').lang = mode===modes[2]?'ru':'zh-Latn';
  byId('pinyin').hidden = true;
  byId('pair-board').hidden = true;
  byId('answers').hidden = false;
  clearFeedback();

  const pool = shuffled(words.filter(w=>w.group===item.group && w[mode.key]!==item[mode.key]));
  const options = shuffled([item,...pool.slice(0,2)]);
  byId('answers').replaceChildren(...options.map(option=>{
    const choice = button(option[mode.key],()=>answer(option,options),'choice');
    choice.lang = mode.key==='zh'?chinese:'ru';
    return choice;
  }));
  byId('question').focus({preventScroll:true});
}

function record(word,correct) {
  if (correct) saved.delete(word.zh);
  else {
    roundMisses.add(word.zh);
    saved.add(word.zh);
  }
  saveSet(reviewKey,saved);
}

function answer(choice, options) {
  if (answered) return;
  answered = true;
  const correct = choice===item;
  if (correct) correctCount++;
  record(item,correct);
  [...byId('answers').children].forEach((node,index)=>{
    node.disabled = true;
    if (options[index]===item) node.classList.add('correct');
    else if (options[index]===choice) node.classList.add('incorrect');
  });
  setProgress(position+1,deck.length,(position+1)+' из '+deck.length,true);
  byId('next').textContent = position+1===deck.length?'Посмотреть результат →':'Дальше →';
  byId('feedback').textContent = (correct?'Верно! ':'Добавим на повтор. ')+item.zh+' · '+item.py+' · '+item.ru;
  byId('example-zh').textContent = item.example;
  byId('example-help').textContent = item.help;
  byId('example-help').lang = item.group===0?'ru':'zh-Latn';
  byId('example').hidden = false;
  byId('next').focus();
}

function startPairs() {
  const priority = shuffled(words.filter(w=>saved.has(w.zh)));
  const others = shuffled(words.filter(w=>!saved.has(w.zh)));
  const entries = [...priority,...others].slice(0,5);
  deck = entries;
  roundGroups = [];
  pairRound = {selected:null, matched:new Set(), wrong:new Set(), previousError:[]};
  openRound();
  paintRail(-1);
  byId('group-name').textContent = 'Дополнительная игра';
  byId('mode-label').textContent = 'Найди пару';
  byId('question').textContent = 'Соедини слова с переводами';
  byId('prompt').textContent = 'Нажми слово слева, затем его перевод справа.';
  byId('word-card').hidden = true;
  byId('answers').hidden = true;
  byId('pair-board').hidden = false;
  clearFeedback();
  setProgress(0,entries.length,'0 из '+entries.length+' пар');
  byId('pair-words').replaceChildren(...shuffled(entries).map(word=>{
    const node = button(word.zh,()=>{
      pairRound.selected?.node.setAttribute('aria-pressed','false');
      pairRound.previousError.forEach(mark=>mark.classList.remove('incorrect'));
      pairRound.selected = {word,node};
      node.setAttribute('aria-pressed','true');
      byId('feedback').textContent = 'Теперь выбери перевод.';
    },'pair-choice');
    node.lang = chinese;
    node.setAttribute('aria-pressed','false');
    return node;
  }));
  byId('pair-translations').replaceChildren(...shuffled(entries).map(word=>{
    const node = button(word.ru,()=>matchPair(word,node),'pair-choice');
    return node;
  }));
  byId('question').focus({preventScroll:true});
}

function matchPair(word,node) {
  const selected = pairRound.selected;
  if (!selected) {
    byId('feedback').textContent = 'Сначала выбери китайское слово слева.';
    return;
  }
  pairRound.previousError.forEach(mark=>mark.classList.remove('incorrect'));
  if (selected.word!==word) {
    pairRound.wrong.add(selected.word);
    record(selected.word,false);
    pairRound.previousError = [selected.node,node];
    pairRound.previousError.forEach(mark=>mark.classList.add('incorrect'));
    byId('feedback').textContent = 'Попробуй другой перевод для этого слова.';
    return;
  }
  if (!pairRound.wrong.has(word)) {
    correctCount++;
    record(word,true);
  }
  pairRound.matched.add(word);
  pairRound.selected = null;
  selected.node.setAttribute('aria-pressed','false');
  [selected.node,node].forEach(mark=>{
    mark.disabled = true;
    mark.classList.add('correct');
  });
  const done = pairRound.matched.size;
  const complete = done===deck.length;
  setProgress(done,deck.length,done+' из '+deck.length+' пар',complete);
  byId('feedback').textContent = 'Пара найдена! '+word.zh+' · '+word.py;
  if (complete) {
    byId('next').textContent = 'Посмотреть результат →';
    byId('next').focus();
  } else {
    [...byId('pair-words').children].find(mark=>!mark.disabled)?.focus();
  }
}

function finish() {
  const newStamps = roundGroups.filter(group=>!stamps.has(group));
  newStamps.forEach(group=>stamps.add(group));
  saveSet(stampKey,stamps);
  byId('end-stamp').textContent = newStamps.length
    ? 'Штампы: '+newStamps.map(group=>themes[group][0]).join(', ')
    : 'Билет: '+themes.filter((_,group)=>stamps.has(group)).length+' из 3 штампов';
  byId('end-title').textContent = pairRound?'Все пары найдены!':nextStop()<0?'Ты добралась до вокзала!':'Остановка пройдена!';
  const metric = pairRound?'Пар с первой попытки: ':'Верных ответов: ';
  byId('result').textContent = metric+correctCount+' из '+deck.length+'. '+
    (roundMisses.size?'Сложные слова ждут тебя в коротком раунде.':'Отличная работа!');
  byId('review-list').replaceChildren(...words.filter(w=>roundMisses.has(w.zh)).map(w=>element('li',w.zh+' · '+w.py+' · '+w.ru)));
  byId('review-missed').hidden = roundMisses.size===0;
  byId('continue-route').hidden = nextStop()<0;
  show('end');
  window.scrollTo(0,0);
  byId('end-title').focus({preventScroll:true});
}

async function listen(value) {
  const currentRun = run, currentQuestion = position;
  const ok = await window.LearningSpeech.speak(value);
  if (run!==currentRun || position!==currentQuestion || byId('round-panel').hidden) return;
  byId('audio-status').textContent = 'Китайский голос недоступен в этом браузере. Можно открыть пиньинь.';
  byId('audio-status').hidden = ok;
}

byId('word-count').textContent = '· '+words.length+' слов';
byId('start-next').addEventListener('click',()=>startStop(Math.max(0,nextStop())));
byId('continue-route').addEventListener('click',()=>startStop(nextStop()));
byId('play-all').addEventListener('click',()=>start(words,themes.map((_,group)=>group)));
byId('play-pairs').addEventListener('click',startPairs);
byId('review-saved').addEventListener('click',()=>start(words.filter(w=>saved.has(w.zh))));
byId('back').addEventListener('click',home);
byId('change-group').addEventListener('click',home);
byId('review-missed').addEventListener('click',()=>start(words.filter(w=>roundMisses.has(w.zh))));
byId('listen').addEventListener('click',()=>listen(item.zh));
byId('listen-example').addEventListener('click',()=>listen(item.example));
byId('hint').addEventListener('click',()=>{
  const hint = byId('pinyin');
  hint.hidden = !hint.hidden;
  byId('hint').setAttribute('aria-expanded',String(!hint.hidden));
  byId('hint').textContent = hint.hidden ? (mode===modes[2]?'Подсказка по смыслу':'Показать пиньинь') : 'Скрыть подсказку';
});
byId('next').addEventListener('click',()=>{
  window.LearningSpeech.stop();
  if (pairRound || ++position===deck.length) finish();
  else draw();
});
paintStops();

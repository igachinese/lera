'use strict';

const byId = id => document.getElementById(id);
const themes = [
  ['Дорога и поездки', 'От дома до вокзала'],
  ['Связки и диалоги', 'Говорилка 2.0'],
  ['Планы и сравнения', 'Говорилка 3.0'],
];
const groups = JSON.parse(byId('word-data').textContent);
const words = groups.flatMap(([, entries], group) =>
  entries.map(([zh, py, ru, example, help]) => ({ group, zh, py, ru, example, help }))
);
const reviewKey = 'lera.homework.2026-11-18.review';
const stampKey = 'lera.homework.2026-11-18.stamps';
const saved = readSet(reviewKey);
const stamps = readSet(stampKey);
let deck = [];
let position = 0;
let roundMisses = new Set();
let roundGroups = [];
let roundSeen = new Set();
let answered = false;
let correctCount = 0;
let item;
let mode;

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
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function button(label, handler) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', handler);
  return element;
}

function show(name) {
  for (const panel of ['start', 'round', 'end']) byId(panel + '-panel').hidden = panel !== name;
}

function start(entries, groupsToStamp = []) {
  if (!entries.length) return;
  deck = shuffled(entries);
  position = 0;
  roundMisses = new Set();
  roundSeen = new Set();
  roundGroups = groupsToStamp;
  correctCount = 0;
  show('round');
  draw();
}

function paintStops() {
  const stops = themes.map(([title, source], group) => {
    const entries = words.filter(word => word.group === group);
    const earned = stamps.has(group);
    const stop = button('', () => start(entries, [group]));
    stop.className = 'stop';
    stop.dataset.earned = String(earned);
    const name = document.createElement('strong');
    name.textContent = title;
    const detail = document.createElement('span');
    detail.textContent = source;
    const progress = document.createElement('small');
    progress.textContent = earned ? '✓ Штамп получен' : entries.length + ' слов';
    stop.append(name, detail, progress);
    return stop;
  });
  byId('groups').replaceChildren(...stops);
  byId('stamp-count').textContent = 'Штампы · ' + themes.filter((_, group) => stamps.has(group)).length + ' из 3';
  const count = words.filter(word => saved.has(word.zh)).length;
  byId('review-saved').textContent = 'Повторить сложные слова · ' + count;
  byId('review-saved').hidden = count === 0;
}

function home() {
  window.LearningSpeech.stop();
  show('start');
  paintStops();
  byId('groups').firstElementChild.focus();
}

function draw() {
  item = deck[position];
  mode = ['meaning', 'listen', 'gap'][position % 3];
  const question = {
    meaning: ['Что значит это слово?', 'Выбери перевод.', item.zh, 'zh-CN', 'ru'],
    listen: ['Что ты услышала?', 'Включи звук и выбери слово. Если звук недоступен, открой пиньинь.', '🎧', 'ru', 'zh'],
    gap: ['Какого слова не хватает?', 'Прочитай реплику и вставь подходящее слово.', item.example.replace(item.zh, '＿＿'), 'zh-CN', 'zh'],
  }[mode];
  byId('group-name').textContent = themes[item.group][0];
  byId('counter').textContent = (position + 1) + ' из ' + deck.length;
  byId('progress').max = deck.length;
  byId('progress').value = position;
  byId('question').textContent = question[0];
  byId('prompt').textContent = question[1];
  byId('word').textContent = question[2];
  byId('word').lang = question[3];
  byId('listen').hidden = mode === 'gap';
  byId('hint').textContent = mode === 'gap' ? 'Подсказка по смыслу' : 'Показать пиньинь';
  byId('hint').setAttribute('aria-expanded', 'false');
  byId('pinyin').textContent = mode === 'gap' ? item.ru : item.py;
  byId('pinyin').lang = mode === 'gap' ? 'ru' : 'zh-Latn';
  byId('pinyin').hidden = true;
  byId('audio-status').hidden = true;
  byId('feedback').textContent = '';
  byId('example').hidden = true;
  byId('next').hidden = true;
  byId('next').textContent = position + 1 === deck.length ? 'Посмотреть результат' : 'Дальше →';
  answered = false;

  const pool = shuffled(words.filter(word => word.group === item.group && word !== item));
  const options = shuffled([item, ...pool.slice(0, 2)]);
  byId('answers').replaceChildren(...options.map(option => {
    const choice = button(option[question[4]], () => answer(option, options));
    choice.lang = question[4] === 'zh' ? 'zh-CN' : 'ru';
    return choice;
  }));
  byId('question').focus();
}

function answer(choice, options) {
  if (answered) return;
  answered = true;
  const correct = choice === item;
  roundSeen.add(item.zh);
  if (correct) {
    correctCount++;
    saved.delete(item.zh);
  } else {
    roundMisses.add(item.zh);
    saved.add(item.zh);
  }
  saveSet(reviewKey, saved);
  for (const [index, element] of [...byId('answers').children].entries()) {
    element.disabled = true;
    if (options[index] === item) element.classList.add('correct');
    else if (options[index] === choice) element.classList.add('incorrect');
  }
  byId('progress').value = position + 1;
  byId('feedback').textContent = (correct ? 'Верно! ' : 'Возьмём это слово на повтор. ') + item.zh + ' · ' + item.py + ' · ' + item.ru;
  byId('example-zh').textContent = item.example;
  byId('example-help').textContent = item.help;
  byId('example-help').lang = item.group === 0 ? 'ru' : 'zh-Latn';
  byId('example').hidden = false;
  byId('next').hidden = false;
  byId('next').focus();
}

function finish() {
  const newStamps = roundGroups.filter(group => !stamps.has(group) && words.every(word => word.group !== group || roundSeen.has(word.zh)));
  newStamps.forEach(group => stamps.add(group));
  saveSet(stampKey, stamps);
  byId('end-stamp').textContent = newStamps.length ? 'Новые штампы · ' + newStamps.map(group => themes[group][0]).join(', ') : '';
  byId('end-title').textContent = stamps.size === 3 ? 'Все остановки пройдены!' : 'Раунд пройден!';
  byId('result').textContent = 'Верных ответов: ' + correctCount + ' из ' + deck.length + '. ' +
    (roundMisses.size ? 'Повтори слова, которые ещё нужно закрепить.' : 'Все слова в этом раунде получились!');
  byId('review-list').replaceChildren(...words.filter(word => roundMisses.has(word.zh)).map(word => {
    const entry = document.createElement('li');
    entry.textContent = word.zh + ' · ' + word.py + ' · ' + word.ru;
    return entry;
  }));
  byId('review-missed').hidden = roundMisses.size === 0;
  show('end');
  byId('end-title').focus();
}

async function listen(text) {
  const current = item;
  const ok = await window.LearningSpeech.speak(text);
  if (current !== item || byId('round-panel').hidden) return;
  byId('audio-status').textContent = 'Китайский голос сейчас недоступен. Можно открыть пиньинь.';
  byId('audio-status').hidden = ok;
}

byId('play-all').addEventListener('click', () => start(words, [0, 1, 2]));
byId('review-saved').addEventListener('click', () => start(words.filter(word => saved.has(word.zh))));
byId('back').addEventListener('click', home);
byId('change-group').addEventListener('click', home);
byId('review-missed').addEventListener('click', () => start(words.filter(word => roundMisses.has(word.zh))));
byId('listen').addEventListener('click', () => listen(item.zh));
byId('listen-example').addEventListener('click', () => listen(item.example));
byId('hint').addEventListener('click', () => {
  const hint = byId('pinyin');
  hint.hidden = !hint.hidden;
  byId('hint').setAttribute('aria-expanded', String(!hint.hidden));
  byId('hint').textContent = !hint.hidden ? 'Скрыть подсказку' : mode === 'gap' ? 'Подсказка по смыслу' : 'Показать пиньинь';
});
byId('next').addEventListener('click', () => {
  window.LearningSpeech.stop();
  if (++position < deck.length) draw();
  else finish();
});
paintStops();

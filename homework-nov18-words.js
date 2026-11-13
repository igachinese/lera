'use strict';

const byId = id => document.getElementById(id);
const groups = JSON.parse(byId('word-data').textContent);
const allWords = groups.flatMap(([group, entries]) =>
  entries.map(([zh, py, ru, example, help]) => ({ group, zh, py, ru, example, help }))
);
const storageKey = 'lera.homework.2026-11-18.review';
let saved = new Set();
try {
  const previous = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(previous)) saved = new Set(previous);
} catch {}

let queue = [];
let position = 0;
let misses = [];
let answered = false;

function showPanel(name) {
  for (const panel of ['start', 'round', 'end']) byId(panel + '-panel').hidden = panel !== name;
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function start(words) {
  queue = shuffled(words);
  position = 0;
  misses = [];
  showPanel('round');
  drawQuestion();
}

function updateReviewButton() {
  const count = allWords.filter(word => saved.has(word.zh)).length;
  byId('review-saved').textContent = 'Повторить слова, которые ещё нужно закрепить (' + count + ')';
  byId('review-saved').hidden = count === 0;
}

function home() {
  updateReviewButton();
  showPanel('start');
  byId('groups').firstElementChild.focus();
}

function drawQuestion() {
  const item = queue[position];
  const reverse = position % 2 === 1;
  const answerKey = reverse ? 'zh' : 'ru';
  byId('group-name').textContent = item.group;
  byId('counter').textContent = (position + 1) + ' из ' + queue.length;
  byId('progress').max = queue.length;
  byId('progress').value = position;
  byId('question').textContent = reverse ? 'Как сказать это по-китайски?' : 'Что значит это слово?';
  byId('word').textContent = reverse ? item.ru : item.zh;
  byId('word').lang = reverse ? 'ru' : 'zh-CN';
  byId('prompt').textContent = reverse ? 'Выбери слово по смыслу.' : 'Прочитай или послушай слово и выбери перевод.';
  byId('listen').hidden = reverse;
  byId('hint').hidden = reverse;
  byId('hint').textContent = 'Показать пиньинь';
  byId('hint').setAttribute('aria-expanded', 'false');
  byId('pinyin').textContent = item.py;
  byId('pinyin').hidden = true;
  byId('audio-status').hidden = true;
  byId('feedback').textContent = '';
  byId('example').hidden = true;
  byId('next').hidden = true;
  byId('next').textContent = position + 1 === queue.length ? 'Посмотреть результат' : 'Следующее слово';
  answered = false;

  const similar = shuffled(allWords.filter(word => word.group === item.group && word !== item));
  const options = shuffled([item, ...similar.slice(0, 2)]);
  byId('answers').replaceChildren(...options.map(option => {
    const button = makeButton(option[answerKey], () => choose(item, option, options));
    button.lang = reverse ? 'zh-CN' : 'ru';
    return button;
  }));
  byId('question').focus();
}

function choose(item, option, options) {
  if (answered) return;
  answered = true;
  const correct = item === option;
  if (correct) {
    saved.delete(item.zh);
  } else {
    misses.push(item);
    saved.add(item.zh);
  }
  try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch {}
  for (const [index, button] of [...byId('answers').children].entries()) {
    button.disabled = true;
    if (options[index] === item) button.classList.add('correct');
    else if (options[index] === option) button.classList.add('incorrect');
  }
  byId('progress').value = position + 1;
  byId('feedback').textContent = (correct ? 'Верно! ' : 'Ещё потренируем. ') + item.zh + ' (' + item.py + ') — ' + item.ru;
  byId('example-zh').textContent = item.example;
  byId('example-help').textContent = item.help;
  byId('example-help').lang = item.group === 'Дорога и поездки' ? 'ru' : 'zh-Latn';
  byId('example').hidden = false;
  byId('next').hidden = false;
  byId('next').focus();
}

function finish() {
  byId('result').textContent = 'Верных ответов: ' + (queue.length - misses.length) + ' из ' + queue.length + '. ' +
    (misses.length ? 'Эти слова можно сразу повторить.' : 'Все слова в этом раунде получились!');
  byId('review-list').replaceChildren(...misses.map(word => {
    const entry = document.createElement('li');
    entry.textContent = word.zh + ' (' + word.py + ') — ' + word.ru;
    return entry;
  }));
  byId('review-missed').hidden = misses.length === 0;
  showPanel('end');
  byId('end-title').focus();
}

const groupButtons = groups.map(([group, entries]) => {
  const button = makeButton(group, () => start(allWords.filter(word => word.group === group)));
  const count = document.createElement('small');
  count.textContent = entries.length + ' слов';
  button.append(count);
  return button;
});
byId('groups').append(...groupButtons, makeButton('Все темы · ' + allWords.length + ' слов', () => start(allWords)));
byId('review-saved').addEventListener('click', () => start(allWords.filter(word => saved.has(word.zh))));
byId('back').addEventListener('click', home);
byId('change-group').addEventListener('click', home);
byId('review-missed').addEventListener('click', () => start(misses));
async function listen(text) {
  const item = queue[position];
  const ok = await window.LearningSpeech.speak(text);
  if (queue[position] !== item) return;
  byId('audio-status').textContent = 'Китайская озвучка сейчас недоступна. Можно продолжить по тексту.';
  byId('audio-status').hidden = ok;
}
byId('listen').addEventListener('click', () => listen(queue[position].zh));
byId('listen-example').addEventListener('click', () => listen(queue[position].example));
byId('hint').addEventListener('click', () => {
  const pinyin = byId('pinyin');
  pinyin.hidden = !pinyin.hidden;
  byId('hint').setAttribute('aria-expanded', String(!pinyin.hidden));
  byId('hint').textContent = pinyin.hidden ? 'Показать пиньинь' : 'Скрыть пиньинь';
});
byId('next').addEventListener('click', () => {
  if (++position < queue.length) drawQuestion();
  else finish();
});
updateReviewButton();

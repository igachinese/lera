'use strict';

const words = [
  ['从','cóng','от, из','从我家到学校。','От моего дома до школы.'],
  ['离','lí','от, когда речь о расстоянии','学校离我家很近。','Школа близко от моего дома.'],
  ['近','jìn','близко','我家离学校很近。','Мой дом близко от школы.'],
  ['远','yuǎn','далеко','火车站离我家很远。','Вокзал далеко от моего дома.'],
  ['多久','duōjiǔ','как долго, сколько времени','从这儿到学校要多久？','Сколько времени отсюда до школы?'],
  ['多远','duōyuǎn','как далеко','你家离学校有多远？','Как далеко твой дом от школы?'],
  ['地图','dìtú','карта','我们看一下地图吧。','Давай посмотрим на карту.'],
  ['旅游','lǚyóu','путешествовать','我打算坐高铁去旅游。','Я собираюсь отправиться в поездку на скоростном поезде.']
];

const frames = [
  {
    title:'Недалеко от дома',
    alt:'Девочка идёт по улице к школьным воротам',
    note:'Заметь, куда идёт героиня и сколько времени занимает дорога.',
    zh:'学校离我家很近。走路要十分钟。',
    ru:'Школа близко от моего дома. Пешком десять минут.'
  },
  {
    title:'По дороге на вокзал',
    alt:'Две подруги разговаривают в вагоне метро',
    note:'Послушай, как подруги добираются от школы до вокзала.',
    zh:'从学校到火车站，坐地铁要二十分钟。',
    ru:'От школы до вокзала на метро двадцать минут.',
    video:true
  },
  {
    title:'На платформе',
    alt:'Девочки на платформе рядом со скоростным поездом',
    note:'Какой план на выходные у героинь?',
    zh:'我们打算坐高铁去旅游。',
    ru:'Мы собираемся отправиться в путешествие на скоростном поезде.'
  },
  {
    title:'За окном поезда',
    alt:'Подруги смотрят на реку и горы из окна скоростного поезда',
    note:'Услышь сравнение из «Говорилки 3.0».',
    zh:'我们正在坐高铁。高铁比地铁快！',
    ru:'Мы сейчас едем на скоростном поезде. Он быстрее метро!'
  }
];

const storyQuestions = [
  { prompt:'Как героиня добирается от дома до школы?', options:['走路','坐地铁','坐高铁'], right:0, why:'走路要十分钟。 Пешком десять минут.' },
  { prompt:'Сколько занимает дорога от школы до вокзала?', options:['十分钟','二十分钟','三十分钟'], right:1, why:'从学校到火车站要二十分钟。 От школы до вокзала двадцать минут.' },
  { prompt:'На чём подруги отправятся в путешествие?', options:['坐地铁','走路','坐高铁'], right:2, why:'我们打算坐高铁去旅游。 Они поедут на скоростном поезде.' }
];

const mapQuestions = [
  { prompt:'Сколько всего от дома до вокзала?', options:['二十分钟','三十分钟','十分钟'], right:1, why:'Десять минут пешком и двадцать на метро. 从我家到火车站要三十分钟。' },
  { prompt:'Как спросить, далеко ли школа от дома?', options:['学校离我家远吗？','从我家到学校要多久？','你怎么去学校？'], right:0, why:'离 помогает спросить именно о расстоянии. 要多久？ — о времени.' },
  { prompt:'Как сказать «От школы до вокзала я еду на метро»?', options:['从我家到学校，我走路。','从学校到火车站，我坐高铁。','从学校到火车站，我坐地铁。'], right:2, why:'从学校 задаёт начало маршрута, 到火车站 — конец, 坐地铁 — транспорт.' }
];

const sentences = [
  { prompt:'От моего дома до школы десять минут.', tokens:['十分钟','从','要','学校','到','我家'], answer:[1,5,4,3,2,0] },
  { prompt:'Вокзал далеко от моего дома.', tokens:['很远','我家','火车站','离'], answer:[2,3,1,0] },
  { prompt:'Я собираюсь поехать на метро.', tokens:['地铁','我','坐','打算'], answer:[1,3,2,0] }
];

const roleLines = [
  ['你打算去哪儿？','Куда ты собираешься?','我打算去公园。','Я собираюсь в парк.'],
  ['公园离你家远吗？','Парк далеко от твоего дома?','公园离我家不远。','Парк недалеко от моего дома.'],
  ['从你家到公园要多久？你怎么去？','Сколько от дома до парка? Как ты туда доберёшься?','从我家到公园要十五分钟。我走路去。','От моего дома до парка пятнадцать минут. Я пойду пешком.']
];

const byId = id => document.getElementById(id);
const speech = window.LearningSpeech;
const storageKey = 'bridge-chinese.travel-lesson.v1';
let results = {};
let spoken = {};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  results = saved?.results || {};
  spoken = saved?.spoken || {};
} catch {}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function chinese(tag, text, className = 'han') {
  const node = el(tag, text, className);
  node.lang = 'zh-CN';
  return node;
}

function button(text, className, onClick) {
  const node = el('button',text,className);
  node.type = 'button';
  node.addEventListener('click',onClick);
  return node;
}

function audioButton(text) {
  const node = el('button','▶','audio');
  node.type = 'button';
  node.dataset.say = text;
  node.setAttribute('aria-label','Послушать: ' + text);
  return node;
}

function syncScore() {
  const firstTries = Object.values(results);
  const total = storyQuestions.length + mapQuestions.length + sentences.length;
  byId('score').textContent = firstTries.length
    ? 'С первой попытки: ' + firstTries.filter(Boolean).length + ' из ' + firstTries.length + '. Попробовано заданий: ' + firstTries.length + ' из ' + total + '.'
    : 'Ответь на задания, чтобы увидеть результат.';
  byId('spoken-score').textContent = 'Устный блок: ' + Object.values(spoken).filter(Boolean).length + ' из 3 по твоим отметкам.';
}

function saveProgress() {
  try { localStorage.setItem(storageKey,JSON.stringify({results,spoken})); } catch {}
  syncScore();
}

function scoreAnswer(id, right) {
  if (!Object.hasOwn(results,id)) {
    results[id] = right;
    saveProgress();
  }
}

function showWords() {
  for (const [zh,py,meaning,sample,gloss] of words) {
    const card = el('article',undefined,'word-card');
    const head = el('div',undefined,'line-with-audio');
    head.append(chinese('h3',zh,'han word-han'),audioButton(zh));
    card.append(head,el('p',py,'pinyin'),el('p',meaning,'meaning'),chinese('p',sample,'han word-sample'),el('p',gloss,'word-gloss'));
    byId('word-list').append(card);
  }
}

function showRoleLines() {
  for (const [question,translation,answer,gloss] of roleLines) {
    const row = el('div',undefined,'role-line');
    const head = el('div',undefined,'line-with-audio');
    head.append(chinese('p',question),audioButton(question));
    const details = el('details',undefined,'example');
    details.append(el('summary','Подсказка'),el('p',translation),chinese('p',answer),el('p',gloss));
    row.append(head,details);
    byId('role-lines').append(row);
  }
}

function setupQuiz(id, title, items) {
  const container = byId(id);
  let index = 0;
  function render(focus = false) {
    const item = items[index];
    const header = el('div',undefined,'exercise-head');
    header.append(el('h3',title),el('span',(index + 1) + ' / ' + items.length,'step-count'));
    const prompt = el('p',item.prompt,'quiz-prompt');
    prompt.tabIndex = -1;
    const options = el('div',undefined,'option-list');
    const feedback = el('p',undefined,'feedback');
    feedback.setAttribute('aria-live','polite');
    const actions = el('div',undefined,'exercise-actions');
    const next = button(index < items.length - 1 ? 'Следующий вопрос →' : 'Повторить вопросы','button small',() => {
      index = (index + 1) % items.length;
      render(true);
    });
    next.hidden = true;
    actions.append(next);
    const choices = item.options.map((answer,i) => {
      const choice = button(answer,'choice han',() => {
        const right = i === item.right;
        scoreAnswer(id + ':' + index,right);
        feedback.textContent = (right ? 'Верно. ' : 'Посмотри подсказку. ') + item.why;
        feedback.classList.toggle('is-error',!right);
        for (const other of choices) other.disabled = true;
        choices[item.right].classList.add('is-right');
        if (!right) choice.classList.add('is-wrong');
        next.hidden = false;
      });
      choice.lang = 'zh-CN';
      return choice;
    });
    options.append(...choices);
    container.replaceChildren(header,prompt,options,feedback,actions);
    if (focus) prompt.focus();
  }
  render();
}

function setupBuilder() {
  let index = 0;
  let picked = [];
  let solved = false;
  const tray = byId('tray'), tokens = byId('tokens'), feedback = byId('builder-feedback');
  const check = byId('check-builder'), reset = byId('reset-builder'), next = byId('next-builder');
  const prompt = byId('builder-prompt');
  let options = [];
  function renderSelection() {
    const item = sentences[index];
    for (let i = 0; i < options.length; i++) {
      const inTray = picked.includes(i);
      options[i].classList.toggle('used',inTray);
      options[i].disabled = solved || inTray;
    }
    tray.replaceChildren(...picked.map((id,i) => {
      const token = button(item.tokens[id],'token han',() => {
        picked.splice(i,1);
        renderSelection();
        options[id].focus();
      });
      token.lang = 'zh-CN';
      token.disabled = solved;
      token.setAttribute('aria-label','Убрать: ' + item.tokens[id]);
      return token;
    }));
    check.disabled = solved || picked.length !== item.tokens.length;
    reset.disabled = !picked.length;
  }
  function render(focus = false) {
    const item = sentences[index];
    picked = [];
    solved = false;
    byId('builder-count').textContent = (index + 1) + ' / ' + sentences.length;
    prompt.textContent = item.prompt;
    prompt.tabIndex = -1;
    feedback.textContent = '';
    next.hidden = true;
    next.textContent = index === sentences.length - 1 ? 'Повторить фразы' : 'Следующая →';
    options = item.tokens.map((text,id) => {
      const token = button(text,'token han',() => {
        picked.push(id);
        feedback.textContent = '';
        renderSelection();
        (options.find(option => !option.disabled) || check).focus();
      });
      token.lang = 'zh-CN';
      return token;
    });
    tokens.replaceChildren(...options);
    renderSelection();
    if (focus) prompt.focus();
  }
  check.addEventListener('click',() => {
    const item = sentences[index];
    solved = picked.every((id,i) => id === item.answer[i]);
    scoreAnswer('builder:' + index,solved);
    feedback.textContent = solved
      ? 'Получилось! ' + item.answer.map(id => item.tokens[id]).join('') + '。'
      : 'Проверь порядок слов. Нажми на слово в верхней строке, чтобы убрать его.';
    feedback.classList.toggle('is-error',!solved);
    if (solved) {
      next.hidden = false;
      renderSelection();
      next.focus();
    }
  });
  reset.addEventListener('click',() => render(true));
  next.addEventListener('click',() => { index = (index + 1) % sentences.length; render(true); });
  render();
}

function setupStory() {
  let index = 0, playId = 0, playing = false;
  let settleVideo;
  const captions = byId('show-captions'), status = byId('story-status'), play = byId('play-story');
  const frameImg = byId('frame-img'), video = byId('story-video'), listen = byId('listen-frame');
  const videoTrack = video.querySelector('track').track;

  function showCaptions() {
    const usesVideo = frames[index].video;
    byId('captions').hidden = usesVideo || !captions.checked;
    if (usesVideo) videoTrack.mode = captions.checked ? 'showing' : 'disabled';
  }

  function render() {
    const frame = frames[index];
    frameImg.hidden = Boolean(frame.video);
    video.hidden = !frame.video;
    if (!frame.video) {
      frameImg.src = 'assets/frame-' + (index + 1) + '.webp';
      frameImg.alt = frame.alt;
    }
    byId('frame-count').textContent = 'Кадр ' + (index + 1) + ' из ' + frames.length;
    byId('frame-title').textContent = frame.title;
    byId('frame-note').textContent = frame.note;
    byId('caption-zh').textContent = frame.zh;
    byId('caption-ru').textContent = frame.ru;
    byId('prev-frame').disabled = index === 0;
    byId('next-frame').disabled = index === frames.length - 1;
    listen.textContent = frame.video ? '▶ Видео' : '▶ Реплика';
    showCaptions();
  }

  function stop() {
    playId++;
    playing = false;
    speech?.stop();
    video.pause();
    settleVideo?.(false);
    play.textContent = '▶ Смотреть историю';
  }

  function noAudio() {
    captions.checked = true;
    showCaptions();
    status.textContent = 'Китайский голос не запустился. Открыли субтитры для чтения.';
  }

  function videoUnavailable() {
    status.textContent = 'Видео не запустилось. Нажми ▶ на самом видео, чтобы повторить попытку.';
  }

  function changeFrame(delta) {
    stop();
    status.textContent = '';
    index += delta;
    render();
  }

  function playMetro() {
    return new Promise(resolve => {
      const finish = ok => {
        video.removeEventListener('ended', onEnd);
        video.removeEventListener('error', onError);
        settleVideo = undefined;
        resolve(ok);
      };
      const onEnd = () => finish(true);
      const onError = () => finish(false);
      settleVideo = finish;
      video.addEventListener('ended', onEnd, {once:true});
      video.addEventListener('error', onError, {once:true});
      video.currentTime = 0;
      video.play().catch(() => { if (settleVideo === finish) finish(false); });
    });
  }

  byId('prev-frame').addEventListener('click',() => changeFrame(-1));
  byId('next-frame').addEventListener('click',() => changeFrame(1));
  captions.addEventListener('change',showCaptions);
  video.textTracks.addEventListener('change',() => {
    if (frames[index].video) captions.checked = videoTrack.mode === 'showing';
  });
  listen.addEventListener('click',async () => {
    stop();
    const current = playId;
    status.textContent = '';
    if (frames[index].video) {
      video.currentTime = 0;
      try { await video.play(); }
      catch (error) { if (current === playId) videoUnavailable(); }
    } else if (!await speech?.speak(frames[index].zh) && current === playId) {
      noAudio();
    }
  });
  play.addEventListener('click',async () => {
    if (playing) { stop(); status.textContent = 'Воспроизведение остановлено.'; return; }
    stop();
    const current = playId;
    playing = true;
    play.textContent = '■ Остановить';
    status.textContent = '';
    let withAudio = true;
    for (index = 0; index < frames.length; index++) {
      render();
      if (frames[index].video) {
        const finished = await playMetro();
        if (current !== playId) return;
        if (!finished) { stop(); videoUnavailable(); return; }
        continue;
      }
      if (withAudio) {
        withAudio = Boolean(await speech?.speak(frames[index].zh));
        if (current !== playId) return;
        if (!withAudio) noAudio();
      }
      await new Promise(resolve => setTimeout(resolve,withAudio ? 850 : 6500));
      if (current !== playId) return;
    }
    index = frames.length - 1;
    stop();
    status.textContent = 'История закончилась. Ответь на вопросы ниже.';
  });

  document.addEventListener('play',event => {
    if (event.target.matches('.lesson-video') && event.target !== video && (playing || !video.paused)) stop();
  },true);
  document.addEventListener('click',event => {
    if (event.target.closest('button[data-say], #test-voice') && (playing || !video.paused)) stop();
  },true);
  render();
}

function coordinateMedia() {
  const videos = [...document.querySelectorAll('.lesson-video')];
  for (const video of videos) {
    video.addEventListener('play',() => {
      if (video.paused) return;
      speech?.stop();
      for (const other of videos) {
        if (other !== video) other.pause();
      }
    });
  }
  document.addEventListener('click',event => {
    if (event.target.closest('button[data-say], #test-voice, #listen-frame, #play-story')) {
      for (const video of videos) video.pause();
    }
  },true);
}

showWords();
showRoleLines();
setupStory();
coordinateMedia();
setupQuiz('story-check','Что услышала?',storyQuestions);
setupQuiz('map-check','Проверь маршрут',mapQuestions);
setupBuilder();
speech?.bind({
  voiceSelect:byId('voice'),
  rateSelect:byId('rate'),
  testButton:byId('test-voice'),
  status:byId('voice-status')
});

document.addEventListener('click',async event => {
  const control = event.target.closest('button[data-say]');
  if (!control) return;
  if (!await speech?.speak(control.dataset.say) && !speech?.available()) {
    const settings = document.querySelector('.voice-panel');
    settings.open = true;
    settings.querySelector('summary').focus();
    settings.scrollIntoView({block:'nearest'});
  }
});

for (const checkbox of document.querySelectorAll('.spoken-checks input')) {
  checkbox.checked = Boolean(spoken[checkbox.value]);
  checkbox.addEventListener('change',() => {
    spoken[checkbox.value] = checkbox.checked;
    saveProgress();
  });
}
syncScore();

document.querySelector('.teacher-link').addEventListener('click',() => { byId('teacher').open = true; });

const sectionLinks = [...document.querySelectorAll('.route-nav a')];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    for (const link of sectionLinks) {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  }
},{rootMargin:'-14% 0px -67% 0px'});
for (const link of sectionLinks) observer.observe(document.querySelector(link.hash));

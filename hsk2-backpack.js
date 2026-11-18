'use strict';

(() => {
  const directory = 'assets/backpack/';
  const bridge = 'lessons/chinese-travel/assets/video/';
  const media = Object.fromEntries(['01', '02', '03', '04', '05', '06', '07', '08'].map(id => {
    const clip = directory + 'video/' + id;
    return [id, {
      video: clip + '.mp4',
      tracks: {'zh-CN': clip + '.zh.vtt', ru: clip + '.ru.vtt'},
    }];
  }));
  const scenes = {
    '01': {title:'Дорога в памяти', speaker:'Подруга', line:'从学校到火车站要多久？', pinyin:'Cóng xuéxiào dào huǒchēzhàn yào duōjiǔ?', translation:'Сколько времени нужно от школы до вокзала?', still:bridge + '01.webp'},
    '02': {title:'Пропажа', speaker:'Девочка в красной куртке', line:'我在找我的书包。', pinyin:'Wǒ zài zhǎo wǒ de shūbāo.', translation:'Я ищу свой рюкзак.', still:directory + 'station-counter.webp'},
    '03': {title:'Вопрос у стойки', speaker:'Дежурная', line:'请告诉我，书包是什么颜色的？', pinyin:'Qǐng gàosu wǒ, shūbāo shì shénme yánsè de?', translation:'Скажи, пожалуйста, какого цвета рюкзак?'},
    '04': {title:'Цвет и содержимое', speaker:'Девочка в красной куртке', line:'黑色的。里面有一本数学书。', pinyin:'Hēisè de. Lǐmiàn yǒu yì běn shùxué shū.', translation:'Чёрный. Внутри есть учебник по математике.'},
    '05': {title:'Перед пропажей', speaker:'Девочка в красной куртке', line:'我刚才在外面等朋友。', pinyin:'Wǒ gāngcái zài wàimiàn děng péngyou.', translation:'Я только что ждала подругу на улице.'},
    '06': {title:'Дежурная заметила рюкзак', speaker:'Дежурная', line:'椅子旁边有一个黑色的书包。', pinyin:'Yǐzi pángbiān yǒu yí ge hēisè de shūbāo.', translation:'Рядом со стулом стоит чёрный рюкзак.'},
    '07': {title:'Ориентир у двери', speaker:'Подруга', line:'椅子在门的右边。', pinyin:'Yǐzi zài mén de yòubiān.', translation:'Стул справа от двери.'},
    '08': {title:'Вопрос тебе', speaker:'Подруга', line:'你的书包里有什么？', pinyin:'Nǐ de shūbāo li yǒu shénme?', translation:'Что лежит в твоём рюкзаке?'},
  };

  const clues = [
    {id:'color', scene:'04', prompt:'Какого цвета рюкзак?', options:['红色','黑色','白色'], answer:1, label:'Цвет', note:'黑色 · чёрный'},
    {id:'book', scene:'04', prompt:'Что внутри?', options:['数学书','汉语书','地图'], answer:0, label:'Внутри', note:'数学书 · учебник по математике'},
    {id:'outside', scene:'05', prompt:'Где героиня ждала подругу?', options:['Внутри','Рядом со стойкой','На улице'], answer:2, label:'Где ждала', note:'外面 · на улице'},
    {id:'chair', scene:'06', prompt:'Рядом с чем стоит рюкзак?', options:['С дверью','Со стулом','Со стойкой'], answer:1, label:'Рюкзак', note:'椅子旁边 · рядом со стулом'},
    {id:'side', scene:'07', prompt:'С какой стороны от двери стоит стул?', options:['Справа','Слева','Перед дверью'], answer:0, label:'Стул', note:'门的右边 · справа от двери'},
  ];
  const bags = [
    {name:'Первая находка', fields:['黑色','汉语书','门右边'], color:'black', missed:'Внутри другой учебник. Переслушай ответ девушки о содержимом.'},
    {name:'Вторая находка', fields:['黑色','数学书','门左边'], color:'black', missed:'Место отличается. С какой стороны от двери стоит нужный стул?'},
    {name:'Третья находка', fields:['黑色','数学书','门右边'], color:'black'},
    {name:'Четвёртая находка', fields:['红色','数学书','门右边'], color:'red', missed:'Отличается цвет. Вспомни первое слово в описании.'},
  ];
  const remixes = [
    {name:'Заявка у школы', line:'我在找红色的书包。里面有一本汉语书。书包在学校门口。', options:['Красный · учебник по китайскому · возле входа в школу','Красный · учебник по математике · возле входа в школу','Чёрный · учебник по китайскому · возле входа в школу'], answer:0, change:'Поменяй цвет и книгу. Сохрани место.'},
    {name:'Заявка у вокзала', line:'我在找黑色的书包。里面有一张地图。书包在火车站旁边。', options:['Чёрный · карта · возле школы','Чёрный · карта · рядом с вокзалом','Красный · карта · рядом с вокзалом'], answer:1, change:'Поменяй цвет и место. Оставь карту внутри.'},
    {name:'Заявка у двери', line:'我在找红色的书包。里面有一本数学书。书包在门的右边。', options:['Красный · учебник по математике · слева от двери','Красный · учебник по китайскому · справа от двери','Красный · учебник по математике · справа от двери'], answer:2, change:'Поменяй книгу и сторону. Оставь цвет.'},
  ];

  const byId = id => document.getElementById(id);
  const sceneMedia = new Set();
  const storageKey = 'lera.backpack.case.v2';
  const state = readProgress();
  let audioRequest = 0;

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const validClues = list => Array.isArray(list) ? list.filter(id => clues.some(clue => clue.id === id)) : [];
      return {
        clues:new Set(validClues(value.clues)),
        retry:new Set(validClues(value.retry)),
        found:value.found === true,
      };
    } catch {
      return {clues:new Set(), retry:new Set(), found:false};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({clues:[...state.clues], retry:[...state.retry], found:state.found}));
    } catch {}
  }

  function node(tag, value, className) {
    const elem = document.createElement(tag);
    if (value) elem.textContent = value;
    if (className) elem.className = className;
    return elem;
  }

  function chinese(tag, value, className = 'zh') {
    const elem = node(tag, value, className);
    elem.lang = 'zh-CN';
    return elem;
  }

  function button(label, handler, className = 'button') {
    const elem = node('button', label, className);
    elem.type = 'button';
    elem.addEventListener('click', handler);
    return elem;
  }

  function status(elem) {
    elem.setAttribute('role', 'status');
    return elem;
  }

  function details(label, ...content) {
    const elem = node('details', '', 'case-details');
    elem.append(node('summary', label), ...content);
    return elem;
  }

  function stopOtherAudio(active) {
    for (const video of sceneMedia) if (video !== active && !video.paused) video.pause();
    if (active) {
      audioRequest++;
      window.LearningSpeech?.stop();
    }
  }

  async function speak(line, feedback) {
    stopOtherAudio();
    const request = ++audioRequest;
    feedback.textContent = '';
    const spoken = await window.LearningSpeech?.speak(line);
    if (request === audioRequest && !spoken) feedback.textContent = 'Звук недоступен. Открой текст реплики или попроси преподавателя её прочитать.';
  }

  function choices({options, answer, language, solved = false, onSolve, onMiss}) {
    const group = node('div', '', 'case-choices');
    const feedback = status(node('p', '', 'case-feedback'));
    let complete = solved;
    const buttons = options.map((option, index) => {
      const choice = button(option, () => {
        if (complete) return;
        if (index === answer) {
          complete = true;
          buttons.forEach((control, pos) => {
            control.disabled = pos !== answer;
            control.classList.remove('wrong');
          });
          choice.classList.add('correct');
          feedback.textContent = onSolve();
        } else {
          choice.classList.add('wrong');
          feedback.textContent = onMiss();
        }
      });
      if (language) choice.lang = language;
      choice.disabled = complete && index !== answer;
      if (complete && index === answer) choice.classList.add('correct');
      return choice;
    });
    group.append(...buttons);
    return [group, feedback];
  }

  function renderScene(id, tasks = []) {
    const scene = scenes[id];
    const item = node('article', '', 'case-scene');
    const top = node('header', '', 'case-scene-head');
    const audioStatus = status(node('p', '', 'case-feedback'));
    top.append(node('span', scene.speaker, 'case-scene-speaker'), node('h3', scene.title));
    item.append(top);
    const files = media[id];
    if (files?.video) {
      const video = node('video', '', 'case-media');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      if (files.poster || scene.still) video.poster = files.poster || scene.still;
      video.src = files.video;
      video.setAttribute('aria-label', scene.title);
      for (const [lang, file] of Object.entries(files.tracks || {})) {
        const track = node('track');
        track.kind = 'subtitles';
        track.srclang = lang;
        track.label = lang === 'ru' ? 'Русский' : '中文';
        track.src = file;
        video.append(track);
      }
      sceneMedia.add(video);
      video.addEventListener('play', () => stopOtherAudio(video));
      video.addEventListener('error', () => { video.hidden = true; audioStatus.textContent = 'Видео не загрузилось. Можно послушать реплику отдельно.'; });
      item.append(id === '07' ? details('Свериться с видеокадром', video) : video);
    } else if (scene.still && id === '01') {
      const image = node('img', '', 'case-media');
      image.src = scene.still;
      image.alt = 'Героини из прошлого урока у поезда';
      image.width = 1280;
      image.height = 720;
      image.loading = 'lazy';
      item.append(image);
    }
    const audio = button('▶ Послушать реплику', () => speak(scene.line, audioStatus), 'button case-audio');
    item.append(audio, audioStatus, details('Текст и перевод', chinese('p', scene.line), node('p', scene.pinyin, 'py'), node('p', scene.translation)));
    for (const clue of tasks) {
      const task = node('div', '', 'case-question');
      task.append(node('p', clue.prompt), ...choices({
        options:clue.options, answer:clue.answer, language:clue.scene === '04' ? 'zh-CN' : null,
        solved:state.clues.has(clue.id),
        onSolve:() => {
          state.clues.add(clue.id);
          saveProgress();
          renderEvidence();
          return 'Улика в досье.';
        },
        onMiss:() => {
          state.retry.add(clue.id);
          saveProgress();
          return 'Переслушай реплику. Если нужно, открой текст.';
        },
      }));
      item.append(task);
    }
    return item;
  }

  function renderEvidence() {
    byId('backpack-progress').textContent = state.clues.size + ' из ' + clues.length + ' улик';
    byId('backpack-evidence').replaceChildren(...clues.map(clue => {
      const earned = state.clues.has(clue.id);
      const row = node('li', '', earned ? 'logged' : '');
      row.append(node('b', clue.label), node('span', earned ? clue.note : 'Ещё ищем'));
      return row;
    }));
  }

  function renderWords() {
    const fresh = new Map(window.Hsk2Prep.words.filter(row => row[5] === 0).map(row => [row[0], row]));
    const sets = [
      {title:'Что случилось?', keys:['找','书包','颜色','告诉'], q:'Как попросить дежурную сказать, где рюкзак?', text:'请告诉我，书包在哪儿？', options:['告诉','颜色','找'], answer:0},
      {title:'Где искать?', keys:['里面','外面','旁边','右边'], q:'Какое слово нужно, если вещь рядом со стулом?', text:'我的书包在椅子旁边。', options:['外面','右边','旁边'], answer:2},
    ];
    for (const set of sets) {
      const item = node('article', '', 'case-word-set');
      const grid = node('div', '', 'case-word-grid');
      const audioStatus = status(node('p', '', 'case-feedback'));
      for (const key of set.keys) {
        const [word, py, meaning, example, translation] = fresh.get(key);
        const explain = node('div', '', 'case-word');
        explain.append(chinese('b', word), node('span', py, 'py'), node('span', meaning),
          button('▶ Слово', () => speak(word, audioStatus), 'case-inline'),
          details('Пример', chinese('p', example), node('p', translation), button('▶ Фраза', () => speak(example, audioStatus), 'case-inline')));
        grid.append(explain);
      }
      const recalled = node('div', '', 'case-question');
      recalled.append(node('p', set.q), ...choices({
        options:set.options, answer:set.answer, language:'zh-CN',
        onSolve:() => 'Верно! Скажи целиком: ' + set.text,
        onMiss:() => 'Вспомни карточки этого набора и попробуй ещё раз.',
      }));
      item.append(node('h3', set.title), details('Открыть или убрать карточки', grid, audioStatus), recalled);
      item.querySelector('details').open = true;
      byId('backpack-words').append(item);
    }
  }

  const finalItem = node('div', '', 'case-found');
  const finalWords = node('p');
  finalItem.hidden = true;
  finalItem.append(node('h3', 'Рюкзак найден!'), chinese('p', '黑色的书包在门右边的椅子旁边。'), finalWords);
  byId('backpack-finale').append(finalItem);

  function renderFound() {
    finalItem.hidden = !state.found;
    const difficult = clues.filter(clue => state.retry.has(clue.id)).map(clue => clue.label.toLowerCase());
    finalWords.textContent = difficult.length
      ? 'Для следующего повтора выбери то, что потребовало ещё попытки: ' + difficult.join(', ') + '.'
      : 'Закрепи находку: без досье скажи, какого цвета рюкзак, что внутри и где он стоял.';
  }

  function renderBags() {
    const grid = node('div', '', 'case-bag-grid');
    const feedback = status(node('p', '', 'case-feedback'));
    const labels = ['Цвет','Внутри','Где стоит стул'];
    const items = bags.map(bag => {
      const choice = button('', () => {
        if (state.found) return;
        if (bag.missed) {
          choice.classList.add('wrong');
          feedback.textContent = bag.missed;
          return;
        }
        state.found = true;
        saveProgress();
        items.forEach((control, index) => {
          control.classList.remove('wrong');
          control.disabled = Boolean(bags[index].missed);
        });
        choice.classList.add('correct');
        feedback.textContent = 'Совпали все три приметы.';
        renderFound();
      }, 'button case-bag');
      choice.disabled = state.found && Boolean(bag.missed);
      if (state.found && !bag.missed) choice.classList.add('correct');
      const swatch = node('b', '', 'case-swatch ' + bag.color);
      swatch.setAttribute('aria-hidden', 'true');
      choice.append(swatch, node('strong', bag.name), ...bag.fields.map((value, index) => {
        const spec = node('span', '', 'case-bag-spec');
        spec.append(node('span', labels[index]), chinese('b', value));
        return spec;
      }));
      return choice;
    });
    grid.append(...items);
    byId('backpack-bags').append(grid, feedback, details('Словарик находок', node('p', '黑色 чёрный · 红色 красный · 数学书 учебник по математике · 汉语书 учебник по китайскому · 左边 слева · 右边 справа')));
  }

  function setupRemix() {
    const slot = byId('backpack-remix');
    let index = 0;
    function draw(focus) {
      const round = remixes[index];
      const item = node('article', '', 'case-scene');
      const feedback = status(node('p', '', 'case-feedback'));
      const header = node('h3', round.name);
      header.tabIndex = -1;
      const transfer = node('p', round.change + ' Теперь скажи новую заявку из трёх коротких фраз.', 'mini-task');
      const next = button(index === remixes.length - 1 ? 'Начать с первой заявки' : 'Следующая заявка →', () => {
        stopOtherAudio();
        audioRequest++;
        window.LearningSpeech?.stop();
        index = (index + 1) % remixes.length;
        draw(true);
      });
      transfer.hidden = next.hidden = true;
      item.append(node('span', 'Заявка ' + (index + 1) + ' из ' + remixes.length, 'case-scene-speaker'), header,
        button('▶ Послушать заявку', () => speak(round.line, feedback), 'button case-audio'), feedback,
        details('Открыть китайский текст', chinese('p', round.line)),
        ...choices({
          options:round.options, answer:round.answer,
          onSolve:() => { transfer.hidden = next.hidden = false; return 'Заявка совпала.'; },
          onMiss:() => 'Прослушай ещё раз и сверь цвет, что внутри и место.',
        }), transfer, next);
      slot.replaceChildren(item);
      if (focus) header.focus();
    }
    draw(false);
  }

  byId('warmup-answer').addEventListener('click', event => {
    const solution = byId('warmup-solution');
    solution.hidden = !solution.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!solution.hidden));
  });
  byId('backpack-warmup').append(renderScene('01'));
  const sceneList = byId('backpack-scenes');
  function renderClueScenes() {
    sceneList.querySelectorAll('video').forEach(video => { video.pause(); sceneMedia.delete(video); });
    sceneList.replaceChildren(...['02','03','04','05','06','07'].map(id => renderScene(id, clues.filter(clue => clue.scene === id))));
  }
  byId('case-reset').addEventListener('click', () => {
    state.clues.clear();
    state.retry.clear();
    state.found = false;
    saveProgress();
    audioRequest++;
    window.LearningSpeech?.stop();
    renderClueScenes();
    renderEvidence();
    byId('backpack-bags').replaceChildren();
    renderBags();
    renderFound();
  });
  renderClueScenes();
  byId('backpack-outro').append(details('Вопрос от героини', renderScene('08')));
  renderWords();
  renderEvidence();
  renderBags();
  renderFound();
  setupRemix();
})();

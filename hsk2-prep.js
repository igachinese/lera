'use strict';

(() => {
  const data = window.Hsk2Prep;
  const byId = id => document.getElementById(id);
  const storeKey = 'lera.hsk2-december.review.v1';
  const intervals = [1, 2, 4, 7, 14];

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function zh(tag, text, className = 'zh') {
    const node = el(tag, text, className);
    node.lang = 'zh-CN';
    return node;
  }

  function button(text, onClick, primary = false) {
    const node = el('button', text, primary ? 'button primary' : 'button');
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }

  function say(text, status) {
    return window.LearningSpeech.speak(text).then(ok => {
      if (status) status.textContent = ok ? '' : 'Китайская озвучка сейчас недоступна. Открой текст или попроси преподавателя прочитать реплику.';
      return ok;
    });
  }

  function setupLesson() {
    const status = byId('backpack-listen-status');
    const card = ([word, py, meaning, example, translation]) => {
      const item = el('article', '', 'item');
      const actions = el('div', '', 'actions');
      actions.append(button('▶ Слово', () => say(word.replaceAll('…', ' '), status)),
        button('▶ Фраза', () => say(example, status)));
      const exampleText = el('details');
      exampleText.append(el('summary', 'Пример и перевод'), zh('p', example), el('p', translation, 'note'));
      item.append(zh('b', word), el('p', py + ' · ' + meaning), actions, exampleText);
      return item;
    };
    const warmup = document.createDocumentFragment();
    data.words.filter(row => ['离','从…到…','数学','比'].includes(row[0])).forEach(word => warmup.append(card(word)));
    byId('backpack-warmup').append(warmup);
    byId('backpack-words').append(...data.words.filter(word => word[5] === 0).map(card));
    byId('backpack-story').addEventListener('click', () => say(data.dialogue.map(row => row[1]).join(' '), status));
    byId('backpack-dialogue').append(...data.dialogue.map(([name, text, py, meaning]) => {
      const scene = el('article', '', 'scene');
      const top = el('div', '', 'actions');
      top.append(el('strong', name), button('▶ Послушать реплику', () => say(text, status)));
      const script = el('details');
      script.append(el('summary', 'Открыть реплику'), zh('p', text), el('p', py, 'py'), el('p', meaning));
      scene.append(top, script);
      return scene;
    }));
    const bagAnswer = el('p', '', 'status');
    bagAnswer.setAttribute('role', 'status');
    const guesses = data.bags.map(([description, translation], i) => {
      const choice = button('', () => {
        choice.classList.add(i === 0 ? 'correct' : 'wrong');
        bagAnswer.textContent = i === 0
          ? 'Рюкзак найден! Чёрный, с учебником по математике и справа от двери.'
          : 'Одна или две приметы совпали. Сверь все три и попробуй снова.';
        if (i === 0) guesses.forEach(node => { node.disabled = true; });
      });
      choice.lang = 'zh-CN';
      choice.textContent = description;
      return choice;
    });
    const translations = el('details');
    const translationList = el('ol');
    data.bags.forEach(row => { translationList.append(el('li', row[1])); });
    translations.append(el('summary', 'Подсказка: перевести приметы'), translationList);
    byId('backpack-bags').append(...guesses, translations, bagAnswer);
    byId('backpack-builds').append(...data.builds.map(setupBuilder));
  }

  function setupBuilder({ru, tokens, answer, zh: spoken}) {
    const item = el('article', '', 'question');
    const line = el('div', '', 'answer-line');
    line.setAttribute('aria-label', 'Твой ответ');
    const bank = el('div', '', 'tokens');
    const actions = el('div', '', 'actions start');
    const feedback = el('p', '', 'status');
    feedback.setAttribute('role', 'status');
    const pieces = [];
    const chip = (word, onClick) => {
      const node = button(word, onClick);
      node.lang = 'zh-CN';
      return node;
    };

    function draw() {
      const chosen = pieces.map((index, pos) => chip(tokens[index], () => {
        pieces.splice(pos, 1);
        draw();
        bank.querySelector('button:not(:disabled)')?.focus();
      }));
      line.replaceChildren(...chosen);
      bank.replaceChildren(...tokens.map((word, index) => {
        const node = chip(word, () => {
          pieces.push(index);
          draw();
          (bank.querySelector('button:not(:disabled)') ?? check).focus();
        });
        node.disabled = pieces.includes(index);
        return node;
      }));
      check.disabled = pieces.length !== tokens.length;
      feedback.textContent = '';
      hear.hidden = true;
    }

    const hear = button('▶ Послушать фразу', () => say(spoken, feedback));
    const check = button('Проверить', () => {
      if (pieces.map(index => tokens[index]).join('') === answer) {
        feedback.textContent = 'Верно! Теперь скажи фразу вслух.';
        hear.hidden = false;
      } else {
        feedback.textContent = 'Ещё попытка. Начни с того, о чём здесь говорится.';
      }
    }, true);
    const reset = button('Собрать заново', () => { pieces.length = 0; draw(); });
    actions.append(check, reset, hear);
    item.append(el('h3', ru), line, bank, actions, feedback);
    draw();
    return item;
  }

  function dayKey(date = new Date()) {
    return new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  }

  function plusDays(key, days) {
    const date = new Date(key + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function displayDate(key) {
    return new Intl.DateTimeFormat('ru-RU', {timeZone:'UTC',day:'numeric',month:'long'}).format(new Date(key + 'T12:00:00Z'));
  }

  function readSchedule() {
    try {
      const value = JSON.parse(localStorage.getItem(storeKey));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function setupWeeks() {
    const today = dayKey();
    const active = data.weeks.findLastIndex(week => week.from <= today);
    byId('hsk2-weeks').append(...data.weeks.map((week, i) => {
      const box = el('article', '', 'week' + (i === active && today <= '2026-12-31' ? ' current' : ''));
      const header = el('div', '', 'week-head');
      header.append(el('span', week.date), el('span', week.step));
      box.append(header, el('h3', week.title));
      for (const [label, text] of [['В работе',week.fresh],['Повтор',week.repeat],['Проверка',week.check]]) {
        const p = el('p');
        p.append(el('strong', label + ' · '), document.createTextNode(text));
        box.append(p);
      }
      const link = el('a', week.link[1] + ' →');
      link.href = week.link[0];
      box.append(link);
      return box;
    }));
  }

  function setupReview() {
    const records = readSchedule();
    const card = byId('review-card');
    const status = byId('review-status');
    const start = byId('review-start');
    const extra = byId('review-extra');
    let queue = [];
    let position = 0;
    let free = false;

    function released(today) {
      return data.words.filter(word => data.weeks[Math.max(0,word[5])].from <= today);
    }

    function state(word) {
      const record = records[word[0]];
      const initial = {due: data.weeks[Math.max(0,word[5])].from, streak: 0};
      return record && /^\d{4}-\d{2}-\d{2}$/.test(record.due) && Number.isInteger(record.streak) && record.streak >= 0 ? record : initial;
    }

    function paintQueue() {
      const today = dayKey();
      const available = released(today);
      const due = available.filter(word => state(word).due <= today).length;
      status.textContent = due ? 'К повторению сегодня: ' + due + '.' : 'На сегодня всё повторено или ещё нет карточек.';
      start.disabled = due === 0;
      extra.disabled = available.length === 0;
      const next = available.map(word => [word,state(word)]).sort((a,b) => a[1].due.localeCompare(b[1].due));
      byId('review-list').replaceChildren(...next.map(([word,record]) => {
        const line = el('li');
        line.append(zh('span',word[0]),document.createTextNode(' · ' + (record.due <= today ? 'сегодня' : displayDate(record.due))));
        return line;
      }));
    }

    function begin(practice) {
      const today = dayKey();
      const candidates = released(today);
      free = practice;
      if (free) {
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i],candidates[j]] = [candidates[j],candidates[i]];
        }
        queue = candidates.slice(0,8);
      } else {
        const due = candidates.filter(word => state(word).due <= today)
          .sort((a,b) => state(a).due.localeCompare(state(b).due));
        const old = due.filter(word => word[5] < 0);
        const fresh = due.filter(word => word[5] >= 0);
        queue = [];
        while (queue.length < 8 && (old.length || fresh.length)) {
          if (fresh.length) queue.push(fresh.shift());
          if (queue.length < 8 && old.length) queue.push(old.shift());
        }
      }
      if (!queue.length) return;
      position = 0;
      card.hidden = false;
      draw();
    }

    function draw() {
      const [word, py, meaning, example, translation] = queue[position];
      const audioStatus = el('p', '', 'note');
      audioStatus.setAttribute('role','status');
      const top = el('p', (free ? 'Свободная практика · ' : 'Карточка · ') + (position + 1) + ' из ' + queue.length, 'eyebrow');
      const title = zh('h3',word);
      title.tabIndex = -1;
      const reveal = button('Показать ответ', () => {
        const results = el('div', '', 'review-choices');
        const choices = free ? [button('Дальше', () => grade(true), true)]
          : [button('Надо повторить', () => grade(false)),button('Вспомнила', () => grade(true),true)];
        results.append(...choices);
        reveal.replaceWith(el('p',py + ' · ' + meaning),zh('p',example),el('p',translation,'note'),results);
        choices[0].focus();
      }, true);
      card.replaceChildren(top,title,button('▶ Послушать', () => say(word.replaceAll('…', ' '),audioStatus)),audioStatus,reveal);
      title.focus();
    }

    function grade(correct) {
      if (!free) {
        const word = queue[position];
        const streak = state(word).streak;
        records[word[0]] = {
          due:plusDays(dayKey(),correct ? intervals[Math.min(streak,intervals.length - 1)] : 1),
          streak:correct ? Math.min(streak + 1, intervals.length - 1) : 0,
        };
        try { localStorage.setItem(storeKey, JSON.stringify(records)); } catch {}
      }
      window.LearningSpeech.stop();
      position++;
      if (position < queue.length) {
        draw();
      } else {
        card.hidden = true;
        paintQueue();
        status.textContent = 'Раунд завершён. ' + status.textContent;
        (start.disabled ? extra : start).focus();
      }
    }

    start.addEventListener('click', () => begin(false));
    extra.addEventListener('click', () => begin(true));
    paintQueue();
  }

  function setupVocabulary() {
    const rows = window.Hsk2VocabCheck;
    const level = byId('vocab-level');
    const search = byId('vocab-search');
    byId('vocab-count').textContent = String(rows.length);
    function draw() {
      const needle = search.value.trim().toLowerCase();
      const filtered = rows.filter(([grade, word, py]) => (!level.value || String(grade) === level.value) &&
        (word.includes(needle) || py.toLowerCase().includes(needle)));
      const items = filtered.map(([grade, word, py]) => {
        const row = el('li');
        row.append(zh('span',word),document.createTextNode(' · ' + py + ' · HSK ' + grade));
        return row;
      });
      byId('vocab-list').replaceChildren(...(items.length ? items : [el('li','Совпадений нет.')]));
    }
    level.addEventListener('change',draw);
    search.addEventListener('input',draw);
    draw();
  }

  function setupDiagnostic() {
    const kinds = {listen:'Аудирование',read:'Чтение',write:'Письмо'};
    const panels = byId('tryout-blanks');
    const status = byId('tryout-result');
    const results = {};
    Object.entries(kinds).forEach(([kind, title]) => {
      const launch = button(title, () => {
        window.LearningSpeech.stop();
        const questions = data.diagnostics.filter(question => question.kind === kind);
        const seen = new Set();
        let correct = 0;
        let noAudio = false;
        delete results[kind];
        status.textContent = 'Выбрано: ' + title.toLowerCase() + '.';
        const report = (index, ok) => {
          if (seen.has(index)) return;
          seen.add(index);
          correct += Number(ok);
          if (seen.size !== questions.length) return;
          results[kind] = noAudio ? 'по тексту · ' + correct + '/4' : correct + '/4';
          status.textContent = Object.entries(results).map(([key,value]) => kinds[key] + ' · ' + value).join('  |  ');
        };
        panels.replaceChildren(...questions.map((q,index) => {
          const item = el('article', '', 'question');
          const explanation = el('p', '', 'status');
          explanation.setAttribute('role','status');
          const heading = el('h3', q.q || 'Впиши иероглиф');
          heading.tabIndex = -1;
          item.append(heading);
          if (q.text) item.append(zh('p',q.text,'zh reading'));
          if (kind === 'listen') {
            const audioStatus = el('p','','note');
            const script = zh('p',q.audio,'zh reading');
            const fallback = button('Открыть текст', () => {
              noAudio = true;
              script.hidden = false;
              fallback.hidden = true;
            });
            script.hidden = true;
            item.append(button('▶ Послушать', () => say(q.audio,audioStatus)),fallback,script,audioStatus);
          }
          const choices = el('div', '', 'choices');
          if (q.options) {
            const options = q.options.map((value,i) => button(value, () => {
              options.forEach(option => { option.disabled = true; });
              options[q.answer].classList.add('correct');
              if (i !== q.answer) options[i].classList.add('wrong');
              explanation.textContent = i === q.answer ? 'Верно.' : 'Правильный ответ: ' + q.options[q.answer];
              report(index,i === q.answer);
            }));
            choices.append(...options);
          } else {
            const input = el('input', '', 'writing');
            input.maxLength = 8;
            input.setAttribute('aria-label','Впиши иероглиф: ' + q.hint);
            const check = button('Проверить', () => {
              if (!input.value.trim()) {
                explanation.textContent = 'Сначала впиши один иероглиф.';
                input.focus();
                return;
              }
              const ok = input.value.trim() === q.answer;
              input.disabled = check.disabled = solution.disabled = true;
              input.classList.add(ok ? 'correct' : 'wrong');
              explanation.textContent = ok ? 'Верно.' : 'Ответ: ' + q.answer;
              report(index,ok);
            },true);
            const solution = button('Сверить тетрадь', () => {
              explanation.textContent = 'Ответ: ' + q.answer + '. Отметь, совпало ли.';
              solution.disabled = input.disabled = check.disabled = true;
              const matches = button('Совпало', () => finishPaper(true));
              const differs = button('Нужно повторить', () => finishPaper(false));
              function finishPaper(ok) {
                matches.disabled = differs.disabled = true;
                report(index,ok);
              }
              choices.append(matches,differs);
              matches.focus();
            });
            item.append(el('p',q.hint,'py'));
            choices.append(input,check,solution);
          }
          item.append(choices,explanation);
          return item;
        }));
        panels.querySelector('h3').focus();
      },kind === 'listen');
      byId('tryout-actions').append(launch);
    });
  }

  if (document.body.dataset.prep === 'lesson') {
    setupLesson();
  } else {
    setupWeeks();
    setupReview();
    setupVocabulary();
    setupDiagnostic();
  }
})();

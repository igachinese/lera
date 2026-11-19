'use strict';

(() => {
  const data = window.Hsk2Tickets;
  const zh = 'zh-CN';
  const storageKey = 'lera.hsk2.tickets.v1';
  const byId = id => document.getElementById(id);

  function element(tag, text = '', className = '', language = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    if (language) node.lang = language;
    return node;
  }

  function button(text, action, className = 'button') {
    const node = element('button', text, className);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  function restore() {
    const asRecord = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {words: asRecord(saved?.words), recall: asRecord(saved?.recall), scores: asRecord(saved?.scores)};
    } catch {
      return {words: {}, recall: {}, scores: {}};
    }
  }

  const record = restore();
  const groups = data.words.map(set => set.map(([word, pinyin, meaning, text, translation, ...distractors]) => ({
    word, pinyin, meaning, text, translation, options: [word, ...distractors],
  })));
  const allWords = groups.flat();
  const exam = [
    {id: 'listening', title: 'Слушай у кассы', label: 'Аудирование', description: 'Услышь цену, напиток и место встречи.', tasks: data.listening},
    {id: 'reading', title: 'Прочитай билет', label: 'Чтение', description: 'Сверь время и подбери реплику.', tasks: data.reading},
    {id: 'writing', title: 'Заполни пропуск', label: 'Письмо', description: 'Выбери или впиши иероглиф.', tasks: data.writing},
  ];
  const vocabulary = ['Мнение и выбор', 'Причины и догадки', 'Планы и сравнения'].map((title, index) => ({
    id: `words-${index}`, title, label: `Урок ${index + 1}`, tasks: groups[index], vocabulary: true,
  }));
  const retry = byId('retry-words');
  const recallToggle = byId('recall-mode');
  const panel = element('div', '', 'ticket-round');
  panel.id = 'ticket-round';
  panel.hidden = true;
  let round;
  let audio;

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch {}
  }

  function missedWords() {
    const words = recallToggle.checked ? record.recall : record.words;
    return allWords.filter(task => words[task.word] === false);
  }

  function updateProgress() {
    const words = recallToggle.checked ? record.recall : record.words;
    const known = allWords.filter(task => words[task.word] === true).length;
    byId('word-progress').value = known;
    const caption = recallToggle.checked ? 'слов вспомнила сама' : 'слов с верным ответом';
    byId('word-count').textContent = `${known} из ${allWords.length} ${caption}`;
    const missed = missedWords().length;
    retry.textContent = missed ? `Повторить трудные слова · ${missed}` : 'Повторить трудные слова';
    retry.disabled = !missed;
    for (const mode of vocabulary) {
      const done = mode.tasks.filter(task => words[task.word] === true).length;
      mode.status.textContent = `${done} из ${mode.tasks.length} ${recallToggle.checked ? 'вспомнила' : 'верно'}`;
    }
    for (const mode of exam) {
      const best = record.scores[mode.id];
      mode.status.textContent = Number.isInteger(best) ? `Лучший результат · ${best} из ${mode.tasks.length}` : mode.description;
    }
  }

  function renderMode(mode) {
    const control = button('', () => activate(mode, mode.tasks, control), 'lesson-mode');
    control.setAttribute('aria-expanded', 'false');
    control.setAttribute('aria-controls', panel.id);
    mode.status = element('small');
    control.append(element('small', mode.label), element('strong', mode.title), mode.status);
    return control;
  }

  function stopSound() {
    audio?.pause();
    audio = null;
  }

  function activate(mode, tasks, launcher, isRetry = false) {
    if (!tasks.length) return;
    round?.launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    const holder = mode.vocabulary ? byId('practice') : byId('games');
    holder.append(panel);
    panel.hidden = false;
    const recall = mode.vocabulary && recallToggle.checked;
    round = {mode, tasks: shuffle(tasks), position: 0, correct: 0, missed: [], launcher, isRetry, recall};
    renderQuestion();
  }

  function setPanel(title, count = '') {
    stopSound();
    const heading = element('h3', title);
    heading.tabIndex = -1;
    const top = element('header', '', 'ticket-round-head');
    top.append(heading);
    if (count) top.append(element('span', count, 'ticket-count'));
    panel.replaceChildren(top);
    return heading;
  }

  function renderTicket() {
    const figure = element('figure', '', 'train-ticket zh', zh);
    const fields = element('dl');
    for (const [label, value] of [['路线', '北京 → 天津'], ['开车时间', '15:20'], ['票价', '20元']]) {
      const field = element('div');
      field.append(element('dt', label), element('dd', value));
      fields.append(field);
    }
    figure.append(element('figcaption', '火车票 · G205'), fields);
    return figure;
  }

  function renderAudio(task) {
    const transcript = element('details');
    transcript.hidden = true;
    transcript.append(element('summary', 'Показать диалог'), element('p', task.audio, 'ticket-transcript zh', zh));
    const status = element('p', '', 'ticket-transcript');
    status.setAttribute('role', 'status');
    audio = element('audio', '', 'ticket-audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.setAttribute('aria-label', 'Китайский диалог');
    audio.addEventListener('error', () => {
      status.textContent = 'Звук недоступен. Диалог можно прочитать.';
      transcript.hidden = false;
    });
    audio.src = task.file;
    panel.append(audio, status, transcript);
    return transcript;
  }

  function renderRecall(task, check) {
    const revealPanel = element('div', '', 'ticket-reveal');
    revealPanel.hidden = true;
    const grade = element('div', '', 'ticket-actions');
    const remembered = button('Вспомнила сама', () => check(task.word), 'button primary');
    grade.append(remembered, button('Надо повторить', () => check('')));
    revealPanel.append(element('p', task.text.replace('＿', task.word), 'ticket-reveal-line zh', zh),
      element('p', `${task.pinyin} · ${task.meaning}`, 'note'), element('p', task.translation), grade);
    const reveal = button('Открыть ответ', () => {
      reveal.hidden = true;
      revealPanel.hidden = false;
      remembered.focus();
    });
    const controls = element('div', '', 'ticket-actions');
    controls.append(reveal);
    panel.append(controls, revealPanel);
    return grade;
  }

  function renderQuestion() {
    const {mode, position, tasks, recall} = round;
    const task = tasks[position];
    const heading = setPanel(mode.title, `Задание ${position + 1} из ${tasks.length}`);
    let transcript;
    if (task.ticket) panel.append(renderTicket());
    if (task.audio) transcript = renderAudio(task);
    if (task.text) panel.append(element('p', task.text, 'ticket-stimulus zh', zh));
    if (task.prompt) {
      panel.append(element('p', task.prompt, 'ticket-prompt', /\p{Script=Han}/u.test(task.prompt) && !/[А-Яа-я]/u.test(task.prompt) ? zh : ''));
    }

    const feedback = element('div', '', 'ticket-feedback');
    feedback.setAttribute('role', 'status');
    const actions = element('div', '', 'ticket-actions');
    const next = button(position + 1 < tasks.length ? 'Дальше →' : 'К результату →', () => {
      round.position++;
      if (round.position < round.tasks.length) renderQuestion();
      else renderSummary();
    }, 'button primary');
    next.hidden = true;
    actions.append(next);

    const choices = new Map();
    const options = element('div', '', 'ticket-options');
    const answer = task.answer ?? task.options[0];
    let answered = false;
    let form;
    let recallGrade;
    function check(value) {
      if (answered) return;
      answered = true;
      const correct = value === answer;
      if (correct) round.correct++;
      else round.missed.push(task);
      if (task.word) {
        const words = recall ? record.recall : record.words;
        words[task.word] = correct;
        save();
        updateProgress();
      }
      feedback.dataset.correct = String(correct);
      if (recall) {
        recallGrade.hidden = true;
        feedback.append(element('strong', correct ? 'Слово вспомнила сама.' : 'Добавлено к трудным словам.'));
      } else if (task.word) {
        feedback.append(
          element('strong', correct ? 'Верно!' : `Правильный ответ — ${answer}`),
          element('p', task.text.replace('＿', task.word), 'zh', zh),
          element('p', task.translation),
          element('p', `${task.pinyin} · ${task.meaning}`, 'note'),
        );
      } else {
        feedback.append(element('strong', correct ? 'Верно!' : `Правильный ответ — ${answer}`), element('p', task.explanation));
      }
      if (transcript) transcript.hidden = false;
      if (form) for (const control of form.elements) control.disabled = true;
      for (const [option, control] of choices) {
        control.disabled = true;
        if (option === answer) control.classList.add('correct');
        else if (option === value) control.classList.add('wrong');
      }
      next.hidden = false;
      next.focus({preventScroll: true});
    }

    if (recall) {
      recallGrade = renderRecall(task, check);
    } else if (task.options) {
      shuffle(task.options).forEach((option, index) => {
        const choice = button('', () => check(option));
        const letter = element('span', 'ABC'[index], 'choice-letter');
        choice.append(letter, element('span', option, 'zh', zh));
        choices.set(option, choice);
        options.append(choice);
      });
      panel.append(options);
    } else {
      form = element('form', '', 'ticket-actions');
      const input = element('input', '', 'writing ticket-input', zh);
      input.required = true;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('aria-label', 'Один китайский иероглиф');
      const submit = element('button', 'Проверить', 'button primary');
      form.addEventListener('submit', event => {
        event.preventDefault();
        const value = input.value.trim();
        if (value) check(value);
      });
      form.append(input, submit);
      panel.append(form);
      const paper = element('details');
      const selfCheck = element('div', '', 'ticket-actions');
      selfCheck.hidden = true;
      const reveal = button('Показать иероглиф', () => {
        reveal.hidden = true;
        selfCheck.hidden = false;
        selfCheck.querySelector('button').focus();
      });
      selfCheck.append(
        element('strong', answer, 'zh', zh),
        button('Мой ответ совпал', () => check(answer)),
        button('Надо повторить', () => check('')),
      );
      paper.append(element('summary', 'Пишу в тетради'), element('p', 'Запиши иероглиф, затем сверься с ответом.'), reveal, selfCheck);
      panel.append(paper);
    }
    panel.append(feedback, actions);
    heading.focus();
  }

  function renderSummary() {
    const {mode, tasks, correct, missed, launcher, isRetry, recall} = round;
    const heading = setPanel(mode.title + ' · результат');
    if (!mode.vocabulary && !isRetry) {
      record.scores[mode.id] = Math.max(record.scores[mode.id] || 0, correct);
      save();
      updateProgress();
    }
    panel.append(element('p', `${correct} из ${tasks.length} ${recall ? 'вспомнила сама' : 'верно'}`, 'round-score'));
    if (missed.length && mode.vocabulary) {
      panel.append(element('p', missed.map(task => task.word).join(' · '), 'zh', zh));
    }
    const actions = element('div', '', 'ticket-actions');
    if (missed.length) {
      actions.append(button('Повторить ошибки раунда', () => activate(mode, missed, launcher, true), 'button primary'));
    }
    actions.append(button('К выбору заданий ↑', () => {
      panel.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
      if (launcher.disabled) byId('practice-title').scrollIntoView();
      else launcher.focus();
      round = null;
    }));
    panel.append(actions);
    heading.focus();
  }

  function setupOrder() {
    const target = byId('order-builder');
    const phrase = ['你想喝', '咖啡', '还是', '奶茶', '？'];
    const selected = [];
    const line = element('p', '', 'answer-line ticket-order-line zh', zh);
    line.setAttribute('aria-live', 'polite');
    const bank = element('div', '', 'ticket-options');
    const status = element('p', '', 'ticket-feedback');
    status.setAttribute('role', 'status');
    const undo = button('Убрать последний фрагмент', () => {
      selected.pop().disabled = false;
      update();
    });
    const check = button('Проверить заказ', () => {
      const correct = [phrase.join(''), '你想喝奶茶还是咖啡？'].includes(line.textContent);
      status.textContent = correct
        ? 'Верно! Теперь спроси вслух, поменяв напитки местами.'
        : 'Подумай, где должно стоять 还是. Оно соединяет два варианта.';
    }, 'button primary');
    function update() {
      line.textContent = selected.map(control => control.textContent).join('');
      undo.disabled = selected.length === 0;
      check.disabled = selected.length !== phrase.length;
      status.textContent = '';
    }
    for (const part of shuffle(phrase)) {
      const control = button(part, () => {
        selected.push(control);
        control.disabled = true;
        update();
        const next = [...bank.children].find(item => !item.disabled);
        (next || check).focus({preventScroll: true});
      }, 'button zh');
      control.lang = zh;
      bank.append(control);
    }
    const actions = element('div', '', 'ticket-actions');
    actions.append(check, undo);
    target.append(line, bank, actions, status);
    update();
  }

  byId('word-rounds').append(...vocabulary.map(renderMode));
  byId('exam-rounds').append(...exam.map(renderMode));
  recallToggle.addEventListener('change', () => {
    byId('word-instructions').textContent = recallToggle.checked
      ? 'Вставь слово вслух, открой ответ и отметь, удалось ли вспомнить его самой.'
      : 'Выбери слово для пропуска. В каждом раунде восемь фраз с переводом после ответа.';
    if (round?.mode.vocabulary) {
      round.launcher.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      round = null;
    }
    updateProgress();
  });
  retry.setAttribute('aria-controls', panel.id);
  retry.setAttribute('aria-expanded', 'false');
  retry.addEventListener('click', () => activate({title: 'Трудные слова', vocabulary: true}, missedWords(), retry, true));
  byId('practice').append(panel);
  updateProgress();
  setupOrder();
})();

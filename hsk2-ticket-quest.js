'use strict';

(() => {
  const journeys = window.Hsk2TicketJourneys;
  const app = document.getElementById('journey-app');
  const storageKey = 'lera.hsk2.ticket-journey.v1';
  const checkpoints = ['Билет', 'Кафе', 'Посадка', 'В поезде'];
  const chinese = 'zh-CN';
  let route = journeys[0];
  let progress = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    route = journeys.find(item => item.id === saved?.route) || route;
    for (const item of journeys) {
      const step = saved?.progress?.[item.id];
      if (Number.isInteger(step) && step >= 0 && step <= 3) progress[item.id] = step;
    }
  } catch {}

  function node(tag, text = '', className = '', lang = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    if (lang) element.lang = lang;
    return element;
  }

  function button(text, action, className = 'button') {
    const control = node('button', text, className);
    control.type = 'button';
    control.addEventListener('click', action);
    return control;
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({route: route.id, progress}));
    } catch {}
  }

  function breakdown(label, line, pinyin, translation) {
    const details = node('details', '', 'quest-help');
    details.append(node('summary', label), node('p', line, 'zh', chinese),
      node('p', pinyin, 'note'), node('p', translation));
    return details;
  }

  function player(kind, label, fallback) {
    const audio = node('audio', '', 'ticket-audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = `assets/tickets/${route.id}-${kind}.mp3`;
    audio.setAttribute('aria-label', label);
    audio.addEventListener('error', () => { fallback.open = true; });
    return audio;
  }

  function ticket(train) {
    const paper = node('figure', '', 'quest-ticket zh', chinese);
    const fields = node('dl');
    for (const [label, value] of [['开车时间', train.time], ['检票口', train.gate], ['票价', train.price + ' 元']]) {
      const field = node('div');
      field.append(node('dt', label), node('dd', value));
      fields.append(field);
    }
    paper.append(node('figcaption', `电子车票 · ${train.number}`),
      node('p', `${route.origin} → ${route.destination}`, 'quest-ticket-route'), fields);
    return paper;
  }

  function choose(stage, options, advance) {
    const list = node('div', '', 'quest-options');
    const status = node('div', '', 'quest-feedback');
    status.setAttribute('role', 'status');
    const next = button(['Купить напиток →', 'Найти выход →', 'Сесть в поезд →'][stage], () => {
      progress[route.id] = stage + 1;
      save();
      render(true);
    }, 'button primary');
    next.hidden = true;

    for (const option of options) {
      const control = button('', () => {
        if (!option.correct) {
          control.dataset.result = 'wrong';
          status.textContent = option.feedback;
          return;
        }
        for (const item of list.children) item.disabled = true;
        control.dataset.result = 'correct';
        status.textContent = advance;
        next.hidden = false;
        next.focus({preventScroll: true});
      }, 'quest-choice');
      control.append(node('strong', option.title, 'zh', option.lang));
      if (option.detail) control.append(node('span', option.detail));
      list.append(control);
    }
    return [list, status, next];
  }

  function renderCounter(body, train) {
    const transcript = breakdown('Разобрать объявление', route.announcement, route.scriptPinyin, route.scriptRu);
    body.append(node('p', 'Послушай объявление и выбери рейс с нужным временем отправления.'),
      player('announcement', 'Объявление на вокзале', transcript),
      ...choose(0, route.trains.map(option => ({
        title: option.number,
        detail: `${option.time} · ${option.price} ¥`,
        correct: option.number === train.number,
        feedback: `У рейса ${option.number} отправление в ${option.time}. ${route.listeningHint}`,
      })), `Билет куплен за ${train.price} ¥. На напиток осталось ${route.budget - train.price} ¥.`),
      transcript);
  }

  function renderCafe(body, train, drink) {
    const remaining = route.budget - train.price;
    body.append(node('p', 'Прочитай заказ. Выбери напиток, на который хватает денег.'),
      node('p', route.order, 'ticket-stimulus zh', chinese),
      ...choose(1, route.drinks.map(option => ({
        title: option.name,
        lang: chinese,
        detail: option.price + ' ¥',
        correct: option.name === drink.name,
        feedback: option.price > remaining
          ? `Напиток выбран верно, но он стоит ${option.price} ¥. У тебя ${remaining} ¥. Сравни 大杯 и 小杯.`
          : option.why,
      })), `Заказ готов. После покупки осталось ${remaining - drink.price} ¥.`),
      breakdown('Разобрать заказ', route.order, route.orderPinyin, route.orderRu));
  }

  function renderGate(body, train) {
    const answer = train.gate + ' 检票口';
    body.append(node('p', 'На билете указан выход. Найди такую же надпись на указателе.'),
      ticket(train),
      ...choose(2, route.gates.map(sign => ({
        title: sign,
        lang: chinese,
        correct: sign === answer,
        feedback: sign.endsWith('候车室')
          ? '候车室 — зал ожидания. Ищи 检票口, где проверяют билеты.'
          : 'На указателе есть 检票口, но номер другой. Сверь код на билете.',
      })), `Нашла выход ${train.gate}. Посадка открыта!`));
  }

  function renderArrival(body, train, drink) {
    const model = breakdown('Свериться с образцом и пиньинем', route.speaking, route.speakingPinyin, route.speakingRu);
    model.append(player('model', 'Пример голосового сообщения', model));
    const illustration = node('img', '', 'quest-arrival-image');
    illustration.src = 'assets/tickets/onboard.webp';
    illustration.alt = 'Подруги у окна в отправляющемся поезде';
    body.append(illustration,
      node('p', `Рейс ${train.number} · ${train.time} · остаток ${route.budget - train.price - drink.price} ¥`, 'quest-receipt'),
      node('h4', 'Голосовое подруге'),
      node('p', 'Представь, что записываешь голосовое. Скажи по-китайски, что уже купила билет, во сколько отправляется поезд и какой напиток ты взяла.'),
      node('p', 'Начни с этой фразы.', 'quest-speaking-start'), node('p', '我已经买好票了。', 'zh', chinese), model,
      node('p', route.transfer, 'quest-transfer'),
      button('Пройти этот маршрут заново', () => {
        progress[route.id] = 0;
        save();
        render(true);
      }));
  }

  function render(focus = false) {
    for (const audio of app.querySelectorAll('audio')) audio.pause();
    const stage = progress[route.id] ?? 0;
    const train = route.trains.find(item => item.number === route.route);
    const drink = route.drinks.find(item => item.name === route.drink);
    const balance = route.budget - (stage >= 1 ? train.price : 0) - (stage >= 2 ? drink.price : 0);
    const layout = node('div', '', 'quest-shell');
    const bar = node('div', '', 'quest-bar');
    const destinations = node('div', '', 'quest-destinations');
    destinations.setAttribute('role', 'group');
    destinations.setAttribute('aria-label', 'Маршрут');
    for (const item of journeys) {
      const control = button(item.title, () => {
        if (route === item) return;
        route = item;
        save();
        render(true);
      });
      control.setAttribute('aria-pressed', String(route === item));
      destinations.append(control);
    }
    bar.append(destinations, node('p', `Кошелёк: ${balance} ¥`, 'quest-wallet'));
    const steps = node('ol', '', 'quest-steps');
    steps.setAttribute('aria-label', 'Остановки по пути к поезду');
    checkpoints.forEach((label, index) => {
      const step = node('li', label);
      if (index < stage) step.dataset.done = 'true';
      if (index === stage) step.setAttribute('aria-current', 'step');
      steps.append(step);
    });
    const body = node('div', '', 'quest-body');
    const heading = node('h3', ['Послушай на вокзале', 'Зайди в кафе', 'Сверь билет', 'Ты в поезде!'][stage]);
    heading.tabIndex = -1;
    body.append(heading);
    [renderCounter, renderCafe, renderGate, renderArrival][stage](body, train, drink);
    layout.append(bar, steps, body);
    app.replaceChildren(layout);
    if (focus) heading.focus();
  }

  document.addEventListener('play', event => {
    if (!(event.target instanceof HTMLAudioElement)) return;
    for (const other of document.querySelectorAll('audio')) {
      if (other !== event.target) other.pause();
    }
  }, true);
  render();
})();

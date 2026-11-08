/* Shared Chinese speech controls for Askar's student pages. */
(() => {
  'use strict';
  const KEY='lera.speech.v2';
  const engine=window.speechSynthesis;
  const controls=[];
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
  let rate=[.65,.7].includes(Number(saved.rate))?Number(saved.rate):.65;
  let preferredURI=saved.voice||'',manual=Boolean(saved.voice),voices=[],selected=null,status='',active=null,token=0;
  const isChinese=v=>/^(zh|cmn)([-_]|$)/i.test(v.lang);
  const isXiaoyi=v=>/xiaoyi|晓伊/i.test(v.name);
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({voice:manual?preferredURI:'',rate}))}catch{}};
  function update(){
    controls.forEach(c=>{
      if(c.voiceSelect){
        const old=[...c.voiceSelect.options].map(x=>x.value).join('|');
        const current=voices.map(x=>x.voiceURI).join('|');
        if(old!==current||!voices.length){
          c.voiceSelect.replaceChildren();
          if(!voices.length){const o=new Option(engine?'Китайский голос не найден':'Озвучка недоступна','');c.voiceSelect.add(o)}
          voices.forEach(v=>c.voiceSelect.add(new Option((isXiaoyi(v)?'★ Xiaoyi · основной':v.name)+' · '+v.lang,v.voiceURI)));
        }
        c.voiceSelect.value=selected?.voiceURI||'';c.voiceSelect.disabled=!voices.length;
      }
      if(c.rateSelect)c.rateSelect.value=String(rate);
      if(c.status)c.status.textContent=status||(!engine?'Этот браузер не поддерживает озвучку.':!voices.length?'Китайский голос не найден. Попробуйте Microsoft Edge или выберите голос после его загрузки.':isXiaoyi(selected)?'Xiaoyi · основной голос · '+String(rate).replace('.',',')+'×':'Xiaoyi здесь недоступен. Выбран '+selected.name+'. Можно сменить голос выше.');
    });
    window.dispatchEvent(new CustomEvent('leravoicechange',{detail:{available:voices.length>0}}));
  }
  function load(){
    voices=engine?engine.getVoices().filter(isChinese):[];
    voices.sort((a,b)=>Number(isXiaoyi(b))-Number(isXiaoyi(a))||Number(/xiaoxiao|晓晓|yunxia|云夏/i.test(b.name))-Number(/xiaoxiao|晓晓|yunxia|云夏/i.test(a.name))||a.name.localeCompare(b.name));
    selected=(manual&&voices.find(v=>v.voiceURI===preferredURI))||voices.find(isXiaoyi)||voices.find(v=>/CN|Hans/i.test(v.lang))||voices[0]||null;
    update();return voices.length;
  }
  async function ready(){
    if(load())return true;
    await new Promise(resolve=>{let done=false;const end=()=>{if(done)return;done=true;engine?.removeEventListener('voiceschanged',end);resolve()};engine?.addEventListener('voiceschanged',end);setTimeout(end,1200)});
    return load()>0;
  }
  function stop(){token++;if(active){clearTimeout(active.watchdog);active.resolve(false);active=null}engine?.cancel()}
  async function speak(text){
    stop();const myToken=token;
    if(!await ready()){status='Не удалось включить китайский голос. Выберите другой голос сверху или откройте сайт в Edge.';update();return false}
    if(myToken!==token)return false;
    return new Promise(resolve=>{
      const tried=new Set();
      function run(voice){
        if(myToken!==token){resolve(false);return}
        tried.add(voice.voiceURI);let started=false,settled=false;
        const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=rate;u.pitch=1;
        const finish=ok=>{if(settled)return;settled=true;clearTimeout(active?.watchdog);active=null;resolve(ok)};
        const fail=()=>{
          if(settled||myToken!==token)return;settled=true;clearTimeout(active?.watchdog);engine.cancel();
          const fallback=tried.size<3?voices.find(v=>!tried.has(v.voiceURI)):null;
          if(fallback){selected=fallback;preferredURI=fallback.voiceURI;manual=true;save();status='Голос не ответил. Пробуем '+fallback.name+'.';update();run(fallback)}
          else{status='Звук не запустился. Выберите голос сверху и нажмите «Проверить звук». Сейчас доступны задания без аудио.';update();active=null;resolve(false)}
        };
        u.onstart=()=>{started=true;status='';update()};u.onend=()=>finish(true);u.onerror=event=>{if(event.error==='interrupted'||event.error==='canceled'){finish(false)}else fail()};
        active={utterance:u,resolve:finish,watchdog:setTimeout(()=>{if(!started)fail()},5000)};engine.speak(u);
      }
      run(selected);
    });
  }
  function bind(control){
    controls.push(control);
    control.voiceSelect?.addEventListener('change',e=>{stop();manual=true;preferredURI=e.target.value;selected=voices.find(v=>v.voiceURI===preferredURI)||selected;status='';save();update()});
    control.rateSelect?.addEventListener('change',e=>{stop();rate=Number(e.target.value)===.7?.7:.65;status='';save();update()});
    control.testButton?.addEventListener('click',()=>speak('你好，阿斯凯！加油！'));
    load();return control;
  }
  engine?.addEventListener('voiceschanged',load);load();
  window.LearningSpeech={bind,speak,stop,ready,available:()=>voices.length>0,getVoice:()=>selected?.name||'',getRate:()=>rate};
})();

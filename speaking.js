/* Navigation and self-reported practice marks, independent of exercise grading. */
(() => {
 'use strict';
 const key='lera.speaking.sections.v1';let done=[];
 try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))done=value.filter(id=>STATIONS.some(s=>s.id===id))}catch{}
 const $=id=>document.getElementById(id);let active='review';
 function save(){try{localStorage.setItem(key,JSON.stringify(done))}catch{}}
 function paint(){
  const index=STATIONS.findIndex(s=>s.id===active);
  $('station-done').checked=done.includes(active);$('station-prev').disabled=index===0;$('station-next').disabled=index===STATIONS.length-1;
  $('speaking-completed').textContent=done.length+' из 7 разделов отмечено';
  STATIONS.forEach(s=>{const tab=$('tab-'+s.id),panel=$('st-'+s.id);tab.classList.toggle('done',done.includes(s.id));tab.tabIndex=s.id===active?0:-1;panel.setAttribute('aria-labelledby',tab.id)});
 }
 function stopTimer(){if(typeof radarTimer!=='undefined'&&radarTimer){clearInterval(radarTimer);radarTimer=null;const button=$('radarTimerBtn');if(button)button.textContent='⏱️ 45 сек: Старт';$('radarTimerWrap').hidden=true}}
 function show(id,scroll=false){
  if(!STATIONS.some(s=>s.id===id))id='review';
  active=id;stopTimer();window.LearningSpeech.stop();openTab(id);paint();
  if(scroll)$('lesson-content').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 }
 document.addEventListener('speaking-station',e=>{active=e.detail;paint();if(location.hash!=='#'+active)history.replaceState(null,'','#'+active);stopTimer();window.LearningSpeech.stop()});
 STATIONS.forEach((s,i)=>{
  const tab=$('tab-'+s.id);tab.onclick=()=>show(s.id,true);
  tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%STATIONS.length;if(e.key==='ArrowLeft')next=(i+STATIONS.length-1)%STATIONS.length;if(e.key==='Home')next=0;if(e.key==='End')next=STATIONS.length-1;if(next!==undefined){e.preventDefault();show(STATIONS[next].id);$('tab-'+STATIONS[next].id).focus()}});
 });
 $('station-done').onchange=e=>{done=done.filter(id=>id!==active);if(e.target.checked)done.push(active);save();paint()};
 $('station-prev').onclick=()=>show(STATIONS[Math.max(0,STATIONS.findIndex(s=>s.id===active)-1)].id,true);
 $('station-next').onclick=()=>show(STATIONS[Math.min(STATIONS.length-1,STATIONS.findIndex(s=>s.id===active)+1)].id,true);
 $('hero-talk').onclick=e=>{e.preventDefault();show('talk',true)};
 addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(STATIONS.some(s=>s.id===id))show(id,true)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTimer();window.LearningSpeech.stop()}});
 addEventListener('pagehide',()=>{stopTimer();window.LearningSpeech.stop()});show(location.hash.slice(1));
})();

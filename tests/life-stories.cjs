const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'data/life-stories.json'))),source=JSON.parse(fs.readFileSync(path.join(root,data.source))),engine=require('../life-stories.js');
const words=new Set(source.topics.flatMap(t=>(t.words||t.w).map(w=>w[0])));
assert(engine.validate(data,source,data.student));assert.throws(()=>engine.validate(data,source,'another-student'));
const targets=new Set(data.items.map(q=>q.target));assert.equal(targets.size,data.targets);assert.equal(words.size,data.dictionarySize);assert(targets.size/words.size>=.25);
// Dynamic segmentation ensures Chinese dialogue introduces no new vocabulary, even function words.
function known(text){const hanzi=text.replace(/[^\p{Script=Han}]/gu,'');const ok=Array(hanzi.length+1).fill(false);ok[0]=true;for(let i=0;i<hanzi.length;i++)if(ok[i])for(const w of words)if(hanzi.startsWith(w,i))ok[i+w.length]=true;return ok.at(-1);}
for(const q of data.items){assert(q.scene>=0&&q.scene<4);assert(known(q.dialogue.replace('___',q.target)),q.id+' '+q.dialogue);assert(q.prompt&&q.outcome);assert.equal(q.choices.filter(x=>x===q.target).length,1);}
const picked=engine.choose(data.items,[],()=>.3);assert.equal(picked.length,6);assert.equal(new Set(picked.map(x=>x.id)).size,6);const next=engine.choose(data.items,picked.map(x=>x.id),()=>.2);assert(next.every(q=>!picked.includes(q)));
const rows=[{id:'1',target:[...targets][0],correct:true,hint:false},{id:'2',target:[...targets][1],correct:true,hint:true},{id:'3',target:[...targets][2],correct:false,hint:false}];assert.deepEqual(engine.summary(rows),{correct:2,total:3,independent:1,percent:67});
const p=engine.applyRound({rounds:[{kind:'choice',correct:1,total:1}],correct:1,attempts:1,words:{},days:[],writing:{'我':1}},rows,Date.now());assert.equal(p.correct,3);assert.equal(p.attempts,4);assert.equal(p.rounds.length,2);assert.equal(p.rounds[1].independent,1);assert(p.words[rows[2].target].weak);assert.equal(p.writing['我'],1);
assert(fs.readFileSync(path.join(root,'practice.js'),'utf8').includes('life-stories.html'));assert(fs.statSync(path.join(root,'assets/life-stories/scenes.webp')).size>10000);
console.log(`${data.name}: ${data.items.length} situations, ${targets.size}/${words.size} words (${(targets.size/words.size*100).toFixed(1)}%), personal lexicon, dialogue, unique round, grading, existing progress preservation OK`);

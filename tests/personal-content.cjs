const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const bank=JSON.parse(fs.readFileSync(path.join(root,'data/grammar.json')));
const source=JSON.parse(fs.readFileSync(path.join(root,bank.source)));
const ids=new Set(source.topics.map(t=>t.id));
const vocabulary=new Set(source.topics.flatMap(t=>(t.w||t.words).map(w=>w[0])).concat(bank.foundation));
function known(s){const reachable=new Set([0]);for(let i=0;i<s.length;i++)if(reachable.has(i))for(const w of vocabulary)if(s.startsWith(w,i))reachable.add(i+w.length);return reachable.has(s.length)}
assert.equal(bank.source,`data/${bank.student}.json`);
for(const q of bank.exercises){assert(q.topics.length);assert(q.topics.every(id=>ids.has(id)),q.ru);assert(q.tokens.concat(q.choices).every(known),q.ru);assert(q.choices.includes(q.tokens[q.blank]),q.ru)}
if(bank.student!=='askar')assert(!/足球|我有球|шахмат|Конь ходит|люблю футбол/.test(JSON.stringify(bank)));
const code=fs.readFileSync(path.join(root,'practice.js'),'utf8');
assert(code.includes("bank.student!=='"+bank.student+"'"));
assert(!code.includes('rows.length?rows:GRAMMAR'));
assert(code.includes('shuffle(ownTones())'));
console.log(`Personal content isolation passed: ${bank.student}, ${bank.exercises.length} exercises; all topics and vocabulary checked.`);

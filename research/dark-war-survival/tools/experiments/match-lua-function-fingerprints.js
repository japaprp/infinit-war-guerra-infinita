const fs=require("fs"),path=require("path");
const root="C:/Users/AMORIM/Downloads/DarkWar_Analysis_Core";
const file=path.join(root,"validation-reports/LUA_FUNCTION_FINGERPRINT_INVENTORY_2026-10-30-functions.csv");
function parseLine(line){const out=[];let s="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'&&line[i+1]==='"'){s+='"';i++;}else if(c==='"'){q=false;}else{s+=c;}}else if(c==='"'){q=true;}else if(c===','){out.push(s);s="";}else{s+=c;}}out.push(s);return out;}
const lines=fs.readFileSync(file,"utf8").replace(/^\uFEFF/,"").trimEnd().split(/\r?\n/);
const header=parseLine(lines.shift());const ix=Object.fromEntries(header.map((x,i)=>[x,i]));
const rows=lines.map(line=>{const v=parseLine(line);return Object.fromEntries(header.map((h,i)=>[h,v[i]??""]));});
const modules=[...new Set(rows.filter(x=>x.luaVersion==="5.5").map(x=>x.moduleKey))].sort();
const cut=Math.floor(modules.length*2/3),train=new Set(modules.slice(0,cut)),test=new Set(modules.slice(cut));
const groups=new Map();
for(const r of rows){
 const key=[r.moduleKey,r.depth,r.lineDefined,r.lastLineDefined,r.numParams,r.isVararg,r.maxStackSize,r.instructionCount,r.constantCount,r.constantFingerprint,r.upvalueCount,r.childPrototypeCount].join("|");
 if(!groups.has(key))groups.set(key,[]);
 groups.get(key).push(r);
}
const pairs=[];let ambiguous=0;
for(const g of groups.values()){const a=g.filter(x=>x.luaVersion==="5.4"),b=g.filter(x=>x.luaVersion==="5.5");if(a.length===1&&b.length===1)pairs.push({moduleKey:a[0].moduleKey,a:a[0],b:b[0]});else if(a.length&&b.length)ambiguous++;}
function ids(s){return s? s.split(";").map(Number):[];}
const map=new Map();let trainFns=0,trainPos=0;
for(const p of pairs){if(!train.has(p.moduleKey))continue;const a=ids(p.a.opcodeIds),b=ids(p.b.opcodeIds);if(a.length!==b.length)continue;trainFns++;for(let i=0;i<a.length;i++){trainPos++;if(!map.has(b[i]))map.set(b[i],new Map());const m=map.get(b[i]);m.set(a[i],(m.get(a[i])||0)+1);}}
let testFns=0,testPos=0,covered=0,correct=0,wrong=0;const unseen=new Set();
for(const p of pairs){if(!test.has(p.moduleKey))continue;const a=ids(p.a.opcodeIds),b=ids(p.b.opcodeIds);if(a.length!==b.length)continue;testFns++;for(let i=0;i<a.length;i++){testPos++;const m=map.get(b[i]);if(!m){unseen.add(b[i]);continue;}covered++;let best=null,bestCount=-1;for(const [k,v] of m){if(v>bestCount){best=k;bestCount=v;}}if(best===a[i])correct++;else wrong++;}}
const conflicts=[...map].filter(([k,v])=>v.size>1).map(([k])=>k);
const result={pairedModuleKeys:modules.length,trainModules:train.size,testModules:test.size,uniqueFunctionPairs:pairs.length,ambiguousFingerprintGroups:ambiguous,trainFunctions:trainFns,trainInstructionPositions:trainPos,trainDistinctLua55Ids:map.size,trainConflictingIds:conflicts.length,testFunctions:testFns,testInstructionPositions:testPos,testCoveredPositions:covered,testCorrect:correct,testWrong:wrong,testCoveragePct:+(100*covered/testPos).toFixed(3),accuracyOnCoveredPct:+(100*correct/covered).toFixed(3),unseenTestIds:[...unseen].sort((a,b)=>a-b)};
const out=path.join(root,"validation-reports/LUA_FUNCTION_FINGERPRINT_HOLDOUT_2026-10-30.json");fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
process.stdout.write(JSON.stringify(result,null,2)+"\n");

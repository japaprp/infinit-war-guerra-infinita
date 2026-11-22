const fs=require("fs"),path=require("path");
const root="C:/Users/AMORIM/Downloads/DarkWar_Analysis_Core";
const file=path.join(root,"validation-reports/LUA_FUNCTION_FINGERPRINT_INVENTORY_2026-10-30-functions.csv");
function parseLine(line){const out=[];let s="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'&&line[i+1]==='"'){s+='"';i++;}else if(c==='"'){q=false;}else{s+=c;}}else if(c==='"'){q=true;}else if(c===','){out.push(s);s="";}else{s+=c;}}out.push(s);return out;}
const lines=fs.readFileSync(file,"utf8").replace(/^\uFEFF/,"").trimEnd().split(/\r?\n/);
const header=parseLine(lines.shift());
const rows=lines.map(line=>{const v=parseLine(line);return Object.fromEntries(header.map((h,i)=>[h,v[i]??""]));});
const names54=["MOVE","LOADI","LOADF","LOADK","LOADKX","LOADFALSE","LFALSESKIP","LOADTRUE","LOADNIL","GETUPVAL","SETUPVAL","GETTABUP","GETTABLE","GETI","GETFIELD","SETTABUP","SETTABLE","SETI","SETFIELD","NEWTABLE","SELF","ADDI","ADDK","SUBK","MULK","MODK","POWK","DIVK","IDIVK","BANDK","BORK","BXORK","SHRI","SHLI","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","MMBIN","MMBINI","MMBINK","UNM","BNOT","NOT","LEN","CONCAT","CLOSE","TBC","JMP","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET","CALL","TAILCALL","RETURN","RETURN0","RETURN1","FORLOOP","FORPREP","TFORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","VARARGPREP","EXTRAARG"];
const noA=new Set(["SETUPVAL","SETTABUP","SETTABLE","SETI","SETFIELD","MMBIN","MMBINI","MMBINK","CLOSE","TBC","JMP","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","RETURN","RETURN0","RETURN1","TFORPREP","TFORCALL","SETLIST","VARARGPREP","EXTRAARG"]);
const groups=new Map();
for(const r of rows){const key=[r.moduleKey,r.depth,r.lineDefined,r.lastLineDefined,r.numParams,r.isVararg,r.maxStackSize,r.instructionCount,r.constantCount,r.constantFingerprint,r.upvalueCount,r.childPrototypeCount].join("|");if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
const pairs=[];let ambiguous=0;
for(const g of groups.values()){const a=g.filter(x=>x.luaVersion==="5.4"),b=g.filter(x=>x.luaVersion==="5.5");if(a.length===1&&b.length===1)pairs.push({moduleKey:a[0].moduleKey,a:a[0],b:b[0]});else if(a.length&&b.length)ambiguous++;}
const map=new Map();
for(const p of pairs){const a=p.a.opcodeIds.split(";").map(Number),b=p.b.opcodeIds.split(";").map(Number);if(a.length!==b.length)continue;for(let i=0;i<a.length;i++){if(!map.has(b[i]))map.set(b[i],new Map());const m=map.get(b[i]);m.set(a[i],(m.get(a[i])||0)+1);}}
const conflicts=[...map].filter(([id,m])=>m.size>1).map(([id])=>id);
const fullMapping=new Map();for(const [id,m] of map){let best=null,count=-1;for(const [target,n] of m){if(n>count){best=target;count=n;}}if(m.size===1)fullMapping.set(id,best);}
const moduleKeys=[...new Set(rows.filter(x=>x.luaVersion==="5.5").map(x=>x.moduleKey))].sort();
const cut=Math.floor(moduleKeys.length*2/3),train=new Set(moduleKeys.slice(0,cut)),test=new Set(moduleKeys.slice(cut));
const trainMap=new Map();let trainFns=0,trainPositions=0;
for(const p of pairs){if(!train.has(p.moduleKey))continue;const a=p.a.opcodeIds.split(";").map(Number),b=p.b.opcodeIds.split(";").map(Number);if(a.length!==b.length)continue;trainFns++;for(let i=0;i<a.length;i++){trainPositions++;if(!trainMap.has(b[i]))trainMap.set(b[i],new Map());const m=trainMap.get(b[i]);m.set(a[i],(m.get(a[i])||0)+1);}}
let testFns=0,testPositions=0,testCovered=0,testCorrect=0,testWrong=0;const unseen=new Set();
for(const p of pairs){if(!test.has(p.moduleKey))continue;const a=p.a.opcodeIds.split(";").map(Number),b=p.b.opcodeIds.split(";").map(Number);if(a.length!==b.length)continue;testFns++;for(let i=0;i<a.length;i++){testPositions++;const m=trainMap.get(b[i]);if(!m){unseen.add(b[i]);continue;}testCovered++;let best=null,count=-1;for(const [target,n] of m){if(n>count){best=target;count=n;}}if(best===a[i])testCorrect++;else testWrong++;}}
let mapped=0,aChecked=0,aInvalid=0;const aInvalidByName={};let constChecked=0,constInvalid=0;const constInvalidByName={};let upChecked=0,upInvalid=0,protoChecked=0,protoInvalid=0;let loadKx=0,loadKxExtraOk=0,loadKxExtraBad=0;let testSkipChecks=0,testSkipInvalid=0,lfalseChecks=0,lfalseInvalid=0,newTableExtraChecks=0,newTableExtraInvalid=0,setListExtraChecks=0,setListExtraInvalid=0,extraArgChecks=0,extraArgInvalid=0,tforPrepChecks=0,tforPrepInvalid=0,tforCallChecks=0,tforCallInvalid=0,jumpChecks=0,jumpInvalid=0;
const byTarget={};
for(const fn of rows.filter(x=>x.luaVersion==="5.5")){
 const ids=fn.opcodeIds?fn.opcodeIds.split(";").map(Number):[];
 const words=fn.instructionWords?fn.instructionWords.split(";").map(x=>parseInt(x,16)>>>0):[];
 const max=Number(fn.maxStackSize),kc=Number(fn.constantCount),uc=Number(fn.upvalueCount),pc=Number(fn.childPrototypeCount);
 for(let i=0;i<ids.length;i++){
  const id=ids[i],target=fullMapping.get(id);if(target===undefined)continue;
  mapped++;const name=names54[target];if(!byTarget[name])byTarget[name]=0;byTarget[name]++;
  const w=words[i],A=(w>>>7)&255,B=(w>>>16)&255,C=(w>>>24)&255,Bx=(w>>>15)&0x1ffff;const nextId=ids[i+1],nextTarget=nextId===undefined?undefined:fullMapping.get(nextId),nextName=nextTarget===undefined?undefined:names54[nextTarget],nextWord=words[i+1],nextA=nextWord===undefined?undefined:(nextWord>>>7)&255;
  if(!noA.has(name)){aChecked++;if(A>=max){aInvalid++;aInvalidByName[name]=(aInvalidByName[name]||0)+1;}}
  let refs=[];
  if(name==="LOADK")refs=[Bx];
  else if(["GETTABUP","GETFIELD","ADDK","SUBK","MULK","MODK","POWK","DIVK","IDIVK","BANDK","BORK","BXORK"].includes(name))refs=[C];
  else if(["SETFIELD","SETTABUP","EQK","MMBINK"].includes(name))refs=[B];
  else if(name==="ERRNNIL")refs=[Bx];
  for(const ix of refs){constChecked++;if(ix>=kc){constInvalid++;constInvalidByName[name]=(constInvalidByName[name]||0)+1;}}
  if(["GETUPVAL","SETUPVAL"].includes(name)){upChecked++;if(B>=uc)upInvalid++;}
  if(name==="GETTABUP"){upChecked++;if(B>=uc)upInvalid++;}
  if(name==="SETTABUP"){upChecked++;if(A>=uc)upInvalid++;}
  if(name==="CLOSURE"){protoChecked++;if(Bx>=pc)protoInvalid++;}
  if(name==="LOADKX"){loadKx++;if(nextName==="EXTRAARG"){const ax=(nextWord>>>7)&0x1ffffff;loadKxExtraOk++;if(ax>=kc){constInvalid++;constInvalidByName.LOADKX=(constInvalidByName.LOADKX||0)+1;}}else{loadKxExtraBad++;}}
  if(["EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET"].includes(name)){testSkipChecks++;if(nextName!=="JMP")testSkipInvalid++;}
  if(name==="LFALSESKIP"){lfalseChecks++;if(nextName!=="LOADTRUE")lfalseInvalid++;}
  const k=(w>>>15)&1;
  if(name==="NEWTABLE"){newTableExtraChecks++;if(nextName!=="EXTRAARG")newTableExtraInvalid++;}
  if(name==="SETLIST"&&k){setListExtraChecks++;if(nextName!=="EXTRAARG")setListExtraInvalid++;}
  if(name==="EXTRAARG"){extraArgChecks++;const prevTarget=i>0?fullMapping.get(ids[i-1]):undefined;const prevName=prevTarget===undefined?undefined:names54[prevTarget];const prevK=i>0?((words[i-1]>>>15)&1):0;if(!(prevName==="LOADKX"||prevName==="NEWTABLE"||(prevName==="SETLIST"&&prevK)))extraArgInvalid++;}
  if(name==="TFORPREP"){tforPrepChecks++;const targetIndex=i+1+Bx;if(targetIndex<0||targetIndex>=ids.length){tforPrepInvalid++;}else{const target=fullMapping.get(ids[targetIndex]);if(target===undefined||names54[target]!=="TFORCALL"||(((words[targetIndex]>>>7)&255)!==A))tforPrepInvalid++;}}
  if(name==="TFORCALL"){tforCallChecks++;if(nextName!=="TFORLOOP"||nextA!==A)tforCallInvalid++;}
  if(name==="JMP"){jumpChecks++;const sj=((w>>>7)&0x1ffffff)-0xffffff;const targetIndex=i+1+sj;if(targetIndex<0||targetIndex>=ids.length)jumpInvalid++;}
  if(name==="FORLOOP"||name==="TFORLOOP"){jumpChecks++;const targetIndex=i+1-Bx;if(targetIndex<0||targetIndex>=ids.length)jumpInvalid++;}
  if(name==="FORPREP"){jumpChecks++;const targetIndex=i+1+Bx+1;if(targetIndex<0||targetIndex>=ids.length)jumpInvalid++;}
 }
}
const result={
 pairedModuleKeys:moduleKeys.length,uniqueFunctionPairs:pairs.length,ambiguousFingerprintGroups:ambiguous,
 fullCorpusMappedIds:fullMapping.size,fullCorpusConflictingIds:conflicts.length,
 trainModules:train.size,testModules:test.size,trainFunctions:trainFns,trainPositions:trainPositions,
 trainMappedIds:trainMap.size,testFunctions:testFns,testPositions:testPositions,testCovered:testCovered,
 testCorrect,testWrong,testCoveragePct:+(100*testCovered/testPositions).toFixed(3),
 testAccuracyOnCoveredPct:+(100*testCorrect/testCovered).toFixed(3),unseenTestIds:[...unseen].sort((a,b)=>a-b),
 mappedInstructions: mapped, aRegisterChecked:aChecked,aRegisterInvalid:aInvalid,aRegisterInvalidPct:+(100*aInvalid/aChecked).toFixed(4),aInvalidByTargetOpcode:aInvalidByName,
 constantRefsChecked:constChecked,constantRefsInvalid:constInvalid,constantInvalidByOpcode:constInvalidByName,
 upvalueRefsChecked:upChecked,upvalueRefsInvalid:upInvalid,prototypeRefsChecked:protoChecked,prototypeRefsInvalid:protoInvalid,
 loadKxCount:loadKx,loadKxFollowedByMappedExtraarg:loadKxExtraOk,loadKxBadFollower:loadKxExtraBad,
 testSkipChecks,testSkipInvalid,lfalseChecks,lfalseInvalid,newTableExtraChecks,newTableExtraInvalid,setListExtraChecks,setListExtraInvalid,extraArgChecks,extraArgInvalid,tforPrepChecks,tforPrepInvalid,tforCallChecks,tforCallInvalid,jumpChecks,jumpInvalid,
 mappedTargetOpcodeFrequency:byTarget
};
const out=path.join(root,"validation-reports/LUA_OPCODE_FINGERPRINT_CROSSWALK_VALIDATION_2026-10-30.json");
fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
process.stdout.write(JSON.stringify(result,null,2)+"\n");

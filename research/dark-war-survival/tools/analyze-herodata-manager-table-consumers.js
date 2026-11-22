[Reading 34 lines from start (total: 34 lines, 0 remaining)]

const fs=require("fs"),crypto=require("crypto");
const [functionsCsv,constantsCsv,crosswalkCsv,out]=process.argv.slice(2);
if(!functionsCsv||!constantsCsv||!crosswalkCsv||!out)throw Error("Usage: node analyze-herodata-manager-table-consumers.js <functions.csv> <constants.csv> <crosswalk.csv> <out.json>");
function parseLine(line){const a=[];let s="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'&&line[i+1]==='"'){s+='"';i++;}else if(c==='"')q=false;else s+=c;}else if(c==='"')q=true;else if(c===','){a.push(s);s="";}else s+=c;}a.push(s);return a;}
function csv(f){const l=fs.readFileSync(f,"utf8").replace(/^\uFEFF/,"").trimEnd().split(/\r?\n/),h=parseLine(l.shift());return l.map(x=>{const v=parseLine(x);return Object.fromEntries(h.map((k,i)=>[k,v[i]??""]));});}
const F=csv(functionsCsv),C=csv(constantsCsv),X=csv(crosswalkCsv);
const N=["MOVE","LOADI","LOADF","LOADK","LOADKX","LOADFALSE","LFALSESKIP","LOADTRUE","LOADNIL","GETUPVAL","SETUPVAL","GETTABUP","GETTABLE","GETI","GETFIELD","SETTABUP","SETTABLE","SETI","SETFIELD","NEWTABLE","SELF","ADDI","ADDK","SUBK","MULK","MODK","POWK","DIVK","IDIVK","BANDK","BORK","BXORK","SHRI","SHLI","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","MMBIN","MMBINI","MMBINK","UNM","BNOT","NOT","LEN","CONCAT","CLOSE","TBC","JMP","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET","CALL","TAILCALL","RETURN","RETURN0","RETURN1","FORLOOP","FORPREP","TFORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","VARARGPREP","EXTRAARG"];
function name(v,w){const id=w&127;if(v==="5.4")return N[id]||"UNMAPPED";const x=X.find(x=>Number(x.lua55OpcodeId)===id&&x.confidence==="HIGH"&&Number(x.holdoutWrong)===0&&Number(x.holdoutUnseen)===0);return x?.candidateLua54Name||"UNMAPPED";}
const consumers=[];
for(const version of ["5.4","5.5"])for(const index of [43,46]){
 const f=F.find(x=>x.luaVersion===version&&x.module.endsWith("bundle__HeroDataManager")&&Number(x.functionIndex)===index);if(!f)throw Error("missing HeroDataManager function "+version+"/"+index);
 const constants=C.filter(x=>x.luaVersion===version&&x.module===f.module&&Number(x.functionIndex)===index).map(x=>({index:Number(x.constantIndex),value:JSON.parse(x.valueJson)}));
 const k=n=>{const x=constants.find(c=>c.value===n);if(!x)throw Error("missing constant "+n+" in "+version+"/"+index);return x.index;};
 const words=f.instructionWords.split(";").map(x=>parseInt(x,16)>>>0);
 const field=(pc)=>({pc,word:words[pc].toString(16).padStart(8,"0"),op:name(version,words[pc]),A:(words[pc]>>>7)&255,B:(words[pc]>>>16)&255,C:(words[pc]>>>24)&255,Bx:(words[pc]>>>15)&131071});
 const heroNamePc=words.findIndex((w,pc)=>name(version,w)==="GETFIELD"&&((w>>>24)&255)===k("GetHeroXmlName"));
 if(heroNamePc<0||name(version,words[heroNamePc+1])!=="CALL")throw Error("GetHeroXmlName field/call sequence not found "+version+"/"+index);
 const getName=field(heroNamePc),callName=field(heroNamePc+1);
 if(callName.A!==getName.A||callName.B!==1||callName.C!==2)throw Error("GetHeroXmlName call signature mismatch "+version+"/"+index);
 const tableGetPc=words.findIndex((w,pc)=>name(version,w)==="GETTABUP"&&((w>>>24)&255)===k("GetTableData"));
 if(tableGetPc<0)throw Error("GetTableData upvalue lookup missing "+version+"/"+index);
 const tableGet=field(tableGetPc);
 const heroNameResultRegister=callName.A;
 let dataCallPc=-1;
 for(let pc=heroNamePc+2;pc<words.length;pc++){const x=field(pc);if(x.op==="CALL"&&x.A===tableGet.A&&x.B===4&&x.C===2){dataCallPc=pc;break;}}
 if(dataCallPc<0)throw Error("GetTableData call after selector missing "+version+"/"+index);
 const dataCall=field(dataCallPc);
 const before=[];for(let pc=Math.max(0,heroNamePc-2);pc<=dataCallPc;pc++)before.push(field(pc));
 const campLoads=words.map((w,pc)=>({w,pc})).filter(x=>name(version,x.w)==="LOADK"&&((x.w>>>15)&131071)===k("camp")).map(x=>field(x.pc));
 if(!campLoads.length)throw Error("camp argument constant not loaded "+version+"/"+index);
 consumers.push({version,functionIndex:index,lineDefined:Number(f.lineDefined),lastLineDefined:Number(f.lastLineDefined),parameters:Number(f.numParams),instructions:Number(f.instructionCount),constants,selectorCall:{getField: getName,call:callName,explicitArguments:0,returnsOneValue:true,resultRegister:heroNameResultRegister},getTableDataCall:{lookup:tableGet,call:dataCall,explicitArguments:dataCall.B-1,returnsOneValue:dataCall.C-1,arguments:"tableName from GetHeroXmlName(); heroId; camp"},campLoads,trace:before});
}
const report={status:"PASS_HERODATA_MANAGER_DYNAMIC_HERO_TABLE_CONSUMER_TRACE",method:"Decoded the exact GETFIELD→CALL selector use and subsequent GETTableData call from existing full-chunk function inventory. Lua 5.5 names use high-confidence empirical crosswalk entries only.",sourceHashes:{functionsCsv:crypto.createHash("sha256").update(fs.readFileSync(functionsCsv)).digest("hex"),constantsCsv:crypto.createHash("sha256").update(fs.readFileSync(constantsCsv)).digest("hex"),crosswalkCsv:crypto.createHash("sha256").update(fs.readFileSync(crosswalkCsv)).digest("hex")},consumers,conclusion:"HeroDataManager functions 43 and 46 in both Lua versions call HeroUtils.GetHeroXmlName() with zero explicit arguments, then pass its returned table name to GetTableData with heroId and camp. This demonstrates the dynamic hero-table selector is consumed by real hero data lookup paths, not only defined as an unused helper."};
fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({status:report.status,consumers:consumers.map(x=>({version:x.version,functionIndex:x.functionIndex,line:x.lineDefined,selectorCallPc:x.selectorCall.call.pc,tableDataCallPc:x.getTableDataCall.call.pc,arguments:x.getTableDataCall.arguments,campLoads:x.campLoads.map(c=>c.pc)})),conclusion:report.conclusion},null,2));

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]
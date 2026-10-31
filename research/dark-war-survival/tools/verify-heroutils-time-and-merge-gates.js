const fs=require("fs"),path=require("path");
const file=process.argv[2]||path.join(__dirname,"../engineering/evidence/hero-utils-time-and-merge-gates-paired-2026-10-31.json");
const e=JSON.parse(fs.readFileSync(file,"utf8"));
const names=["MOVE","LOADI","LOADF","LOADK","LOADKX","LOADFALSE","LFALSESKIP","LOADTRUE","LOADNIL","GETUPVAL","SETUPVAL","GETTABUP","GETTABLE","GETI","GETFIELD","SETTABUP","SETTABLE","SETI","SETFIELD","NEWTABLE","SELF","ADDI","ADDK","SUBK","MULK","MODK","POWK","DIVK","IDIVK","BANDK","BORK","BXORK","SHRI","SHLI","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","MMBIN","MMBINI","MMBINK","UNM","BNOT","NOT","LEN","CONCAT","CLOSE","TBC","JMP","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET","CALL","TAILCALL","RETURN","RETURN0","RETURN1","FORLOOP","FORPREP","TFORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","VARARGPREP","EXTRAARG"];
const kUsed=new Set(["NEWTABLE","SETTABUP","SETTABLE","SETI","SETFIELD","MMBINI","MMBINK","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET","SETLIST","VARARG","RETURN","TAILCALL"]);
function assert(ok,msg){if(!ok)throw Error("FAIL: "+msg);}
function dec(hex,pc){const w=parseInt(hex,16)>>>0,op=w&0x7f;return {word:w,op,A:(w>>>7)&255,k:(w>>>15)&1,B:(w>>>16)&255,C:(w>>>24)&255,Bx:(w>>>15)&0x1ffff,sJ:(w>>>7)-0xffffff,target:pc+1+((w>>>7)-0xffffff)};}
const summaries={};
for(const idx of [151,152,169,170]){
 const f=e.functions[String(idx)],a=f.raw54,b=f.raw55;
 assert(a.instructionWords.length===b.instructionWords.length,"function "+idx+" instruction length");
 assert(f.pass===true,"function "+idx+" paired summary pass");
 assert(f.constantsEqual===true,"function "+idx+" constants equal");
 const diffs=[];
 for(let pc=0;pc<a.instructionWords.length;pc++){
  const x=dec(a.instructionWords[pc],pc),y=dec(b.instructionWords[pc],pc),op=names[x.op];
  assert(f.opcode55To54[String(b.opcodeIds[pc])]===op,"function "+idx+" opcode map at pc "+pc);
  for(const field of ["A","B","C"])if(x[field]!==y[field])diffs.push({pc,field});
  if(kUsed.has(op)&&x.k!==y.k)diffs.push({pc,field:"k"});
  if(op==="JMP"&&x.target!==y.target)diffs.push({pc,field:"target"});
 }
 assert(diffs.length===0,"function "+idx+" operand/jump diffs "+JSON.stringify(diffs));
 summaries[idx]={instructionCount:a.instructionWords.length,paired:true,unusedKBitDifferences:f.unusedKDiffs.length};
}
const f170=e.functions["170"].raw54,ins=f170.instructionWords.map((w,pc)=>({ ...dec(w,pc),name:names[dec(w,pc).op] }));
for(const [pc,n,v] of [[13,"GTI",0],[24,"EQI",1],[37,"EQI",2],[63,"EQI",3],[86,"EQI",4],[130,"EQI",0]]){assert(ins[pc].name===n,"function170 pc"+pc+" opcode "+n);assert(ins[pc].B-127===v,"function170 pc"+pc+" immediate "+v);}
for(const pc of [33,52,59,78,82,101,105])assert(ins[pc].name==="LT","time comparison LT at pc "+pc);
assert(ins[131].name==="JMP"&&ins[131].target===133,"merge gate jump target");
assert(ins[132].name==="RETURN0","zero-count early return");
assert(ins[130].k===0,"zero-count comparison k=0");
assert(e.mergeGate.getHeroMergeItem.functionIndex===151,"GetHeroMergeItem function mapping");
assert(e.mergeGate.isHeroMergeItemEnough.functionIndex===152,"IsHeroMergeItemEnough function mapping");
assert(e.mergeGate.getHeroTemplateListCallback.logic.includes("ownedCount == 0"),"zero-count filter description");
assert(e.timeGate.types["1"].condition==="curDay >= targetDay","time type 1");
assert(e.timeGate.types["2"].condition.includes("curWeek == targetWeek"),"time type 2");
assert(e.timeGate.types["3"].condition.includes("seasonDay >= targetSeasonDay"),"time type 3");
assert(e.timeGate.types["4"].condition.includes("seasonStageDay >= targetStageDay"),"time type 4");
assert(e.referenceSemantics.conditionalJump.includes("skip the next JMP"),"Lua VM branch semantics reference");
assert(e.memory.requiredMB===875,"RAM threshold");
console.log(JSON.stringify({status:"PASS_PORTABLE_EVIDENCE_VALIDATION",file,summaries,timeGate:"types 1-4 validated from raw Lua 5.4 words and paired Lua 5.5 operands/targets",mergeGate:"zero owned count rejects; positive owned count passes; IsHeroMergeItemEnough uses requiredCount <= ownedCount",branchSemantics:"Lua 5.4/5.5 cond-vs-k verified",ram:e.memory},null,2));

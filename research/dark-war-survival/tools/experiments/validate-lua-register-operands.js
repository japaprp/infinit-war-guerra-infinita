const fs=require("fs"),path=require("path");
const root="C:/Users/AMORIM/Downloads/DarkWar_Analysis_Core";
const base=path.join(root,"validation-reports/");
function parseLine(line){const out=[];let s="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'&&line[i+1]==='"'){s+='"';i++;}else if(c==='"'){q=false;}else{s+=c;}}else if(c==='"'){q=true;}else if(c===','){out.push(s);s="";}else{s+=c;}}out.push(s);return out;}
function readCsv(p){const lines=fs.readFileSync(p,"utf8").replace(/^\uFEFF/,"").trimEnd().split(/\r?\n/),h=parseLine(lines.shift());return lines.map(l=>{const v=parseLine(l);return Object.fromEntries(h.map((k,i)=>[k,v[i]??""]));});}
const cross=readCsv(path.join(base,"LUA_OPCODE_CROSSWALK_55_TO_54_FINGERPRINT_V1_2026-10-30.csv"));
const functions=readCsv(path.join(base,"LUA_FUNCTION_FINGERPRINT_INVENTORY_2026-10-30-functions.csv"));
const names54=["MOVE","LOADI","LOADF","LOADK","LOADKX","LOADFALSE","LFALSESKIP","LOADTRUE","LOADNIL","GETUPVAL","SETUPVAL","GETTABUP","GETTABLE","GETI","GETFIELD","SETTABUP","SETTABLE","SETI","SETFIELD","NEWTABLE","SELF","ADDI","ADDK","SUBK","MULK","MODK","POWK","DIVK","IDIVK","BANDK","BORK","BXORK","SHRI","SHLI","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","MMBIN","MMBINI","MMBINK","UNM","BNOT","NOT","LEN","CONCAT","CLOSE","TBC","JMP","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET","CALL","TAILCALL","RETURN","RETURN0","RETURN1","FORLOOP","FORPREP","TFORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","VARARGPREP","EXTRAARG"];
const map=new Map(cross.map(r=>[+r.lua55OpcodeId,+r.candidateLua54OpcodeId]));
let checked=0,invalid=0;const byKind={},byOpcode={};let selfKeyChecks=0,selfKeyInvalid=0,selfKZero=0,selfKNonzero=0;
function reg(v,max,kind,name){checked++;if(v<0||v>=max){invalid++;byKind[kind]=(byKind[kind]||0)+1;byOpcode[name]=(byOpcode[name]||0)+1;}}
function range(start,count,max,kind,name){if(count<=0)return;checked++;if(start<0||start+count-1>=max){invalid++;byKind[kind]=(byKind[kind]||0)+1;byOpcode[name]=(byOpcode[name]||0)+1;}}
for(const fn of functions.filter(x=>x.luaVersion==="5.5")){
 const ids=fn.opcodeIds.split(";").map(Number),words=fn.instructionWords.split(";").map(x=>parseInt(x,16)>>>0),max=+fn.maxStackSize;
 for(let i=0;i<ids.length;i++){
  const target=map.get(ids[i]);if(target===undefined)continue;const name=names54[target],w=words[i],A=(w>>>7)&255,B=(w>>>16)&255,C=(w>>>24)&255,k=(w>>>15)&1,Bx=(w>>>15)&0x1ffff;
  switch(name){
   case "MOVE": reg(B,max,"B-register",name);break;
   case "GETTABLE": reg(B,max,"B-register",name);reg(C,max,"C-register",name);break;
   case "GETI": case "GETFIELD": case "ADDI": case "ADDK": case "SUBK": case "MULK": case "MODK": case "POWK": case "DIVK": case "IDIVK": case "BANDK": case "BORK": case "BXORK": reg(B,max,"B-register",name);break;
   case "ADD": case "SUB": case "MUL": case "MOD": case "POW": case "DIV": case "IDIV": case "BAND": case "BOR": case "BXOR": case "SHL": case "SHR": reg(B,max,"B-register",name);reg(C,max,"C-register",name);break;
   case "UNM": case "BNOT": case "NOT": case "LEN": reg(B,max,"B-register",name);break;
   case "SETUPVAL": case "SETTABLE": case "SETI": case "SETFIELD": case "CLOSE": case "TBC": case "TEST": case "SETLIST": reg(A,max,"A-read/base-register",name);if(name==="SETTABLE")reg(B,max,"B-key-register",name);if(["SETTABLE","SETI","SETFIELD"].includes(name)){if(k){if(C>=+fn.constantCount){checked++;invalid++;byKind["C-constant-when-k1"]=(byKind["C-constant-when-k1"]||0)+1;byOpcode[name]=(byOpcode[name]||0)+1;}}else reg(C,max,"C-register-when-k0",name);}break;
   case "SELF": reg(B,max,"B-register",name);range(A+1,1,max,"A+1-register",name);selfKeyChecks++;if(k===0)selfKZero++;else selfKNonzero++;if(C>=+fn.constantCount){selfKeyInvalid++;}break;
   case "SETTABUP": if(k){if(C>=+fn.constantCount){checked++;invalid++;byKind["SETTABUP-C-constant"]=(byKind["SETTABUP-C-constant"]||0)+1;byOpcode[name]=(byOpcode[name]||0)+1;}}else reg(C,max,"SETTABUP-C-register-when-k0",name);break;
   case "CONCAT": range(A,B,max,"CONCAT-register-range",name);break;
   case "LOADNIL": range(A,B+1,max,"LOADNIL-register-range",name);break;
   case "EQ": case "LT": case "LE": reg(A,max,"A-comparison-register",name);reg(B,max,"B-register",name);reg(C,max,"C-register",name);break;
   case "EQK": case "EQI": case "LTI": case "LEI": case "GTI": case "GEI": reg(A,max,"A-comparison-register",name);break;
   case "MMBIN": reg(A,max,"MMBIN-A-register",name);reg(B,max,"MMBIN-B-register",name);break;
   case "MMBINI": case "MMBINK": reg(A,max,"MMBIN-A-register",name);break;
   case "TESTSET": reg(B,max,"B-register",name);break;
   case "CALL": if(B>0)range(A,B,max,"CALL-function-and-arguments",name);if(C>1)range(A,C-1,max,"CALL-result-range",name);break;
   case "TAILCALL": if(B>0)range(A,B,max,"TAILCALL-function-and-arguments",name);break;
   case "RETURN": if(B>1)range(A,B-1,max,"RETURN-value-range",name);break;
   case "RETURN1": reg(A,max,"RETURN1-source-register",name);break;
   case "FORLOOP": case "FORPREP": case "TFORPREP": range(A,4,max,"FOR-control-register-range",name);break;
   case "TFORCALL": range(A,5,max,"TFORCALL-control-register-range",name);if(C>0)range(A+4,C,max,"TFORCALL-result-range",name);break;
   case "TFORLOOP": range(A,5,max,"TFORLOOP-control-register-range",name);break;
   case "VARARG": if(C>1)range(A,C-1,max,"VARARG-result-range",name);break;
  }
 }
}
const result={mappedOpcodeIds:map.size,functions:functions.filter(x=>x.luaVersion==="5.5").length,registerOperandChecks:checked,invalid:invalid,invalidByKind:byKind,invalidByOpcode:byOpcode,selfKeyConstantChecks:selfKeyChecks,selfKeyConstantInvalid:selfKeyInvalid,selfKZero,selfKNonzero};
const out=path.join(base,"LUA_REGISTER_OPERAND_VALIDATION_2026-10-30.json");fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");process.stdout.write(JSON.stringify(result,null,2)+"\n");

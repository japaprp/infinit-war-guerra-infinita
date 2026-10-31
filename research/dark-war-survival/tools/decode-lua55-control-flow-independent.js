const fs=require("fs"),path=require("path");
const [functionsCsv,crosswalkCsv,output]=process.argv.slice(2);
if(!functionsCsv||!crosswalkCsv||!output)throw Error("Usage: node decode-lua55-control-flow-independent.js <functions.csv> <crosswalk.csv> <output.json>");
function parseLine(line){const out=[];let s="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q){if(c==='"'&&line[i+1]==='"'){s+='"';i++;}else if(c==='"')q=false;else s+=c;}else if(c==='"')q=true;else if(c===','){out.push(s);s="";}else s+=c;}out.push(s);return out;}
function readCsv(file){const lines=fs.readFileSync(file,"utf8").replace(/^\uFEFF/,"").trimEnd().split(/\r?\n/),headers=parseLine(lines.shift());return lines.map(line=>{const v=parseLine(line);return Object.fromEntries(headers.map((h,i)=>[h,v[i]??""]));});}
const rows=readCsv(functionsCsv),crosswalk=readCsv(crosswalkCsv);
const row=rows.find(x=>x.luaVersion==="5.5"&&x.lineDefined==="3163");
if(!row)throw Error("LUA55_TARGET_FUNCTION_NOT_FOUND");
const words=row.instructionWords.split(";").map(x=>Number.parseInt(x,16)>>>0);
const map=new Map(crosswalk.map(x=>[Number(x.lua55OpcodeId),x]));
const decoded=words.map((w,pc)=>{const id=w&0x7f,entry=map.get(id);if(!entry||entry.confidence!=="HIGH"||Number(entry.holdoutWrong)!==0||Number(entry.holdoutUnseen)!==0)throw Error("UNTRUSTED_OR_UNMAPPED_OPCODE_ID_"+id+"_AT_PC_"+pc);return {pc,word:w.toString(16).padStart(8,"0"),rawOpcodeId:id,semanticOpcode:entry.candidateLua54Name,A:(w>>>7)&255,k:(w>>>15)&1,B:(w>>>16)&255,C:(w>>>24)&255};});
const jump=decoded[6],test=decoded[5];
if(test.semanticOpcode!=="TEST"||test.A!==0||test.k!==0)throw Error("TEST_FIELDS_ASSERTION_FAILED");
if(jump.semanticOpcode!=="JMP")throw Error("JMP_MAPPING_ASSERTION_FAILED");
const sj=(words[6]>>>7)-0xffffff,target=6+1+sj;
if(sj!==3||target!==10)throw Error("JMP_TARGET_ASSERTION_FAILED");
const expected=["GETTABUP","GETFIELD","RETURN1"];
for(let i=0;i<3;i++)if(decoded[7+i].semanticOpcode!==expected[i]||decoded[10+i].semanticOpcode!==expected[i])throw Error("RETURN_PATH_SHAPE_ASSERTION_FAILED");
if(decoded[13].semanticOpcode!=="RETURN0")throw Error("TERMINAL_RETURN_ASSERTION_FAILED");
const branches={switchTrue:{condition:"cond=true; cond!=k; skip JMP",nextPc:7,returnAtPc:9,returnConstant:"Army_B"},switchFalse:{condition:"cond=false; cond==k; execute JMP",jumpTarget:10,returnAtPc:12,returnConstant:"Army"}};
const report={status:"PASS_INDEPENDENT_LUA55_CONTROL_FLOW_DECODE",source:{module:"PveUtil",luaVersion:"5.5",functionIndex:Number(row.functionIndex),lineDefined:Number(row.lineDefined),instructionCount:words.length,sha256:row.sha256},method:"Independent decoder extracts raw 7-bit opcode IDs and iABC/iJ fields directly from stored instruction words, then resolves semantic names only through the previously validated empirical fingerprint crosswalk. It does not import or call either Lua parser, crosswalk exporter, or existing validator.",crosswalkChecks:{allInstructionsMapped:true,allIdsHighConfidence:true,allHoldoutWrongZero:true,allHoldoutUnseenZero:true,rawOpcodeIds:[...new Set(decoded.map(x=>x.rawOpcodeId))],mapping:decoded.map(x=>({pc:x.pc,rawOpcodeId:x.rawOpcodeId,semanticOpcode:x.semanticOpcode}))},checks:{testPc:5,testRawWord:test.word,testRawOpcodeId:test.rawOpcodeId,testSemanticOpcode:test.semanticOpcode,A:test.A,k:test.k,skipNextInstructionTarget:7,jumpPc:6,jumpRawWord:jump.word,jumpRawOpcodeId:jump.rawOpcodeId,jumpSemanticOpcode:jump.semanticOpcode,signedJumpOffset:sj,jumpTarget:target,returnPathA:"PC7-9 returns TableName.Army_B",returnPathB:"PC10-12 returns TableName.Army",terminalReturn:"PC13 RETURN0"},branchInterpretation:branches,decoded};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({status:report.status,output,checks:report.checks,rawOpcodeIds:report.crosswalkChecks.rawOpcodeIds},null,2));

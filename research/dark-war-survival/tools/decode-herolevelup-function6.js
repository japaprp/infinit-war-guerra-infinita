[Reading 33 lines from start (total: 33 lines, 0 remaining)]

// Targeted decoder for HeroLevelUpTemplateManager function 6 only.
// Does not import, invoke, or share implementation with either PveUtil decoder.
const versions={
 "5.4":{sha256:"9b1ff70670b820bb4fc3f59cd10adbb8a397ee3e8efab3f1811fc35be9652b42",words:["0000008b","0101008e","0201008e","80000101","0300018b","80000201","0003014a","04008314","00050400","02030344","000600ba","80000038","00020348","00038149","0300010b","00020148","00010147"]},
 "5.5":{sha256:"1e9e37ca404e97d3e387855f1b40eca102eb2ad5d6412b939d46be496f78a72c",words:["000000fd","010100fb","020100e7","8000015a","030001e2","8000025a","00030149","040002ae","000403d6","02030285","00050082","8000002b","00020291","00038116","0300013e","00020111","00010128"]}
};
const op54=["MOVE","LOADI","LOADF","LOADK","LOADKX","LOADFALSE","LFALSESKIP","LOADTRUE","LOADNIL","GETUPVAL","SETUPVAL","GETTABUP","GETTABLE","GETI","GETFIELD","SETTABUP","SETTABLE","SETI","SETFIELD","NEWTABLE","SELF","ADDI","ADDK","SUBK","MULK","MODK","POWK","DIVK","IDIVK","BANDK","BORK","BXORK","SHRI","SHLI","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","MMBIN","MMBINI","MMBINK","UNM","BNOT","NOT","LEN","CONCAT","CLOSE","TBC","JMP","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET","CALL","TAILCALL","RETURN","RETURN0","RETURN1","FORLOOP","FORPREP","TFORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","VARARGPREP","EXTRAARG"];
const map55={125:["GETTABUP","HIGH"],123:["GETFIELD","HIGH"],103:["GETFIELD","HIGH"],90:["LOADI","HIGH"],98:["GETTABUP","HIGH"],46:["SELF","HIGH"],5:["CALL","HIGH"],2:["LT","HIGH"],43:["JMP","HIGH"],17:["RETURN1","HIGH"],62:["GETTABUP","HIGH"],40:["RETURN0","HIGH"],86:["MOVE","MEDIUM"]};
function decode(version){
 const v=versions[version],rows=v.words.map((hex,pc)=>{const w=Number.parseInt(hex,16)>>>0,id=w&127;return {pc,word:hex,opcodeId:id,opcode:version==="5.4"?op54[id]:(map55[id]?.[0]??"UNRESOLVED"),confidence:version==="5.4"?"OFFICIAL_OPCODE_TABLE":(map55[id]?.[1]??"UNMAPPED"),A:(w>>>7)&255,k:(w>>>15)&1,B:(w>>>16)&255,C:(w>>>24)&255};});
 return {version,sha256:v.sha256,instructionCount:rows.length,instructions:rows};
}
function analyze54(rows){
 const self=rows.find(x=>x.opcode==="SELF"&&x.C===4&&x.k===1);
 const call=rows.find(x=>x.opcode==="CALL"&&self&&x.A===self.A);
 const move=rows.find(x=>x.opcode==="MOVE"&&call&&x.A===call.A+2);
 const prep=rows.find(x=>x.opcode==="FORPREP");
 const loop=rows.find(x=>x.opcode==="FORLOOP"&&prep&&x.A===prep.A);
 if(!self||!call||!move||!prep||!loop) return {status:"FAIL_TRACE_PATTERN_NOT_FOUND"};
 const loopValue=prep.A+3;
 return {status:move.B===loopValue?"PASS_STATIC_REGISTER_TRACE":"FAIL_ARGUMENT_NOT_LOOP_VALUE",method:"GetBreakRequireBase",methodConstantIndex:self.C,receiverRegister:self.B,selfRegister:self.A+1,methodRegister:self.A,callPc:call.pc,callA:call.A,callB:call.B,callC:call.C,explicitArgumentRegister:call.A+2,movePc:move.pc,argumentSourceRegister:move.B,forPrepPc:prep.pc,forLoopPc:loop.pc,loopBaseRegister:prep.A,visibleLoopValueRegister:loopValue};
}
function analyze55(rows){
 const self=rows.find(x=>x.opcode==="SELF"&&x.C===4);
 const call=rows.find(x=>x.opcode==="CALL"&&self&&x.A===self.A);
 const move=rows.find(x=>x.opcode==="MOVE"&&call&&x.A===call.A+2);
 const unresolved=rows.filter(x=>x.confidence==="UNMAPPED").map(x=>({pc:x.pc,opcodeId:x.opcodeId}));
 const medium=rows.filter(x=>x.confidence==="MEDIUM").map(x=>({pc:x.pc,opcodeId:x.opcodeId,opcode:x.opcode}));
 return {status:"BLOCKED_REGISTER_MAPPING",methodLookup:self?{pc:self.pc,A:self.A,C:self.C}:null,call:call?{pc:call.pc,A:call.A,B:call.B,C:call.C}:null,argumentMove:move?{pc:move.pc,destination:move.A,source:move.B,confidence:move.confidence}:null,unmappedOpcodes:unresolved,mediumConfidenceOpcodes:medium,reason:"Loop setup/step opcodes and MOVE mapping/operand semantics are not all validated; argument provenance cannot be certified."};
}
const d54=decode("5.4"),d55=decode("5.5");
const result={status:"PARTIAL_DECODE",target:"HeroLevelUpTemplateManager function 6, lines 30-39",independentOfPveUtilDecoders:true,versions:{"5.4":d54,"5.5":d55},argumentAnalysis:{"5.4":analyze54(d54.instructions),"5.5":analyze55(d55.instructions)}};
console.log(JSON.stringify(result,null,2));

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]
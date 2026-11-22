// Dedicated, self-contained decoder for HeroLevelUpTemplateManager.GetNeedMainLv (function 6).
// Does not import or reuse PveUtil-specific decoders.
const chunks={
 "5.4":{sha256:"9b1ff70670b820bb4fc3f59cd10adbb8a397ee3e8efab3f1811fc35be9652b42",words:["0000008b","0101008e","0201008e","80000101","0300018b","80000201","0003014a","04008314","00050400","02030344","000600ba","80000038","00020348","00038149","0300010b","00020148","00010147"]},
 "5.5":{sha256:"1e9e37ca404e97d3e387855f1b40eca102eb2ad5d6412b939d46be496f78a72c",words:["000000fd","010100fb","020100e7","8000015a","030001e2","8000025a","00030149","040002ae","000403d6","02030285","00050082","8000002b","00020291","00038116","0300013e","00020111","00010128"]}
};
const lua54Names=["MOVE","LOADI","LOADF","LOADK","LOADKX","LOADFALSE","LFALSESKIP","LOADTRUE","LOADNIL","GETUPVAL","SETUPVAL","GETTABUP","GETTABLE","GETI","GETFIELD","SETTABUP","SETTABLE","SETI","SETFIELD","NEWTABLE","SELF","ADDI","ADDK","SUBK","MULK","MODK","POWK","DIVK","IDIVK","BANDK","BORK","BXORK","SHRI","SHLI","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","MMBIN","MMBINI","MMBINK","UNM","BNOT","NOT","LEN","CONCAT","CLOSE","TBC","JMP","EQ","LT","LE","EQK","EQI","LTI","LEI","GTI","GEI","TEST","TESTSET","CALL","TAILCALL","RETURN","RETURN0","RETURN1","FORLOOP","FORPREP","TFORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","VARARGPREP","EXTRAARG"];
const lua55To54={125:11,123:14,103:14,90:1,98:11,73:74,46:20,86:0,5:68,2:58,43:56,17:72,22:73,62:11,40:71};
function decode(version){return chunks[version].words.map((hex,pc)=>{const n=Number.parseInt(hex,16)>>>0,id=n&127,base=version==="5.4"?id:lua55To54[id];return {pc,word:hex,opcodeId:id,opcode:base===undefined?"UNRESOLVED":lua54Names[base],A:(n>>>7)&255,B:(n>>>16)&255,C:(n>>>24)&255,Bx:(n>>>15)&0x1ffff};});}
const d54=decode("5.4"),d55=decode("5.5"),p54=d54[6],m54=d54[8],c54=d54[9],l54=d54[13],p55=d55[6],m55=d55[8],c55=d55[9],l55=d55[13];
const checks={
 "5.4":{forPrep:p54.opcode==="FORPREP"&&p54.A===2,forLoop:l54.opcode==="FORLOOP"&&l54.A===2,move:m54.opcode==="MOVE"&&m54.A===8&&m54.B===5,call:c54.opcode==="CALL"&&c54.A===6&&c54.B===3&&c54.C===2,controlRegister:p54.A+3,argumentSource:m54.B},
 "5.5":{forPrep:p55.opcode==="FORPREP"&&p55.A===2,forLoop:l55.opcode==="FORLOOP"&&l55.A===2,move:m55.opcode==="MOVE"&&m55.A===7&&m55.B===4,call:c55.opcode==="CALL"&&c55.A===5&&c55.B===3&&c55.C===2,controlRegister:p55.A+2,argumentSource:m55.B}
};
for(const v of ["5.4","5.5"])checks[v].argumentMatchesLoopControl=checks[v].argumentSource===checks[v].controlRegister;
const ok=Object.values(checks).every(x=>x.forPrep&&x.forLoop&&x.move&&x.call&&x.argumentMatchesLoopControl);
console.log(JSON.stringify({status:ok?"PASS_BOTH_VERSIONS":"FAIL",target:"HeroLevelUpTemplateManager.GetNeedMainLv function6",independentOfPveUtil:true,sourceHashes:{"5.4":chunks["5.4"].sha256,"5.5":chunks["5.5"].sha256},checks,conclusion:"GetBreakRequireBase receives numeric-for control variable i. Lua54 uses A+3 (R5); Lua55 uses A+2 (R4). Loop starts at 1, ends at HeroMaxLevel, step 1.",instructions:{"5.4":d54,"5.5":d55}},null,2));

[executed on device: WIN-RPC1DR79TVC (a1fb0fea-9200-442c-8e10-e849494b85b1)]
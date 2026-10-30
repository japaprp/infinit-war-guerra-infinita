const fs=require("fs"),crypto=require("crypto");

class Reader {
  constructor(buf,version){this.b=buf;this.p=0;this.version=version;this.pool=[];this.stringPoolRefs=0;}
  need(n){if(!Number.isSafeInteger(n)||n<0||this.p+n>this.b.length)throw new Error("TRUNCATED_OR_INVALID at "+this.p+" need "+n);}
  byte(){this.need(1);return this.b[this.p++];}
  bytes(n){this.need(n);const x=this.b.subarray(this.p,this.p+n);this.p+=n;return x;}
  u32(){this.need(4);const x=this.b.readUInt32LE(this.p);this.p+=4;return x;}
  i32(){this.need(4);const x=this.b.readInt32LE(this.p);this.p+=4;return x;}
  i64(){this.need(8);const x=this.b.readBigInt64LE(this.p);this.p+=8;return x;}
  f64(){this.need(8);const x=this.b.readDoubleLE(this.p);this.p+=8;return x;}
  align(n){const logicalOffset=this.p+(this.version===0x55?1:0);const pad=(n-(logicalOffset%n))%n;if(pad)this.bytes(pad);}
  varintBig(){
    let x=0n,b,steps=0;
    do {
      b=this.byte();
      x=(x<<7n)|BigInt(b&0x7f);
      if(++steps>10)throw new Error("VARINT_TOO_LONG at "+this.p);
    } while(this.version===0x54 ? ((b&0x80)===0) : ((b&0x80)!==0));
    return x;
  }
  varint(){
    const x=this.varintBig();
    if(x>BigInt(Number.MAX_SAFE_INTEGER))throw new Error("VARINT_OVERFLOW at "+this.p);
    return Number(x);
  }
  count(label){
    const n=this.varint();
    if(n>1000000)throw new Error("COUNT_LIMIT "+label+"="+n+" at "+this.p);
    return n;
  }
  str54(nullable=true){
    let n=this.count("string_size");
    if(n===0){if(!nullable)throw new Error("NULL_STRING_NOT_ALLOWED");return null;}
    n-=1;const b=this.bytes(n);
    return b.toString("utf8");
  }
  str55(){
    const n=this.count("string_size");
    if(n===0){
      const idx=this.varint();
      if(idx===0)return null;
      if(idx>this.pool.length)throw new Error("STRING_REF_OUT_OF_RANGE "+idx);
      this.stringPoolRefs++;return this.pool[idx-1];
    }
    const len=n-1;const b=this.bytes(len+1);
    const s=b.subarray(0,len).toString("utf8");
    this.pool.push(s);
    return s;
  }
  str(nullable=true){
    if(this.version===0x54)return this.str54(nullable);
    return this.str55();
  }
  int64orVarint(){
    if(this.version===0x54)return this.i64().toString();
    const x=this.varintBig();
    const signed=(x&1n)!==0n ? -((x>>1n)+1n) : (x>>1n);
    return String(signed);
  }
  loadNumber(){return this.f64();}
}
function parseFile(file){
 const raw=fs.readFileSync(file);
 if(raw.length<40)throw new Error("FILE_TOO_SHORT");
 const prefix=raw[4],version=raw[5];
 if(!((version===0x54&&prefix===0x03)||(version===0x55&&prefix===0xa8)))throw new Error("UNKNOWN_PREFIX_OR_VERSION");
 const b=Buffer.concat([raw.subarray(0,4),raw.subarray(5)]);
 const r=new Reader(b,version);
 if(r.bytes(4).toString("hex")!=="1b4c7561")throw new Error("BAD_LUA_SIGNATURE");
 if(r.byte()!==version)throw new Error("BAD_VERSION");
 if(r.byte()!==0)throw new Error("BAD_FORMAT");
 if(r.bytes(6).toString("hex")!=="19930d0a1a0a")throw new Error("BAD_LUAC_DATA");
 if(version===0x54){
   if(r.byte()!==4||r.byte()!==8||r.byte()!==8)throw new Error("BAD_54_SIZE_FIELDS");
   if(r.i64()!==0x5678n)throw new Error("BAD_54_INTEGER_SENTINEL");
   if(r.f64()!==370.5)throw new Error("BAD_54_NUMBER_SENTINEL");
 }else{
   if(r.byte()!==4||r.i32()!==-0x5678)throw new Error("BAD_55_INT_SENTINEL");
   if(r.byte()!==4||r.u32()!==0x12345678)throw new Error("BAD_55_INSTRUCTION_SENTINEL");
   if(r.byte()!==8||r.i64()!==-0x5678n)throw new Error("BAD_55_INTEGER_SENTINEL");
   if(r.byte()!==8||r.f64()!==-370.5)throw new Error("BAD_55_NUMBER_SENTINEL");
 }
 const closureUpvalues=r.byte();
 
 const stats={functions:0,instructions:0,constants:0,upvalues:0,prototypes:0,strings:0,uniqueStrings:0,stringPoolRefs:0,maximumDepth:0};
 const strings=new Set(),interesting=new Set();
 const addString=s=>{if(s!==null){stats.strings++;strings.add(s);if(/GetTable|TableData|TableName|building|hero|equip|season|activity|goods|effect|worldcity|army|score|status|trade_post|recharge/i.test(s))interesting.add(s);}};
 function loadString(nullable=true){const s=r.str(nullable);addString(s);return s;}
 function safeRec(n,label){if(n>1000000)throw new Error("COUNT_LIMIT "+label+"="+n+" at "+r.p);return n;}
 function loadCode(){
   const n=safeRec(r.count("instruction_count"),"instruction_count");
   if(version===0x55)r.align(4);
   
   r.bytes(n*4);stats.instructions+=n;
 }
 function loadConstants(){
   const n=safeRec(r.count("constant_count"),"constant_count");
   stats.constants+=n;
   for(let i=0;i<n;i++){
     const tagPos=r.p;const tag=r.byte();
     switch(tag){
       case 0: case 1: case 17: break;
       case 3: if(version===0x54)r.i64();else r.int64orVarint();break;
       case 19: r.f64();break;
       case 4: case 20: loadString(false);break;
       default: throw new Error("INVALID_CONSTANT_TAG "+tag+" at "+tagPos+" constantIndex="+i+" count="+n);
     }
   }
 }
 function loadUpvalues(){
   const n=safeRec(r.count("upvalue_count"),"upvalue_count");
   stats.upvalues+=n;
   for(let i=0;i<n;i++){r.byte();r.byte();r.byte();}
   return n;
 }
 function loadProtos(parentSource,depth){
   const n=safeRec(r.count("prototype_count"),"prototype_count");
   stats.prototypes+=n;
   for(let i=0;i<n;i++)loadFunction(parentSource,depth+1);
 }
 function loadDebug(upvalueCount){
   const nLine=safeRec(r.count("lineinfo_count"),"lineinfo_count");
   r.bytes(nLine);
   const nAbs=safeRec(r.count("abslineinfo_count"),"abslineinfo_count");
   if(version===0x54){
     for(let i=0;i<nAbs;i++){r.count("abs_pc");r.count("abs_line");}
   }else{
     if(nAbs>0)r.align(4);
     r.bytes(nAbs*8);
   }
   const nLoc=safeRec(r.count("locvar_count"),"locvar_count");
   for(let i=0;i<nLoc;i++){
     loadString(true);
     r.count("locvar_start");r.count("locvar_end");
   }
   let nNames=r.count("upvalue_name_count");
   if(nNames!==0)nNames=upvalueCount;
   for(let i=0;i<nNames;i++)loadString(true);
 }
 function loadFunction(parentSource,depth){
   if(depth>128)throw new Error("PROTO_DEPTH_LIMIT");
   stats.functions++;stats.maximumDepth=Math.max(stats.maximumDepth,depth);
   let source=parentSource;
   if(version===0x54){const s=loadString(true);if(s!==null)source=s;}
   r.count("line_defined");r.count("last_line_defined");
   r.byte();r.byte();r.byte();
   loadCode();loadConstants();
   const ups=loadUpvalues();
   loadProtos(source,depth);
   if(version===0x55)loadString(true);
   loadDebug(ups);
   return ups;
 }
 const rootUpvalues=loadFunction(null,0);
 if(closureUpvalues!==rootUpvalues)throw new Error("ROOT_UPVALUE_COUNT_MISMATCH closure="+closureUpvalues+" proto="+rootUpvalues);
 if(r.p!==b.length)throw new Error("TRAILING_BYTES "+(b.length-r.p)+" at "+r.p);
 stats.uniqueStrings=strings.size;
 stats.stringPoolRefs=r.stringPoolRefs;
 stats.sha256=crypto.createHash("sha256").update(raw).digest("hex");
 stats.size=raw.length;
 stats.luaVersion=version===0x54?"5.4":"5.5";
 stats.wrapperPrefix="0x"+prefix.toString(16).padStart(2,"0");
 stats.closureUpvalues=closureUpvalues;
 stats.interestingStrings=Array.from(interesting);
 return {file:require("path").basename(file),status:"PASS_FULL_CHUNK_STRUCTURE",...stats};
}
const args=process.argv.slice(2);
if(args.length===0){console.error("Usage: node parse-lua-chunks.js <directory-or-file> [report.json]");process.exit(2);}
const input=args[0],out=args[1]||"lua-full-chunk-parse-summary.json";
const fsStat=fs.statSync(input);
function walk(dir,files=[]){
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=require("path").join(dir,ent.name);
  if(ent.isDirectory())walk(p,files);
  else if(ent.isFile()&&ent.name.toLowerCase().endsWith(".bytes"))files.push(p);
 }
 return files;
}
const files=fsStat.isDirectory()?walk(input):args;
const root=fsStat.isDirectory()?input:require("path").dirname(input);
const perFile=[],failures=[],byVersion={"5.4":{files:0,functions:0,instructions:0,constants:0,strings:0},"5.5":{files:0,functions:0,instructions:0,constants:0,strings:0}};
const byBundle=new Map(),candidateRows=new Map();
let totalFunctions=0,totalInstructions=0,totalConstants=0,totalStrings=0,passed=0;
const candidatePattern=/^(?:[A-Za-z0-9]+_)*(?:building|heroes?|equip|season|activity|event|world|arena|army|goods|effect|resource|science|research|fortress|battle|rank|reward|phase|group|config|level_up|pve|monster|alliance|car|city|troop|technology|production|upgrade|tower|map|server|march)[A-Za-z0-9_]*$/i;
for(const file of files){
 try{
  const x=parseFile(file);
  const rel=require("path").relative(root,file).replace(/\\/g,"/");
  const parts=rel.split("/");
  const bundle=parts.length>1?parts[0]:"";
  const module=parts[parts.length-1].replace(/\.bytes$/i,"");
  const row={bundle,module,relativePath:rel,luaVersion:x.luaVersion,prefix:x.wrapperPrefix,size:x.size,sha256:x.sha256,functions:x.functions,instructions:x.instructions,constants:x.constants,upvalues:x.upvalues,prototypes:x.prototypes,strings:x.strings,uniqueStrings:x.uniqueStrings,stringPoolRefs:x.stringPoolRefs,maximumDepth:x.maximumDepth,status:x.status};
  perFile.push(row);passed++;
  const v=byVersion[x.luaVersion];v.files++;v.functions+=x.functions;v.instructions+=x.instructions;v.constants+=x.constants;v.strings+=x.strings;
  totalFunctions+=x.functions;totalInstructions+=x.instructions;totalConstants+=x.constants;totalStrings+=x.strings;
  if(!byBundle.has(bundle))byBundle.set(bundle,{bundle,files:0,lua54:0,lua55:0,functions:0,instructions:0,constants:0});
  const b=byBundle.get(bundle);b.files++;b[x.luaVersion==="5.4"?"lua54":"lua55"]++;b.functions+=x.functions;b.instructions+=x.instructions;b.constants+=x.constants;
  for(const s of x.interestingStrings){
    if(s.length>0&&s.length<180&&!s.startsWith("@/")&&(candidatePattern.test(s)||/^(GetTableData|GetTableName|TableName|useTableName)$/i.test(s))){
      const key=[bundle,module,x.luaVersion,s].join("|");
      candidateRows.set(key,{bundle,module,luaVersion:x.luaVersion,string:s,evidence:/^(GetTableData|GetTableName|TableName|useTableName)$/i.test(s)?"TABLE_API_SYMBOL":"TABLE_NAME_OR_ALIAS_CANDIDATE"});
    }
  }
 }catch(e){
  const rel=require("path").relative(root,file).replace(/\\/g,"/");
  const err={relativePath:rel,status:"FAIL_FULL_CHUNK_STRUCTURE",error:String(e)};
  failures.push(err);if(failures.length<=100)console.log(JSON.stringify(err));
 }
}
const result={date:"2026-10-30",inputKind:fsStat.isDirectory()?"directory":"file",filesScanned:files.length,filesPassed:passed,filesFailed:failures.length,byVersion,totalFunctions,totalInstructions,totalConstants,totalStrings,byBundle:Array.from(byBundle.values()).sort((a,b)=>a.bundle.localeCompare(b.bundle)),tableCandidateStringRows:candidateRows.size,failures:failures.slice(0,100),status:failures.length===0&&passed===files.length?"PASS":"FAIL"};
fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n","utf8");
const csvHeader="bundle,module,relativePath,luaVersion,prefix,size,sha256,functions,instructions,constants,upvalues,prototypes,strings,uniqueStrings,stringPoolRefs,maximumDepth,status";
const csvRows=perFile.map(x=>[x.bundle,x.module,x.relativePath,x.luaVersion,x.prefix,x.size,x.sha256,x.functions,x.instructions,x.constants,x.upvalues,x.prototypes,x.strings,x.uniqueStrings,x.stringPoolRefs,x.maximumDepth,x.status].map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(","));
const csvPath=out.replace(/\.json$/i,"-files.csv");
fs.writeFileSync(csvPath,[csvHeader,...csvRows].join("\n")+"\n","utf8");
const candHeader="bundle,module,luaVersion,string,evidence";
const candRows=Array.from(candidateRows.values()).map(x=>[x.bundle,x.module,x.luaVersion,x.string,x.evidence].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(","));
const candPath=out.replace(/\.json$/i,"-table-candidates.csv");
fs.writeFileSync(candPath,[candHeader,...candRows].join("\n")+"\n","utf8");
console.log(JSON.stringify({filesScanned:files.length,filesPassed:passed,filesFailed:failures.length,byVersion,totalFunctions,totalInstructions,totalConstants,totalStrings,tableCandidateStringRows:candidateRows.size,status:result.status,report:out,perFileCsv:csvPath,candidateCsv:candPath},null,2));
process.exitCode=result.status==="PASS"?0:1;

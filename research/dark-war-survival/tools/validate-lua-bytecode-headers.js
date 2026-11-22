const fs=require("fs"),path=require("path");
const root=process.argv[2];
const out=process.argv[3]||"lua-header-validation.json";
if(!root){console.error("Usage: node validate-lua-bytecode-headers.js <AssetRipper-export-root> [report.json]");process.exit(2);}
const data=Buffer.from([0x19,0x93,0x0d,0x0a,0x1a,0x0a]);
const counts={lua54:0,lua55:0,invalid:0,zero:0,nonLuaBytes:0};
const failures=[];let totalBytes=0,scannedFiles=0;
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&ent.name.toLowerCase().endsWith(".bytes"))inspect(p);}}
function inspect(file){
 const b=fs.readFileSync(file);scannedFiles++;totalBytes+=b.length;
 if(!b.length){counts.zero++;counts.invalid++;if(failures.length<30)failures.push({file:path.relative(root,file),status:"ZERO_BYTE"});return;}
 if(!b.subarray(0,4).equals(Buffer.from([0x1b,0x4c,0x75,0x61]))){counts.nonLuaBytes++;counts.invalid++;if(failures.length<30)failures.push({file:path.relative(root,file),status:"NO_LUA_SIGNATURE"});return;}
 const v=b[5],prefix=b[4];let reason=[];
 if(b[6]!==0)reason.push("format");
 if(!b.subarray(7,13).equals(data))reason.push("luac_data");
 if(v===0x54){counts.lua54++;if(prefix!==0x03)reason.push("wrapper_prefix");if(b[13]!==4||b[14]!==8||b[15]!==8)reason.push("size_fields");if(b.length<32||b.readBigUInt64LE(16)!==0x5678n||b.readDoubleLE(24)!==370.5)reason.push("sentinels");}
 else if(v===0x55){counts.lua55++;if(prefix!==0xa8)reason.push("wrapper_prefix");if(b[13]!==4||b.readInt32LE(14)!==-0x5678||b[18]!==4||b.readUInt32LE(19)!==0x12345678||b[23]!==8||b.readBigInt64LE(24)!==-0x5678n||b[32]!==8||b.readDoubleLE(33)!==-370.5)reason.push("size_or_sentinels");}
 else reason.push("unknown_version");
 if(reason.length){counts.invalid++;if(failures.length<30)failures.push({file:path.relative(root,file),status:"HEADER_FAIL",version:v,prefix,reason});}
}
walk(root);
const result={date:new Date().toISOString().slice(0,10),totalBytesFiles:scannedFiles,counts,totalBytes,failures,status:counts.invalid===0?"PASS":"FAIL"};
fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n","utf8");
console.log(JSON.stringify(result,null,2));console.log("REPORT="+out);
process.exitCode=counts.invalid===0?0:1;

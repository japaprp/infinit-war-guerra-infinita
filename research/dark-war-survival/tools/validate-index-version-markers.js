const fs=require("fs"),path=require("path");
const root=process.argv[2],out=process.argv[3]||"index-version-validation.json";
if(!root){console.error("Usage: node validate-index-version-markers.js <index-metadata-directory> [report.json]");process.exit(2);}
const catalogs=["gameres","datatable","lua","download"];
function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
const results=[];
for(const name of catalogs){
 const index=fs.readFileSync(path.join(root,name));
 const [version,size,crc]=fs.readFileSync(path.join(root,name+".version"),"utf8").trim().split(",").map(x=>x.trim());
 const lines=index.toString("utf8").split(/\r?\n/).slice(0,3),actualCrc=crc32(index);
 const result={catalog:name,markerVersion:Number(version),markerSize:Number(size),actualSize:index.length,sizeMatch:index.length===Number(size),markerCRC32:Number(crc),actualCRC32:actualCrc,crcMatch:actualCrc===Number(crc),indexBuildHeader:lines[0],sectionVersion:Number(lines[2].split(",")[0]),sectionVersionMatch:Number(lines[2].split(",")[0])===Number(version)};
 result.status=result.sizeMatch&&result.crcMatch&&result.sectionVersionMatch?"PASS":"FAIL";results.push(result);
}
const report={date:new Date().toISOString().slice(0,10),status:results.every(x=>x.status==="PASS")?"PASS":"FAIL",results};
fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n","utf8");console.log(JSON.stringify(report,null,2));console.log("REPORT="+out);process.exitCode=report.status==="PASS"?0:1;

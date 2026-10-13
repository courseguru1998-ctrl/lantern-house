import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
// File-backed stand-in for the Supabase calls the studio makes (auth, project_members,
// review_records, review-images). Data lives in .local-data/, which is not committed.
const root=path.join(process.cwd(),'.local-data'),recordsFile=path.join(root,'records.json'),images=path.join(root,'review-images');
const user={id:'00000000-0000-4000-8000-000000000001'};
async function readRows():Promise<any[]>{try{return JSON.parse(await readFile(recordsFile,'utf8'));}catch(e:any){if(e.code==='ENOENT')return [];throw e;}}
async function writeRows(rows:any[]){await mkdir(root,{recursive:true});await writeFile(recordsFile+'.tmp',JSON.stringify(rows,null,1));await rename(recordsFile+'.tmp',recordsFile);}
// Writes are read-modify-write on one file, so run them one at a time.
let queue:Promise<unknown>=Promise.resolve();
function serial<T>(task:()=>Promise<T>):Promise<T>{const run=queue.then(task,task);queue=run.catch(()=>{});return run;}
class Query{
 operation='select';value:any;filters:[string,unknown][]=[];sort?:[string,boolean];max?:number;single=false;
 constructor(private table:string){}
 select(){return this;}
 insert(v:any){this.operation='insert';this.value=v;return this;}
 update(v:any){this.operation='update';this.value=v;return this;}
 eq(k:string,v:unknown){this.filters.push([k,v]);return this;}
 order(k:string,o?:{ascending?:boolean}){this.sort=[k,o?.ascending!==false];return this;}
 limit(n:number){this.max=n;return this;}
 maybeSingle(){this.single=true;return this;}
 then(resolve?:(r:{data:any;error:any})=>any,reject?:(e:any)=>any){return this.run().then(data=>({data,error:null}),error=>({data:null,error})).then(resolve,reject);}
 private async run(){
  const match=(r:any)=>this.filters.every(([k,v])=>r[k]===v);
  if(this.table==='project_members'){const rows=[{user_id:user.id}].filter(match);return this.single?rows[0]??null:rows;}
  if(this.table!=='review_records')throw Error('Unknown table: '+this.table);
  if(this.operation==='insert')return serial(async()=>{const rows=await readRows();rows.push(this.value);await writeRows(rows);return null;});
  if(this.operation==='update')return serial(async()=>{const rows=await readRows(),changed=rows.filter(match);changed.forEach(r=>Object.assign(r,this.value));if(changed.length)await writeRows(rows);return changed;});
  const rows=(await readRows()).filter(match);
  if(this.sort){const [k,ascending]=this.sort;rows.sort((a,b)=>(a[k]<b[k]?-1:a[k]>b[k]?1:0)*(ascending?1:-1));}
  return this.single?rows[0]??null:rows.slice(0,this.max??rows.length);
 }
}
function objectPath(key:string){if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(key))throw Error('Invalid image key');return path.join(images,...key.split('/'))+'.jpg';}
const bucket={
 async upload(key:string,bytes:Uint8Array){try{const file=objectPath(key);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes,{flag:'wx'});return {error:null};}catch(error){return {error};}},
 async download(key:string){try{return {data:new Blob([new Uint8Array(await readFile(objectPath(key)))],{type:'image/jpeg'}),error:null};}catch(error){return {data:null,error};}},
 async remove(keys:string[]){try{await Promise.all(keys.map(k=>rm(objectPath(k),{force:true})));return {error:null};}catch(error){return {error};}}
};
export function createLocalClient(){
 return {
  auth:{getUser:async()=>({data:{user},error:null}),signInWithPassword:async()=>({data:{user},error:null}),signOut:async()=>({error:null})},
  from:(table:string)=>new Query(table),
  storage:{from:()=>bucket}
 };
}

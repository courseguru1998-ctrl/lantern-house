// Executes the real API handlers against a mock Supabase client.
// Checks API control flow; live Auth, RLS and storage still need deployment QA.
import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
let user={id:'11111111-1111-4111-8111-111111111111',email:'owner@example.test'},member=true;
const rows=[],objects=new Map();
class Query{
 constructor(table){this.table=table;this.filters=[];this.operation='select';}
 select(){return this;}order(){return this;}limit(){return this;}
 eq(k,v){this.filters.push([k,v]);return this;}maybeSingle(){return this;}
 insert(v){this.operation='insert';this.value=v;return this;}
 update(v){this.operation='update';this.value=v;return this;}
 then(resolve,reject){try{let data;if(this.table==='project_members')data=member&&user?{user_id:user.id}:null;else if(this.operation==='insert'){rows.push(this.value);data=null;}else {const matching=rows.filter(r=>this.filters.every(([k,v])=>r[k]===v));if(this.operation==='update')matching.forEach(r=>Object.assign(r,this.value));data=matching;}return Promise.resolve({data,error:null}).then(resolve,reject);}catch(e){return Promise.reject(e).then(resolve,reject);}}
}
const client={auth:{getUser:async()=>({data:{user},error:null})},from:t=>new Query(t),storage:{from:()=>({upload:async(k,v)=>{objects.set(k,v);return {error:null};},download:async k=>({data:objects.has(k)?new Blob([objects.get(k)]):null,error:null}),remove:async keys=>{keys.forEach(k=>objects.delete(k));return {error:null};}})}};
const source=fs.readFileSync('app/api/review/route.ts','utf8').replace("import {createClient} from '@/lib/supabase/server';",'');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const api={};new Function('exports','createClient',compiled)(api,async()=>client);
async function call(method='GET',body,origin='https://studio.test',url='https://studio.test/api/review'){const res=await api[method](new Request(url,{method,headers:{origin,'Content-Type':'application/json','oai-authenticated-user-id':'forged-platform-header'},body:body?JSON.stringify(body):undefined}));return {status:res.status,body:res.headers.get('content-type')?.includes('json')?await res.json():await res.arrayBuffer()};}
const owner=user;user=null;assert.equal((await call()).status,401);user=owner;member=false;assert.equal((await call()).status,401);member=true;
assert.equal((await call('POST',{kind:'decision',title:'Finish',body:'Test',data:{room:'Living'}})).status,201);
let record=(await call()).body.records[0];assert.equal(record.user_id,owner.id);assert.equal(record.author,owner.email);
assert.equal((await call('POST',{action:'status',id:record.id,revision:1,status:'approved'})).status,200);
assert.equal((await call('POST',{action:'status',id:record.id,revision:1,status:'open'})).status,409);
user={id:'22222222-2222-4222-8222-222222222222',email:'reviewer@example.test'};assert.equal((await call('POST',{action:'status',id:record.id,revision:2,status:'open'})).status,409);user=owner;
const pin=await call('POST',{kind:'note',title:'Wall',body:'',data:{point:[1,2,3]},image:'data:image/jpeg;base64,/9j/2Q=='});assert.equal(pin.status,201);assert.ok(objects.has(owner.id+'/'+pin.body.id));assert.equal((await call('GET',null,undefined,'https://studio.test/api/review?image='+owner.id+'/'+pin.body.id)).status,200);
assert.equal((await call('POST',{kind:'bad',title:'X',body:'',data:{}})).status,400);assert.equal((await call('POST',{},'https://elsewhere.test')).status,403);
console.log('PASS Vercel API contract: verified identity, membership, records, ownership, stale writes, private image paths, validation and origin checks (mock Supabase).');

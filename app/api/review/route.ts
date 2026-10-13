import {createClient} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
const json=(x:unknown,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
async function identity(){const client=await createClient();const {data:{user},error}=await client.auth.getUser();if(error||!user)return null;const {data:member}=await client.from('project_members').select('user_id').eq('user_id',user.id).maybeSingle();return member?{client,id:user.id,name:user.email||'Project reviewer'}:null;}
function failure(e:unknown){console.error('Review storage:',e);return json({error:'Project storage is temporarily unavailable. Your input has been kept. Please try again.'},503);}
export async function GET(req:Request){
 const user=await identity();if(!user)return json({error:'Sign in to open this private project.'},401);
 try{const image=new URL(req.url).searchParams.get('image');if(image){if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(image))return json({error:'Invalid image'},400);const {data:item,error:readError}=await user.client.storage.from('review-images').download(image);if(readError||!item)return json({error:'Image not found'},404);return new Response(item,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=3600'}});}
 const {data:records,error}=await user.client.from('review_records').select('*').order('created',{ascending:false}).limit(500);if(error)throw error;return json({user:{id:user.id,name:user.name},records});}catch(e){return failure(e);}
}
export async function POST(req:Request){
 const user=await identity();if(!user)return json({error:'Sign in to save project changes.'},401);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Request origin is not allowed'},403);
 try{if(Number(req.headers.get('content-length'))>900000)return json({error:'This view is too large to save.'},413);const b:any=await req.json();if(!b||typeof b!=='object')return json({error:'Invalid record'},400);
 if(b.action==='status'){if(!['open','review','approved','resolved'].includes(b.status)||typeof b.id!=='string'||!Number.isInteger(b.revision))return json({error:'Invalid update'},400);const {data:changed,error}=await user.client.from('review_records').update({status:b.status,updated:new Date().toISOString(),revision:b.revision+1}).eq('id',b.id).eq('user_id',user.id).eq('revision',b.revision).select('id');if(error)throw error;if(!changed?.length)return json({error:'This item changed or belongs to another reviewer. Refresh before trying again.'},409);return json({ok:true});}
 if(!['note','view','scheme','decision','spec','publication'].includes(b.kind)||typeof b.title!=='string'||!b.title.trim()||b.title.length>140||typeof b.body!=='string'||b.body.length>4000||!b.data||typeof b.data!=='object'||Array.isArray(b.data))return json({error:'Please check the title and details.'},400);
 const id=crypto.randomUUID(),now=new Date().toISOString();let imageKey:string|null=null;
 const dataBase=JSON.stringify(b.data);if(dataBase.length>14000)return json({error:'Too much detail for one item.'},400);
 if(b.image){if(typeof b.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(b.image)||b.image.length>650000)return json({error:'The preview image could not be saved.'},400);imageKey=user.id+'/'+id;const {error}=await user.client.storage.from('review-images').upload(imageKey,Uint8Array.from(atob(b.image.split(',')[1]),c=>c.charCodeAt(0)),{contentType:'image/jpeg',upsert:false});if(error)throw error;}
 const {error:insertError}=await user.client.from('review_records').insert({id,kind:b.kind,title:b.title.trim(),body:b.body,data:{...b.data,image:imageKey,edition:'05'},status:'open',user_id:user.id,author:user.name,created:now,updated:now,revision:1});if(insertError){if(imageKey)await user.client.storage.from('review-images').remove([imageKey]);throw insertError;}return json({id},201);
 }catch(e){return failure(e);}
}

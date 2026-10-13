import {createClient} from '@/lib/supabase/server';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request origin.'},{status:403});
 try{const {email,password}=await req.json();if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>1024)return Response.json({error:'Enter your email and password.'},{status:400});
 const client=await createClient();const {data,error}=await client.auth.signInWithPassword({email,password});
 if(error||!data.user)return Response.json({error:'Sign-in failed. Check your email and password.'},{status:401});
 const {data:member}=await client.from('project_members').select('user_id').eq('user_id',data.user.id).maybeSingle();
 if(!member){await client.auth.signOut();return Response.json({error:'Ask the project owner to add your account to this project.'},{status:403});}
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Sign-in is unavailable. Check the project configuration.'},{status:503});}
}

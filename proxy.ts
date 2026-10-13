import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {localMode} from '@/lib/local/mode';
export async function proxy(request:NextRequest){
 if(localMode())return NextResponse.next();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const pathname=request.nextUrl.pathname,authRoute=pathname==='/login'||pathname.startsWith('/api/auth/');
 const login=()=>{const next=request.nextUrl.clone();next.pathname='/login';next.search='';next.searchParams.set('next',pathname+request.nextUrl.search);return NextResponse.redirect(next);};
 if(!url||!key){if(authRoute)return NextResponse.next();return pathname.startsWith('/api/')?NextResponse.json({error:'Configure the Supabase environment variables.'},{status:503}):login();}
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(items){items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 const {data:{user},error}=await supabase.auth.getUser();
 const finish=(out:NextResponse)=>{response.cookies.getAll().forEach(cookie=>out.cookies.set(cookie));out.headers.set('Cache-Control','private, no-store');return out;};
 if(authRoute)return finish(response);
 if(error||!user)return finish(pathname.startsWith('/api/')?NextResponse.json({error:'Sign in to open this private project.'},{status:401}):login());
 const {data:member}=await supabase.from('project_members').select('user_id').eq('user_id',user.id).maybeSingle();
 if(!member)return finish(pathname.startsWith('/api/')?NextResponse.json({error:'Your account has not been added to this project.'},{status:403}):login());
 return finish(response);
}
// The HTML model and floor-plan assets are protected too; only framework files,
// the favicon and sign-in routes can be served before authorization.
export const config={matcher:['/((?!_next/static|_next/image|favicon.svg).*)']};

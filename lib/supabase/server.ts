import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export async function createClient(){
 const jar=await cookies();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('Configure Supabase environment variables first.');
 return createServerClient(url,key,{cookies:{getAll(){return jar.getAll();},setAll(items){items.forEach(({name,value,options})=>jar.set(name,value,options));}}});
}

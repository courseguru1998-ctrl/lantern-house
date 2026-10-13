import LoginForm from './sign-in';
import {localMode} from '@/lib/local/mode';
export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){
 const {next}=await searchParams;
 const configured=!!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
 return <main style={{maxWidth:420,margin:'12vh auto',padding:24}}><h1 style={{font:'36px Georgia'}}>Lantern House</h1><p>Sign in to your private design studio.</p>{localMode()?<p role="status">Local mode is on: sign-in is skipped on this computer and records are saved in <code>.local-data/</code>. <a href="/">Open the studio</a></p>:configured?<LoginForm destination={next||'/'}/>:<p role="alert">Setup required: add the two Supabase environment variables from .env.example, run supabase/schema.sql, and create your project account. See README.md.</p>}</main>;
}

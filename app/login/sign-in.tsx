'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export default function LoginForm({destination}:{destination:string}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <form style={{display:'grid',gap:18,marginTop:24}} onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);try{const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password')})});const data=await response.json();if(!response.ok)throw Error(data.error);const next=new URL(destination,location.origin);location.assign(next.origin===location.origin&&!next.pathname.startsWith('/login')?next.pathname+next.search:'/');}catch(err:any){setError(err.message);}finally{setBusy(false);}}}><label>Email<Input name="email" type="email" autoComplete="username" required/></label><label>Password<Input name="password" type="password" autoComplete="current-password" required/></label>{error&&<p role="alert">{error}</p>}<Button disabled={busy}>{busy?'Signing in…':'Sign in'}</Button><p style={{fontSize:14}}>Accounts are supplied by the project owner. Contact them if you need access or a password reset.</p></form>;
}

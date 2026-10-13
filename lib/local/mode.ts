// Local mode runs the studio on this computer without Supabase. Production builds
// ignore it, so a stray LANTERN_LOCAL_MODE value cannot open a Vercel deployment.
export const localMode=()=>process.env.LANTERN_LOCAL_MODE==='1'&&process.env.NODE_ENV!=='production';

import {createClient, type SupabaseClient} from '@supabase/supabase-js';
let singleton:SupabaseClient|null=null;
export function configured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)}
export function db():SupabaseClient|null {
 if(!configured())return null;
 if(!singleton)singleton=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:true,autoRefreshToken:true}});
 return singleton;
}

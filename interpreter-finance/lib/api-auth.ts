import { supabase } from './supabase'


// RETURNS AUTHORIZATION HEADERS USING THE CURRENT SUPABASE SESSION TOKEN FOR CLIENT-SIDE API CALLS
export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

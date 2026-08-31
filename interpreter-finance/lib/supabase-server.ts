import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _client: SupabaseClient | null = null
let _authClient: SupabaseClient | null = null

export function createSupabaseClient(token?: string | null): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (token) {
    if (!_authClient) {
      _authClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    }
    return _authClient
  }
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export async function getUserIdFromRequest(request: Request): Promise<{ userId: string | null; supabase: SupabaseClient | null }> {
  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const supabase = createSupabaseClient(token)
  if (!token || !supabase) return { userId: null, supabase: null }
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return { userId: null, supabase }
    return { userId: data.user.id, supabase }
  } catch {
    return { userId: null, supabase }
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Retorna null si faltan variables (el route degradará gracefulmente).
export function createSupabaseClient(token?: string | null): SupabaseClient | null {
  console.log('[supabase-server] createSupabaseClient, url=', supabaseUrl ? 'set' : 'MISSING', 'key=', supabaseAnonKey ? 'set' : 'MISSING')
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  })
}

// Devuelve el user_id y un cliente autenticado, o null si no hay conexión.
// Nunca lanza en la importación del módulo.
export async function getUserIdFromRequest(
  request: Request
): Promise<{ userId: string | null; supabase: SupabaseClient | null }> {
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
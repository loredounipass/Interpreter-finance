import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function requireEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    )
  }
}

// Cliente de Supabase con el access token del usuario inyectado en los headers.
// Así las RLS policies ven auth.uid() correcto en cada request (un singleton
// sin token ejecutaría las queries como anónimo y las policies bloquearían).
export function createSupabaseClient(token?: string | null): SupabaseClient {
  requireEnv()
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  })
}

// Devuelve el user_id y un cliente autenticado a partir del bearer token.
export async function getUserIdFromRequest(
  request: Request
): Promise<{ userId: string | null; supabase: SupabaseClient }> {
  requireEnv()
  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const supabase = createSupabaseClient(token)
  if (!token) return { userId: null, supabase }
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { userId: null, supabase }
  return { userId: data.user.id, supabase }
}
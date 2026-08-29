import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
  )
}

// Cliente para usar en los route handlers del servidor. El anon key es público;
// la autorización real se hace verificando el access token que envía el cliente.
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey)

// Devuelve el user_id a partir del bearer token del request, o null si no es válido.
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const { data, error } = await supabaseServer.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

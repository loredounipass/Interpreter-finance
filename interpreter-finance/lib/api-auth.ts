import { supabase } from './supabase'

// Headers de autorización para llamar a nuestras API routes desde el cliente.
// Usa la sesión activa de Supabase (access token) para que el servidor pueda
// identificar al usuario y aplicar las RLS policies.
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

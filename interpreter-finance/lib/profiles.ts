import { supabase } from './supabase'


// CREATES A USER PROFILE ROW IN SUPABASE AFTER REGISTRATION
export async function createProfile(userId: string, firstName: string, lastName: string, email: string) {
  const { error } = await supabase
    .from('profiles')
    .insert([{ id: userId, first_name: firstName, last_name: lastName, email }])
  return { error }
}

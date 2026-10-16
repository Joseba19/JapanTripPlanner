import { db } from '../lib/supabase.js'

export async function fetchSettings() {
  const { data, error } = await db.from('settings').select('eur_jpy, updated_at, updated_by').eq('id', 1).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function updateRate(eurJpy, me) {
  const { data, error } = await db
    .from('settings')
    .update({ eur_jpy: eurJpy, updated_by: me })
    .eq('id', 1)
    .select('eur_jpy, updated_at, updated_by')
    .single()
  if (error) throw new Error(error.message)
  return data
}

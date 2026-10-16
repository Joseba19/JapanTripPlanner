import { db } from '../lib/supabase.js'

const fail = (error) => {
  throw Object.assign(new Error(error.message || 'Error de Supabase'), { cause: error })
}

/** Todos los planes, archivados incluidos (son pocos: se filtran en el cliente). */
export async function fetchPlans() {
  const { data, error } = await db.from('plans').select('*').order('position', { ascending: true })
  if (error) fail(error)
  return data
}

export async function createPlan(values, me) {
  const { data, error } = await db
    .from('plans')
    .insert({ ...values, created_by: me, updated_by: me })
    .select()
    .single()
  if (error) fail(error)
  return data
}

export async function updatePlan(id, patch, me) {
  const { data, error } = await db
    .from('plans')
    .update({ ...patch, updated_by: me })
    .eq('id', id)
    .select()
    .single()
  if (error) fail(error)
  return data
}

export const archivePlan = (id, me) =>
  updatePlan(id, { archived_at: new Date().toISOString(), archived_by: me }, me)

export const restorePlan = (id, me) => updatePlan(id, { archived_at: null, archived_by: null }, me)

/** Borrado definitivo: la política RLS solo lo permite si el plan está archivado. */
export async function deletePlan(id) {
  const { data, error } = await db
    .from('plans')
    .delete()
    .eq('id', id)
    .not('archived_at', 'is', null)
    .select('id')
  if (error) fail(error)
  if (!data.length) throw new Error('Solo se pueden borrar planes archivados.')
}

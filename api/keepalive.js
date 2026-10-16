// Keep-alive para el plan gratuito de Supabase (se pausa tras 7 días sin actividad).
// Vercel Cron llama aquí una vez al día (vercel.json) con "Authorization: Bearer $CRON_SECRET".
// Hace una escritura real: actualiza la fila de public.heartbeat mediante la función SQL heartbeat().

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret) return res.status(500).json({ ok: false, error: 'Falta CRON_SECRET en Vercel' })
  if (req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ ok: false })

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  try {
    const response = await fetch(`${url}/rest/v1/rpc/heartbeat`, {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/json' },
      body: JSON.stringify({ p_source: 'vercel-cron' }),
    })
    const body = await response.json().catch(() => null)
    return res.status(response.ok ? 200 : 502).json({ ok: response.ok, status: response.status, beat_at: body })
  } catch (error) {
    return res.status(502).json({ ok: false, error: String(error) })
  }
}

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key) ? createClient(url, key) : null

// URL publique d'un fichier audio Assimil
export function assimilAudioUrl(lessonNum, filename) {
  if (!url) return null
  return `${url}/storage/v1/object/public/assimil/L${String(lessonNum).padStart(3,'0')}/${filename}`
}

export const supabaseReady = !!(url && key)

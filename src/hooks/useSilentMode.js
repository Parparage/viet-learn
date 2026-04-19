import { useState } from 'react'

const KEY = 'viet-silent-mode'

export function useSilentMode() {
  const [silent, setSilent] = useState(() => localStorage.getItem(KEY) === 'true')

  const toggle = () => setSilent(prev => {
    const next = !prev
    localStorage.setItem(KEY, String(next))
    return next
  })

  return { silent, toggle }
}

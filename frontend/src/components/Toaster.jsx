import { useEffect, useState } from 'react'
import { toast } from '../lib/toast'
import { AlertIcon, CheckIcon } from './icons'

export function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => toast.subscribe(setToasts), [])

  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status">
          <span className="toast-icon">{t.type === 'error' ? <AlertIcon /> : <CheckIcon />}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

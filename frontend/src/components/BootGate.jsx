import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { AlertIcon, CalendarCheckIcon } from './icons'

const TIMEOUT_MS = 90_000 // give a cold-started free instance time to wake up
const RETRY_MS = 2_500
const SLOW_AFTER_MS = 4_000

// Gates the app behind a successful backend health ping, so users never land on
// a half-awake API. Shows a polished loading state (and a reassuring message
// once it's taking a while), with a retry on persistent failure.
export function BootGate({ children }) {
  const [status, setStatus] = useState('connecting') // connecting | ready | error
  const [slow, setSlow] = useState(false)
  const [round, setRound] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timer
    const startedAt = Date.now()
    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlow(true)
    }, SLOW_AFTER_MS)

    const ping = async () => {
      try {
        await apiClient.get('/health', { timeout: 8_000 })
        if (!cancelled) setStatus('ready')
      } catch {
        if (cancelled) return
        if (Date.now() - startedAt > TIMEOUT_MS) {
          setStatus('error')
          return
        }
        timer = setTimeout(ping, RETRY_MS)
      }
    }
    ping()

    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(slowTimer)
    }
  }, [round])

  if (status === 'ready') return children

  if (status === 'error') {
    return (
      <div className="boot">
        <div className="boot-card">
          <span className="boot-mark boot-mark-err" aria-hidden="true">
            <AlertIcon width={26} height={26} />
          </span>
          <h1 className="boot-title">Can’t reach the server</h1>
          <p className="boot-sub">
            The backend didn’t respond in time. It may still be starting up, or it’s temporarily
            unavailable.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSlow(false)
              setStatus('connecting')
              setRound((r) => r + 1)
            }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="boot" role="status" aria-live="polite">
      <div className="boot-card">
        <span className="boot-mark" aria-hidden="true">
          <CalendarCheckIcon width={28} height={28} />
        </span>
        <span className="boot-ring" aria-hidden="true" />
        <h1 className="boot-title">Mini Booking</h1>
        <p className="boot-text">{slow ? 'Waking up the server…' : 'Connecting…'}</p>
        {slow && (
          <p className="boot-sub">The free server sleeps when idle — this can take up to a minute. Hang tight.</p>
        )}
        <span className="boot-bar" aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  )
}

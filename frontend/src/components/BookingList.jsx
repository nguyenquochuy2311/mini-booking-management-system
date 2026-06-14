import { useState } from 'react'
import { useBooking } from '../context/BookingContext'
import { toast } from '../lib/toast'
import { CalendarIcon, ClockIcon, TrashIcon } from './icons'
import { ChooseRoomArt, EmptyScheduleArt } from './illustrations'

const fmtDate = (d) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// Stable accent per name so each avatar is consistently coloured.
const avatarHue = (name) => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

const validDate = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function BookingList() {
  const { bookings, selectedRoomId, isAuthenticated, deleteBooking, bookingsLoading, draft } = useBooking()
  const [deletingId, setDeletingId] = useState(null)

  if (!selectedRoomId) {
    return (
      <div className="empty-state" data-testid="booking-list-placeholder">
        <ChooseRoomArt />
        <p className="empty-title">Select a room to see its bookings.</p>
        <p className="muted">Pick a room to view and manage its schedule.</p>
      </div>
    )
  }

  if (bookingsLoading) {
    return (
      <div className="booking-list">
        {[0, 1, 2].map((i) => (
          <div key={i} className="booking-skeleton skeleton" />
        ))}
      </div>
    )
  }

  // Live preview of the booking currently being typed in the form.
  const ghostStart = isAuthenticated && draft ? validDate(draft.start_time) : null
  const ghost = ghostStart
    ? { name: (draft.user_name || '').trim() || 'New booking', start: ghostStart, end: validDate(draft.end_time) }
    : null

  if (bookings.length === 0 && !ghost) {
    return (
      <div className="empty-state" data-testid="booking-list-empty">
        <EmptyScheduleArt />
        <p className="empty-title">No bookings for this room yet.</p>
        <p className="muted">{isAuthenticated ? 'Create one — it appears here instantly.' : 'Log in as an admin to add one.'}</p>
      </div>
    )
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteBooking(id)
      toast.success('Booking deleted')
    } finally {
      setDeletingId(null)
    }
  }

  // Merge real bookings with the ghost at its chronological position.
  const items = bookings.map((b) => ({ kind: 'real', b }))
  if (ghost) {
    const idx = items.findIndex((it) => new Date(it.b.start_time) > ghost.start)
    const node = { kind: 'ghost', ghost }
    if (idx === -1) items.push(node)
    else items.splice(idx, 0, node)
  }

  return (
    <ul className="booking-list" data-testid="booking-list">
      {items.map((item, i) => {
        if (item.kind === 'ghost') {
          const hue = avatarHue(item.ghost.name)
          return (
            <li key="__ghost" className="booking-item ghost" style={{ '--row-accent': `hsl(${hue} 70% 55%)` }}>
              <span className="booking-avatar" aria-hidden="true">
                {item.ghost.name.charAt(0).toUpperCase()}
              </span>
              <div className="booking-body">
                <strong className="booking-name">{item.ghost.name}</strong>
                <span className="booking-time muted">
                  <CalendarIcon width={14} height={14} />
                  {fmtDate(item.ghost.start)}
                  <span className="dot" aria-hidden="true">
                    •
                  </span>
                  <ClockIcon width={14} height={14} />
                  {fmtTime(item.ghost.start)} {item.ghost.end ? `– ${fmtTime(item.ghost.end)}` : '– …'}
                </span>
              </div>
              <span className="ghost-tag">Preview</span>
            </li>
          )
        }

        const booking = item.b
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        const hue = avatarHue(booking.user_name || '?')
        return (
          <li
            key={booking.id}
            className="booking-item stagger"
            data-testid="booking-item"
            data-booking-id={booking.id}
            style={{ '--row-accent': `hsl(${hue} 70% 55%)`, animationDelay: `${Math.min(i, 6) * 50}ms` }}
          >
            <span className="booking-avatar" aria-hidden="true">
              {(booking.user_name || '?').charAt(0).toUpperCase()}
            </span>
            <div className="booking-body">
              <strong className="booking-name" data-testid="booking-user-name">
                {booking.user_name}
              </strong>
              <span className="booking-time muted" data-testid="booking-time-range">
                <CalendarIcon width={14} height={14} />
                {fmtDate(start)}
                <span className="dot" aria-hidden="true">
                  •
                </span>
                <ClockIcon width={14} height={14} />
                {fmtTime(start)} – {fmtTime(end)}
              </span>
            </div>
            {isAuthenticated && (
              <button
                type="button"
                className="icon-btn danger"
                disabled={deletingId === booking.id}
                onClick={() => handleDelete(booking.id)}
                data-testid="booking-delete-button"
                aria-label={`Delete booking for ${booking.user_name}`}
                title="Delete booking"
              >
                {deletingId === booking.id ? <span className="spinner" aria-hidden="true" /> : <TrashIcon width={16} height={16} />}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

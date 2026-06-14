import { useBooking } from '../context/BookingContext'
import { HERO_FALLBACK, HERO_IMAGE } from '../lib/roomImage'

export function Hero() {
  const { rooms } = useBooking()

  return (
    <section className="hero">
      <img
        className="hero-bg"
        src={HERO_IMAGE}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={(e) => {
          if (!e.currentTarget.dataset.fb) {
            e.currentTarget.dataset.fb = '1'
            e.currentTarget.src = HERO_FALLBACK
          }
        }}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="hero-eyebrow">Workspace scheduling</p>
        <h1 className="hero-title">Book the right room, in seconds.</h1>
        <p className="hero-sub">
          Browse meeting rooms, check availability, and reserve a slot — with overlaps blocked automatically.
        </p>
        <div className="hero-stats">
          <span className="hero-stat">
            <strong>{rooms.length || '—'}</strong> rooms
          </span>
          <span className="hero-dot" aria-hidden="true" />
          <span className="hero-stat">
            <strong>{rooms.reduce((s, r) => s + (r.capacity || 0), 0) || '—'}</strong> seats
          </span>
        </div>
      </div>
    </section>
  )
}

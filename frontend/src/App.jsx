import { useEffect, useState } from 'react'
import { BookingForm } from './components/BookingForm'
import { BookingList } from './components/BookingList'
import { Hero } from './components/Hero'
import { LoginForm } from './components/LoginForm'
import { RoomList } from './components/RoomList'
import { RoomPicker } from './components/RoomPicker'
import { ThemeToggle } from './components/ThemeToggle'
import { Toaster } from './components/Toaster'
import { CalendarCheckIcon, CloseIcon, PlusIcon } from './components/icons'
import { useBooking } from './context/BookingContext'
import './App.css'

function App() {
  const { rooms, bookings, selectedRoomId, error, bookingsLoading, isAuthenticated } = useBooking()
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)
  const [sheetOpen, setSheetOpen] = useState(false)

  // The create form can mutate only when authed + a room is chosen.
  const canCreate = isAuthenticated && Boolean(selectedRoomId)
  // Effective open state — never "open" when creating isn't possible (e.g. logout).
  const isSheetOpen = sheetOpen && canCreate

  // Lock background scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.classList.toggle('sheet-locked', isSheetOpen)
    return () => document.body.classList.remove('sheet-locked')
  }, [isSheetOpen])

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <CalendarCheckIcon width={20} height={20} />
          </span>
          <div className="brand-text">
            <span className="brand-name">Mini Booking</span>
            <span className="brand-sub">Room scheduling</span>
          </div>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <LoginForm />
        </div>
      </header>

      <Hero />

      {error && (
        <p className="banner-error" role="alert">
          {error}
        </p>
      )}

      <div className="layout">
        <RoomList />

        <main className="panel main-panel">
          <RoomPicker />
          <div className="panel-head">
            <div>
              <h2>{selectedRoom ? `Bookings · ${selectedRoom.name}` : 'Bookings'}</h2>
              {selectedRoom && (
                <p className="muted panel-sub">
                  {bookingsLoading
                    ? 'Loading…'
                    : `${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'} scheduled`}
                </p>
              )}
            </div>
          </div>

          <div className="schedule">
            <div className="schedule-list">
              <BookingList />
            </div>
            <div className={isSheetOpen ? 'schedule-form open' : 'schedule-form'}>
              <button
                type="button"
                className="sheet-close"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
              >
                <CloseIcon width={18} height={18} />
              </button>
              <BookingForm onSuccess={() => setSheetOpen(false)} />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile-only: floating button opens the create form as a bottom sheet. */}
      {canCreate && !isSheetOpen && (
        <button type="button" className="fab btn btn-primary" onClick={() => setSheetOpen(true)}>
          <PlusIcon width={18} height={18} />
          New booking
        </button>
      )}
      {isSheetOpen && <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />}

      <Toaster />
    </div>
  )
}

export default App

import { useBooking } from '../context/BookingContext'
import { roomImage, roomImageFallback } from '../lib/roomImage'
import { CheckIcon, UsersIcon } from './icons'

const onImgError = (name) => (e) => {
  if (!e.currentTarget.dataset.fb) {
    e.currentTarget.dataset.fb = '1'
    e.currentTarget.src = roomImageFallback(name)
  }
}

export function RoomList() {
  const { rooms, selectedRoomId, selectRoom, roomsLoading } = useBooking()

  return (
    <aside className="panel rooms-panel">
      <div className="panel-head">
        <h2>Rooms</h2>
        {rooms.length > 0 && <span className="badge">{rooms.length}</span>}
      </div>

      {roomsLoading && rooms.length === 0 ? (
        <div className="room-list">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="room-card skeleton" style={{ height: 132 }} />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <p className="muted">No rooms available.</p>
      ) : (
        <ul className="room-list" data-testid="room-list">
          {rooms.map((room, i) => {
            const active = room.id === selectedRoomId
            return (
              <li key={room.id} className="stagger" style={{ animationDelay: `${i * 70}ms` }}>
                <button
                  type="button"
                  className={active ? 'room-card active' : 'room-card'}
                  onClick={() => selectRoom(room.id)}
                  data-testid="room-item"
                  data-room-id={room.id}
                  data-room-name={room.name}
                  data-active={active}
                  aria-pressed={active}
                >
                  <span className="room-cover">
                    <img src={roomImage(room.name)} alt="" loading="lazy" onError={onImgError(room.name)} />
                    <span className="room-cover-badge">
                      <UsersIcon width={13} height={13} />
                      {room.capacity}
                    </span>
                    {active && (
                      <span className="room-check" aria-hidden="true">
                        <CheckIcon width={14} height={14} />
                      </span>
                    )}
                  </span>
                  <span className="room-info">
                    <span className="room-name" data-testid="room-name">
                      {room.name}
                    </span>
                    <span className="room-capacity muted" data-testid="room-capacity">
                      <UsersIcon width={14} height={14} />
                      Seats {room.capacity}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}

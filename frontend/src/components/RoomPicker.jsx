import { useBooking } from '../context/BookingContext'

// Compact room selector for mobile (replaces the photo-card sidebar there).
export function RoomPicker() {
  const { rooms, selectedRoomId, selectRoom } = useBooking()

  return (
    <div className="room-picker">
      <label className="field-label" htmlFor="room-select">
        Room
      </label>
      <select
        id="room-select"
        className="input room-select"
        value={selectedRoomId ?? ''}
        onChange={(event) => selectRoom(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="" disabled>
          Select a room…
        </option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name} · {room.capacity} seats
          </option>
        ))}
      </select>
    </div>
  )
}

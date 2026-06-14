import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, getStoredToken, setStoredToken } from '../api/client'

const BookingContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useBooking = () => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}

const fetchRooms = () => apiClient.get('/rooms').then((response) => response.data.data)

const fetchBookings = (roomId) =>
  apiClient.get(`/rooms/${roomId}/bookings`).then((response) => response.data.data)

export function BookingProvider({ children }) {
  const [rooms, setRooms] = useState([])
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [bookings, setBookings] = useState([])
  const [token, setToken] = useState(getStoredToken())
  const [error, setError] = useState(null)
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  // Live draft from the create form, rendered as a ghost card in the list.
  const [draft, setDraft] = useState(null)

  const isAuthenticated = Boolean(token)

  // Load rooms once on mount, and default-select the first room so the user
  // lands on a room's schedule instead of an empty prompt.
  useEffect(() => {
    let active = true
    fetchRooms()
      .then((data) => {
        if (!active) return
        setRooms(data)
        setRoomsLoading(false)
        if (data.length > 0) {
          setSelectedRoomId((current) => current ?? data[0].id)
          setBookingsLoading(true)
        }
      })
      .catch(() => active && (setError('Failed to load rooms.'), setRoomsLoading(false)))
    return () => {
      active = false
    }
  }, [])

  // Validate a stored token on load so write affordances only appear when the
  // session is genuinely valid (a stale/expired token ⇒ treated as logged out).
  useEffect(() => {
    const stored = getStoredToken()
    if (!stored) {
      return
    }
    let active = true
    apiClient.get('/user').catch((err) => {
      if (active && err.response?.status === 401) {
        setStoredToken(null)
        setToken(null)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // React to a 401 anywhere (e.g. token expires mid-session): log out + reset.
  useEffect(() => {
    const onExpired = () => {
      setToken(null)
      setSelectedRoomId(null)
      setBookings([])
      setDraft(null)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  // Reload bookings whenever the selected room changes.
  useEffect(() => {
    if (!selectedRoomId) {
      return
    }
    let active = true
    fetchBookings(selectedRoomId)
      .then((data) => active && (setBookings(data), setBookingsLoading(false)))
      .catch(() => active && (setError('Failed to load bookings.'), setBookingsLoading(false)))
    return () => {
      active = false
    }
  }, [selectedRoomId])

  const refreshBookings = useCallback(async () => {
    if (selectedRoomId) {
      setBookings(await fetchBookings(selectedRoomId))
    }
  }, [selectedRoomId])

  const selectRoom = useCallback(
    (roomId) => {
      setError(null)
      setDraft(null)
      if (roomId !== selectedRoomId) {
        setBookingsLoading(true)
      }
      setSelectedRoomId(roomId)
    },
    [selectedRoomId],
  )

  const login = useCallback(async (credentials) => {
    const { data } = await apiClient.post('/login', credentials)
    setStoredToken(data.token)
    setToken(data.token)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/logout')
    } catch {
      // Token may already be invalid — clear locally regardless.
    }
    setStoredToken(null)
    setToken(null)
    // Reset the view to a clean state so no logged-in-session data lingers.
    // (Rooms/bookings remain publicly browsable by selecting a room again.)
    setSelectedRoomId(null)
    setBookings([])
    setDraft(null)
  }, [])

  // Returns the created booking. Throws on validation/overlap (422) so the
  // form can surface field-keyed errors.
  const createBooking = useCallback(
    async (payload) => {
      const { data } = await apiClient.post('/bookings', payload)
      await refreshBookings()
      return data.data
    },
    [refreshBookings],
  )

  const deleteBooking = useCallback(
    async (id) => {
      await apiClient.delete(`/bookings/${id}`)
      await refreshBookings()
    },
    [refreshBookings],
  )

  const value = useMemo(
    () => ({
      rooms,
      bookings,
      selectedRoomId,
      selectRoom,
      isAuthenticated,
      login,
      logout,
      createBooking,
      deleteBooking,
      error,
      roomsLoading,
      bookingsLoading,
      draft,
      setDraft,
    }),
    [
      rooms,
      bookings,
      selectedRoomId,
      selectRoom,
      isAuthenticated,
      login,
      logout,
      createBooking,
      deleteBooking,
      error,
      roomsLoading,
      bookingsLoading,
      draft,
    ],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

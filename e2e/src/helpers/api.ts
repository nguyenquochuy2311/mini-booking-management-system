import type { APIRequestContext } from '@playwright/test'
import { ADMIN, API_URL, E2E_USER_PREFIX } from './constants'

export interface Room {
  id: number
  name: string
  capacity: number
}

export interface Booking {
  id: number
  room_id: number
  user_name: string
  start_time: string
  end_time: string
}

export interface BookingInput {
  room_id: number
  user_name: string
  start_time: string
  end_time: string
}

/**
 * Thin REST wrapper used for arranging/cleaning state out-of-band (global
 * setup/teardown, fixtures). UI behaviour is exercised through the browser; this
 * is only for the arrange/cleanup phases.
 */
export class ApiClient {
  private constructor(
    private readonly request: APIRequestContext,
    private readonly token: string,
  ) {}

  static async login(request: APIRequestContext): Promise<ApiClient> {
    const res = await request.post(`${API_URL}/login`, {
      data: ADMIN,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok()) {
      throw new Error(`Admin login failed: ${res.status()} ${await res.text()}`)
    }
    const body = await res.json()
    return new ApiClient(request, body.token)
  }

  get authToken(): string {
    return this.token
  }

  private authHeaders() {
    return { Authorization: `Bearer ${this.token}`, Accept: 'application/json' }
  }

  private roomsCache?: Room[]

  // Rooms are static seed data; fetch once per client to avoid hammering the
  // dev server (each test + cleanup would otherwise re-list rooms repeatedly).
  async getRooms(): Promise<Room[]> {
    if (!this.roomsCache) {
      const res = await this.request.get(`${API_URL}/rooms`, { headers: { Accept: 'application/json' } })
      this.roomsCache = (await res.json()).data
    }
    return this.roomsCache!
  }

  async getRoomBookings(roomId: number): Promise<Booking[]> {
    const res = await this.request.get(`${API_URL}/rooms/${roomId}/bookings`, {
      headers: { Accept: 'application/json' },
    })
    return (await res.json()).data
  }

  async createBooking(input: BookingInput): Promise<Booking> {
    const res = await this.request.post(`${API_URL}/bookings`, {
      data: input,
      headers: this.authHeaders(),
    })
    if (res.status() !== 201) {
      throw new Error(`createBooking expected 201, got ${res.status()}: ${await res.text()}`)
    }
    return (await res.json()).data
  }

  async deleteBooking(id: number): Promise<void> {
    await this.request.delete(`${API_URL}/bookings/${id}`, { headers: this.authHeaders() })
  }

  /**
   * Delete only e2e-owned rows (user_name startsWith the e2e prefix) across all
   * rooms. Safe to run against the shared TiDB database. Returns count removed.
   */
  async sweepE2eBookings(): Promise<number> {
    const rooms = await this.getRooms()
    let removed = 0
    for (const room of rooms) {
      const bookings = await this.getRoomBookings(room.id)
      for (const b of bookings) {
        if (typeof b.user_name === 'string' && b.user_name.startsWith(E2E_USER_PREFIX)) {
          await this.deleteBooking(b.id)
          removed += 1
        }
      }
    }
    return removed
  }

  /** Delete every booking carrying an exact user_name (per-test cleanup). */
  async deleteByUserName(userName: string): Promise<void> {
    const rooms = await this.getRooms()
    for (const room of rooms) {
      const bookings = await this.getRoomBookings(room.id)
      for (const b of bookings) {
        if (b.user_name === userName) {
          await this.deleteBooking(b.id)
        }
      }
    }
  }

  /**
   * Find a booking in a room by its exact UTC start instant (and optional name).
   * Compares by epoch, not string, because PHP returns microsecond ISO
   * (…000000Z) while JS produces millisecond ISO (…000Z).
   */
  async findBooking(roomId: number, startUtcIso: string, userName?: string): Promise<Booking | undefined> {
    const target = Date.parse(startUtcIso)
    const bookings = await this.getRoomBookings(roomId)
    return bookings.find(
      (b) => Date.parse(b.start_time) === target && (userName === undefined || b.user_name === userName),
    )
  }
}

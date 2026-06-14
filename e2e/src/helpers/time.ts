// Deterministic time-window generator — the keystone for running against a
// shared database. Every window is anchored far in the future (year 2099) and
// each call to nextWindow() strides a full day forward, so two windows from
// different tests can never accidentally overlap, and they never collide with
// real or seeded data.

export interface TimeWindow {
  startUtc: Date
  endUtc: Date
}

const BASE_UTC = Date.UTC(2099, 0, 1, 0, 0, 0) // 2099-01-01T00:00:00Z
const SLOT_MS = 60 * 60 * 1000 // 1-hour bookings
const STRIDE_MS = 24 * 60 * 60 * 1000 // 1 day between consecutive windows
const HALF_HOUR = 30 * 60 * 1000
const QUARTER_HOUR = 15 * 60 * 1000

let counter = 0

/** A fresh, globally-unique 1-hour window no other test will touch. */
export function nextWindow(): TimeWindow {
  const start = new Date(BASE_UTC + counter * STRIDE_MS)
  counter += 1
  return { startUtc: start, endUtc: new Date(start.getTime() + SLOT_MS) }
}

const win = (startMs: number, endMs: number): TimeWindow => ({
  startUtc: new Date(startMs),
  endUtc: new Date(endMs),
})

// Derivations relative to an existing window `w`, for the overlap matrix.
/** Ends exactly when `w` starts → back-to-back, NOT overlapping. */
export const before = (w: TimeWindow): TimeWindow => win(w.startUtc.getTime() - SLOT_MS, w.startUtc.getTime())
/** Starts exactly when `w` ends → back-to-back, NOT overlapping. */
export const after = (w: TimeWindow): TimeWindow => win(w.endUtc.getTime(), w.endUtc.getTime() + SLOT_MS)
/** Fully inside `w` → overlaps. */
export const inside = (w: TimeWindow): TimeWindow => win(w.startUtc.getTime() + QUARTER_HOUR, w.endUtc.getTime() - QUARTER_HOUR)
/** Fully contains `w` → overlaps. */
export const contains = (w: TimeWindow): TimeWindow => win(w.startUtc.getTime() - HALF_HOUR, w.endUtc.getTime() + HALF_HOUR)
/** Straddles `w`'s start → overlaps. */
export const straddleStart = (w: TimeWindow): TimeWindow => win(w.startUtc.getTime() - HALF_HOUR, w.startUtc.getTime() + HALF_HOUR)
/** Straddles `w`'s end → overlaps. */
export const straddleEnd = (w: TimeWindow): TimeWindow => win(w.endUtc.getTime() - HALF_HOUR, w.endUtc.getTime() + HALF_HOUR)

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The datetime-local string (Asia/Singapore wall-clock, UTC+8) that the browser
 * — with timezoneId pinned to Asia/Singapore — converts back to exactly `utc`
 * via `new Date(value).toISOString()`. Keeps UI-entered times and API
 * assertions in lockstep regardless of the runner's real timezone.
 */
export function toLocalInput(utc: Date): string {
  const sgt = new Date(utc.getTime() + 8 * 60 * 60 * 1000)
  return `${sgt.getUTCFullYear()}-${pad(sgt.getUTCMonth() + 1)}-${pad(sgt.getUTCDate())}T${pad(sgt.getUTCHours())}:${pad(sgt.getUTCMinutes())}`
}

/** What the SPA POSTs for a given window start/end. */
export const toUtcIso = (utc: Date): string => utc.toISOString()

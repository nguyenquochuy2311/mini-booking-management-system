// Real room photography from Unsplash, with a guaranteed-reliable picsum
// fallback (wired via onError in the component) so a card never shows a broken
// image — it always degrades to another real photo.
const PARAMS = 'auto=format&fit=crop&w=640&h=280&q=72'

const BY_NAME = {
  Alpha: '1497366754035-f200968a6e72',
  Bravo: '1431540015161-0bf868a2d407',
  Charlie: '1524758631624-e2822e304c36',
  Boardroom: '1577412647305-991150c7d163',
}

const POOL = [
  '1497366811353-6870744d04b2',
  '1505373877841-8d25f7d46678',
  '1431540015161-0bf868a2d407',
  '1524758631624-e2822e304c36',
]

const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export const roomImage = (name) => {
  const id = BY_NAME[name] ?? POOL[hash(name) % POOL.length]
  return `https://images.unsplash.com/photo-${id}?${PARAMS}`
}

export const roomImageFallback = (name) =>
  `https://picsum.photos/seed/room-${encodeURIComponent(name)}/640/280`

export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&h=420&q=72'
export const HERO_FALLBACK = 'https://picsum.photos/seed/booking-hero/1280/420'

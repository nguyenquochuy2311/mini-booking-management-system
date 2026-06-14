// Theme persistence + toggle. The initial theme is applied in index.html
// before paint; this just reads/updates it at runtime.
const KEY = 'booking_theme'

export const getTheme = () => document.documentElement.getAttribute('data-theme') || 'light'

export const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // ignore storage failures
  }
}

export const toggleTheme = () => {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

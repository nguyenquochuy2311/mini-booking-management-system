import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

const TOKEN_KEY = 'booking_token'

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const apiClient = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
})

// Attach the bearer token to every request when present.
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Drop a stale token on 401 and notify the app so the UI reactively falls back
// to the logged-out (read-only) state — writes always require a valid login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null)
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  },
)

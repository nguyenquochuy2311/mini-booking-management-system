// Tiny dependency-free toast store (pub/sub). Additive UI only — never blocks
// interaction (the Toaster container is pointer-events: none).
let seq = 0
let toasts = []
const listeners = new Set()

const emit = () => listeners.forEach((l) => l(toasts))

export const toast = {
  show(message, type = 'success', ttl = 2800) {
    const id = ++seq
    toasts = [...toasts, { id, message, type }]
    emit()
    setTimeout(() => toast.dismiss(id), ttl)
    return id
  },
  success(message) {
    return this.show(message, 'success')
  },
  error(message) {
    return this.show(message, 'error')
  },
  dismiss(id) {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  },
  subscribe(listener) {
    listeners.add(listener)
    listener(toasts)
    return () => listeners.delete(listener)
  },
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BootGate } from './components/BootGate.jsx'
import { BookingProvider } from './context/BookingContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BootGate>
      <BookingProvider>
        <App />
      </BookingProvider>
    </BootGate>
  </StrictMode>,
)

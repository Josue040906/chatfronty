import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ToastProvider from './components/ui/Toasts.jsx'
import { reveillerServeurs } from './api/client.js'

// Les serveurs démarrent pendant que l'utilisateur se connecte.
reveillerServeurs()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

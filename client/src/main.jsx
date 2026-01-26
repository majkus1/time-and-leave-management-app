import './axiosSetup.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { HelmetProvider } from 'react-helmet-async'
import Modal from 'react-modal'
import './i18n.js'
import { registerSW } from 'virtual:pwa-register'
import "@fontsource/titillium-web";      // domyślny styl (400)
import "@fontsource/titillium-web/700.css"; // np. bold
import "@fontsource/titillium-web/600.css";
import "@fontsource/teko";               // domyślny styl Teko (400)
import "@fontsource/teko/700.css";        // np. bold

// Set app element for react-modal once (prevents multiple registration warnings)
if (typeof document !== 'undefined') {
	Modal.setAppElement('#root')
}

// Rejestracja Service Worker z automatycznym odświeżaniem
const updateSW = registerSW({
  immediate: true, // Sprawdź aktualizacje natychmiast
  onNeedRefresh() {
    // Automatycznie odśwież stronę po aktualizacji service workera
    console.log('Nowa wersja dostępna, odświeżanie...')
    updateSW(true) // true = wymusza natychmiastowe odświeżenie
  },
  onOfflineReady() {
    console.log('Aplikacja gotowa do pracy offline')
  },
  onRegistered(registration) {
    console.log('[SW] Service Worker registered:', registration)
    // Sprawdzaj aktualizacje co godzinę
    setInterval(() => {
      registration?.update()
    }, 60 * 60 * 1000) // 1 godzina
  },
  onRegisterError(error) {
    console.error('Błąd rejestracji Service Worker:', error)
  }
})

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <HelmetProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </HelmetProvider>
)

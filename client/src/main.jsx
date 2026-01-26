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
    console.log('[SW] Nowa wersja dostępna, odświeżanie...')
    // Odśwież po krótkim opóźnieniu, aby użytkownik zobaczył komunikat
    setTimeout(() => {
      updateSW(true) // true = wymusza natychmiastowe odświeżenie
    }, 1000)
  },
  onOfflineReady() {
    console.log('[SW] Aplikacja gotowa do pracy offline')
  },
  onRegistered(registration) {
    console.log('[SW] Service Worker registered:', registration)
    
    // Sprawdzaj aktualizacje przy każdym załadowaniu strony
    if (registration) {
      registration.update()
    }
    
    // Sprawdzaj aktualizacje co 5 minut (zamiast co godzinę)
    // To zapewni, że użytkownicy szybko otrzymają nowe wersje
    const updateInterval = setInterval(() => {
      if (registration) {
        console.log('[SW] Sprawdzanie aktualizacji...')
        registration.update().catch(err => {
          console.error('[SW] Błąd podczas sprawdzania aktualizacji:', err)
        })
      } else {
        clearInterval(updateInterval)
      }
    }, 5 * 60 * 1000) // 5 minut
    
    // Sprawdzaj również gdy użytkownik wraca do aplikacji (focus)
    window.addEventListener('focus', () => {
      if (registration) {
        console.log('[SW] Aplikacja w focusie, sprawdzanie aktualizacji...')
        registration.update()
      }
    })
    
    // Sprawdzaj gdy użytkownik przełącza się między kartami
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && registration) {
        console.log('[SW] Karta widoczna, sprawdzanie aktualizacji...')
        registration.update()
      }
    })
  },
  onRegisterError(error) {
    console.error('[SW] Błąd rejestracji Service Worker:', error)
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

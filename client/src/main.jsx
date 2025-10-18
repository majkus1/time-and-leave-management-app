import './axiosSetup.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { HelmetProvider } from 'react-helmet-async'
import './i18n.js'
import { registerSW } from 'virtual:pwa-register'
import "@fontsource/titillium-web";      // domyślny styl (400)
import "@fontsource/titillium-web/700.css"; // np. bold
import "@fontsource/titillium-web/600.css";
import "@fontsource/teko";               // domyślny styl Teko (400)
import "@fontsource/teko/700.css";        // np. bold

const updateSW = registerSW({
  onNeedRefresh() {
    // Automatycznie odśwież bez pytania
    updateSW()
  },
  onOfflineReady() {
    console.log('App ready to work offline.')
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

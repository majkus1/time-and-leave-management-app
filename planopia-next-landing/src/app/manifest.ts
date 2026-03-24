import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Planopia - ewidencja czasu pracy i urlopy',
    short_name: 'Planopia',
    description:
      '30 dni za darmo: pełne funkcje, do 5 użytkowników. Ewidencja czasu pracy i zarządzanie urlopami w jednej aplikacji.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

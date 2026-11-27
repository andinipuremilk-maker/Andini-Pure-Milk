// Web App Manifest: membuat aplikasi bisa di-install dari browser (Android, iOS, PC).
// Next.js menyajikannya otomatis di /manifest.webmanifest.
export default function manifest() {
  return {
    name: 'Andini Pure Milk POS',
    short_name: 'Andini POS',
    description: 'Kasir & manajemen operasional Andini Pure Milk',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fbf9f6',
    theme_color: '#542a16',
    lang: 'id',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    shortcuts: [
      { name: 'Terminal Kasir', url: '/kasir', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'Panel Admin', url: '/admin/dashboard', icons: [{ src: '/icon-192.png', sizes: '192x192' }] }
    ]
  };
}

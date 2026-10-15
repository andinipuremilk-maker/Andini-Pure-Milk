import './globals.css'

export const metadata = {
  title: 'Andini Pure Milk POS',
  description: 'Point of Sale System',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#7c4a2d',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}

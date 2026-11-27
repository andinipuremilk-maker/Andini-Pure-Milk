import './globals.css';

export const metadata = {
  title: 'Andini Pure Milk — Point of Sale',
  description: 'Sistem Operasional Kasir & Manajemen UMKM Susu Murni Andini',
  applicationName: 'Andini POS',
  // iOS Safari: tampil layar penuh saat dibuka dari "Tambah ke Layar Utama"
  appleWebApp: {
    capable: true,
    title: 'Andini POS',
    statusBarStyle: 'default'
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#542a16',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTransaksiPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/transaksi/pemasukan');
  }, [router]);

  return (
    <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 800, color: 'var(--color-text-secondary)' }}>
      Mengalihkan ke Transaksi Pemasukan...
    </div>
  );
}

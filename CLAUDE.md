# Coding Rules & Guidelines for AI Assistant
## Proyek: Andini Pure Milk POS & Management System

Dokumen ini berisi panduan, standar arsitektur, aturan bisnis, dan konvensi penulisan kode yang **WAJIB** dipatuhi oleh seluruh AI coding assistant (Claude, Cursor, Copilot, Antigravity, dll.) saat mengembangkan atau memodifikasi codebase ini.

---

## 1. Ringkasan Proyek & Tech Stack

- **Nama Aplikasi:** Andini Pure Milk POS & Backoffice System
- **Framework:** Next.js (App Router) v16.x dengan React 19.x
- **Bahasa:** JavaScript (ES6+ / JSX)
- **Styling:** Vanilla CSS murni dengan CSS Variables / Design Tokens di [`app/globals.css`](file:///Users/rayhanmarsaathallah/Downloads/Andini%20Pure%20Milk/app/globals.css). **Dilarang keras memasang TailwindCSS** kecuali ada instruksi eksplisit dari pengguna.
- **Penyimpanan Data (Data Layer):** In-Memory Mock Database singleton di [`lib/db.js`](file:///Users/rayhanmarsaathallah/Downloads/Andini%20Pure%20Milk/lib/db.js).
- **Pustaka Eksternal:**
  - `jspdf` & `html2canvas`: Cetak struk & ekspor laporan PDF.
  - `xlsx`: Ekspor laporan rekapitulasi ke format Excel spreadsheet.

---

## 2. Aturan Bisnis Inti (Core Business Rules)

1. **Autentikasi & Akun Pengguna:**
   - **TIDAK ADA** halaman registrasi publik (`/register`). Registrasi mandiri telah dinonaktifkan.
   - Pengelolaan akun (tambah karyawan, edit role/status, hapus akun) **HANYA** boleh dilakukan melalui Panel Admin pada menu Manajemen Akun: [`/admin/karyawan`](file:///Users/rayhanmarsaathallah/Downloads/Andini%20Pure%20Milk/app/admin/karyawan/page.js).
   - Terdapat 2 role utama:
     - `admin`: Memiliki akses penuh ke seluruh menu dashboard, produk, transaksi (pemasukan/pengeluaran), rekapitulasi, dan kelola karyawan.
     - `kasir`: Akses khusus ke antarmuka POS kasir ([`/kasir`](file:///Users/rayhanmarsaathallah/Downloads/Andini%20Pure%20Milk/app/kasir/page.js)).

2. **Transaksi & Kasir (Point of Sale):**
   - Transaksi kasir mencatat pemilihan produk, jumlah (qty), seller/mitra pelanggan, serta metode bayar (`tunai`, `qris`, `transfer`).
   - Terdapat formulir **Keterangan / Catatan Pesanan (Opsional)** pada pop-up konfirmasi pembayaran kasir di bawah metode pembayaran.
   - Sistem wajib secara otomatis menghitung:
     - Total Setoran (Total Omset)
     - Total Modal (HPP produk yang terjual)
     - Total Laba Bersih (`total_setor - total_modal`)
     - Kembalian uang (khusus metode `tunai`).
   - Struk/nota kasir harus menampilkan rincian barang, total bayar, metode bayar, dan catatan keterangan jika diisi.

3. **Pengeluaran Operasional:**
   - Pencatatan biaya operasional, pembelian bahan baku (susu murni, cup, gula aren, dsb.), dan logistik dilakukan di [`/admin/transaksi/pengeluaran`](file:///Users/rayhanmarsaathallah/Downloads/Andini%20Pure%20Milk/app/admin/transaksi/pengeluaran/page.js).
   - Wajib mencatat kategori, deskripsi, nominal, penanggung jawab (PJ), dan metode pembayaran.

---

## 3. Sistem Desain & Estetika (Design System)

Aplikasi mengusung tema **"Hitam, Putih & Coklat Artisan"** (*Craft Dairy & Milk Bar*). Selalu gunakan CSS Variables berikut:

### Variabel Warna Utama (`app/globals.css`)
```css
/* Monokrom Dasar */
--color-bg-light: #ffffff;
--color-bg-dark: #fbfbfb;
--color-text-primary: #0a0a0a;
--color-text-secondary: #666666;
--color-border: #e5e5e5;
--color-error: #dc2626;
--color-error-bg: #fef2f2;

/* Aksen Coklat Artisan */
--color-chocolate: #7c4a2d;         /* Aksen coklat utama, tombol aktif, badge */
--color-chocolate-dark: #5a321c;    /* State hover & teks tebal coklat */
--color-chocolate-hover: #693d24;   /* Interaksi hover tombol */
--color-chocolate-light: #f8f3ee;   /* Background card tipis & badge lembut */
--color-chocolate-border: #e0d0c4;  /* Border aksen coklat */
--color-caramel: #a26744;           /* Aksen sekunder */
--color-caramel-light: #faf5f0;     /* Highlight card alternatif */
```

### Prinsip Antarmuka (UI/UX)
- **Tombol & Interaksi:** Gunakan class `.btn-primary` (latar hitam teks putih), `.btn-secondary` (border outline), atau tombol beraksen `--color-chocolate` untuk tindakan utama.
- **Format Uang:** Selalu gunakan format Rupiah Indonesia: `Rp {nominal.toLocaleString('id-ID')}`.
- **Responsivitas:** Antarmuka harus 100% responsif mobile dan desktop. 
  - Kasir POS memiliki layout adaptif (toggle tab menu vs keranjang pada layar kecil).
  - Admin memiliki mobile drawer navigation dengan hamburger toggle.

---

## 4. Konvensi Koding & Arsitektur (Coding Standards)

1. **Client Components vs Server Components:**
   - Seluruh halaman atau komponen yang menggunakan Hook (`useState`, `useEffect`, `useRouter`, dsb.) atau berinteraksi dengan DOM **WAJIB** diawali dengan `'use client';` di baris pertama.
2. **API Routes (`app/api/.../route.js`):**
   - Gunakan `NextResponse.json(...)` dari `next/server`.
   - Pastikan setiap route menangani validasi input dan fallback error yang jelas (`try...catch`).
   - Saat menambahkan kolom/properti baru pada transaksi atau produk (misal: `keterangan`), pastikan disinkronkan di:
     1. Struktur schema default di [`lib/db.js`](file:///Users/rayhanmarsaathallah/Downloads/Andini%20Pure%20Milk/lib/db.js).
     2. Handler API `GET` & `POST` di [`app/api/transaksi/route.js`](file:///Users/rayhanmarsaathallah/Downloads/Andini%20Pure%20Milk/app/api/transaksi/route.js).
     3. Komponen pemanggil di frontend (`/kasir` dan `/admin`).
3. **Immutability & State Safety:**
   - Gunakan fallback nilai default / *optional chaining* (`item?.nama || '-'`) agar terhindar dari runtime error saat data lama memiliki nilai `null` atau `undefined`.
4. **Kebersihan Kode:**
   - Pertahankan komentar kode yang sudah ada.
   - Jangan menambahkan library eksternal baru jika dapat diselesaikan dengan Vanilla JavaScript atau CSS bawaan.

---

## 5. Protokol Kerja untuk AI Assistant

1. **Pahami Sebelum Mengubah:** Selalu pelajari struktur file dan state saat ini sebelum mengusulkan atau melakukan pengeditan.
2. **Konsistensi Bahasa:** Komunikasi dengan pengguna dan antarmuka aplikasi menggunakan **Bahasa Indonesia** yang rapi, profesional, dan ramah kasir/admin.
3. **Format Tautan File:** Saat menyebutkan berkas kode pada penjelasan ke pengguna, gunakan format tautan Markdown lengkap (`[nama_file.js](file:///path/ke/file)`).
4. **Verifikasi:** Pastikan tidak ada sintaks yang rusak atau error build setelah kode diperbarui.

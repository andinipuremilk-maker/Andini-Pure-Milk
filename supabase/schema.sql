-- ==============================================================================
-- ANDINI PURE MILK POS & MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL DATABASE SCHEMA & INITIAL SEED DATA
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL: users (Akun Pengguna & Karyawan - Tanpa Kolom Telepon)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'kasir', 'barista', 'staff', 'kurir')),
    shift TEXT DEFAULT 'Shift 1 (08:00 - 16:00)',
    tanggal_masuk DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: kategori_produk
-- Migrasi: penguncian login setelah 5 kali salah password
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gagal_login INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS terkunci_sampai TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.kategori_produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: produk
CREATE TABLE IF NOT EXISTS public.produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori_id UUID REFERENCES public.kategori_produk(id) ON DELETE SET NULL,
    nama TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    harga_jual BIGINT NOT NULL DEFAULT 0,
    harga_modal BIGINT NOT NULL DEFAULT 0,
    stok INT NOT NULL DEFAULT 100,
    image_url TEXT,
    variants JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: booths (Gerai / Titik Penjualan)
CREATE TABLE IF NOT EXISTS public.booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT UNIQUE NOT NULL,
    lokasi TEXT DEFAULT '',
    penanggung_jawab TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL: sellers (Mitra / Reseller)
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL: diskon (Master Promo & Diskon Toko - Dikelola Admin)
CREATE TABLE IF NOT EXISTS public.diskon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK (tipe IN ('persen', 'nominal')),
    nilai NUMERIC NOT NULL DEFAULT 0,
    keterangan TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi: masa berlaku diskon (kosong = tanpa batas, tanggal selesai inklusif)
ALTER TABLE public.diskon ADD COLUMN IF NOT EXISTS tanggal_mulai DATE;
ALTER TABLE public.diskon ADD COLUMN IF NOT EXISTS tanggal_selesai DATE;

-- 7. TABEL: transaksi (Penjualan Kasir - Ramping & Tanpa Kolom Redundan)
CREATE TABLE IF NOT EXISTS public.transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_transaksi TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    kasir TEXT DEFAULT '',
    booth TEXT DEFAULT '',
    seller TEXT NOT NULL DEFAULT 'Umum / Retail',
    tanggal TIMESTAMPTZ DEFAULT NOW(),
    subtotal BIGINT NOT NULL DEFAULT 0,
    diskon BIGINT NOT NULL DEFAULT 0,
    diskon_tipe TEXT DEFAULT 'nominal',
    diskon_nilai NUMERIC DEFAULT 0,
    diskon_id UUID REFERENCES public.diskon(id) ON DELETE SET NULL,
    diskon_nama TEXT DEFAULT '',
    total BIGINT NOT NULL DEFAULT 0,
    bayar BIGINT NOT NULL DEFAULT 0,
    kembalian BIGINT NOT NULL DEFAULT 0,
    metode_bayar TEXT NOT NULL CHECK (metode_bayar IN ('tunai', 'qris', 'transfer')),
    keterangan TEXT DEFAULT '',
    status TEXT DEFAULT 'selesai',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL: detail_transaksi (Rincian Produk Tiap Nota Transaksi)
-- Migrasi untuk database yang sudah ada: simpan nama kasir & booth per transaksi
ALTER TABLE public.transaksi ADD COLUMN IF NOT EXISTS kasir TEXT DEFAULT '';
ALTER TABLE public.transaksi ADD COLUMN IF NOT EXISTS booth TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS public.detail_transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaksi_id UUID NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
    produk_id UUID REFERENCES public.produk(id) ON DELETE SET NULL,
    nama_produk TEXT NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    harga_satuan BIGINT NOT NULL DEFAULT 0,
    subtotal BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi: modal per item saat transaksi terjadi (laba historis tidak berubah saat harga modal produk diubah)
ALTER TABLE public.detail_transaksi ADD COLUMN IF NOT EXISTS harga_modal NUMERIC;

-- 8. TABEL: pengeluaran (Beban & Biaya Operasional Toko)
CREATE TABLE IF NOT EXISTS public.pengeluaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_transaksi TEXT UNIQUE NOT NULL,
    tanggal TIMESTAMPTZ DEFAULT NOW(),
    kategori TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    nominal BIGINT NOT NULL DEFAULT 0,
    metode_bayar TEXT NOT NULL DEFAULT 'tunai',
    pj TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXING UNTUK KECEPATAN QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON public.transaksi (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_transaksi_seller ON public.transaksi (seller);
CREATE INDEX IF NOT EXISTS idx_detail_transaksi_trx ON public.detail_transaksi (transaksi_id);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_tanggal ON public.pengeluaran (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON public.produk (kategori_id);
CREATE INDEX IF NOT EXISTS idx_booths_nama ON public.booths (nama);

-- ==============================================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS)
-- Semua tabel dikunci. Aplikasi mengakses database HANYA dari server memakai
-- SUPABASE_SERVICE_ROLE_KEY, yang otomatis melewati RLS. Tanpa policy, kunci
-- anon/publik tidak bisa membaca atau mengubah data apa pun.
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diskon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama yang membuka akses penuh untuk anon (versi sebelumnya)
DROP POLICY IF EXISTS "Allow all for authenticated/anon on users" ON public.users;
DROP POLICY IF EXISTS "Allow all on kategori_produk" ON public.kategori_produk;
DROP POLICY IF EXISTS "Allow all on produk" ON public.produk;
DROP POLICY IF EXISTS "Allow all on booths" ON public.booths;
DROP POLICY IF EXISTS "Allow all on sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow all on transaksi" ON public.transaksi;
DROP POLICY IF EXISTS "Allow all on detail_transaksi" ON public.detail_transaksi;
DROP POLICY IF EXISTS "Allow all on pengeluaran" ON public.pengeluaran;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Seed Akun Default (Admin & Kasir)
INSERT INTO public.users (nama, username, password, role, shift)
VALUES 
    ('Admin Utama Andini', 'admin', 'admin', 'admin', 'Pagi & Malam'),
    ('Kasir Outlet Andini', 'kasir', 'kasir', 'kasir', 'Shift 1 (08:00 - 16:00)'),
    ('Siti Rahma', 'siti_kasir', 'password', 'kasir', 'Shift 2 (15:00 - 22:00)'),
    ('Eko Prasetyo', 'eko_barista', 'password', 'barista', 'Shift 1 (08:00 - 16:00)'),
    ('Nafis Abdullah', 'nafis_ops', 'password', 'staff', 'Full Time'),
    ('Farhan Maulana', 'farhan_driver', 'password', 'kurir', 'On Call / Shift')
ON CONFLICT (username) DO NOTHING;

-- Seed Kategori Produk
INSERT INTO public.kategori_produk (id, nama)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Susu Murni & Olahan'),
    ('22222222-2222-2222-2222-222222222222', 'Minuman Rempah (STMJ)'),
    ('33333333-3333-3333-3333-333333333333', 'Boba & Es Segar'),
    ('44444444-4444-4444-4444-444444444444', 'Pie & Pastry'),
    ('55555555-5555-5555-5555-555555555555', 'Yogurt & Olahan Dairy')
ON CONFLICT (nama) DO NOTHING;

-- Seed Produk Andini Pure Milk
INSERT INTO public.produk (kategori_id, nama, sku, harga_jual, harga_modal, stok, image_url, is_active)
VALUES
    -- Susu Murni & Olahan
    ('11111111-1111-1111-1111-111111111111', 'Susu Murni 1 Liter', 'SM-1L', 15000, 10000, 100, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80', true),
    ('11111111-1111-1111-1111-111111111111', 'Susu Murni Hangat', 'SM-HGT', 10000, 6000, 100, 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&auto=format&fit=crop&q=80', true),
    ('11111111-1111-1111-1111-111111111111', 'Sticky Milk', 'STK-MLK', 8000, 5500, 100, 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=400&auto=format&fit=crop&q=80', true),
    ('11111111-1111-1111-1111-111111111111', 'Susu Coklat 1L', 'SC-1L', 18000, 12000, 100, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=80', true),
    ('11111111-1111-1111-1111-111111111111', 'Es Susu Rasa (Melon/Straw)', 'SS-RSA', 10000, 6000, 100, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=80', true),

    -- Minuman Rempah (STMJ)
    ('22222222-2222-2222-2222-222222222222', 'STMJ (Susu Telur Madu Jahe)', 'STMJ-ORG', 15000, 10000, 100, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80', true),
    ('22222222-2222-2222-2222-222222222222', 'SMJ (Susu Madu Jahe)', 'SMJ-ORG', 12000, 7500, 100, 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400&auto=format&fit=crop&q=80', true),
    ('22222222-2222-2222-2222-222222222222', 'Jahe Merah Ori', 'JHM-ORG', 10000, 6000, 100, 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&auto=format&fit=crop&q=80', true),

    -- Boba & Es Segar
    ('33333333-3333-3333-3333-333333333333', 'BK (Boba Ketan)', 'BB-KTN', 8000, 4500, 100, 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&auto=format&fit=crop&q=80', true),
    ('33333333-3333-3333-3333-333333333333', 'BB (Boba Brown Sugar)', 'BB-BSG', 10000, 5500, 100, 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&auto=format&fit=crop&q=80', true),
    ('33333333-3333-3333-3333-333333333333', 'Kiko (Es Lilin)', 'KKO-ORG', 2000, 500, 500, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&auto=format&fit=crop&q=80', true),
    ('33333333-3333-3333-3333-333333333333', 'Es Krim & Puding', 'EKM-PDG', 5000, 2500, 100, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&auto=format&fit=crop&q=80', true),
    ('33333333-3333-3333-3333-333333333333', 'Es Tea Susu', 'ETS-SSU', 5000, 3000, 100, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=80', true),

    -- Pie & Pastry
    ('44444444-4444-4444-4444-444444444444', 'Pie Susu Original', 'PIE-ORG', 5000, 3000, 150, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&auto=format&fit=crop&q=80', true),
    ('44444444-4444-4444-4444-444444444444', 'Pie Susu Coklat', 'PIE-CKL', 5500, 3200, 150, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&auto=format&fit=crop&q=80', true),
    ('44444444-4444-4444-4444-444444444444', 'Pie Susu Kotak / Box', 'PIE-BOX', 25000, 15000, 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', true),
    ('44444444-4444-4444-4444-444444444444', 'Brownies Slice', 'BRN-SLC', 15000, 9000, 50, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80', true),

    -- Yogurt & Olahan Dairy
    ('55555555-5555-5555-5555-555555555555', 'Yoghurt Bottle 250ml', 'YGH-250', 15000, 9000, 80, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80', true),
    ('55555555-5555-5555-5555-555555555555', 'Yoghurt Plain 500ml', 'YGH-500', 25000, 15000, 50, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80', true),
    ('55555555-5555-5555-5555-555555555555', 'Keju Mozzarella 200g', 'KJ-MOZ', 35000, 22000, 40, 'https://images.unsplash.com/photo-1589881133595-a3c085cb731d?w=400&auto=format&fit=crop&q=80', true)
ON CONFLICT (sku) DO NOTHING;

-- Seed Sellers / Mitra
INSERT INTO public.sellers (nama)
VALUES 
    ('Umum / Retail'),
    ('NAFIS'),
    ('EKO'),
    ('SD LATENG'),
    ('SD AL KHARIYAH'),
    ('PAK GOFAR'),
    ('FARHAN'),
    ('AIRIN'),
    ('PAK TOTOK'),
    ('TIM ANDINI')
ON CONFLICT (nama) DO NOTHING;

-- Seed Booths (Gerai Penjualan)
INSERT INTO public.booths (nama, lokasi, penanggung_jawab, is_active)
VALUES 
    ('Booth 1 - Gerai Utama (Pusat)', 'Outlet Pusat Andini', 'Admin Utama', true),
    ('Booth 2 - Alun-Alun Kota', 'Kawasan Kuliner Alun-Alun', 'Eko Prasetyo', true),
    ('Booth 3 - Pantai Boom', 'Area Wisata Pantai Boom', 'Siti Rahma', true),
    ('Booth 4 - Kampus & Sekolah', 'Jl. Pendidikan No. 45', 'Rizky Ramadhan', true),
    ('Booth 5 - RTH Maron Genteng', 'Taman Hijau Genteng', 'Angga Wijaya', true),
    ('Booth Event / Bazar Keliling', 'Mobile / Fleksibel', 'Farhan Maulana', true)
ON CONFLICT (nama) DO NOTHING;

-- Seed Sample Pengeluaran Operasional
INSERT INTO public.pengeluaran (no_transaksi, kategori, deskripsi, nominal, metode_bayar, pj)
VALUES
    ('EXP-001001', 'Bahan Baku & Perlengkapan', 'Pembelian Es Batu 10 Plastik & Sedotan Steril', 35000, 'tunai', 'Kasir Outlet Andini'),
    ('EXP-001002', 'Operasional', 'Bayar Listrik & Kebersihan Outlet', 185000, 'transfer', 'Admin Utama Andini'),
    ('EXP-001003', 'Transport & Logistik', 'Bensin Operasional Pengiriman Susu Murni', 50000, 'tunai', 'Farhan Maulana')
ON CONFLICT (no_transaksi) DO NOTHING;

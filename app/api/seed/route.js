import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  return await handleSeed(req);
}

export async function POST(req) {
  return await handleSeed(req);
}

async function handleSeed(req) {
  try {
    const summary = {
      users: 0,
      kategori: 0,
      produk: 0,
      sellers: 0,
      transaksi: 0,
      detail_transaksi: 0,
      pengeluaran: 0,
      target: isSupabaseConfigured() ? 'Supabase & Mock DB' : 'Mock DB Only'
    };

    // 1. DATA MASTER KARYAWAN / USERS
    const dummyUsers = [
      { nama: 'Admin Utama Andini', username: 'admin', password: 'admin', role: 'admin', shift: 'Pagi & Malam', tanggal_masuk: '2025-01-10', is_active: true },
      { nama: 'Bu Andini (Owner)', username: 'andini_owner', password: 'password', role: 'admin', shift: 'Full Control', tanggal_masuk: '2025-01-01', is_active: true },
      { nama: 'Kasir Outlet Andini', username: 'kasir', password: 'kasir', role: 'kasir', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-02-01', is_active: true },
      { nama: 'Siti Rahma', username: 'siti_kasir', password: 'password', role: 'kasir', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-03-15', is_active: true },
      { nama: 'Rina Anggraini', username: 'rina_kasir', password: 'password', role: 'kasir', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-04-01', is_active: true },
      { nama: 'Dimas Setiawan', username: 'dimas_kasir', password: 'password', role: 'kasir', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-05-10', is_active: true },
      { nama: 'Putri Lestari', username: 'putri_kasir', password: 'password', role: 'kasir', shift: 'Shift Weekend', tanggal_masuk: '2025-06-01', is_active: true },
      { nama: 'Eko Prasetyo', username: 'eko_barista', password: 'password', role: 'barista', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-02-10', is_active: true },
      { nama: 'Bayu Pratama', username: 'bayu_barista', password: 'password', role: 'barista', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-03-20', is_active: true },
      { nama: 'Rizky Ramadhan', username: 'rizky_barista', password: 'password', role: 'barista', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-05-01', is_active: true },
      { nama: 'Angga Wijaya', username: 'angga_barista', password: 'password', role: 'barista', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-06-15', is_active: true },
      { nama: 'Nafis Abdullah', username: 'nafis_ops', password: 'password', role: 'staff', shift: 'Full Time', tanggal_masuk: '2025-01-20', is_active: true },
      { nama: 'Hendra Saputra', username: 'hendra_ops', password: 'password', role: 'staff', shift: 'Full Time', tanggal_masuk: '2025-04-12', is_active: true },
      { nama: 'Farhan Maulana', username: 'farhan_driver', password: 'password', role: 'kurir', shift: 'On Call / Shift', tanggal_masuk: '2025-04-05', is_active: true },
      { nama: 'Budi Santoso', username: 'budi_driver', password: 'password', role: 'kurir', shift: 'Shift Siang & Sore', tanggal_masuk: '2025-05-18', is_active: true }
    ];

    // 2. DATA MASTER KATEGORI
    const dummyKategori = [
      { id: '11111111-1111-1111-1111-111111111111', nama: 'Susu Murni & Olahan' },
      { id: '22222222-2222-2222-2222-222222222222', nama: 'Minuman Rempah (STMJ)' },
      { id: '33333333-3333-3333-3333-333333333333', nama: 'Boba & Es Segar' },
      { id: '44444444-4444-4444-4444-444444444444', nama: 'Pie & Pastry' },
      { id: '55555555-5555-5555-5555-555555555555', nama: 'Yogurt & Olahan Dairy' },
      { id: '66666666-6666-6666-6666-666666666666', nama: 'Kopi Susu Tradisional' },
      { id: '77777777-7777-7777-7777-777777777777', nama: 'Camilan & Roti Panggang' }
    ];

    // 3. DATA MASTER SELLERS
    const dummySellers = [
      'Umum / Retail',
      'NAFIS',
      'EKO',
      'SD LATENG',
      'SD AL KHARIYAH',
      'PAK GOFAR',
      'FARHAN',
      'AIRIN',
      'PAK TOTOK',
      'TIM ANDINI',
      'KANTIN RSUD',
      'SD PERTIWI',
      'WARUNG BU SRI',
      'TOKO ROTI KENCANA',
      'CAFE OMAH SUSU',
      'RESELLER GENTENG',
      'KOPERASI AL-IKHLAS'
    ];

    // 4. DATA MASTER PRODUK (32 Produk Lengkap)
    const dummyProduk = [
      // Kategori 1: Susu Murni & Olahan
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Susu Murni 1 Liter', sku: 'SM-1L', harga_jual: 15000, harga_modal: 10000, stok: 120, is_active: true },
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Susu Murni Hangat', sku: 'SM-HGT', harga_jual: 10000, harga_modal: 6000, stok: 150, is_active: true },
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Sticky Milk Special', sku: 'STK-MLK', harga_jual: 8000, harga_modal: 5500, stok: 100, is_active: true },
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Susu Coklat 1 Liter', sku: 'SC-1L', harga_jual: 18000, harga_modal: 12000, stok: 80, is_active: true },
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Es Susu Melon Segar', sku: 'SS-MLN', harga_jual: 10000, harga_modal: 6000, stok: 110, is_active: true },
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Es Susu Strawberry', sku: 'SS-STR', harga_jual: 10000, harga_modal: 6000, stok: 110, is_active: true },
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Susu Kurma Segar', sku: 'SM-KRM', harga_jual: 16000, harga_modal: 10000, stok: 90, is_active: true },
      { kategori_id: '11111111-1111-1111-1111-111111111111', nama: 'Susu Matcha Green Tea', sku: 'SM-MTC', harga_jual: 15000, harga_modal: 9000, stok: 85, is_active: true },

      // Kategori 2: Minuman Rempah (STMJ)
      { kategori_id: '22222222-2222-2222-2222-222222222222', nama: 'STMJ (Susu Telur Madu Jahe)', sku: 'STMJ-ORG', harga_jual: 15000, harga_modal: 10000, stok: 140, is_active: true },
      { kategori_id: '22222222-2222-2222-2222-222222222222', nama: 'STMJ Telur Bebek Liar', sku: 'STMJ-BBK', harga_jual: 18000, harga_modal: 11500, stok: 75, is_active: true },
      { kategori_id: '22222222-2222-2222-2222-222222222222', nama: 'SMJ (Susu Madu Jahe)', sku: 'SMJ-ORG', harga_jual: 12000, harga_modal: 7500, stok: 130, is_active: true },
      { kategori_id: '22222222-2222-2222-2222-222222222222', nama: 'Jahe Merah Ori Hangat', sku: 'JHM-ORG', harga_jual: 10000, harga_modal: 6000, stok: 100, is_active: true },
      { kategori_id: '22222222-2222-2222-2222-222222222222', nama: 'Susu Jahe Hangat Cup', sku: 'SJH-CUP', harga_jual: 8000, harga_modal: 4500, stok: 120, is_active: true },

      // Kategori 3: Boba & Es Segar
      { kategori_id: '33333333-3333-3333-3333-333333333333', nama: 'BK (Boba Ketan Hitam)', sku: 'BB-KTN', harga_jual: 8000, harga_modal: 4500, stok: 100, is_active: true },
      { kategori_id: '33333333-3333-3333-3333-333333333333', nama: 'BB (Boba Brown Sugar)', sku: 'BB-BSG', harga_jual: 10000, harga_modal: 5500, stok: 120, is_active: true },
      { kategori_id: '33333333-3333-3333-3333-333333333333', nama: 'Kiko (Es Lilin Susu)', sku: 'KKO-ORG', harga_jual: 2000, harga_modal: 500, stok: 400, is_active: true },
      { kategori_id: '33333333-3333-3333-3333-333333333333', nama: 'Es Krim & Puding Susu', sku: 'EKM-PDG', harga_jual: 5000, harga_modal: 2500, stok: 100, is_active: true },
      { kategori_id: '33333333-3333-3333-3333-333333333333', nama: 'Es Tea Susu Andini', sku: 'ETS-SSU', harga_jual: 5000, harga_modal: 3000, stok: 150, is_active: true },
      { kategori_id: '33333333-3333-3333-3333-333333333333', nama: 'Susu Regal Caramel', sku: 'SM-RGL', harga_jual: 15000, harga_modal: 8500, stok: 95, is_active: true },

      // Kategori 4: Pie & Pastry
      { kategori_id: '44444444-4444-4444-4444-444444444444', nama: 'Pie Susu Original', sku: 'PIE-ORG', harga_jual: 5000, harga_modal: 3000, stok: 200, is_active: true },
      { kategori_id: '44444444-4444-4444-4444-444444444444', nama: 'Pie Susu Coklat', sku: 'PIE-CKL', harga_jual: 5500, harga_modal: 3200, stok: 180, is_active: true },
      { kategori_id: '44444444-4444-4444-4444-444444444444', nama: 'Pie Susu Box Isi 6', sku: 'PIE-BOX', harga_jual: 25000, harga_modal: 15000, stok: 60, is_active: true },
      { kategori_id: '44444444-4444-4444-4444-444444444444', nama: 'Brownies Slice Susu', sku: 'BRN-SLC', harga_jual: 15000, harga_modal: 9000, stok: 60, is_active: true },

      // Kategori 5: Yogurt & Olahan Dairy
      { kategori_id: '55555555-5555-5555-5555-555555555555', nama: 'Yoghurt Bottle 250ml', sku: 'YGH-250', harga_jual: 15000, harga_modal: 9000, stok: 80, is_active: true },
      { kategori_id: '55555555-5555-5555-5555-555555555555', nama: 'Yoghurt Plain 500ml', sku: 'YGH-500', harga_jual: 25000, harga_modal: 15000, stok: 50, is_active: true },
      { kategori_id: '55555555-5555-5555-5555-555555555555', nama: 'Keju Mozzarella 200g', sku: 'KJ-MOZ', harga_jual: 35000, harga_modal: 22000, stok: 45, is_active: true },

      // Kategori 6: Kopi Susu Tradisional
      { kategori_id: '66666666-6666-6666-6666-666666666666', nama: 'Kopi Susu Gula Aren', sku: 'KPS-AREN', harga_jual: 13000, harga_modal: 7000, stok: 120, is_active: true },
      { kategori_id: '66666666-6666-6666-6666-666666666666', nama: 'Kopi Susu Vanilla Cream', sku: 'KPS-VNL', harga_jual: 14000, harga_modal: 7500, stok: 90, is_active: true },

      // Kategori 7: Camilan & Roti Panggang
      { kategori_id: '77777777-7777-7777-7777-777777777777', nama: 'Roti Bakar Coklat Keju', sku: 'RTB-CKJ', harga_jual: 15000, harga_modal: 8000, stok: 70, is_active: true },
      { kategori_id: '77777777-7777-7777-7777-777777777777', nama: 'Roti Bakar Srikaya Susu', sku: 'RTB-KYA', harga_jual: 12000, harga_modal: 6500, stok: 70, is_active: true },
      { kategori_id: '77777777-7777-7777-7777-777777777777', nama: 'Puding Karamel Susu', sku: 'PDG-KRM', harga_jual: 8000, harga_modal: 4000, stok: 80, is_active: true },
      { kategori_id: '77777777-7777-7777-7777-777777777777', nama: 'Keripik Susu Krispi', sku: 'KPK-SSU', harga_jual: 12000, harga_modal: 7000, stok: 100, is_active: true }
    ];

    // 5. DATA OPERASIONAL PENGELUARAN (Template Beragam)
    const expenseTemplates = [
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Es Batu Kristal 10 Kantong', nominal: 35000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Restok Cup Plastik 22oz & Tutup Sealer', nominal: 145000, pj: 'Admin Utama Andini', metode: 'qris' },
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Jahe Merah & Temulawak Segar', nominal: 95000, pj: 'Nafis Abdullah', metode: 'tunai' },
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Restok Susu Murni dari Peternakan Mitra', nominal: 450000, pj: 'Admin Utama Andini', metode: 'transfer' },
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Gula Aren Murni 10 Kg', nominal: 180000, pj: 'Eko Prasetyo', metode: 'transfer' },
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Bahan Boba Brown Sugar & Jelly Cincau', nominal: 85000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Sedotan Steril & Kantong Kresek', nominal: 40000, pj: 'Siti Rahma', metode: 'tunai' },
      { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Telur Ayam Kampung & Telur Bebek', nominal: 120000, pj: 'Eko Prasetyo', metode: 'tunai' },
      { kategori: 'Operasional', deskripsi: 'Pembayaran Tagihan Listrik PLN Outlet', nominal: 220000, pj: 'Admin Utama Andini', metode: 'transfer' },
      { kategori: 'Operasional', deskripsi: 'Iuran Kebersihan Lingkungan & Sampah', nominal: 35000, pj: 'Siti Rahma', metode: 'tunai' },
      { kategori: 'Operasional', deskripsi: 'Langganan WiFi & Internet Kasir Gerai', nominal: 150000, pj: 'Admin Utama Andini', metode: 'transfer' },
      { kategori: 'Operasional', deskripsi: 'Refill Tabung Gas LPG 3Kg untuk Rebus Susu', nominal: 44000, pj: 'Nafis Abdullah', metode: 'tunai' },
      { kategori: 'Operasional', deskripsi: 'Servis Ringan Mesin Sealer Cup Cup', nominal: 75000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
      { kategori: 'Operasional', deskripsi: 'Sabun Cuci Piring Food Grade & Spon', nominal: 28000, pj: 'Siti Rahma', metode: 'tunai' },
      { kategori: 'Transport & Logistik', deskripsi: 'Bensin Operasional Motor Kurir Delivery', nominal: 50000, pj: 'Farhan Maulana', metode: 'tunai' },
      { kategori: 'Transport & Logistik', deskripsi: 'Ongkir Paket Pengiriman Pie Susu Luar Kota', nominal: 35000, pj: 'Budi Santoso', metode: 'tunai' },
      { kategori: 'Transport & Logistik', deskripsi: 'Bensin Pengambilan Susu Murni Peternakan', nominal: 60000, pj: 'Farhan Maulana', metode: 'tunai' },
      { kategori: 'Gaji & Bonus', deskripsi: 'Insentif Lembur Penjualan Ramai Weekend', nominal: 150000, pj: 'Admin Utama Andini', metode: 'transfer' },
      { kategori: 'Gaji & Bonus', deskripsi: 'Uang Makan Tim Barista Shift Malam', nominal: 60000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
      { kategori: 'Lain-lain', deskripsi: 'Pembelian Air Galon Mineral untuk Gerai', nominal: 22000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
      { kategori: 'Lain-lain', deskripsi: 'Pembelian Kertas Struk Thermal & Lakban', nominal: 55000, pj: 'Siti Rahma', metode: 'qris' }
    ];

    // =========================================================================
    // JIKA SUPABASE TERKONFIGURASI, SINKRONISASIKAN KE SUPABASE
    // =========================================================================
    if (isSupabaseConfigured() && supabaseAdmin) {
      // A. USERS
      for (const u of dummyUsers) {
        await supabaseAdmin.from('users').upsert(u, { onConflict: 'username' });
      }
      const { data: dbUsers } = await supabaseAdmin.from('users').select('id, username, nama');
      summary.users = dbUsers?.length || 0;

      // B. KATEGORI
      for (const k of dummyKategori) {
        await supabaseAdmin.from('kategori_produk').upsert(k, { onConflict: 'id' });
      }
      const { data: dbKats } = await supabaseAdmin.from('kategori_produk').select('id, nama');
      summary.kategori = dbKats?.length || 0;

      // C. PRODUK
      for (const p of dummyProduk) {
        await supabaseAdmin.from('produk').upsert(p, { onConflict: 'sku' });
      }
      const { data: dbProds } = await supabaseAdmin.from('produk').select('id, nama, sku, harga_jual, harga_modal, kategori_id');
      summary.produk = dbProds?.length || 0;

      // D. SELLERS
      for (const sName of dummySellers) {
        await supabaseAdmin.from('sellers').upsert({ nama: sName, is_active: true }, { onConflict: 'nama' });
      }
      const { data: dbSellers } = await supabaseAdmin.from('sellers').select('id, nama');
      summary.sellers = dbSellers?.length || 0;

      // E. CEK APAKAH PERLU SEED TRANSAKSI (jika transaksi < 20)
      const { count: trxCount } = await supabaseAdmin.from('transaksi').select('*', { count: 'exact', head: true });

      if (!trxCount || trxCount < 20) {
        // Hapus detail dan transaksi lama bila ada untuk kebersihan data
        await supabaseAdmin.from('detail_transaksi').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabaseAdmin.from('transaksi').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const kasirUsers = (dbUsers || []).filter(u => u.username !== 'admin');
        const defaultKasirId = kasirUsers[0]?.id || dbUsers?.[0]?.id || null;
        const availableProducts = dbProds || [];
        const availableSellers = dummySellers;
        const paymentMethods = ['tunai', 'qris', 'transfer'];

        // Buat data transaksi selama 30 hari ke belakang HINGGA HARI INI
        // Hari ini = index 0 (paling fresh)
        let trxCounter = 1;
        const batchTrx = [];
        const batchDetails = [];

        for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - daysAgo);

          // Jumlah transaksi: 4 - 8 transaksi per hari (hari ini 6 transaksi sampai jam sekarang)
          const numDaily = daysAgo === 0 ? 7 : Math.floor(Math.random() * 5) + 4;

          for (let t = 0; t < numDaily; t++) {
            // Atur jam antara 08:00 sampai 21:00
            const hour = daysAgo === 0 ? Math.min(8 + t * 2, 19) : 8 + Math.floor(Math.random() * 13);
            const minute = (t * 13 + daysAgo * 7) % 60;
            targetDate.setHours(hour, minute, 0, 0);

            const trxIso = targetDate.toISOString();
            const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
            const no_transaksi = `TRX-${dateStr}-${String(trxCounter).padStart(4, '0')}`;
            trxCounter++;

            const seller = availableSellers[Math.floor(Math.random() * availableSellers.length)];
            const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const user = kasirUsers.length > 0 ? kasirUsers[Math.floor(Math.random() * kasirUsers.length)] : null;

            // Pilih 1 - 3 jenis produk untuk transaksi ini
            const numItems = Math.floor(Math.random() * 3) + 1;
            let totalTrx = 0;
            const itemsForThisTrx = [];

            for (let i = 0; i < numItems; i++) {
              const prod = availableProducts[Math.floor(Math.random() * availableProducts.length)];
              const qty = Math.floor(Math.random() * 3) + 1;
              const subtotal = qty * Number(prod.harga_jual || 10000);
              totalTrx += subtotal;

              itemsForThisTrx.push({
                produk_id: prod.id,
                nama_produk: prod.nama,
                qty,
                harga_satuan: Number(prod.harga_jual || 10000),
                subtotal
              });
            }

            const bayar = method === 'tunai' ? totalTrx + (Math.floor(Math.random() * 3) * 5000) : totalTrx;
            const kembalian = bayar - totalTrx;

            const trxRecord = {
              no_transaksi,
              user_id: user?.id || defaultKasirId,
              seller,
              tanggal: trxIso,
              total: totalTrx,
              bayar,
              kembalian,
              metode_bayar: method,
              keterangan: daysAgo === 0 && t === 0 ? 'Pesanan Pembuka Pagi Gerai' : '',
              status: 'selesai'
            };

            batchTrx.push({ trxRecord, items: itemsForThisTrx });
          }
        }

        // Insert Transaksi dan Detail ke Supabase
        for (const item of batchTrx) {
          const { data: insertedTrx, error: trxErr } = await supabaseAdmin
            .from('transaksi')
            .insert(item.trxRecord)
            .select()
            .single();

          if (!trxErr && insertedTrx) {
            summary.transaksi++;
            const detailsWithId = item.items.map(dt => ({
              transaksi_id: insertedTrx.id,
              ...dt
            }));
            const { data: insDetails } = await supabaseAdmin
              .from('detail_transaksi')
              .insert(detailsWithId)
              .select();
            summary.detail_transaksi += insDetails?.length || 0;
          }
        }
      } else {
        summary.transaksi = trxCount;
      }

      // F. CEK APAKAH PERLU SEED PENGELUARAN (jika < 15 data)
      const { count: expCount } = await supabaseAdmin.from('pengeluaran').select('*', { count: 'exact', head: true });

      if (!expCount || expCount < 15) {
        let expCounter = 101;
        const newExpenses = [];

        for (let i = 0; i < 35; i++) {
          const dExp = new Date();
          // Sebarkan dari 30 hari lalu hingga hari ini (i < 4 untuk hari ini)
          const daysAgo = i < 4 ? 0 : Math.floor((i / 35) * 30);
          dExp.setDate(dExp.getDate() - daysAgo);
          dExp.setHours(8 + (i % 10), (i * 17) % 60, 0, 0);

          const tpl = expenseTemplates[i % expenseTemplates.length];
          const dateStr = dExp.toISOString().slice(0, 10).replace(/-/g, '');
          const no_transaksi = `EXP-${dateStr}-${String(expCounter++).padStart(3, '0')}`;

          newExpenses.push({
            no_transaksi,
            tanggal: dExp.toISOString(),
            kategori: tpl.kategori,
            deskripsi: tpl.deskripsi,
            nominal: tpl.nominal + ((i % 4) * 5000),
            metode_bayar: tpl.metode,
            pj: tpl.pj
          });
        }

        const { data: insExp } = await supabaseAdmin
          .from('pengeluaran')
          .insert(newExpenses)
          .select();

        summary.pengeluaran = (expCount || 0) + (insExp?.length || 0);
      } else {
        summary.pengeluaran = expCount;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data dummy berhasil digenerate dan disinkronkan ke sistem Andini Pure Milk!',
      summary
    });
  } catch (error) {
    console.error('Error seeding dummy data:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

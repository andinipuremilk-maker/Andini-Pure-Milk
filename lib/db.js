// Singleton mock database seeded with rich products, sellers, transactions, and expenses
const globalAny = global;

function generateDatabaseFromExcel() {
  const users = [
    { id: 'u1', nama: 'Admin Utama Andini', username: 'admin', password: 'admin', role: 'admin', shift: 'Pagi & Malam', tanggal_masuk: '2025-01-10', is_active: true },
    { id: 'u2', nama: 'Bu Andini (Owner)', username: 'andini_owner', password: 'password', role: 'admin', shift: 'Full Control', tanggal_masuk: '2025-01-01', is_active: true },
    { id: 'u3', nama: 'Kasir Outlet Andini', username: 'kasir', password: 'kasir', role: 'kasir', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-02-01', is_active: true },
    { id: 'u4', nama: 'Siti Rahma', username: 'siti_kasir', password: 'password', role: 'kasir', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-03-15', is_active: true },
    { id: 'u5', nama: 'Rina Anggraini', username: 'rina_kasir', password: 'password', role: 'kasir', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-04-01', is_active: true },
    { id: 'u6', nama: 'Dimas Setiawan', username: 'dimas_kasir', password: 'password', role: 'kasir', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-05-10', is_active: true },
    { id: 'u7', nama: 'Putri Lestari', username: 'putri_kasir', password: 'password', role: 'kasir', shift: 'Shift Weekend', tanggal_masuk: '2025-06-01', is_active: true },
    { id: 'u8', nama: 'Eko Prasetyo', username: 'eko_barista', password: 'password', role: 'barista', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-02-10', is_active: true },
    { id: 'u9', nama: 'Bayu Pratama', username: 'bayu_barista', password: 'password', role: 'barista', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-03-20', is_active: true },
    { id: 'u10', nama: 'Rizky Ramadhan', username: 'rizky_barista', password: 'password', role: 'barista', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-05-01', is_active: true },
    { id: 'u11', nama: 'Angga Wijaya', username: 'angga_barista', password: 'password', role: 'barista', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-06-15', is_active: true },
    { id: 'u12', nama: 'Nafis Abdullah', username: 'nafis_ops', password: 'password', role: 'staff', shift: 'Full Time', tanggal_masuk: '2025-01-20', is_active: true },
    { id: 'u13', nama: 'Hendra Saputra', username: 'hendra_ops', password: 'password', role: 'staff', shift: 'Full Time', tanggal_masuk: '2025-04-12', is_active: true },
    { id: 'u14', nama: 'Farhan Maulana', username: 'farhan_driver', password: 'password', role: 'kurir', shift: 'On Call / Shift', tanggal_masuk: '2025-04-05', is_active: true },
    { id: 'u15', nama: 'Budi Santoso', username: 'budi_driver', password: 'password', role: 'kurir', shift: 'Shift Siang & Sore', tanggal_masuk: '2025-05-18', is_active: true }
  ];

  const kategoriProduk = [
    { id: 'k1', nama: 'Susu Murni & Olahan' },
    { id: 'k2', nama: 'Minuman Rempah (STMJ)' },
    { id: 'k3', nama: 'Boba & Es Segar' },
    { id: 'k4', nama: 'Pie & Pastry' },
    { id: 'k5', nama: 'Yogurt & Olahan Dairy' },
    { id: 'k6', nama: 'Kopi Susu Tradisional' },
    { id: 'k7', nama: 'Camilan & Roti Panggang' }
  ];

  const produk = [
    // Susu Murni & Olahan
    { id: 'p1', kategori_id: 'k1', nama: 'Susu Murni 1 Liter', sku: 'SM-1L', harga_jual: 15000, harga_modal: 10000, stok: 120, is_active: true },
    { id: 'p2', kategori_id: 'k1', nama: 'Susu Murni Hangat', sku: 'SM-HGT', harga_jual: 10000, harga_modal: 6000, stok: 150, is_active: true },
    { id: 'p3', kategori_id: 'k1', nama: 'Sticky Milk Special', sku: 'STK-MLK', harga_jual: 8000, harga_modal: 5500, stok: 100, is_active: true },
    { id: 'p4', kategori_id: 'k1', nama: 'Susu Coklat 1 Liter', sku: 'SC-1L', harga_jual: 18000, harga_modal: 12000, stok: 80, is_active: true },
    { id: 'p5', kategori_id: 'k1', nama: 'Es Susu Melon Segar', sku: 'SS-MLN', harga_jual: 10000, harga_modal: 6000, stok: 110, is_active: true },
    { id: 'p6', kategori_id: 'k1', nama: 'Es Susu Strawberry', sku: 'SS-STR', harga_jual: 10000, harga_modal: 6000, stok: 110, is_active: true },
    { id: 'p7', kategori_id: 'k1', nama: 'Susu Kurma Segar', sku: 'SM-KRM', harga_jual: 16000, harga_modal: 10000, stok: 90, is_active: true },
    { id: 'p8', kategori_id: 'k1', nama: 'Susu Matcha Green Tea', sku: 'SM-MTC', harga_jual: 15000, harga_modal: 9000, stok: 85, is_active: true },

    // Minuman Rempah (STMJ)
    { id: 'p9', kategori_id: 'k2', nama: 'STMJ (Susu Telur Madu Jahe)', sku: 'STMJ-ORG', harga_jual: 15000, harga_modal: 10000, stok: 140, is_active: true },
    { id: 'p10', kategori_id: 'k2', nama: 'STMJ Telur Bebek Liar', sku: 'STMJ-BBK', harga_jual: 18000, harga_modal: 11500, stok: 75, is_active: true },
    { id: 'p11', kategori_id: 'k2', nama: 'SMJ (Susu Madu Jahe)', sku: 'SMJ-ORG', harga_jual: 12000, harga_modal: 7500, stok: 130, is_active: true },
    { id: 'p12', kategori_id: 'k2', nama: 'Jahe Merah Ori Hangat', sku: 'JHM-ORG', harga_jual: 10000, harga_modal: 6000, stok: 100, is_active: true },
    { id: 'p13', kategori_id: 'k2', nama: 'Susu Jahe Hangat Cup', sku: 'SJH-CUP', harga_jual: 8000, harga_modal: 4500, stok: 120, is_active: true },

    // Boba & Es Segar
    { id: 'p14', kategori_id: 'k3', nama: 'BK (Boba Ketan Hitam)', sku: 'BB-KTN', harga_jual: 8000, harga_modal: 4500, stok: 100, is_active: true },
    { id: 'p15', kategori_id: 'k3', nama: 'BB (Boba Brown Sugar)', sku: 'BB-BSG', harga_jual: 10000, harga_modal: 5500, stok: 120, is_active: true },
    { id: 'p16', kategori_id: 'k3', nama: 'Kiko (Es Lilin Susu)', sku: 'KKO-ORG', harga_jual: 2000, harga_modal: 500, stok: 400, is_active: true },
    { id: 'p17', kategori_id: 'k3', nama: 'Es Krim & Puding Susu', sku: 'EKM-PDG', harga_jual: 5000, harga_modal: 2500, stok: 100, is_active: true },
    { id: 'p18', kategori_id: 'k3', nama: 'Es Tea Susu Andini', sku: 'ETS-SSU', harga_jual: 5000, harga_modal: 3000, stok: 150, is_active: true },
    { id: 'p19', kategori_id: 'k3', nama: 'Susu Regal Caramel', sku: 'SM-RGL', harga_jual: 15000, harga_modal: 8500, stok: 95, is_active: true },

    // Pie & Pastry
    { id: 'p20', kategori_id: 'k4', nama: 'Pie Susu Original', sku: 'PIE-ORG', harga_jual: 5000, harga_modal: 3000, stok: 200, is_active: true },
    { id: 'p21', kategori_id: 'k4', nama: 'Pie Susu Coklat', sku: 'PIE-CKL', harga_jual: 5500, harga_modal: 3200, stok: 180, is_active: true },
    { id: 'p22', kategori_id: 'k4', nama: 'Pie Susu Box Isi 6', sku: 'PIE-BOX', harga_jual: 25000, harga_modal: 15000, stok: 60, is_active: true },
    { id: 'p23', kategori_id: 'k4', nama: 'Brownies Slice Susu', sku: 'BRN-SLC', harga_jual: 15000, harga_modal: 9000, stok: 60, is_active: true },

    // Yogurt & Olahan Dairy
    { id: 'p24', kategori_id: 'k5', nama: 'Yoghurt Bottle 250ml', sku: 'YGH-250', harga_jual: 15000, harga_modal: 9000, stok: 80, is_active: true },
    { id: 'p25', kategori_id: 'k5', nama: 'Yoghurt Plain 500ml', sku: 'YGH-500', harga_jual: 25000, harga_modal: 15000, stok: 50, is_active: true },
    { id: 'p26', kategori_id: 'k5', nama: 'Keju Mozzarella 200g', sku: 'KJ-MOZ', harga_jual: 35000, harga_modal: 22000, stok: 45, is_active: true },

    // Kopi Susu Tradisional
    { id: 'p27', kategori_id: 'k6', nama: 'Kopi Susu Gula Aren', sku: 'KPS-AREN', harga_jual: 13000, harga_modal: 7000, stok: 120, is_active: true },
    { id: 'p28', kategori_id: 'k6', nama: 'Kopi Susu Vanilla Cream', sku: 'KPS-VNL', harga_jual: 14000, harga_modal: 7500, stok: 90, is_active: true },

    // Camilan & Roti Panggang
    { id: 'p29', kategori_id: 'k7', nama: 'Roti Bakar Coklat Keju', sku: 'RTB-CKJ', harga_jual: 15000, harga_modal: 8000, stok: 70, is_active: true },
    { id: 'p30', kategori_id: 'k7', nama: 'Roti Bakar Srikaya Susu', sku: 'RTB-KYA', harga_jual: 12000, harga_modal: 6500, stok: 70, is_active: true },
    { id: 'p31', kategori_id: 'k7', nama: 'Puding Karamel Susu', sku: 'PDG-KRM', harga_jual: 8000, harga_modal: 4000, stok: 80, is_active: true },
    { id: 'p32', kategori_id: 'k7', nama: 'Keripik Susu Krispi', sku: 'KPK-SSU', harga_jual: 12000, harga_modal: 7000, stok: 100, is_active: true }
  ];

  const sellers = [
    { id: 's1', nama: 'Umum / Retail', is_active: true, created_at: '2025-01-01T00:00:00.000Z' },
    { id: 's2', nama: 'NAFIS', is_active: true, created_at: '2025-01-02T00:00:00.000Z' },
    { id: 's3', nama: 'EKO', is_active: true, created_at: '2025-01-03T00:00:00.000Z' },
    { id: 's4', nama: 'SD LATENG', is_active: true, created_at: '2025-01-04T00:00:00.000Z' },
    { id: 's5', nama: 'SD AL KHARIYAH', is_active: true, created_at: '2025-01-05T00:00:00.000Z' },
    { id: 's6', nama: 'PAK GOFAR', is_active: true, created_at: '2025-01-06T00:00:00.000Z' },
    { id: 's7', nama: 'FARHAN', is_active: true, created_at: '2025-01-07T00:00:00.000Z' },
    { id: 's8', nama: 'AIRIN', is_active: true, created_at: '2025-01-08T00:00:00.000Z' },
    { id: 's9', nama: 'PAK TOTOK', is_active: true, created_at: '2025-01-09T00:00:00.000Z' },
    { id: 's10', nama: 'TIM ANDINI', is_active: true, created_at: '2025-01-10T00:00:00.000Z' },
    { id: 's11', nama: 'KANTIN RSUD', is_active: true, created_at: '2025-02-01T00:00:00.000Z' },
    { id: 's12', nama: 'SD PERTIWI', is_active: true, created_at: '2025-02-15T00:00:00.000Z' },
    { id: 's13', nama: 'WARUNG BU SRI', is_active: true, created_at: '2025-03-01T00:00:00.000Z' },
    { id: 's14', nama: 'TOKO ROTI KENCANA', is_active: true, created_at: '2025-03-10T00:00:00.000Z' },
    { id: 's15', nama: 'CAFE OMAH SUSU', is_active: true, created_at: '2025-03-25T00:00:00.000Z' },
    { id: 's16', nama: 'RESELLER GENTENG', is_active: true, created_at: '2025-04-01T00:00:00.000Z' },
    { id: 's17', nama: 'KOPERASI AL-IKHLAS', is_active: true, created_at: '2025-04-10T00:00:00.000Z' }
  ];

  const transaksi = [];
  const detailTransaksi = [];
  const methods = ['tunai', 'qris', 'transfer'];
  let trxSeq = 1;

  // Generate historical data for last 35 days up to TODAY (daysAgo = 0)
  for (let daysAgo = 34; daysAgo >= 0; daysAgo--) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - daysAgo);

    // Hari ini ada 6-8 transaksi, hari-hari sebelumnya ada 4-8 transaksi
    const numTrx = daysAgo === 0 ? 8 : (Math.floor(Math.random() * 5) + 4);

    for (let j = 0; j < numTrx; j++) {
      const trxDate = new Date(baseDate);
      const hour = daysAgo === 0 ? Math.min(8 + j * 2, 19) : (8 + Math.floor(Math.random() * 13));
      const minute = (j * 17 + daysAgo * 11) % 60;
      trxDate.setHours(hour, minute, 0, 0);

      const trxId = `t${trxDate.getTime()}_${j}`;
      const dateStr = trxDate.toISOString().slice(0, 10).replace(/-/g, '');
      const no_transaksi = `TRX-${dateStr}-${String(trxSeq++).padStart(4, '0')}`;
      const method = methods[Math.floor(Math.random() * methods.length)];
      const randSeller = sellers[Math.floor(Math.random() * sellers.length)];
      const sellerName = typeof randSeller === 'string' ? randSeller : randSeller.nama;

      const numItems = Math.floor(Math.random() * 3) + 1;
      let totalSetor = 0;
      let totalModal = 0;

      for (let k = 0; k < numItems; k++) {
        const prod = produk[Math.floor(Math.random() * produk.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const subtotalSetor = qty * prod.harga_jual;
        const subtotalModal = qty * (prod.harga_modal || Math.round(prod.harga_jual * 0.6));

        totalSetor += subtotalSetor;
        totalModal += subtotalModal;

        detailTransaksi.push({
          id: `dt_${trxId}_${k}`,
          transaksi_id: trxId,
          produk_id: prod.id,
          nama_produk: prod.nama,
          qty: qty,
          harga_satuan: prod.harga_jual,
          harga_modal: prod.harga_modal || Math.round(prod.harga_jual * 0.6),
          subtotal: subtotalSetor,
          subtotal_modal: subtotalModal,
          laba: subtotalSetor - subtotalModal
        });
      }

      const totalLaba = totalSetor - totalModal;

      transaksi.push({
        id: trxId,
        user_id: 'u3',
        no_transaksi,
        seller: sellerName,
        tanggal: trxDate.toISOString(),
        total: totalSetor,
        total_setor: totalSetor,
        total_modal: totalModal,
        total_laba: totalLaba,
        bayar: totalSetor + (method === 'tunai' ? (Math.floor(Math.random() * 3) * 5000) : 0),
        kembalian: method === 'tunai' ? (Math.floor(Math.random() * 3) * 5000) : 0,
        metode_bayar: method,
        keterangan: daysAgo === 0 && j === 0 ? 'Pesanan Pembuka Pagi Gerai' : '',
        status: 'selesai'
      });
    }
  }

  const pengeluaran = [];
  const dummyExpensesData = [
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Es Batu Kristal 10 Kantong', nominal: 35000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Restok Cup Plastik 22oz & Tutup Sealer', nominal: 145000, pj: 'Admin Utama Andini', metode: 'qris' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Jahe Merah & Temulawak Segar', nominal: 95000, pj: 'Nafis Abdullah', metode: 'tunai' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Restok Susu Murni dari Peternakan Mitra', nominal: 450000, pj: 'Admin Utama Andini', metode: 'transfer' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Gula Aren Murni 10 Kg', nominal: 180000, pj: 'Eko Prasetyo', metode: 'transfer' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Bahan Boba Brown Sugar & Jelly Cincau', nominal: 85000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Sedotan Steril & Kantong Kresek', nominal: 40000, pj: 'Siti Rahma', metode: 'tunai' },
    { kategori: 'Operasional', deskripsi: 'Pembayaran Tagihan Listrik PLN Outlet', nominal: 220000, pj: 'Admin Utama Andini', metode: 'transfer' },
    { kategori: 'Operasional', deskripsi: 'Iuran Kebersihan Lingkungan & Sampah', nominal: 35000, pj: 'Siti Rahma', metode: 'tunai' },
    { kategori: 'Operasional', deskripsi: 'Langganan WiFi & Internet Kasir Gerai', nominal: 150000, pj: 'Admin Utama Andini', metode: 'transfer' },
    { kategori: 'Operasional', deskripsi: 'Refill Tabung Gas LPG 3Kg untuk Rebus Susu', nominal: 44000, pj: 'Nafis Abdullah', metode: 'tunai' },
    { kategori: 'Operasional', deskripsi: 'Servis Ringan Mesin Sealer Cup Cup', nominal: 75000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
    { kategori: 'Transport & Logistik', deskripsi: 'Bensin Operasional Motor Kurir Delivery', nominal: 50000, pj: 'Farhan Maulana', metode: 'tunai' },
    { kategori: 'Transport & Logistik', deskripsi: 'Ongkir Paket Pengiriman Pie Susu Luar Kota', nominal: 35000, pj: 'Budi Santoso', metode: 'tunai' },
    { kategori: 'Gaji & Bonus', deskripsi: 'Insentif Lembur Penjualan Ramai Weekend', nominal: 150000, pj: 'Admin Utama Andini', metode: 'transfer' },
    { kategori: 'Lain-lain', deskripsi: 'Pembelian Air Galon Mineral untuk Gerai', nominal: 22000, pj: 'Kasir Outlet Andini', metode: 'tunai' },
    { kategori: 'Lain-lain', deskripsi: 'Pembelian Kertas Struk Thermal & Lakban', nominal: 55000, pj: 'Siti Rahma', metode: 'qris' }
  ];

  // Generate 35 expenses for today and past 30 days
  let expSeq = 101;
  for (let i = 0; i < 35; i++) {
    const dExp = new Date();
    const daysAgo = i < 4 ? 0 : Math.floor((i / 35) * 30);
    dExp.setDate(dExp.getDate() - daysAgo);
    dExp.setHours(8 + (i % 10), (i * 17) % 60, 0, 0);

    const template = dummyExpensesData[i % dummyExpensesData.length];
    const expId = `exp_${dExp.getTime()}_${i}`;
    const dateStr = dExp.toISOString().slice(0, 10).replace(/-/g, '');
    const no_transaksi = `EXP-${dateStr}-${String(expSeq++).padStart(3, '0')}`;

    pengeluaran.push({
      id: expId,
      no_transaksi,
      tanggal: dExp.toISOString(),
      kategori: template.kategori,
      deskripsi: template.deskripsi,
      nominal: template.nominal + ((i % 4) * 5000),
      metode_bayar: template.metode,
      pj: template.pj
    });
  }

  return { users, kategoriProduk, produk, transaksi, detailTransaksi, sellers, pengeluaran };
}

// Re-generate if empty or outdated
if (!globalAny.mockDb || !globalAny.mockDb.pengeluaran || globalAny.mockDb.pengeluaran.length < 20 || !globalAny.mockDb.users || globalAny.mockDb.users.length < 10) {
  globalAny.mockDb = generateDatabaseFromExcel();
}

// Ensure default passwords for admin and kasir match user request
if (globalAny.mockDb && globalAny.mockDb.users) {
  const adminUser = globalAny.mockDb.users.find(u => u.username === 'admin');
  if (adminUser) adminUser.password = 'admin';
  const kasirUser = globalAny.mockDb.users.find(u => u.username === 'kasir');
  if (kasirUser) kasirUser.password = 'kasir';
}

export const db = globalAny.mockDb;

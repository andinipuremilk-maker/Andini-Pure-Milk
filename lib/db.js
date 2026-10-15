// Singleton mock database seeded with real products and sellers from 'PER SELLER NEW2026.xlsx'
const globalAny = global;

function generateDatabaseFromExcel() {
  const users = [
    { id: 'u1', nama: 'Admin Andini', username: 'admin', password: 'admin', role: 'admin', shift: 'Pagi & Malam', tanggal_masuk: '2025-01-10', is_active: true },
    { id: 'u2', nama: 'Kasir Andini', username: 'kasir', password: 'kasir', role: 'kasir', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-02-01', is_active: true },
    { id: 'u3', nama: 'Siti Rahma', username: 'siti_kasir', password: 'password', role: 'kasir', shift: 'Shift 2 (15:00 - 22:00)', tanggal_masuk: '2025-03-15', is_active: true },
    { id: 'u4', nama: 'Eko Prasetyo', username: 'eko_barista', password: 'password', role: 'barista', shift: 'Shift 1 (08:00 - 16:00)', tanggal_masuk: '2025-02-10', is_active: true },
    { id: 'u5', nama: 'Nafis Abdullah', username: 'nafis_ops', password: 'password', role: 'staff', shift: 'Full Time', tanggal_masuk: '2025-01-20', is_active: true },
    { id: 'u6', nama: 'Farhan Maulana', username: 'farhan_driver', password: 'password', role: 'kurir', shift: 'On Call / Shift', tanggal_masuk: '2025-04-05', is_active: true },
  ];

  const kategoriProduk = [
    { id: 'k1', nama: 'Susu Murni & Olahan' },
    { id: 'k2', nama: 'Minuman Rempah (STMJ)' },
    { id: 'k3', nama: 'Boba & Es Segar' },
    { id: 'k4', nama: 'Pie & Pastry' },
    { id: 'k5', nama: 'Yogurt & Olahan Dairy' },
  ];

  const produk = [
    // Susu Murni & Olahan
    { id: 'p1', kategori_id: 'k1', nama: 'Susu Murni 1 Liter', sku: 'SM-1L', harga_jual: 15000, harga_modal: 10000, stok: 100, is_active: true },
    { id: 'p2', kategori_id: 'k1', nama: 'Susu Murni Hangat', sku: 'SM-HGT', harga_jual: 10000, harga_modal: 6000, stok: 100, is_active: true },
    { id: 'p3', kategori_id: 'k1', nama: 'Sticky Milk', sku: 'STK-MLK', harga_jual: 8000, harga_modal: 5500, stok: 100, is_active: true },
    { id: 'p4', kategori_id: 'k1', nama: 'Susu Coklat 1L', sku: 'SC-1L', harga_jual: 18000, harga_modal: 12000, stok: 100, is_active: true },
    { id: 'p5', kategori_id: 'k1', nama: 'Es Susu Rasa (Melon/Straw)', sku: 'SS-RSA', harga_jual: 10000, harga_modal: 6000, stok: 100, is_active: true },

    // Minuman Rempah (STMJ)
    { id: 'p6', kategori_id: 'k2', nama: 'STMJ (Susu Telur Madu Jahe)', sku: 'STMJ-ORG', harga_jual: 15000, harga_modal: 10000, stok: 100, is_active: true },
    { id: 'p7', kategori_id: 'k2', nama: 'SMJ (Susu Madu Jahe)', sku: 'SMJ-ORG', harga_jual: 12000, harga_modal: 7500, stok: 100, is_active: true },
    { id: 'p8', kategori_id: 'k2', nama: 'Jahe Merah Ori', sku: 'JHM-ORG', harga_jual: 10000, harga_modal: 6000, stok: 100, is_active: true },

    // Boba & Es Segar
    { id: 'p9', kategori_id: 'k3', nama: 'BK (Boba Ketan)', sku: 'BB-KTN', harga_jual: 8000, harga_modal: 4500, stok: 100, is_active: true },
    { id: 'p10', kategori_id: 'k3', nama: 'BB (Boba Brown Sugar)', sku: 'BB-BSG', harga_jual: 10000, harga_modal: 5500, stok: 100, is_active: true },
    { id: 'p11', kategori_id: 'k3', nama: 'Kiko (Es Lilin)', sku: 'KKO-ORG', harga_jual: 2000, harga_modal: 500, stok: 500, is_active: true },
    { id: 'p12', kategori_id: 'k3', nama: 'Es Krim & Puding', sku: 'EKM-PDG', harga_jual: 5000, harga_modal: 2500, stok: 100, is_active: true },
    { id: 'p13', kategori_id: 'k3', nama: 'Es Tea Susu', sku: 'ETS-SSU', harga_jual: 5000, harga_modal: 3000, stok: 100, is_active: true },

    // Pie & Pastry
    { id: 'p14', kategori_id: 'k4', nama: 'Pie Susu Original', sku: 'PIE-ORG', harga_jual: 5000, harga_modal: 3000, stok: 150, is_active: true },
    { id: 'p15', kategori_id: 'k4', nama: 'Pie Susu Coklat', sku: 'PIE-CKL', harga_jual: 5500, harga_modal: 3200, stok: 150, is_active: true },
    { id: 'p16', kategori_id: 'k4', nama: 'Pie Susu Kotak / Box', sku: 'PIE-BOX', harga_jual: 25000, harga_modal: 15000, stok: 50, is_active: true },
    { id: 'p17', kategori_id: 'k4', nama: 'Brownies Slice', sku: 'BRN-SLC', harga_jual: 15000, harga_modal: 9000, stok: 50, is_active: true },

    // Yogurt & Olahan Dairy
    { id: 'p18', kategori_id: 'k5', nama: 'Yoghurt Bottle 250ml', sku: 'YGH-250', harga_jual: 15000, harga_modal: 9000, stok: 80, is_active: true },
    { id: 'p19', kategori_id: 'k5', nama: 'Yoghurt Plain 500ml', sku: 'YGH-500', harga_jual: 25000, harga_modal: 15000, stok: 50, is_active: true },
    { id: 'p20', kategori_id: 'k5', nama: 'Keju Mozzarella 200g', sku: 'KJ-MOZ', harga_jual: 35000, harga_modal: 22000, stok: 40, is_active: true },
  ];

  const sellers = [
    'NAFIS',
    'EKO',
    'SD LATENG',
    'SD AL KHARIYAH',
    'PAK GOFAR',
    'FARHAN',
    'AIRIN',
    'PAK TOTOK',
    'TIM ANDINI',
    'Umum / Retail'
  ];

  const transaksi = [];
  const detailTransaksi = [];
  const methods = ['tunai', 'qris', 'transfer'];
  
  // Generate historical data for last 90 days
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const numTrx = Math.floor(Math.random() * 31) + 20; // 20-50 transactions / day
    
    for (let j = 0; j < numTrx; j++) {
      date.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
      
      const trxId = `t${date.getTime()}_${j}`;
      const trxDate = date.toISOString();
      const method = methods[Math.floor(Math.random() * methods.length)];
      const sellerName = sellers[Math.floor(Math.random() * sellers.length)];
      
      const numItems = Math.floor(Math.random() * 4) + 1;
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
        user_id: 'u2',
        no_transaksi: 'TRX-' + date.getTime() + '-' + j,
        seller: sellerName,
        tanggal: trxDate,
        total: totalSetor,
        total_setor: totalSetor,
        total_modal: totalModal,
        total_laba: totalLaba,
        bayar: totalSetor + (method === 'tunai' ? (Math.floor(Math.random() * 5) * 5000) : 0),
        kembalian: method === 'tunai' ? (Math.floor(Math.random() * 5) * 5000) : 0,
        metode_bayar: method,
        keterangan: '',
        status: 'selesai'
      });
    }
  }

  const pengeluaran = [];
  const dummyExpensesData = [
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Es Batu 10 Plastik & Sedotan Steril', nominal: 35000, pj: 'Kasir Andini', metode: 'tunai' },
    { kategori: 'Operasional', deskripsi: 'Bayar Listrik & Kebersihan Outlet', nominal: 185000, pj: 'Admin Andini', metode: 'transfer' },
    { kategori: 'Transport & Logistik', deskripsi: 'Bensin Operasional Pengiriman Susu Murni', nominal: 50000, pj: 'Farhan', metode: 'tunai' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Restok Cup Plastik 22oz & Lid Sealer', nominal: 120000, pj: 'Admin Andini', metode: 'qris' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Jahe Merah & Gula Aren Organik', nominal: 95000, pj: 'Nafis', metode: 'tunai' },
    { kategori: 'Gaji & Bonus', deskripsi: 'Bonus Harian Tim Outlet Kasir', nominal: 150000, pj: 'Admin Andini', metode: 'transfer' },
    { kategori: 'Operasional', deskripsi: 'Biaya Maintenance Mesin Sealer Cup', nominal: 75000, pj: 'Kasir Andini', metode: 'tunai' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Kantong Plastik Takeaway & Tissue', nominal: 45000, pj: 'Kasir Andini', metode: 'qris' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Restok Susu Murni dari Peternakan Mitra', nominal: 450000, pj: 'Admin Andini', metode: 'transfer' },
    { kategori: 'Bahan Baku & Perlengkapan', deskripsi: 'Pembelian Bahan Boba Brown Sugar & Ketan', nominal: 80000, pj: 'Nafis', metode: 'tunai' },
    { kategori: 'Transport & Logistik', deskripsi: 'Ongkir Pengiriman Pie Susu Box', nominal: 25000, pj: 'Kasir Andini', metode: 'tunai' },
    { kategori: 'Lain-lain', deskripsi: 'Pembelian Air Galon untuk Kasir & Outlet', nominal: 20000, pj: 'Kasir Andini', metode: 'tunai' }
  ];

  // Generate 25 expenses for today and past days
  for (let i = 0; i < 25; i++) {
    const dExp = new Date();
    const daysAgo = i < 6 ? (i % 2) : Math.floor((i / 25) * 30);
    dExp.setDate(dExp.getDate() - daysAgo);
    dExp.setHours(9 + (i % 8), (i * 17) % 60, 0, 0);

    const template = dummyExpensesData[i % dummyExpensesData.length];
    const expId = `exp_${dExp.getTime()}_${i}`;

    pengeluaran.push({
      id: expId,
      no_transaksi: 'EXP-' + (dExp.getTime() + i).toString().slice(-6),
      tanggal: dExp.toISOString(),
      kategori: template.kategori,
      deskripsi: template.deskripsi,
      nominal: template.nominal + ((i % 3) * 5000),
      metode_bayar: template.metode,
      pj: template.pj
    });
  }

  return { users, kategoriProduk, produk, transaksi, detailTransaksi, sellers, pengeluaran };
}

if (!globalAny.mockDb || !globalAny.mockDb.pengeluaran || globalAny.mockDb.pengeluaran.length < 15 || !globalAny.mockDb.users || globalAny.mockDb.users.length < 5) {
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

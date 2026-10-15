export const mockUsers = [
  { id: 'u1', nama: 'Admin User', username: 'admin', password: 'password', role: 'admin', is_active: true },
  { id: 'u2', nama: 'Kasir User', username: 'kasir', password: 'password', role: 'kasir', is_active: true },
];

export const mockKategoriProduk = [
  { id: 'k1', nama: 'Susu Botol' },
  { id: 'k2', nama: 'Pie' },
  { id: 'k3', nama: 'Yogurt' },
];

export const mockProduk = [
  { id: 'p1', kategori_id: 'k1', nama: 'Susu Murni 1L', sku: 'SM-1L', harga_jual: 20000, is_active: true },
  { id: 'p2', kategori_id: 'k1', nama: 'Susu Coklat 1L', sku: 'SC-1L', harga_jual: 22000, is_active: true },
  { id: 'p3', kategori_id: 'k2', nama: 'Pie Susu Original', sku: 'PIE-ORG', harga_jual: 5000, is_active: true },
  { id: 'p4', kategori_id: 'k2', nama: 'Pie Susu Coklat', sku: 'PIE-CHO', harga_jual: 5500, is_active: true },
  { id: 'p5', kategori_id: 'k3', nama: 'Yogurt Plain 500ml', sku: 'YG-PLN', harga_jual: 25000, is_active: true },
];

export const mockTransaksi = [];
export const mockDetailTransaksi = [];

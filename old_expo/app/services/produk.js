import { mockProduk, mockKategoriProduk } from './mockData';

// Fetch all active products
export const getProduk = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mockProduk.filter(p => p.is_active)];
};

export const getKategori = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mockKategoriProduk];
};

export const addProduk = async (produk) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const newProduk = {
    id: `p${Date.now()}`,
    is_active: true,
    ...produk
  };
  mockProduk.push(newProduk);
  return newProduk;
};

export const updateProduk = async (id, updates) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockProduk.findIndex(p => p.id === id);
  if (index !== -1) {
    mockProduk[index] = { ...mockProduk[index], ...updates };
    return mockProduk[index];
  }
  throw new Error('Produk tidak ditemukan');
};

export const softDeleteProduk = async (id) => {
  return updateProduk(id, { is_active: false });
};

export const addKategori = async (nama) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const newKat = { id: `k${Date.now()}`, nama };
  mockKategoriProduk.push(newKat);
  return newKat;
};

export const updateKategori = async (id, nama) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockKategoriProduk.findIndex(k => k.id === id);
  if (index !== -1) {
    mockKategoriProduk[index].nama = nama;
    return mockKategoriProduk[index];
  }
  throw new Error('Kategori tidak ditemukan');
};

export const deleteKategori = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const hasProducts = mockProduk.some(p => p.kategori_id === id && p.is_active);
  if (hasProducts) {
    throw new Error('Tidak dapat menghapus kategori yang masih memiliki produk aktif.');
  }
  
  const index = mockKategoriProduk.findIndex(k => k.id === id);
  if (index !== -1) {
    mockKategoriProduk.splice(index, 1);
    return true;
  }
  throw new Error('Kategori tidak ditemukan');
};

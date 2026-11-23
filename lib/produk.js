// Helper harga per kemasan (Botol Kecil / Botol Besar) untuk produk bervarian.
// Harga varian disimpan di produk.variants[] (JSONB): { id, nama, harga_jual, harga_modal }.
// Varian tanpa harga (data lama) otomatis memakai harga dasar produk.
const KEMASAN_ID = { 'Botol Kecil': 'v_kcl', 'Botol Besar': 'v_bsr' };

// Deteksi kemasan dari field kemasan, atau dari akhiran nama "Produk (Botol Besar)"
export function deteksiKemasan(item) {
  if (item?.kemasan && KEMASAN_ID[item.kemasan]) return item.kemasan;
  const m = String(item?.nama || item?.nama_produk || '').match(/\((Botol Kecil|Botol Besar)\)\s*$/);
  return m ? m[1] : null;
}

export function hargaKemasan(produk, kemasan) {
  const dasar = {
    harga_jual: Number(produk?.harga_jual) || 0,
    harga_modal: Number(produk?.harga_modal) || 0
  };
  if (!kemasan || !Array.isArray(produk?.variants)) return dasar;
  const v = produk.variants.find(x => x.id === KEMASAN_ID[kemasan]);
  if (!v) return dasar;
  const jual = Number(v.harga_jual);
  const modal = Number(v.harga_modal);
  return {
    harga_jual: Number.isFinite(jual) && jual > 0 ? jual : dasar.harga_jual,
    harga_modal: Number.isFinite(modal) && v.harga_modal !== '' && v.harga_modal != null ? modal : dasar.harga_modal
  };
}

import { mockTransaksi, mockDetailTransaksi } from './mockData';

export const submitTransaksi = async (transaksiData, detailItems, userId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const no_transaksi = 'TRX-' + Date.now();
  const transaksi = {
    id: `t${Date.now()}`,
    user_id: userId,
    no_transaksi,
    tanggal: new Date().toISOString(),
    total: transaksiData.total,
    bayar: transaksiData.bayar,
    kembalian: transaksiData.bayar - transaksiData.total,
    metode_bayar: transaksiData.metode_bayar,
    status: 'selesai'
  };

  mockTransaksi.push(transaksi);

  detailItems.forEach((item, index) => {
    mockDetailTransaksi.push({
      id: `dt${Date.now()}_${index}`,
      transaksi_id: transaksi.id,
      produk_id: item.produk_id,
      qty: item.qty,
      harga_satuan: item.harga_satuan,
      subtotal: item.qty * item.harga_satuan
    });
  });

  return transaksi;
};

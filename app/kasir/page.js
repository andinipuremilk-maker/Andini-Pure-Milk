'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconMilk,
  IconCart,
  IconStore,
  IconUser,
  IconReceipt,
  IconClock,
  IconPlus,
  IconMinus,
  IconTrash,
  IconSearch,
  IconX,
  IconCheck,
  IconPause,
  IconCalendar,
  IconPrinter,
  IconLogOut,
  IconArrowRight,
  IconShield,
  IconBanknote,
  IconQrCode,
  IconCreditCard,
  IconEdit,
  IconAlertCircle,
  IconTag
} from '../../components/ui/icons';
import ReceiptModal from './ReceiptModal';

export default function KasirPage() {
  const router = useRouter();
  const [produk, setProduk] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [activeKategori, setActiveKategori] = useState(null);
  const [searchProduk, setSearchProduk] = useState('');

  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTx, setCompletedTx] = useState(null);

  const [metodeBayar, setMetodeBayar] = useState('tunai');
  const [seller, setSeller] = useState('Umum / Retail');
  const [customSeller, setCustomSeller] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [processing, setProcessing] = useState(false);

  // Diskon State
  const [diskonList, setDiskonList] = useState([]);
  const [selectedDiskonId, setSelectedDiskonId] = useState('');
  const [diskonNama, setDiskonNama] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [diskonTipe, setDiskonTipe] = useState('nominal'); // 'nominal' | 'persen'
  const [diskonNilai, setDiskonNilai] = useState(0);
  const [tempDiskonTipe, setTempDiskonTipe] = useState('nominal');
  const [tempDiskonNilai, setTempDiskonNilai] = useState('');
  const [discountError, setDiscountError] = useState('');

  // Pending State
  const [pendingCount, setPendingCount] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingNote, setPendingNote] = useState('');
  const [savingPending, setSavingPending] = useState(false);

  // Riwayat Pop-Up Modal State
  const [showRiwayatModal, setShowRiwayatModal] = useState(false);
  const [riwayatTab, setRiwayatTab] = useState('pending'); // 'pending' | 'selesai'
  const [riwayatList, setRiwayatList] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [searchRiwayat, setSearchRiwayat] = useState('');

  // Detail Pop-Up State (dengan Ubah Tanggal)
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);
  const [editTanggalInput, setEditTanggalInput] = useState('');
  const [savingTanggal, setSavingTanggal] = useState(false);
  const [tanggalSaveSuccess, setTanggalSaveSuccess] = useState(false);

  // Selesaikan Transaksi Pending Modal State (Edit Qty & Harga Satuan)
  const [editingTx, setEditingTx] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editSeller, setEditSeller] = useState('Umum / Retail');
  const [editMetode, setEditMetode] = useState('tunai');
  const [editDiskonId, setEditDiskonId] = useState('');
  const [editDiskonNama, setEditDiskonNama] = useState('');
  const [editDiskonTipe, setEditDiskonTipe] = useState('nominal');
  const [editDiskonNilai, setEditDiskonNilai] = useState(0);
  const [editBayar, setEditBayar] = useState(0);
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editProductToAdd, setEditProductToAdd] = useState('');
  const [completingPending, setCompletingPending] = useState(false);

  // Modal Konfirmasi Alert Pembatalan Transaksi Pending
  const [cancelConfirmTx, setCancelConfirmTx] = useState(null);
  const [cancellingTx, setCancellingTx] = useState(false);
  const [cancellationNotice, setCancellationNotice] = useState('');

  const [sellersList, setSellersList] = useState([
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
    'Lainnya (Kustom)'
  ]);
  const [boothsList, setBoothsList] = useState([]);
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [showQuickAddSeller, setShowQuickAddSeller] = useState(false);
  const [quickSellerName, setQuickSellerName] = useState('');
  const [savingQuickSeller, setSavingQuickSeller] = useState(false);
  const [quickSellerError, setQuickSellerError] = useState('');

  const handleQuickAddSeller = async () => {
    const trimmed = quickSellerName.trim();
    if (!trimmed) {
      setQuickSellerError('Nama mitra tidak boleh kosong.');
      return;
    }

    try {
      setSavingQuickSeller(true);
      setQuickSellerError('');
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: trimmed })
      });
      const result = await res.json();
      if (res.ok) {
        const newName = result.seller?.nama || trimmed;
        setSellersList(prev => {
          const withoutCustom = prev.filter(s => s !== 'Lainnya (Kustom)');
          if (!withoutCustom.includes(newName)) {
            withoutCustom.push(newName);
          }
          return [...withoutCustom, 'Lainnya (Kustom)'];
        });
        setSeller(newName);
        setShowQuickAddSeller(false);
        setQuickSellerName('');
      } else {
        setQuickSellerError(result.error || 'Gagal menambahkan mitra.');
      }
    } catch (err) {
      setQuickSellerError('Terjadi kesalahan jaringan.');
    } finally {
      setSavingQuickSeller(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const res = await fetch('/api/transaksi?status=pending&limit=100');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPendingCount(data.length);
      }
    } catch (e) {
      console.error('Error load pending count:', e);
    }
  };

  const loadRiwayat = async () => {
    try {
      setLoadingRiwayat(true);
      const res = await fetch('/api/transaksi?limit=100');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRiwayatList(data);
        const pendings = data.filter(t => t.status === 'pending');
        setPendingCount(pendings.length);
      }
    } catch (e) {
      console.error('Error load riwayat:', e);
    } finally {
      setLoadingRiwayat(false);
    }
  };

  const loadDiskonList = async () => {
    try {
      const res = await fetch('/api/diskon?active_only=true');
      const data = await res.json();
      if (data && Array.isArray(data.diskon)) {
        setDiskonList(data.diskon);
      }
    } catch (e) {
      console.error('Error load diskon list:', e);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Check auth (kasir & admin diperbolehkan)
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?role=kasir');
        return;
      }
      const user = JSON.parse(userStr);
      if (!user || (user.role !== 'kasir' && user.role !== 'admin')) {
        router.push('/login?role=kasir');
        return;
      }
      setCurrentUser(user);
    } catch (e) {
      router.push('/login?role=kasir');
      return;
    }

    Promise.all([
      fetch('/api/produk').then(r => r.json()),
      fetch('/api/kategori').then(r => r.json()),
      fetch('/api/sellers').then(r => r.json()).catch(() => ({})),
      fetch('/api/transaksi?status=pending&limit=100').then(r => r.json()).catch(() => []),
      fetch('/api/booth?active_only=true').then(r => r.json()).catch(() => []),
      fetch('/api/diskon?active_only=true').then(r => r.json()).catch(() => ({}))
    ]).then(([prodRes, katRes, sellerRes, pendingRes, boothRes, diskonRes]) => {
      setProduk(Array.isArray(prodRes) ? prodRes : []);
      setKategori(Array.isArray(katRes) ? katRes : []);
      if (diskonRes && Array.isArray(diskonRes.diskon)) {
        setDiskonList(diskonRes.diskon);
      }
      if (sellerRes && Array.isArray(sellerRes.sellers)) {
        const names = sellerRes.sellers.map(s => s.nama);
        if (!names.includes('Lainnya (Kustom)')) names.push('Lainnya (Kustom)');
        setSellersList(names);
      }
      if (Array.isArray(pendingRes)) {
        setPendingCount(pendingRes.length);
      }
      if (Array.isArray(boothRes) && boothRes.length > 0) {
        setBoothsList(boothRes);
      }
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    // Hapus cookie sesi di server
    fetch('/api/auth', { method: 'DELETE' }).catch(() => {});
    localStorage.removeItem('user');
    router.push('/login?role=kasir');
  };

  const getOrderItemKey = (item) => item.order_item_key || `${item.produk_id}__${item.nama}`;

  const hasPackagingOption = (prod) => {
    if (!prod) return false;
    return Boolean(
      prod.has_variants === true ||
      (Array.isArray(prod.variants) && prod.variants.length > 0)
    );
  };

  const addToOrder = (product, kemasan = null) => {
    const itemKey = kemasan ? `${product.id}__${kemasan}` : product.id;
    const itemNama = kemasan ? `${product.nama} (${kemasan})` : product.nama;
    const itemHarga = Number(product.harga_jual) || 0;

    setOrder(prev => {
      const existing = prev.find(item => getOrderItemKey(item) === itemKey);
      if (existing) {
        return prev.map(item =>
          getOrderItemKey(item) === itemKey
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        order_item_key: itemKey,
        produk_id: product.id,
        kemasan: kemasan || null,
        nama: itemNama,
        harga_satuan: itemHarga,
        qty: 1,
        image_url: product.image_url || null
      }];
    });
  };

  const updateQty = (item, delta) => {
    const targetKey = getOrderItemKey(item);
    setOrder(prev => prev.map(o => {
      if (getOrderItemKey(o) === targetKey) {
        const newQty = o.qty + delta;
        return { ...o, qty: newQty > 0 ? newQty : 1 };
      }
      return o;
    }));
  };

  const deleteItem = (item) => {
    const targetKey = getOrderItemKey(item);
    setOrder(prev => prev.filter(o => getOrderItemKey(o) !== targetKey));
  };

  const calculateDiskonNominal = (sub, tipe, nilai) => {
    const num = Math.max(0, Number(nilai) || 0);
    if (num <= 0 || sub <= 0) return 0;
    if (tipe === 'persen') {
      const pct = Math.min(100, num);
      return Math.round((sub * pct) / 100);
    }
    return Math.min(sub, num);
  };

  const subtotal = order.reduce((sum, item) => sum + (item.qty * item.harga_satuan), 0);
  const totalQty = order.reduce((sum, item) => sum + item.qty, 0);
  const diskonNominal = calculateDiskonNominal(subtotal, diskonTipe, diskonNilai);
  const total = Math.max(0, subtotal - diskonNominal);

  const handleSelectDiskon = (promoId) => {
    if (!promoId) {
      setSelectedDiskonId('');
      setDiskonNama('');
      setDiskonTipe('nominal');
      setDiskonNilai(0);
      return;
    }
    const promo = diskonList.find(d => d.id === promoId);
    if (promo) {
      setSelectedDiskonId(promo.id);
      setDiskonNama(promo.nama);
      setDiskonTipe(promo.tipe || 'nominal');
      setDiskonNilai(Number(promo.nilai) || 0);
    }
  };

  const handleSelectEditDiskon = (promoId) => {
    if (!promoId) {
      setEditDiskonId('');
      setEditDiskonNama('');
      setEditDiskonTipe('nominal');
      setEditDiskonNilai(0);
      return;
    }
    const promo = diskonList.find(d => d.id === promoId);
    if (promo) {
      const tipe = promo.tipe || 'nominal';
      const nilai = Number(promo.nilai) || 0;
      setEditDiskonId(promo.id);
      setEditDiskonNama(promo.nama);
      setEditDiskonTipe(tipe);
      setEditDiskonNilai(nilai);
    }
  };

  const openDiscountModal = () => {
    setTempDiskonTipe(diskonTipe);
    setTempDiskonNilai(diskonNilai > 0 ? String(diskonNilai) : '');
    setDiscountError('');
    setShowDiscountModal(true);
  };

  const applyDiscount = () => {
    const val = Number(tempDiskonNilai) || 0;
    if (val < 0) {
      setDiscountError('Nilai diskon tidak valid.');
      return;
    }
    if (tempDiskonTipe === 'persen' && val > 100) {
      setDiscountError('Diskon persentase maksimal 100%.');
      return;
    }
    if (tempDiskonTipe === 'nominal' && val > subtotal) {
      setDiscountError(`Diskon nominal tidak boleh melebihi subtotal (Rp ${subtotal.toLocaleString('id-ID')}).`);
      return;
    }
    setDiskonTipe(tempDiskonTipe);
    setDiskonNilai(val);
    setShowDiscountModal(false);
    setDiscountError('');
  };

  const removeDiscount = () => {
    setSelectedDiskonId('');
    setDiskonNama('');
    setDiskonTipe('nominal');
    setDiskonNilai(0);
    setShowDiscountModal(false);
    setDiscountError('');
  };

  const getEffectiveSeller = () => {
    if (seller === 'Lainnya (Kustom)') {
      return customSeller.trim() || 'Umum / Retail';
    }
    return seller;
  };

  // Pembayaran Langsung
  const handlePayment = async () => {
    // Booth wajib dipilih agar laporan penjualan per gerai akurat
    if (!currentUser?.booth) {
      alert('Pilih Booth Penjualan terlebih dahulu (menu di bagian atas layar).');
      return;
    }
    setProcessing(true);
    const user = currentUser || JSON.parse(localStorage.getItem('user')) || { id: 'u3', nama: 'Kasir Outlet Andini' };
    const effectiveSeller = getEffectiveSeller();
    const kasirNama = user.nama || user.username || 'Kasir Outlet Andini';
    const boothName = user.booth || 'Gerai Utama';

    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaksiData: {
            subtotal,
            diskon: diskonNominal,
            diskon_tipe: diskonTipe,
            diskon_nilai: diskonNilai,
            diskon_id: selectedDiskonId || null,
            diskon_nama: diskonNama || null,
            total,
            bayar: total,
            metode_bayar: metodeBayar,
            seller: effectiveSeller,
            keterangan: keterangan.trim(),
            kasir: kasirNama,
            booth: boothName,
            status: 'selesai'
          },
          detailItems: order,
          userId: user.id,
          kasirNama: kasirNama
        })
      });

      if (res.ok) {
        const txResult = await res.json();
        setCompletedTx({
          no_transaksi: txResult.no_transaksi || 'TRX-SUCCESS',
          tanggal: new Date().toISOString(),
          items: [...order],
          subtotal,
          diskon: diskonNominal,
          diskon_tipe: diskonTipe,
          diskon_nilai: diskonNilai,
          total,
          bayar: total,
          metode_bayar: metodeBayar,
          seller: effectiveSeller,
          keterangan: keterangan.trim(),
          kasir: kasirNama
        });
        setOrder([]);
        setSelectedDiskonId('');
        setDiskonNama('');
        setDiskonNilai(0);
        setKeterangan('');
        setShowPayment(false);
        setShowReceipt(true);
        loadPendingCount();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          alert('Sesi login berakhir. Silakan login kembali.');
          router.push('/login?role=kasir');
          return;
        }
        alert(errData.error || 'Gagal memproses transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setProcessing(false);
    }
  };

  // Simpan Transaksi sebagai Pending (Tahan Pesanan)
  const handleSavePending = async () => {
    // Booth wajib dipilih agar laporan penjualan per gerai akurat
    if (!currentUser?.booth) {
      alert('Pilih Booth Penjualan terlebih dahulu (menu di bagian atas layar).');
      return;
    }
    if (order.length === 0) return;
    setSavingPending(true);
    const user = currentUser || JSON.parse(localStorage.getItem('user')) || { id: 'u3', nama: 'Kasir Outlet Andini' };
    const effectiveSeller = getEffectiveSeller();
    const kasirNama = user.nama || user.username || 'Kasir Outlet Andini';
    const boothName = user.booth || 'Gerai Utama';

    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaksiData: {
            subtotal,
            diskon: diskonNominal,
            diskon_tipe: diskonTipe,
            diskon_nilai: diskonNilai,
            diskon_id: selectedDiskonId || null,
            diskon_nama: diskonNama || null,
            total,
            bayar: 0,
            metode_bayar: 'tunai',
            seller: effectiveSeller,
            keterangan: (pendingNote || keterangan || 'Pesanan Tertahan (Pending)').trim(),
            kasir: kasirNama,
            booth: boothName,
            status: 'pending'
          },
          detailItems: order,
          userId: user.id,
          kasirNama: kasirNama
        })
      });

      if (res.ok) {
        setOrder([]);
        setSelectedDiskonId('');
        setDiskonNama('');
        setDiskonNilai(0);
        setKeterangan('');
        setPendingNote('');
        setShowPendingModal(false);
        await loadPendingCount();
        alert('Pesanan berhasil ditahan dengan status PENDING. Anda dapat menyelesaikannya dari menu Riwayat Transaksi.');
      } else {
        alert('Gagal menyimpan transaksi pending.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menyimpan pending.');
    } finally {
      setSavingPending(false);
    }
  };

  // Buka Pop-Up Detail Transaksi
  const handleOpenDetail = (tx) => {
    setSelectedDetailTx(tx);
    setTanggalSaveSuccess(false);
    try {
      const d = new Date(tx.tanggal);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
      setEditTanggalInput(localISOTime);
    } catch (e) {
      setEditTanggalInput('');
    }
  };

  // Simpan Perubahan Tanggal Transaksi di Pop-Up Detail
  const handleSaveTanggal = async () => {
    if (!selectedDetailTx || !editTanggalInput) return;
    try {
      setSavingTanggal(true);
      setTanggalSaveSuccess(false);
      const targetIso = new Date(editTanggalInput).toISOString();
      const res = await fetch('/api/transaksi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDetailTx.id,
          tanggal: targetIso
        })
      });

      if (res.ok) {
        setSelectedDetailTx(prev => ({ ...prev, tanggal: targetIso }));
        setRiwayatList(prev => prev.map(t => t.id === selectedDetailTx.id ? { ...t, tanggal: targetIso } : t));
        setTanggalSaveSuccess(true);
        setTimeout(() => setTanggalSaveSuccess(false), 3500);
      } else {
        alert('Gagal mengubah tanggal transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan saat update tanggal.');
    } finally {
      setSavingTanggal(false);
    }
  };

  // Buka Modal Edit & Selesaikan Transaksi Pending
  const handleStartCompletePending = (tx) => {
    setEditingTx(tx);
    const initialItems = (tx.items || []).map(it => ({
      produk_id: it.produk_id,
      nama: it.nama_produk || it.nama || 'Produk',
      qty: it.qty || 1,
      harga_satuan: it.harga_satuan || 0
    }));
    setEditItems(initialItems);
    setEditSeller(tx.seller || 'Umum / Retail');
    setEditMetode(tx.metode_bayar || 'tunai');
    setEditKeterangan(tx.keterangan || '');
    setEditDiskonId(tx.diskon_id || '');
    setEditDiskonNama(tx.diskon_nama || '');
    setEditDiskonTipe(tx.diskon_tipe || 'nominal');
    setEditDiskonNilai(Number(tx.diskon_nilai) || 0);
    const initialSubtotal = initialItems.reduce((sum, it) => sum + (it.qty * it.harga_satuan), 0);
    const initialDiskon = calculateDiskonNominal(initialSubtotal, tx.diskon_tipe || 'nominal', Number(tx.diskon_nilai) || 0);
    const initialTotal = Math.max(0, initialSubtotal - initialDiskon);
    setEditBayar(initialTotal);
    setEditProductToAdd('');
  };

  // Pengaturan Item saat Selesaikan Transaksi Pending
  const updateEditItemQty = (index, delta) => {
    setEditItems(prev => prev.map((it, i) => {
      if (i === index) {
        const newQty = Math.max(1, it.qty + delta);
        return { ...it, qty: newQty };
      }
      return it;
    }));
  };

  const updateEditItemPrice = (index, newPrice) => {
    const val = Math.max(0, parseInt(newPrice) || 0);
    setEditItems(prev => prev.map((it, i) => i === index ? { ...it, harga_satuan: val } : it));
  };

  const removeEditItem = (index) => {
    if (editItems.length <= 1) {
      alert('Transaksi harus memiliki minimal 1 produk.');
      return;
    }
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProductToEdit = () => {
    if (!editProductToAdd) return;
    const prod = produk.find(p => p.id === editProductToAdd);
    if (!prod) return;
    const existingIdx = editItems.findIndex(it => it.produk_id === prod.id);
    if (existingIdx >= 0) {
      updateEditItemQty(existingIdx, 1);
    } else {
      setEditItems(prev => [...prev, {
        produk_id: prod.id,
        nama: prod.nama,
        qty: 1,
        harga_satuan: prod.harga_jual
      }]);
    }
    setEditProductToAdd('');
  };

  const editSubtotal = editItems.reduce((sum, it) => sum + (it.qty * it.harga_satuan), 0);
  const editDiskonNominal = calculateDiskonNominal(editSubtotal, editDiskonTipe, editDiskonNilai);
  const editTotal = Math.max(0, editSubtotal - editDiskonNominal);

  // Selesaikan Transaksi Pending & Potong Stok
  const handleFinishCompletePending = async () => {
    if (!editingTx || editItems.length === 0) return;
    setCompletingPending(true);
    const user = currentUser || JSON.parse(localStorage.getItem('user')) || { id: 'u3', nama: 'Kasir Outlet Andini' };
    const kasirNama = user.nama || user.username || editingTx.kasir || 'Kasir Outlet Andini';
    const finalBayar = Number(editBayar) || editTotal;

    try {
      const res = await fetch('/api/transaksi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTx.id,
          detailItems: editItems,
          transaksiData: {
            subtotal: editSubtotal,
            diskon: editDiskonNominal,
            diskon_tipe: editDiskonTipe,
            diskon_nilai: editDiskonNilai,
            diskon_id: editDiskonId || null,
            diskon_nama: editDiskonNama || null,
            total: editTotal,
            bayar: finalBayar,
            metode_bayar: editMetode,
            seller: editSeller,
            keterangan: editKeterangan.trim(),
            kasir: kasirNama,
            status: 'selesai'
          },
          status: 'selesai'
        })
      });

      if (res.ok) {
        setCompletedTx({
          no_transaksi: editingTx.no_transaksi,
          tanggal: editingTx.tanggal || new Date().toISOString(),
          items: editItems.map(it => ({
            ...it,
            subtotal: it.qty * it.harga_satuan
          })),
          subtotal: editSubtotal,
          diskon: editDiskonNominal,
          diskon_tipe: editDiskonTipe,
          diskon_nilai: editDiskonNilai,
          total: editTotal,
          bayar: finalBayar,
          kembalian: Math.max(0, finalBayar - editTotal),
          metode_bayar: editMetode,
          seller: editSeller,
          keterangan: editKeterangan.trim(),
          kasir: kasirNama
        });

        setEditingTx(null);
        setShowRiwayatModal(false);
        if (selectedDetailTx) setSelectedDetailTx(null);
        setShowReceipt(true);
        loadPendingCount();
        loadRiwayat();
      } else {
        alert('Gagal menyelesaikan transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan saat menyelesaikan transaksi.');
    } finally {
      setCompletingPending(false);
    }
  };

  // Eksekusi Pembatalan / Hapus Transaksi Pending dari Modal Alert
  const handleConfirmDeletePending = async () => {
    if (!cancelConfirmTx) return;
    try {
      setCancellingTx(true);
      const res = await fetch(`/api/transaksi?id=${cancelConfirmTx.id}`, { method: 'DELETE' });
      if (res.ok) {
        const deletedNo = cancelConfirmTx.no_transaksi;
        setRiwayatList(prev => prev.filter(t => t.id !== cancelConfirmTx.id));
        if (selectedDetailTx?.id === cancelConfirmTx.id) setSelectedDetailTx(null);
        setCancelConfirmTx(null);
        loadPendingCount();
        setCancellationNotice(`Transaksi ${deletedNo} berhasil dibatalkan dan dihapus dari sistem.`);
        setTimeout(() => setCancellationNotice(''), 4000);
      } else {
        alert('Gagal membatalkan transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan saat membatalkan transaksi.');
    } finally {
      setCancellingTx(false);
    }
  };

  const filteredProduk = produk.filter(p => {
    const matchesCat = !activeKategori || p.kategori_id === activeKategori;
    const matchesSearch = !searchProduk || p.nama.toLowerCase().includes(searchProduk.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryName = (catId) => {
    const cat = kategori.find(k => k.id === catId);
    return cat ? cat.nama : 'Umum';
  };

  const [mobileTab, setMobileTab] = useState('menu'); // 'menu' | 'cart'

  // Filter untuk pop-up riwayat transaksi
  const pendingTransactions = riwayatList.filter(t => t.status === 'pending');
  const completedTransactions = riwayatList.filter(t => t.status === 'selesai');
  const displayedRiwayat = (riwayatTab === 'pending' ? pendingTransactions : completedTransactions).filter(t => {
    if (!searchRiwayat.trim()) return true;
    const q = searchRiwayat.toLowerCase();
    const matchNo = t.no_transaksi?.toLowerCase().includes(q);
    const matchSeller = t.seller?.toLowerCase().includes(q);
    const matchKet = t.keterangan?.toLowerCase().includes(q);
    const matchItem = t.items?.some(it => it.nama_produk?.toLowerCase().includes(q));
    return matchNo || matchSeller || matchKet || matchItem;
  });

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg-light)', fontWeight: 800 }}>
      MEMUAT POS KASIR...
    </div>
  );

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-light)', position: 'relative' }}>

      {/* Header POS Kasir */}
      <header className="kasir-header" style={{
        padding: '0.65rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--surface-panel)',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div className="kasir-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconMilk size={18} />
          </div>
          <div>
            <h1 style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              margin: 0,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}>
              Terminal Kasir
            </h1>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Andini Pure Milk
            </span>
          </div>
        </div>

        {/* Action Toolbar Header */}
        <div className="kasir-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

          {/* Tombol Pop-up Riwayat Transaksi */}
          <button
            type="button"
            onClick={() => { setShowRiwayatModal(true); loadRiwayat(); }}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              gap: '0.4rem',
              backgroundColor: pendingCount > 0 ? 'var(--status-warning-bg)' : 'var(--surface-panel)',
              borderColor: pendingCount > 0 ? 'var(--status-warning-border)' : 'var(--border-subtle)',
              color: pendingCount > 0 ? 'var(--status-warning)' : 'var(--text-primary)'
            }}
          >
            <IconReceipt size={14} />
            <span className="kasir-btn-label">Riwayat Transaksi</span>
            {pendingCount > 0 && (
              <span style={{
                backgroundColor: 'var(--status-warning)',
                color: '#ffffff',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                <IconClock size={10} />
                <span>{pendingCount}</span>
              </span>
            )}
          </button>

          {/* Shortcut ke Panel Admin jika User ber-role Admin */}
          {mounted && currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => router.push('/admin/transaksi/pemasukan')}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                gap: '0.35rem'
              }}
            >
              <IconShield size={14} />
              <span className="kasir-btn-label">Panel Admin</span>
            </button>
          )}

          {/* Tombol Kelola Diskon (Hanya muncul jika user role admin) */}
          {mounted && currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => router.push('/admin/diskon')}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--terracotta)',
                gap: '0.35rem'
              }}
              title="Kelola Diskon & Promo Penjualan (Khusus Admin)"
            >
              <IconTag size={14} />
              <span className="kasir-btn-label">Kelola Diskon</span>
            </button>
          )}

          {/* Dropdown Booth Penjualan Kasir di Header */}
          <div className="kasir-booth-select" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem 0.55rem'
          }}>
            <IconStore size={14} style={{ color: 'var(--accent-primary)' }} />
            <select
              suppressHydrationWarning
              value={mounted && currentUser?.booth ? currentUser.booth : ''}
              onChange={(e) => {
                const newBooth = e.target.value;
                const updatedUser = { ...(currentUser || {}), booth: newBooth };
                setCurrentUser(updatedUser);
                try {
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (err) { }
              }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '220px'
              }}
            >
              <option value="">-- Pilih Booth Penjualan --</option>
              {boothsList.length > 0 ? (
                boothsList.map(b => (
                  <option key={b.id || b.nama} value={b.nama}>{b.nama}</option>
                ))
              ) : (
                <>
                  <option value="Booth 1 - Gerai Utama (Pusat)">Booth 1 - Gerai Utama (Pusat)</option>
                  <option value="Booth 2 - Alun-Alun Kota">Booth 2 - Alun-Alun Kota</option>
                  <option value="Booth 3 - Pantai Boom">Booth 3 - Pantai Boom</option>
                  <option value="Booth 4 - Kampus & Sekolah">Booth 4 - Kampus & Sekolah</option>
                  <option value="Booth 5 - RTH Maron Genteng">Booth 5 - RTH Maron Genteng</option>
                  <option value="Booth Event / Bazar Keliling">Booth Event / Bazar Keliling</option>
                </>
              )}
            </select>
          </div>

          <span className="badge-neutral kasir-user-badge" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} suppressHydrationWarning>
            <IconUser size={13} />
            <span>{mounted && currentUser?.nama ? currentUser.nama : 'Kasir'}</span>
          </span>

          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
            title="Keluar / Ganti Akun"
          >
            <IconLogOut size={13} />
            <span className="kasir-btn-label">Keluar</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="kasir-mobile-tabs" style={{ display: 'none', backgroundColor: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '0.5rem 0.75rem', gap: '0.5rem' }}>
        <button
          onClick={() => setMobileTab('menu')}
          style={{
            flex: 1,
            padding: '0.65rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.8125rem',
            backgroundColor: mobileTab === 'menu' ? 'var(--surface-panel)' : 'transparent',
            color: mobileTab === 'menu' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: mobileTab === 'menu' ? '1px solid var(--border-subtle)' : '1px solid transparent',
            boxShadow: mobileTab === 'menu' ? 'var(--shadow-xs)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <IconMilk size={15} />
          <span>Menu Produk ({filteredProduk.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          style={{
            flex: 1,
            padding: '0.65rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.8125rem',
            backgroundColor: mobileTab === 'cart' ? 'var(--surface-panel)' : 'transparent',
            color: mobileTab === 'cart' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: mobileTab === 'cart' ? '1px solid var(--border-subtle)' : '1px solid transparent',
            boxShadow: mobileTab === 'cart' ? 'var(--shadow-xs)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            position: 'relative'
          }}
        >
          <IconCart size={15} />
          <span>Keranjang {totalQty > 0 ? `(${totalQty})` : ''}</span>
        </button>
      </div>

      {/* Main Layout */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Left Side: Product Selection & Filters */}
        <section
          className={`kasir-menu-section ${mobileTab === 'menu' ? 'active-mobile' : ''}`}
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-canvas)', borderRight: '1px solid var(--border-subtle)', overflow: 'hidden' }}
        >
          {/* Search & Category Filter Toolbar */}
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-panel)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Cari menu produk atau kategori..."
                value={searchProduk}
                onChange={e => setSearchProduk(e.target.value)}
                style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
              />
              <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
                <IconSearch size={15} />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="no-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '0.35rem', paddingBottom: '0.1rem', WebkitOverflowScrolling: 'touch' }}>
              <button
                onClick={() => setActiveKategori(null)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: activeKategori === null ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  backgroundColor: activeKategori === null ? 'var(--accent-primary)' : 'var(--surface-panel)',
                  color: activeKategori === null ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                Semua Menu
              </button>
              {kategori.map(k => {
                const isActive = activeKategori === k.id;
                return (
                  <button
                    key={k.id}
                    onClick={() => setActiveKategori(k.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--surface-panel)',
                      color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {k.nama}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          <div className="kasir-product-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', paddingBottom: '5rem' }}>
            <div className="kasir-product-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '0.85rem'
            }}>
              {filteredProduk.map(p => {
                const hasPackaging = hasPackagingOption(p);
                const inCartItems = order.filter(item => item.produk_id === p.id);
                const inCartQty = inCartItems.reduce((sum, item) => sum + item.qty, 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (hasPackaging) {
                        setVariantModalProduct(p);
                      } else {
                        addToOrder(p);
                      }
                    }}
                    className="card"
                    style={{
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: inCartQty > 0 ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      position: 'relative',
                      backgroundColor: inCartQty > 0 ? 'var(--accent-subtle)' : 'var(--surface-panel)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      transition: 'border-color 0.12s ease, transform 0.05s ease, box-shadow 0.12s ease',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    {/* Foto Produk */}
                    <div className="kasir-product-photo" style={{
                      position: 'relative',
                      width: '100%',
                      height: '115px',
                      backgroundColor: 'var(--surface-subtle)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.nama}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-tertiary)'
                        }}>
                          <IconMilk size={26} />
                        </div>
                      )}

                      {inCartQty > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '0.45rem',
                          right: '0.45rem',
                          backgroundColor: 'var(--accent-primary)',
                          color: 'var(--text-inverse)',
                          borderRadius: 'var(--radius-full)',
                          minWidth: '22px',
                          height: '22px',
                          padding: '0 0.35rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 2
                        }}>
                          {inCartQty}
                        </span>
                      )}
                    </div>

                    {/* Informasi Produk */}
                    <div style={{
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flex: 1,
                      gap: '0.5rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {getCategoryName(p.kategori_id)}
                          </span>
                          {hasPackaging && (
                            <span className="badge-neutral kasir-variant-badge" style={{ fontSize: '0.625rem', padding: '0.08rem 0.35rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                              Botol Kecil / Besar
                            </span>
                          )}
                        </div>
                        <h3 style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          margin: '0.15rem 0 0 0',
                          lineHeight: 1.35,
                          color: 'var(--text-primary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {p.nama}
                        </h3>
                      </div>

                      <div>
                        <div className="tabular" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          Rp {p.harga_jual.toLocaleString('id-ID')}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: (p.stok ?? 100) > 10 ? 'var(--text-tertiary)' : 'var(--status-warning)', marginTop: '0.15rem' }}>
                          Stok: <span className="tabular">{p.stok ?? 100}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Keranjang Melayang (khusus HP, tampil saat ada item) */}
          {totalQty > 0 && (
            <button
              type="button"
              className="kasir-floating-cart safe-bottom"
              onClick={() => setMobileTab('cart')}
              style={{
                display: 'none',
                position: 'absolute',
                left: '0.75rem',
                right: '0.75rem',
                bottom: '0.75rem',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 20,
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCart size={16} />
                <span>{totalQty} item</span>
              </span>
              <span className="tabular" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Rp {total.toLocaleString('id-ID')}
                <IconArrowRight size={15} />
              </span>
            </button>
          )}
        </section>

        {/* Right Side: Order Summary Cart */}
        <section
          className={`kasir-cart-section ${mobileTab === 'cart' ? 'active-mobile' : ''}`}
          style={{ width: '380px', minWidth: '320px', maxWidth: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-panel)', borderLeft: '1px solid var(--border-subtle)' }}
        >
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setMobileTab('menu')}
                className="kasir-back-to-menu-btn"
                style={{ display: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
              >
                &larr; Menu
              </button>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Pesanan Berjalan
              </h2>
            </div>

            {order.length > 0 && (
              <button
                onClick={() => setOrder([])}
                style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-danger)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <IconTrash size={13} />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
            {order.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <IconCart size={24} />
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Keranjang Kosong</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, maxWidth: '240px' }}>
                  Pilih produk dari menu di sebelah kiri untuk menambahkan ke pesanan
                </p>
                <button
                  onClick={() => setMobileTab('menu')}
                  className="btn-secondary"
                  style={{ marginTop: '0.75rem', padding: '0.5rem 0.85rem', fontSize: '0.75rem' }}
                >
                  Pilih Menu
                </button>
              </div>
            ) : (
              order.map(item => (
                <div key={getOrderItemKey(item)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border-subtle)', gap: '0.65rem' }}>
                  {/* Thumbnail Mini */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.nama}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <IconMilk size={16} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.35rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nama}</h4>
                    <p className="tabular" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.1rem 0 0 0' }}>
                      Rp {item.harga_satuan.toLocaleString('id-ID')} &times; {item.qty} = <strong style={{ color: 'var(--text-primary)' }}>Rp {(item.qty * item.harga_satuan).toLocaleString('id-ID')}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      onClick={() => updateQty(item, -1)}
                      style={{ width: '28px', height: '28px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Kurangi kuantitas"
                    >
                      <IconMinus size={12} />
                    </button>
                    <span className="tabular" style={{ width: '24px', textAlign: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item, 1)}
                      style={{ width: '28px', height: '28px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Tambah kuantitas"
                    >
                      <IconPlus size={12} />
                    </button>
                    <button
                      onClick={() => deleteItem(item)}
                      style={{ width: '28px', height: '28px', border: '1px solid var(--border-subtle)', color: 'var(--status-danger)', borderRadius: 'var(--radius-sm)', marginLeft: '0.25rem', cursor: 'pointer', backgroundColor: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Hapus dari keranjang"
                    >
                      <IconTrash size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '1rem 1.25rem max(1rem, env(safe-area-inset-bottom, 1rem)) 1.25rem', backgroundColor: 'var(--surface-canvas)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Kuantitas</span>
              <span className="tabular" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{totalQty} item</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Subtotal Produk</span>
              <span className="tabular" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>

            {/* Diskon Transaksi Row */}
            {diskonNominal > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', backgroundColor: 'var(--terracotta-subtle)', padding: '0.35rem 0.55rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--terracotta-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta)', minWidth: 0 }}>
                  <IconTag size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }} title={diskonNama || 'Diskon'}>
                    {diskonNama || `Diskon ${diskonTipe === 'persen' ? `(${diskonNilai}%)` : ''}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <span className="tabular" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--terracotta)' }}>
                    - Rp {diskonNominal.toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    title="Hapus promo ini"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <IconX size={13} />
                  </button>
                </div>
              </div>
            ) : (
              order.length > 0 && diskonList.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <select
                    value={selectedDiskonId}
                    onChange={(e) => handleSelectDiskon(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--border-subtle)',
                      backgroundColor: 'var(--surface-sunken)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">🏷️ Gunakan Promo / Diskon...</option>
                    {diskonList.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nama} ({d.tipe === 'persen' ? `${d.nilai}%` : `Rp ${Number(d.nilai).toLocaleString('id-ID')}`})
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Pembayaran</span>
              <span className="tabular" style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--surface-panel)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
                disabled={order.length === 0 || processing || savingPending}
                onClick={() => { setPendingNote(''); setShowPendingModal(true); }}
              >
                <IconPause size={14} />
                <span>Tahan (Hold)</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1.6, padding: '0.75rem', fontSize: '0.8125rem', justifyContent: 'center' }}
                disabled={order.length === 0 || processing || savingPending}
                onClick={() => setShowPayment(true)}
              >
                <span>Proses Bayar</span>
                <IconArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @media (max-width: 960px) {
          .kasir-mobile-tabs {
            display: flex !important;
          }
          .kasir-menu-section {
            display: none !important;
            border-right: none !important;
          }
          .kasir-menu-section.active-mobile {
            display: flex !important;
            flex: 1 !important;
            min-width: 100% !important;
          }
          .kasir-cart-section {
            display: none !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            border-left: none !important;
          }
          .kasir-cart-section.active-mobile {
            display: flex !important;
            flex: 1 !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .kasir-back-to-menu-btn {
            display: inline-block !important;
          }
          .kasir-floating-cart {
            display: flex !important;
          }
        }

        /* Layout kasir khusus layar HP */
        @media (max-width: 640px) {
          .kasir-header {
            padding: 0.5rem 0.75rem !important;
            gap: 0.5rem !important;
          }
          .kasir-header-brand {
            flex: 1;
          }
          .kasir-header-actions {
            display: contents !important;
          }
          .kasir-btn-label,
          .kasir-user-badge {
            display: none !important;
          }
          .kasir-header-actions > button {
            min-height: 38px;
            min-width: 38px;
            padding: 0.45rem 0.6rem !important;
          }
          .kasir-booth-select {
            order: 10;
            flex: 1 1 100%;
            padding: 0.2rem 0.55rem !important;
          }
          .kasir-booth-select select {
            flex: 1;
            max-width: none !important;
            width: 100%;
          }
          .kasir-product-scroll {
            padding: 0.75rem !important;
            padding-bottom: 6rem !important;
          }
          .kasir-product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.6rem !important;
          }
          .kasir-product-photo {
            height: 96px !important;
          }
          .kasir-variant-badge {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. MODAL KONFIRMASI PENDING / TAHAN PESANAN                                */}
      {/* ========================================================================= */}
      {showPendingModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-warning-bg)',
                  color: 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconPause size={16} />
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Tahan Pesanan (Hold Order)
                </h2>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                style={{ color: 'var(--text-tertiary)', padding: '0.25rem', display: 'flex' }}
                aria-label="Tutup"
              >
                <IconX size={18} />
              </button>
            </div>

            <div style={{
              backgroundColor: 'var(--status-warning-bg)',
              border: '1px solid var(--status-warning-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <IconClock size={16} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--status-warning)', lineHeight: 1.45 }}>
                Pesanan ini disimpan dengan status <strong>Pending</strong>. Stok gerai belum berkurang sampai transaksi diselesaikan dan dibayar.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Ringkasan Pesanan:
              </span>
              <div style={{ backgroundColor: 'var(--surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>{totalQty} Produk Dipilih</span>
                  <span className="tabular" style={{ color: 'var(--accent-primary)' }}>Rp {total.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                  {order.map(o => `${o.nama} (${o.qty}x)`).join(', ')}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Mitra / Seller:
              </label>
              <select
                className="input-field"
                value={seller}
                onChange={e => setSeller(e.target.value)}
              >
                {sellersList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Catatan / Pengingat (No. Meja / Nama Pelanggan):
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Meja 4 / Ambil dompet di parkiran / Tunggu teman..."
                value={pendingNote}
                onChange={e => setPendingNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPendingModal(false)}
                disabled={savingPending}
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSavePending}
                disabled={savingPending}
                style={{ flex: 1.5, backgroundColor: 'var(--status-warning)', borderColor: 'var(--status-warning)' }}
              >
                <IconPause size={14} />
                <span>{savingPending ? 'Menyimpan...' : 'Simpan Pending'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL POP-UP RIWAYAT TRANSAKSI KASIR                                   */}
      {/* ========================================================================= */}
      {showRiwayatModal && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '860px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>

            {/* Header Pop-up Riwayat */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconReceipt size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Riwayat Transaksi Kasir
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                    Kelola pesanan tertahan (pending) dan pantau penjualan yang telah diselesaikan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRiwayatModal(false)}
                style={{ color: 'var(--text-tertiary)', padding: '0.25rem', display: 'flex' }}
                aria-label="Tutup"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Alert Banner Pembatalan / Notifikasi */}
            {cancellationNotice && (
              <div style={{
                marginBottom: '0.85rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                color: 'var(--status-success)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <IconCheck size={16} />
                <span>{cancellationNotice}</span>
              </div>
            )}

            {/* Filter Tabs & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setRiwayatTab('pending')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    border: '1px solid',
                    borderColor: riwayatTab === 'pending' ? 'var(--status-warning-border)' : 'var(--border-subtle)',
                    backgroundColor: riwayatTab === 'pending' ? 'var(--status-warning-bg)' : 'var(--surface-panel)',
                    color: riwayatTab === 'pending' ? 'var(--status-warning)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <IconClock size={14} />
                  <span>Transaksi Pending</span>
                  <span style={{
                    backgroundColor: riwayatTab === 'pending' ? 'var(--status-warning)' : 'var(--surface-subtle)',
                    color: riwayatTab === 'pending' ? '#ffffff' : 'var(--text-secondary)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.6875rem',
                    fontWeight: 700
                  }}>
                    {pendingTransactions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRiwayatTab('selesai')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    border: '1px solid',
                    borderColor: riwayatTab === 'selesai' ? 'var(--status-success-border)' : 'var(--border-subtle)',
                    backgroundColor: riwayatTab === 'selesai' ? 'var(--status-success-bg)' : 'var(--surface-panel)',
                    color: riwayatTab === 'selesai' ? 'var(--status-success)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <IconCheck size={14} />
                  <span>Transaksi Selesai</span>
                  <span style={{
                    backgroundColor: riwayatTab === 'selesai' ? 'var(--status-success)' : 'var(--surface-subtle)',
                    color: riwayatTab === 'selesai' ? '#ffffff' : 'var(--text-secondary)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.6875rem',
                    fontWeight: 700
                  }}>
                    {completedTransactions.length}
                  </span>
                </button>
              </div>

              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cari nomor transaksi, mitra, atau catatan..."
                  value={searchRiwayat}
                  onChange={e => setSearchRiwayat(e.target.value)}
                  style={{ paddingLeft: '2rem', fontSize: '0.8125rem' }}
                />
                <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
                  <IconSearch size={14} />
                </div>
              </div>
            </div>

            {/* List Transaksi */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-subtle)' }}>
              {loadingRiwayat ? (
                <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Memuat data riwayat transaksi...
                </div>
              ) : displayedRiwayat.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-panel)',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconReceipt size={20} />
                  </div>
                  <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                    {riwayatTab === 'pending' ? 'Tidak ada transaksi pending saat ini.' : 'Belum ada riwayat transaksi selesai.'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                    {riwayatTab === 'pending' ? 'Pesanan yang ditahan dari kasir akan muncul di sini.' : 'Transaksi yang berhasil dibayar akan terekam otomatis.'}
                  </p>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {displayedRiwayat.map(tx => {
                    const dt = new Date(tx.tanggal);
                    const formattedDate = `${dt.toLocaleDateString('id-ID')} ${dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                    const isPending = tx.status === 'pending';

                    return (
                      <div
                        key={tx.id}
                        style={{
                          backgroundColor: 'var(--surface-panel)',
                          border: '1px solid',
                          borderColor: isPending ? 'var(--status-warning-border)' : 'var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                      >
                        {/* Baris Atas: Header Transaksi */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.8125rem', backgroundColor: 'var(--surface-subtle)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                                {tx.no_transaksi}
                              </span>
                              <span className={isPending ? 'badge-warning' : 'badge-success'}>
                                {isPending ? <IconClock size={11} /> : <IconCheck size={11} />}
                                <span>{isPending ? 'Pending' : 'Selesai'}</span>
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {formattedDate} &bull; Kasir: <strong>{tx.kasir || 'Kasir Gerai'}</strong> &bull; Mitra: <strong>{tx.seller || 'Umum'}</strong>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div className="tabular" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                              Rp {tx.total?.toLocaleString('id-ID')}
                            </div>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                              Metode: {tx.metode_bayar || 'Tunai'}
                            </span>
                          </div>
                        </div>

                        {/* Catatan / Keterangan bila ada */}
                        {tx.keterangan && (
                          <div style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface-subtle)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-xs)', borderLeft: '3px solid var(--status-warning)', color: 'var(--text-primary)' }}>
                            <strong>Catatan:</strong> {tx.keterangan}
                          </div>
                        )}

                        {/* Items Preview */}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {(tx.items || []).map((it, i) => (
                            <span key={i} style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-xs)' }}>
                              {it.nama_produk || it.nama} <strong style={{ color: 'var(--text-primary)' }}>({it.qty}x)</strong>
                            </span>
                          ))}
                        </div>

                        {/* Baris Tombol Aksi */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                          {/* Tombol Detail & Ubah Tanggal */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(tx)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <IconSearch size={13} />
                            <span>Detail & Tanggal</span>
                          </button>

                          {/* Tombol Khusus Transaksi Pending */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setCancelConfirmTx(tx)}
                                className="btn-danger"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              >
                                <IconTrash size={13} />
                                <span>Batalkan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartCompletePending(tx)}
                                className="btn-primary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                              >
                                <IconEdit size={13} />
                                <span>Selesaikan & Bayar</span>
                              </button>
                            </>
                          )}

                          {/* Tombol Khusus Transaksi Selesai */}
                          {!isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                setCompletedTx(tx);
                                setShowReceipt(true);
                              }}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              <IconPrinter size={13} />
                              <span>Cetak Struk</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Modal Riwayat */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setShowRiwayatModal(false)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL POP-UP DETAIL TRANSAKSI & FITUR UBAH TANGGAL                     */}
      {/* ========================================================================= */}
      {selectedDetailTx && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div className="modal-content" style={{ maxWidth: '620px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <IconReceipt size={18} color="var(--terracotta)" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Detail Transaksi</h2>
                </div>
                <span className="tabular" style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {selectedDetailTx.no_transaksi}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailTx(null)}
                className="btn-ghost"
                style={{ width: '32px', height: '32px', padding: 0 }}
                aria-label="Tutup"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Info Status & Kasir */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: 'var(--surface-sunken)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className={selectedDetailTx.status === 'pending' ? 'badge-warning' : 'badge-success'}>
                    {selectedDetailTx.status === 'pending' ? (
                      <><IconClock size={11} /> Pending</>
                    ) : (
                      <><IconCheck size={11} /> Selesai</>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kasir / PJ</span>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                  <IconUser size={13} color="var(--text-muted)" />
                  {selectedDetailTx.kasir || 'Kasir Gerai'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mitra / Pelanggan</span>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                  <IconStore size={13} color="var(--text-muted)" />
                  {selectedDetailTx.seller || 'Umum'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Metode</span>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                  <IconCreditCard size={13} color="var(--text-muted)" />
                  {selectedDetailTx.metode_bayar || 'Tunai'}
                </span>
              </div>
            </div>

            {/* FITUR UBAH TANGGAL TRANSAKSI */}
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <IconCalendar size={14} color="var(--terracotta)" />
                  Ubah Waktu & Tanggal Transaksi
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Tercatat: {new Date(selectedDetailTx.tanggal).toLocaleString('id-ID')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={editTanggalInput}
                  onChange={e => setEditTanggalInput(e.target.value)}
                  style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.8125rem', backgroundColor: 'var(--surface-card)' }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveTanggal}
                  disabled={savingTanggal || !editTanggalInput}
                  style={{ padding: '0.5rem 0.95rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  <IconCheck size={13} />
                  {savingTanggal ? 'Menyimpan...' : 'Simpan Tanggal'}
                </button>
              </div>

              {tanggalSaveSuccess && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <IconCheck size={13} /> Tanggal transaksi berhasil diperbarui.
                </div>
              )}
            </div>

            {/* Rincian Produk Item */}
            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rincian Produk
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>PRODUK</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 600, width: '60px' }}>QTY</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 600, width: '110px' }}>HARGA</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 600, width: '120px' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedDetailTx.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>{it.nama_produk || it.nama}</td>
                      <td className="tabular" style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>{it.qty}</td>
                      <td className="tabular" style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        Rp {it.harga_satuan?.toLocaleString('id-ID')}
                      </td>
                      <td className="tabular" style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>
                        Rp {((it.subtotal !== undefined ? it.subtotal : (it.qty * it.harga_satuan)) || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {selectedDetailTx.diskon > 0 && (
                    <>
                      <tr style={{ backgroundColor: 'var(--surface-sunken)', fontWeight: 600 }}>
                        <td colSpan="3" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtotal:</td>
                        <td className="tabular" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Rp {(selectedDetailTx.subtotal || (selectedDetailTx.total + selectedDetailTx.diskon))?.toLocaleString('id-ID')}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: 'var(--surface-sunken)', fontWeight: 700 }}>
                        <td colSpan="3" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--terracotta)', textTransform: 'uppercase' }}>
                          Diskon {selectedDetailTx.diskon_tipe === 'persen' ? `(${selectedDetailTx.diskon_nilai}%)` : ''}:
                        </td>
                        <td className="tabular" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--terracotta)', fontSize: '0.85rem' }}>
                          - Rp {selectedDetailTx.diskon?.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr style={{ backgroundColor: 'var(--surface-sunken)', fontWeight: 700 }}>
                    <td colSpan="3" style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total:</td>
                    <td className="tabular" style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: 'var(--terracotta)', fontSize: '0.95rem' }}>
                      Rp {selectedDetailTx.total?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Tombol Aksi di Bawah Pop-Up Detail */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedDetailTx(null)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                Tutup
              </button>

              {selectedDetailTx.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCancelConfirmTx(selectedDetailTx)}
                    className="btn-danger"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.8125rem' }}
                  >
                    <IconTrash size={14} /> Batalkan Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartCompletePending(selectedDetailTx);
                      setSelectedDetailTx(null);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.8125rem' }}
                  >
                    <IconEdit size={14} /> Selesaikan Pesanan &rarr;
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedTx(selectedDetailTx);
                    setShowReceipt(true);
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  <IconPrinter size={14} /> Cetak Struk
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL SELESAIKAN TRANSAKSI PENDING (EDIT QTY & HARGA SATUAN)           */}
      {/* ========================================================================= */}
      {editingTx && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '680px', width: '94%', maxHeight: '92vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <IconEdit size={18} color="var(--terracotta)" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                    Selesaikan Transaksi Pending
                  </h2>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  No. Transaksi: <span className="tabular" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{editingTx.no_transaksi}</span> &bull; Sesuaikan jumlah dan harga sebelum checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="btn-ghost"
                style={{ width: '32px', height: '32px', padding: 0 }}
                aria-label="Tutup"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Tabel Produk yang Dapat Diedit (Qty & Harga Satuan) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  Produk Pesanan
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--terracotta)', fontWeight: 600 }}>
                  Harga & qty dapat disesuaikan langsung
                </span>
              </div>

              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.55rem 0.65rem', textAlign: 'left', fontWeight: 600 }}>PRODUK</th>
                      <th style={{ padding: '0.55rem 0.65rem', textAlign: 'center', width: '115px', fontWeight: 600 }}>QTY</th>
                      <th style={{ padding: '0.55rem 0.65rem', textAlign: 'right', width: '135px', fontWeight: 600 }}>HARGA SATUAN</th>
                      <th style={{ padding: '0.55rem 0.65rem', textAlign: 'right', width: '120px', fontWeight: 600 }}>SUBTOTAL</th>
                      <th style={{ padding: '0.55rem 0.4rem', textAlign: 'center', width: '36px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editItems.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.55rem 0.65rem', fontWeight: 600 }}>
                          {it.nama}
                        </td>
                        <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.15rem' }}>
                            <button
                              type="button"
                              onClick={() => updateEditItemQty(idx, -1)}
                              style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                              aria-label="Kurangi"
                            >
                              <IconMinus size={12} />
                            </button>
                            <span className="tabular" style={{ width: '24px', textAlign: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>{it.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateEditItemQty(idx, 1)}
                              style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                              aria-label="Tambah"
                            >
                              <IconPlus size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rp</span>
                            <input
                              type="number"
                              className="input-field tabular"
                              value={it.harga_satuan}
                              onChange={e => updateEditItemPrice(idx, e.target.value)}
                              style={{ width: '90px', padding: '0.3rem 0.45rem', fontSize: '0.8125rem', textAlign: 'right', fontWeight: 600 }}
                              min="0"
                            />
                          </div>
                        </td>
                        <td className="tabular" style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 700 }}>
                          Rp {(it.qty * it.harga_satuan).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeEditItem(idx)}
                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Hapus produk"
                          >
                            <IconTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tambah Produk Lain ke Pesanan Pending */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <select
                  className="input-field"
                  value={editProductToAdd}
                  onChange={e => setEditProductToAdd(e.target.value)}
                  style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Tambah Produk Lain dari Katalog --</option>
                  {produk.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama} (Rp {p.harga_jual.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProductToEdit}
                  disabled={!editProductToAdd}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  <IconPlus size={13} /> Tambah
                </button>
              </div>
            </div>

            {/* Diskon Pengaturan saat Selesaikan Pending */}
            <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <IconTag size={13} color="var(--terracotta)" /> Pilih Diskon / Promo
                </span>
                {editDiskonId && (
                  <button
                    type="button"
                    onClick={() => handleSelectEditDiskon('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
                  >
                    Hapus Diskon
                  </button>
                )}
              </div>
              <select
                className="input-field"
                value={editDiskonId}
                onChange={e => handleSelectEditDiskon(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
              >
                <option value="">-- Tanpa Diskon (Normal) --</option>
                {diskonList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({d.tipe === 'persen' ? `${d.nilai}%` : `Rp ${Number(d.nilai).toLocaleString('id-ID')}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Ringkasan Total Tagihan Baru */}
            <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: editDiskonNominal > 0 ? '0.25rem' : '0' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Subtotal ({editItems.reduce((s, it) => s + it.qty, 0)} pcs)</span>
                <span className="tabular" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rp {editSubtotal.toLocaleString('id-ID')}</span>
              </div>
              {editDiskonNominal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--terracotta)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Diskon ({editDiskonNama || (editDiskonTipe === 'persen' ? `${editDiskonNilai}%` : 'Promo')})</span>
                  <span className="tabular" style={{ fontSize: '0.85rem', fontWeight: 700 }}>- Rp {editDiskonNominal.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Total Tagihan Final</span>
                <span className="tabular" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                  Rp {editTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Form Pembayaran Transaksi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Metode Pembayaran</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { id: 'tunai', label: 'Tunai', icon: IconBanknote },
                    { id: 'qris', label: 'QRIS', icon: IconQrCode },
                    { id: 'transfer', label: 'Transfer', icon: IconCreditCard }
                  ].map(({ id, label, icon: IconComponent }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEditMetode(id)}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: editMetode === id ? 'var(--terracotta)' : 'var(--border-subtle)',
                        backgroundColor: editMetode === id ? 'var(--terracotta-subtle)' : 'var(--surface-card)',
                        color: editMetode === id ? 'var(--terracotta)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <IconComponent size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Nominal Dibayar (Rp)</label>
                <input
                  type="number"
                  className="input-field tabular"
                  value={editBayar}
                  onChange={e => setEditBayar(Number(e.target.value) || 0)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.875rem', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Mitra & Catatan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Mitra / Penjual</label>
                <select
                  className="input-field"
                  value={editSeller}
                  onChange={e => setEditSeller(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                >
                  {sellersList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Catatan Tambahan</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Catatan pelunasan..."
                  value={editKeterangan}
                  onChange={e => setEditKeterangan(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            {/* Tombol Eksekusi Penyelesaian */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                disabled={completingPending}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFinishCompletePending}
                disabled={completingPending || editItems.length === 0}
                className="btn-primary"
                style={{ flex: 2, padding: '0.65rem' }}
              >
                <IconCheck size={15} />
                {completingPending ? 'Memproses...' : 'Selesaikan & Bayar'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PILIH VARIAN UKURAN KEMASAN (MODEL 1: BOTOL KECIL & BESAR)          */}
      {/* ========================================================================= */}
      {variantModalProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '420px', padding: 0, overflow: 'hidden' }}>
            {/* Header Modal */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--surface-sunken)'
            }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pilih Ukuran Kemasan
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.1rem 0 0 0', color: 'var(--text-primary)' }}>
                  {variantModalProduct.nama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                aria-label="Tutup"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Body: Thumbnail & Varian List */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {variantModalProduct.image_url ? (
                    <img
                      src={variantModalProduct.image_url}
                      alt={variantModalProduct.nama}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <IconMilk size={20} style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {variantModalProduct.nama}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {getCategoryName(variantModalProduct.kategori_id)} &bull; Stok: <span className="tabular">{variantModalProduct.stok ?? 100}</span>
                  </div>
                </div>
              </div>

              {/* Pilihan Opsi Status Kemasan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pilih Status Kemasan:
                </span>
                {[
                  { key: 'Botol Kecil', label: 'Botol Kecil (250ml)', desc: 'Porsi personal praktis' },
                  { key: 'Botol Besar', label: 'Botol Besar (1 Liter)', desc: 'Kemasan keluarga / sharing' }
                ].map((kemasanOpt) => {
                  const existingItem = order.find(item => item.order_item_key === `${variantModalProduct.id}__${kemasanOpt.key}`);
                  const existingQty = existingItem ? existingItem.qty : 0;

                  return (
                    <button
                      key={kemasanOpt.key}
                      type="button"
                      onClick={() => {
                        addToOrder(variantModalProduct, kemasanOpt.key);
                        setVariantModalProduct(null);
                      }}
                      className="btn-secondary"
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        border: existingQty > 0 ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: existingQty > 0 ? 'var(--accent-subtle)' : 'var(--surface-panel)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-sunken)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--terracotta)'
                        }}>
                          <IconMilk size={17} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {kemasanOpt.label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                            {kemasanOpt.desc} {existingQty > 0 && <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>&bull; {existingQty} di keranjang</span>}
                          </div>
                        </div>
                      </div>
                      <div className="tabular" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        Rp {Number(variantModalProduct.harga_jual).toLocaleString('id-ID')}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tombol Tutup / Batal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setVariantModalProduct(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.78125rem' }}
                >
                  BATAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL PEMBAYARAN LANGSUNG (CHECKOUT REGULER)                            */}
      {/* ========================================================================= */}
      {showPayment && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '92%' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCart size={18} color="var(--terracotta)" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Konfirmasi Pembayaran</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="btn-ghost"
                style={{ width: '32px', height: '32px', padding: 0 }}
                aria-label="Tutup"
              >
                <IconX size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: diskonNominal > 0 ? '0.35rem' : '0' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Subtotal Produk ({totalQty} item)</span>
                <span className="tabular" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {diskonNominal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', color: 'var(--terracotta)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    <IconTag size={13} />
                    <span>Diskon ({diskonNama || (diskonTipe === 'persen' ? `${diskonNilai}%` : 'Promo')})</span>
                    <button
                      type="button"
                      onClick={removeDiscount}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.7rem', cursor: 'pointer', padding: 0, marginLeft: '0.2rem' }}
                    >
                      Batal
                    </button>
                  </div>
                  <span className="tabular" style={{ fontSize: '0.875rem', fontWeight: 700 }}>- Rp {diskonNominal.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.45rem', borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Total Tagihan</span>
                <span className="tabular" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--terracotta)' }}>Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Promo / Diskon Dropdown Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <IconTag size={14} style={{ color: 'var(--terracotta)' }} />
                  <span>Pilih Diskon / Promo</span>
                </label>
                {mounted && currentUser?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => { setShowPayment(false); router.push('/admin/diskon'); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--terracotta)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    + Kelola Diskon (Admin)
                  </button>
                )}
              </div>

              <select
                className="input-field"
                value={selectedDiskonId}
                onChange={(e) => handleSelectDiskon(e.target.value)}
                style={{
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.8125rem',
                  width: '100%',
                  fontWeight: selectedDiskonId ? 700 : 400,
                  borderColor: selectedDiskonId ? 'var(--terracotta)' : 'var(--border-subtle)',
                  backgroundColor: selectedDiskonId ? 'var(--terracotta-subtle)' : 'var(--surface-card)'
                }}
              >
                <option value="">-- Tanpa Diskon (Normal) --</option>
                {diskonList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({d.tipe === 'persen' ? `${d.nilai}%` : `Rp ${Number(d.nilai).toLocaleString('id-ID')}`})
                  </option>
                ))}
              </select>

              {diskonList.length === 0 && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                  Belum ada promo aktif yang dibuat oleh Admin.
                </div>
              )}
            </div>

            {/* Seller / Mitra Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Mitra / Pelanggan
                </label>
                <button
                  type="button"
                  onClick={() => { setShowQuickAddSeller(!showQuickAddSeller); setQuickSellerError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--terracotta)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showQuickAddSeller ? 'Tutup Form' : '+ Tambah Mitra'}
                </button>
              </div>

              {showQuickAddSeller && (
                <div style={{
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Nama mitra baru..."
                      value={quickSellerName}
                      onChange={e => setQuickSellerName(e.target.value)}
                      disabled={savingQuickSeller}
                      style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddSeller}
                      disabled={savingQuickSeller || !quickSellerName.trim()}
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {savingQuickSeller ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                  {quickSellerError && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.72rem', marginTop: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <IconAlertCircle size={12} /> {quickSellerError}
                    </div>
                  )}
                </div>
              )}

              <select
                className="input-field"
                value={seller}
                onChange={e => setSeller(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.8125rem' }}
              >
                {sellersList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {seller === 'Lainnya (Kustom)' && (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ketik nama mitra / pemesan khusus..."
                  value={customSeller}
                  onChange={e => setCustomSeller(e.target.value)}
                  style={{ marginTop: '0.5rem', padding: '0.55rem 0.75rem', fontSize: '0.8125rem' }}
                />
              )}
            </div>

            {/* Metode Pembayaran Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Metode Pembayaran
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'tunai', label: 'Tunai', icon: IconBanknote },
                  { id: 'qris', label: 'QRIS', icon: IconQrCode },
                  { id: 'transfer', label: 'Transfer', icon: IconCreditCard }
                ].map(({ id, label, icon: IconComponent }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMetodeBayar(id)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      border: '1px solid',
                      borderColor: metodeBayar === id ? 'var(--terracotta)' : 'var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      backgroundColor: metodeBayar === id ? 'var(--terracotta-subtle)' : 'var(--surface-card)',
                      color: metodeBayar === id ? 'var(--terracotta)' : 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <IconComponent size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Catatan Pembelian */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Catatan Pesanan (Opsional)
              </label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Contoh: Es dipisah, STMJ tanpa telur, dll..."
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                style={{
                  resize: 'vertical',
                  minHeight: '60px',
                  fontSize: '0.8125rem',
                  padding: '0.55rem 0.75rem'
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
                onClick={() => setShowPayment(false)}
                disabled={processing}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1.5, padding: '0.65rem' }}
                onClick={handlePayment}
                disabled={processing}
              >
                <IconCheck size={15} />
                {processing ? 'Memproses...' : 'Konfirmasi Bayar'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL NOTA DIGITAL BUKTI TRANSAKSI                                      */}
      {/* ========================================================================= */}
      <ReceiptModal
        isOpen={showReceipt && !!completedTx}
        onClose={() => {
          setShowReceipt(false);
          setCompletedTx(null);
        }}
        tx={completedTx}
        onNewTransaction={() => {
          setShowReceipt(false);
          setCompletedTx(null);
          setOrder([]);
        }}
      />

      {/* ========================================================================= */}
      {/* 7. MODAL ALERT KONFIRMASI PEMBATALAN TRANSAKSI PENDING                   */}
      {/* ========================================================================= */}
      {cancelConfirmTx && (
        <div className="modal-overlay" style={{ zIndex: 1350 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '92%', textAlign: 'center', padding: '1.5rem' }}>

            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-subtle)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <IconAlertCircle size={24} />
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-primary)' }}>
              Batalkan Transaksi Pending?
            </h3>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
              Pesanan ini akan dibatalkan dan dihapus dari antrean pending. Tindakan ini tidak dapat diurungkan.
            </p>

            <div style={{
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              border: '1px solid var(--border-subtle)',
              textAlign: 'left',
              marginBottom: '1rem',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>No. Transaksi</span>
                <span className="tabular" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {cancelConfirmTx.no_transaksi}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mitra / Pelanggan</span>
                <span style={{ fontWeight: 600 }}>{cancelConfirmTx.seller || 'Umum'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Tagihan</span>
                <span className="tabular" style={{ fontWeight: 700, color: 'var(--terracotta)' }}>
                  Rp {cancelConfirmTx.total?.toLocaleString('id-ID')}
                </span>
              </div>
              {cancelConfirmTx.keterangan && (
                <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong>Catatan:</strong> <em>{cancelConfirmTx.keterangan}</em>
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: 'var(--warning-subtle)',
              border: '1px solid rgba(180, 83, 9, 0.2)',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
              color: 'var(--warning)',
              marginBottom: '1.25rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>Stok produk di gerai tetap aman dan tidak terpotong karena transaksi ini masih pending.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCancelConfirmTx(null)}
                disabled={cancellingTx}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.8125rem' }}
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePending}
                disabled={cancellingTx}
                className="btn-danger"
                style={{ flex: 1.4, padding: '0.6rem', fontSize: '0.8125rem' }}
              >
                <IconTrash size={14} />
                {cancellingTx ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}

    </div>
  );
}

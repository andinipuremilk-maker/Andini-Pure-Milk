import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  useWindowDimensions
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getProduk, getKategori } from '../../services/produk';
import { submitTransaksi } from '../../services/transaksi';
import ProductCard from '../../components/ProductCard';
import OrderItem from '../../components/OrderItem';
import BottomSheet from '../../components/BottomSheet';

export default function POSScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  const [produk, setProduk] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKategori, setActiveKategori] = useState(null);
  
  const [order, setOrder] = useState([]);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [bayarText, setBayarText] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('tunai');
  const [processing, setProcessing] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, katRes] = await Promise.all([getProduk(), getKategori()]);
      setProduk(prodRes);
      setKategori(katRes);
      if (katRes.length > 0) setActiveKategori(katRes[0].id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (product) => {
    setOrder(prev => {
      const existing = prev.find(item => item.produk_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.produk_id === product.id 
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { 
        produk_id: product.id, 
        nama: product.nama, 
        harga_satuan: product.harga_jual, 
        qty: 1 
      }];
    });
  };

  const updateQty = (item, delta) => {
    setOrder(prev => {
      return prev.map(o => {
        if (o.produk_id === item.produk_id) {
          const newQty = o.qty + delta;
          return { ...o, qty: newQty > 0 ? newQty : 1 };
        }
        return o;
      });
    });
  };

  const deleteItem = (item) => {
    setOrder(prev => prev.filter(o => o.produk_id !== item.produk_id));
  };

  const total = order.reduce((sum, item) => sum + (item.qty * item.harga_satuan), 0);
  
  const bayarValue = parseInt(bayarText.replace(/[^0-9]/g, ''), 10) || 0;
  const kembalian = bayarValue - total;

  const handlePayment = async () => {
    if (order.length === 0) return;
    if (bayarValue < total) {
      Alert.alert('Error', 'Nominal bayar kurang dari total transaksi.');
      return;
    }

    setProcessing(true);
    try {
      await submitTransaksi({
        total,
        bayar: bayarValue,
        metode_bayar: metodeBayar
      }, order, user.id);
      
      setPaymentVisible(false);
      setOrder([]);
      setBayarText('');
      Alert.alert('Sukses', 'Transaksi berhasil disimpan.');
    } catch (error) {
      Alert.alert('Error', 'Gagal memproses transaksi.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProduk = produk.filter(p => !activeKategori || p.kategori_id === activeKategori);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POS KASIR</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.main, isDesktop && { flexDirection: 'row' }]}>
        {/* Left/Top: Product Grid */}
        <View style={styles.productSection}>
          <View style={styles.kategoriList}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{id: null, nama: 'Semua'}, ...kategori]}
              keyExtractor={item => String(item.id)}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={[styles.kategoriChip, activeKategori === item.id && styles.kategoriChipActive]}
                  onPress={() => setActiveKategori(item.id)}
                >
                  <Text style={[styles.kategoriText, activeKategori === item.id && styles.kategoriTextActive]}>
                    {item.nama}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {loading ? (
            <View style={styles.center}><ActivityIndicator color="#000" /></View>
          ) : filteredProduk.length === 0 ? (
            <View style={styles.center}><Text style={styles.emptyText}>Tidak ada produk.</Text></View>
          ) : (
            <FlatList
              data={filteredProduk}
              numColumns={2}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.gridContent}
              renderItem={({item}) => (
                <ProductCard product={item} onPress={() => addToOrder(item)} />
              )}
            />
          )}
        </View>

        {/* Right/Bottom: Order Summary Panel */}
        <View style={styles.orderSection}>
          <Text style={styles.orderTitle}>PESANAN SAAT INI</Text>
          
          {order.length === 0 ? (
            <View style={styles.emptyOrder}>
              <Text style={styles.emptyText}>Belum ada produk dipilih.</Text>
            </View>
          ) : (
            <FlatList
              data={order}
              keyExtractor={item => item.produk_id}
              renderItem={({item}) => (
                <OrderItem 
                  item={item} 
                  onIncrease={i => updateQty(i, 1)}
                  onDecrease={i => updateQty(i, -1)}
                  onDelete={deleteItem}
                />
              )}
            />
          )}

          <View style={styles.summaryFooter}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TOTAL</Text>
              <Text style={styles.summaryValue}>Rp {total.toLocaleString('id-ID')}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.bayarBtn, order.length === 0 && styles.bayarBtnDisabled]}
              onPress={() => setPaymentVisible(true)}
              disabled={order.length === 0}
            >
              <Text style={styles.bayarBtnText}>BAYAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Payment Modal */}
      <BottomSheet visible={paymentVisible} onClose={() => setPaymentVisible(false)}>
        <Text style={styles.modalTitle}>PEMBAYARAN</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.modalLabel}>Total Tagihan</Text>
          <Text style={styles.modalTotal}>Rp {total.toLocaleString('id-ID')}</Text>
        </View>

        <Text style={styles.modalLabel}>Metode Pembayaran</Text>
        <View style={styles.metodeContainer}>
          {['tunai', 'qris', 'transfer'].map(metode => (
            <TouchableOpacity 
              key={metode}
              style={[styles.metodeBtn, metodeBayar === metode && styles.metodeBtnActive]}
              onPress={() => setMetodeBayar(metode)}
            >
              <Text style={[styles.metodeText, metodeBayar === metode && styles.metodeTextActive]}>
                {metode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.modalLabel}>Nominal Bayar</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={bayarText}
          onChangeText={setBayarText}
          placeholder="Masukkan jumlah..."
          placeholderTextColor="#A0A0A0"
        />

        {bayarValue > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.modalLabel}>Kembalian</Text>
            <Text style={[styles.modalTotal, kembalian < 0 && { color: '#FF0000' }]}>
              Rp {kembalian.toLocaleString('id-ID')}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.bayarBtn}
          onPress={handlePayment}
          disabled={processing || bayarValue < total}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.bayarBtnText}>KONFIRMASI BAYAR</Text>
          )}
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1,
  },
  logoutBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  main: {
    flex: 1,
    flexDirection: 'column', // Could be 'row' on tablets
  },
  productSection: {
    flex: 3,
    backgroundColor: '#FAFAFA',
  },
  kategoriList: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  kategoriChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
  },
  kategoriChipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  kategoriText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  kategoriTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    padding: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  orderSection: {
    flex: 2,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 0,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: 1,
  },
  emptyOrder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  bayarBtn: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
  },
  bayarBtnDisabled: {
    backgroundColor: '#A0A0A0',
  },
  bayarBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 24,
    letterSpacing: 1,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
    marginBottom: 8,
  },
  modalTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  metodeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  metodeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    alignItems: 'center',
  },
  metodeBtnActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  metodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  metodeTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    backgroundColor: '#FAFAFA',
    marginBottom: 24,
  },
});

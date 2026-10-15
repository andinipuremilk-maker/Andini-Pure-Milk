import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { 
  getProduk, getKategori, addProduk, updateProduk, softDeleteProduk, 
  addKategori, updateKategori, deleteKategori 
} from '../../services/produk';
import BottomSheet from '../../components/BottomSheet';

export default function ProductScreen() {
  const [activeTab, setActiveTab] = useState('produk'); // 'produk' | 'kategori'
  const [produk, setProduk] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null); // null if adding
  const [formData, setFormData] = useState({});
  const [processing, setProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, katRes] = await Promise.all([getProduk(), getKategori()]);
      setProduk(prodRes);
      setKategori(katRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    if (activeTab === 'produk') {
      setFormData(item ? { ...item, harga_jual: item.harga_jual.toString() } : { nama: '', sku: '', harga_jual: '', kategori_id: kategori[0]?.id });
    } else {
      setFormData(item ? { ...item } : { nama: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.nama) {
      Alert.alert('Error', 'Nama wajib diisi');
      return;
    }

    setProcessing(true);
    try {
      if (activeTab === 'produk') {
        const payload = {
          nama: formData.nama,
          sku: formData.sku,
          harga_jual: parseInt(formData.harga_jual, 10) || 0,
          kategori_id: formData.kategori_id
        };
        if (editItem) {
          await updateProduk(editItem.id, payload);
        } else {
          await addProduk(payload);
        }
      } else {
        if (editItem) {
          await updateKategori(editItem.id, formData.nama);
        } else {
          await addKategori(formData.nama);
        }
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Terjadi kesalahan');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (item) => {
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin menghapus ${item.nama}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (activeTab === 'produk') {
                await softDeleteProduk(item.id);
              } else {
                await deleteKategori(item.id);
              }
              loadData();
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', error.message || 'Gagal menghapus');
            }
          }
        }
      ]
    );
  };

  const renderProdukItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.nama}</Text>
        <Text style={styles.listSub}>{item.sku} • Rp {item.harga_jual.toLocaleString('id-ID')}</Text>
      </View>
      <View style={styles.listActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
          <Text style={styles.actionBtnText}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>HAPUS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderKategoriItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.nama}</Text>
      </View>
      <View style={styles.listActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
          <Text style={styles.actionBtnText}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>HAPUS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'produk' && styles.tabActive]}
          onPress={() => setActiveTab('produk')}
        >
          <Text style={[styles.tabText, activeTab === 'produk' && styles.tabTextActive]}>PRODUK</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'kategori' && styles.tabActive]}
          onPress={() => setActiveTab('kategori')}
        >
          <Text style={[styles.tabText, activeTab === 'kategori' && styles.tabTextActive]}>KATEGORI</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Text style={styles.addBtnText}>+ TAMBAH {activeTab.toUpperCase()}</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#000" /></View>
        ) : (
          <FlatList
            data={activeTab === 'produk' ? produk : kategori}
            keyExtractor={item => item.id}
            renderItem={activeTab === 'produk' ? renderProdukItem : renderKategoriItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada data.</Text>}
          />
        )}
      </View>

      {/* Modal Add/Edit */}
      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text style={styles.modalTitle}>
          {editItem ? 'EDIT' : 'TAMBAH'} {activeTab.toUpperCase()}
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NAMA</Text>
          <TextInput
            style={styles.input}
            value={formData.nama}
            onChangeText={text => setFormData({...formData, nama: text})}
            placeholder="Masukkan nama"
          />
        </View>

        {activeTab === 'produk' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKU</Text>
              <TextInput
                style={styles.input}
                value={formData.sku}
                onChangeText={text => setFormData({...formData, sku: text})}
                placeholder="Misal: SM-1L"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>HARGA JUAL</Text>
              <TextInput
                style={styles.input}
                value={formData.harga_jual}
                onChangeText={text => setFormData({...formData, harga_jual: text})}
                placeholder="Misal: 20000"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>KATEGORI ID</Text>
              {/* In a real app, this should be a dropdown/picker. Keeping simple input for now */}
              <TextInput
                style={styles.input}
                value={formData.kategori_id}
                onChangeText={text => setFormData({...formData, kategori_id: text})}
                placeholder="ID Kategori"
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>SIMPAN</Text>
          )}
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addBtn: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 40,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  listSub: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  deleteBtn: {
    borderColor: '#000000',
  },
  deleteBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  emptyText: {
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 24,
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FAFAFA',
  },
  saveBtn: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

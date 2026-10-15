import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLaporanStats } from '../../services/laporan';
import StatCard from '../../components/StatCard';

export default function LaporanScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeType, setRangeType] = useState('month'); // 'today' | 'week' | 'month'

  useFocusEffect(
    useCallback(() => {
      loadStats(rangeType);
    }, [rangeType])
  );

  const loadStats = async (type) => {
    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      
      if (type === 'today') {
        // start is already today
      } else if (type === 'week') {
        start.setDate(end.getDate() - 7);
      } else if (type === 'month') {
        start.setDate(1); // First day of current month
      }

      const data = await getLaporanStats(start.toISOString(), end.toISOString());
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.rangeSelector}>
        <TouchableOpacity 
          style={[styles.rangeBtn, rangeType === 'today' && styles.rangeBtnActive]}
          onPress={() => setRangeType('today')}
        >
          <Text style={[styles.rangeBtnText, rangeType === 'today' && styles.rangeBtnTextActive]}>HARI INI</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.rangeBtn, rangeType === 'week' && styles.rangeBtnActive]}
          onPress={() => setRangeType('week')}
        >
          <Text style={[styles.rangeBtnText, rangeType === 'week' && styles.rangeBtnTextActive]}>7 HARI</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.rangeBtn, rangeType === 'month' && styles.rangeBtnActive]}
          onPress={() => setRangeType('month')}
        >
          <Text style={[styles.rangeBtnText, rangeType === 'month' && styles.rangeBtnTextActive]}>BULAN INI</Text>
        </TouchableOpacity>
      </View>

      {loading || !stats ? (
        <View style={styles.center}><ActivityIndicator color="#000" /></View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.sectionTitle}>RINGKASAN</Text>
          <View style={styles.row}>
            <StatCard 
              title="PENDAPATAN" 
              value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`} 
            />
            <StatCard 
              title="TRANSAKSI" 
              value={stats.totalCount} 
            />
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <StatCard 
              title="RATA-RATA TRANSAKSI" 
              value={`Rp ${Math.round(stats.avgValue).toLocaleString('id-ID')}`} 
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>PENDAPATAN BERDASARKAN KATEGORI</Text>
          <View style={styles.cardList}>
            {stats.categoryBreakdown.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada transaksi.</Text>
            ) : (
              stats.categoryBreakdown.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listName}>{item.kategori}</Text>
                  <Text style={styles.listValue}>Rp {item.revenue.toLocaleString('id-ID')}</Text>
                </View>
              ))
            )}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>RINCIAN HARIAN</Text>
          <View style={styles.cardList}>
            {stats.dailyBreakdown.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada transaksi.</Text>
            ) : (
              stats.dailyBreakdown.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listName}>{item.date}</Text>
                  <Text style={styles.listValue}>Rp {item.revenue.toLocaleString('id-ID')}</Text>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  rangeSelector: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    alignItems: 'center',
  },
  rangeBtnActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  rangeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  rangeBtnTextActive: {
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
    marginBottom: 12,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  cardList: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 16,
  },
  emptyText: {
    color: '#6B6B6B',
    fontSize: 15,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  listValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B6B6B',
  }
});

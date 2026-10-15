import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardStats } from '../../services/laporan';
import StatCard from '../../components/StatCard';
import { AuthContext } from '../../context/AuthContext';

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <View style={styles.center}><ActivityIndicator color="#000" /></View>;
  }

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...stats.last7Days.map(d => d.revenue), 1); // fallback to 1 to avoid /0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>DASHBOARD</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>HARI INI</Text>
      <View style={styles.row}>
        <StatCard 
          title="PENDAPATAN" 
          value={`Rp ${stats.todayRevenue.toLocaleString('id-ID')}`} 
        />
        <StatCard 
          title="TRANSAKSI" 
          value={stats.todayCount} 
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>PRODUK TERLARIS (HARI INI)</Text>
      <View style={styles.cardList}>
        {stats.topProducts.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada data</Text>
        ) : (
          stats.topProducts.map((p, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listNumber}>{i + 1}</Text>
              <Text style={styles.listName}>{p.nama}</Text>
              <Text style={styles.listValue}>{p.qty} terjual</Text>
            </View>
          ))
        )}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>PENDAPATAN 7 HARI TERAKHIR</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartContainer}>
          {stats.last7Days.slice().reverse().map((day, i) => {
            const heightPerc = (day.revenue / maxRevenue) * 100;
            return (
              <View key={i} style={styles.barColumn}>
                <View style={styles.barValueContainer}>
                  <Text style={styles.barValueText} numberOfLines={1}>
                    {day.revenue > 0 ? (day.revenue / 1000) + 'k' : ''}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${heightPerc}%` }]} />
                </View>
                <Text style={styles.barLabel}>{day.date}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
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
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    width: 24,
  },
  listName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  listValue: {
    fontSize: 15,
    color: '#6B6B6B',
  },
  chartCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 16,
    height: 250,
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barValueContainer: {
    height: 20,
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 10,
    color: '#6B6B6B',
  },
  barTrack: {
    flex: 1,
    width: 24,
    backgroundColor: '#EAEAEA',
    justifyContent: 'flex-end',
    marginVertical: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: '#000000',
    width: '100%',
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    textTransform: 'uppercase',
  }
});

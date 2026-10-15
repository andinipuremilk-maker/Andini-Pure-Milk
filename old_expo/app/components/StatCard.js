import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ title, value, subtitle }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  }
});

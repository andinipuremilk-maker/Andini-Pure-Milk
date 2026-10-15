import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProductCard({ product, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.nama}</Text>
        <Text style={styles.price}>
          Rp {product.harga_jual.toLocaleString('id-ID')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    aspectRatio: 1,
    margin: 8,
    flex: 1,
    minWidth: '40%',
    padding: 16,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  }
});

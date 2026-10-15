import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function OrderItem({ item, onIncrease, onDecrease, onDelete }) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nama}</Text>
        <Text style={styles.price}>Rp {item.harga_satuan.toLocaleString('id-ID')}</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => onDecrease(item)}>
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.qty}>{item.qty}</Text>
        
        <TouchableOpacity style={styles.btn} onPress={() => onIncrease(item)}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => onDelete(item)}>
          <Text style={styles.deleteBtnText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  price: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  qty: {
    fontSize: 15,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  deleteBtn: {
    borderColor: '#000000',
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  }
});

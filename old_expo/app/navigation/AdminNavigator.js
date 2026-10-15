import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ProductScreen from '../screens/admin/ProductScreen';
import LaporanScreen from '../screens/admin/LaporanScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0 },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#6B6B6B',
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Produk" component={ProductScreen} />
      <Tab.Screen name="Laporan" component={LaporanScreen} />
    </Tab.Navigator>
  );
}

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.heroText}>ANDINI</Text>
          <Text style={styles.subHeroText}>PURE MILK</Text>
          <Text style={styles.tagline}>POINT OF SALE</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login', { role: 'kasir' })}
          >
            <Text style={styles.primaryButtonText}>LOGIN KASIR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login', { role: 'admin' })}
          >
            <Text style={styles.secondaryButtonText}>LOGIN ADMIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 2,
  },
  subHeroText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
    marginTop: -8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B6B6B',
    letterSpacing: 4,
    marginTop: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

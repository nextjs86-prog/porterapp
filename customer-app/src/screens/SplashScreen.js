import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SIZES } from '../utils/theme';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const init = async () => {
      await new Promise(r => setTimeout(r, 2000));
      const token = await AsyncStorage.getItem('token');
      const seen  = await AsyncStorage.getItem('onboarding_seen');
      if (token)     navigation.replace('Main');
      else if (seen) navigation.replace('Login');
      else           navigation.replace('Onboarding');
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>🚚</Text>
        <Text style={styles.appName}>QuickHaul</Text>
        <Text style={styles.tagline}>Fast. Reliable. Doorstep.</Text>
      </View>
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoBox:    { alignItems: 'center' },
  logo:       { fontSize: 72, marginBottom: 16 },
  appName:    { fontSize: 36, color: COLORS.white, fontWeight: '700', letterSpacing: 1 },
  tagline:    { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  version:    { position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.5)', fontSize: SIZES.sm },
});

export default SplashScreen;


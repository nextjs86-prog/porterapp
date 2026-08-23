import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '../utils/theme';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const init = async () => {
      await new Promise(r => setTimeout(r, 2000));
      const token = await AsyncStorage.getItem('driver_token');
      navigation.replace(token ? 'Main' : 'Login');
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚛</Text>
      <Text style={styles.appName}>QuickHaul</Text>
      <Text style={styles.tag}>Driver Partner</Text>
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logo:      { fontSize: 72, marginBottom: 16 },
  appName:   { fontSize: 36, color: COLORS.white, fontWeight: '700' },
  tag:       { fontSize: SIZES.base, color: 'rgba(255,255,255,0.8)', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  version:   { position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.4)', fontSize: SIZES.sm },
});

export default SplashScreen;

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/theme';

const MAX_WAIT_MS = 8000;

const SplashScreen = ({ navigation }) => {
  const navigated = useRef(false);

  const goNext = async () => {
    if (navigated.current) return;
    navigated.current = true;
    const token = await AsyncStorage.getItem('driver_token');
    navigation.replace(token ? 'Main' : 'Login');
  };

  useEffect(() => {
    const fallback = setTimeout(goNext, MAX_WAIT_MS);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/intro.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isMuted={false}
        onPlaybackStatusUpdate={(status) => { if (status.didJustFinish) goNext(); }}
        onError={goNext}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  video:     { flex: 1, width: '100%', height: '100%' },
});

export default SplashScreen;

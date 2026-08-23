import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import io from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';

const SOCKET_URL = 'https://porterapp-7y12.onrender.com';

const SearchDriverScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const user     = useAuthStore(s => s.user);
  const [status, setStatus] = useState('Searching for nearby drivers...');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const socketRef = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Socket connection
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('customer:join', user?._id);

    socket.on('order:update', ({ status: s }) => {
      if (s === 'accepted') {
        clearTimeout(timerRef.current);
        navigation.replace('Tracking', { orderId });
      }
    });

    // 3 min timeout
    timerRef.current = setTimeout(() => {
      Alert.alert('No Driver Found', 'No drivers available nearby. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 180000);

    return () => {
      socket.disconnect();
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animContainer}>
          {[1.6, 1.3, 1].map((scale, i) => (
            <Animated.View
              key={i}
              style={[styles.ring, { transform: [{ scale: Animated.multiply(pulseAnim, scale) }], opacity: Animated.divide(1, scale) }]}
            />
          ))}
          <View style={styles.centerDot}>
            <Text style={{ fontSize: 36 }}>🚚</Text>
          </View>
        </View>

        <Text style={styles.title}>{status}</Text>
        <Text style={styles.sub}>Please wait while we connect you with a nearby driver</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Order ID</Text>
          <Text style={styles.infoVal}>#{orderId?.slice(-8)?.toUpperCase()}</Text>
        </View>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            Alert.alert('Cancel Search', 'Are you sure you want to cancel?', [
              { text: 'No' },
              { text: 'Yes', onPress: () => navigation.goBack(), style: 'destructive' },
            ]);
          }}
        >
          <Text style={styles.cancelText}>Cancel Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  content:      { alignItems: 'center', padding: 32 },
  animContainer:{ width: 200, height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  ring:         { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: `${COLORS.primary}20`, borderWidth: 1, borderColor: `${COLORS.primary}40` },
  centerDot:    { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  title:        { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 12 },
  sub:          { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  infoCard:     { backgroundColor: COLORS.white, padding: 16, borderRadius: SIZES.radius, marginTop: 32, width: '100%', alignItems: 'center', elevation: 2 },
  infoLabel:    { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 4 },
  infoVal:      { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  cancelBtn:    { marginTop: 32, padding: 14 },
  cancelText:   { color: COLORS.error, fontSize: SIZES.base, fontWeight: '600' },
});

export default SearchDriverScreen;


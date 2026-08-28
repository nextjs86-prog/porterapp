import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../utils/theme';
import useDriverStore from '../store/useDriverStore';

const TIMEOUT_SECS = 30;

const IncomingOrderScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const [timer,   setTimer]   = useState(TIMEOUT_SECS);
  const [loading, setLoading] = useState(false);
  const progress = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);
  const acceptOrder = useDriverStore(s => s.acceptOrder);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0, duration: TIMEOUT_SECS * 1000, useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); navigation.goBack(); return 0; }
        return t - 1;
      });
    }, 1000);

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/notification.wav'),
          { isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
        await sound.playAsync();
      } catch (err) { console.warn('Notification sound failed', err); }
    })();

    return () => {
      clearInterval(interval);
      soundRef.current?.unloadAsync();
    };
  }, []);

  const stopSound = () => soundRef.current?.stopAsync();

  const handleAccept = async () => {
    stopSound();
    setLoading(true);
    try {
      await acceptOrder(order.orderId);
      navigation.replace('Navigation', { orderId: order.orderId });
    } catch (err) {
      navigation.goBack();
    }
  };

  const handleReject = () => { stopSound(); navigation.goBack(); };

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <Animated.View style={[styles.timerFill, { width: progressWidth }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{timer}s</Text>
        </View>
        <Text style={styles.title}>New Order Request!</Text>
        <Text style={styles.sub}>Accept within {timer} seconds</Text>

        <View style={styles.orderCard}>
          {/* Pickup */}
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: COLORS.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddr} numberOfLines={2}>{order.pickup?.address}</Text>
            </View>
          </View>
          <View style={styles.routeConnector} />
          {/* Drop */}
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Drop</Text>
              <Text style={styles.locationAddr} numberOfLines={2}>{order.drop?.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View style={styles.detail}>
              <Icon name="truck" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{order.vehicleType?.replace('_', ' ')}</Text>
            </View>
            {order.distanceKm != null && (
              <View style={styles.detail}>
                <Icon name="map-marker-distance" size={16} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>{order.distanceKm} km</Text>
              </View>
            )}
            <View style={styles.detail}>
              <Icon name="currency-inr" size={16} color={COLORS.success} />
              <Text style={[styles.detailText, { color: COLORS.success, fontWeight: '700' }]}>₹{order.fareBreakdown?.total}</Text>
            </View>
          </View>

          {order.notes ? (
            <View style={styles.goodsRow}>
              <Icon name="package-variant" size={16} color={COLORS.textSecondary} />
              <Text style={styles.goodsText} numberOfLines={2}>{order.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Icon name="close" size={28} color={COLORS.error} />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.acceptBtn, loading && { opacity: 0.7 }]} onPress={handleAccept} disabled={loading}>
            <Icon name="check" size={28} color={COLORS.white} />
            <Text style={styles.acceptText}>{loading ? 'Accepting...' : 'Accept'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  timerBar:        { height: 4, backgroundColor: COLORS.grayLight, position: 'absolute', top: 0, left: 0, right: 0 },
  timerFill:       { height: 4, backgroundColor: COLORS.warning },
  content:         { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  timerBadge:      { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.warning, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  timerText:       { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  title:           { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  sub:             { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  orderCard:       { backgroundColor: COLORS.bgLight, borderRadius: SIZES.radiusLg, padding: 16, marginBottom: 24 },
  locationRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  locationDot:     { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  locationLabel:   { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  locationAddr:    { fontSize: SIZES.sm, color: COLORS.textPrimary, marginTop: 2 },
  routeConnector:  { width: 2, height: 20, backgroundColor: COLORS.grayLight, marginLeft: 5, marginVertical: 4 },
  divider:         { height: 1, backgroundColor: COLORS.grayLight, marginVertical: 12 },
  detailsRow:      { flexDirection: 'row', justifyContent: 'space-around' },
  detail:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText:      { fontSize: SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  goodsRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.grayLight },
  goodsText:       { fontSize: SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  actions:         { flexDirection: 'row', gap: 16 },
  rejectBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: COLORS.error, borderRadius: SIZES.radiusLg, padding: 16 },
  rejectText:      { fontSize: SIZES.base, fontWeight: '700', color: COLORS.error },
  acceptBtn:       { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, borderRadius: SIZES.radiusLg, padding: 16 },
  acceptText:      { fontSize: SIZES.base, fontWeight: '700', color: COLORS.white },
});

export default IncomingOrderScreen;

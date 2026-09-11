import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Switch,
  SafeAreaView, ScrollView, Alert, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import io from 'socket.io-client';
import { COLORS, SIZES } from '../utils/theme';
import useDriverStore from '../store/useDriverStore';

const SOCKET_URL = 'https://porterapp-7y12.onrender.com';

const ONLINE_NOTIFICATION_ID = 'driver-online-status';

const DashboardScreen = ({ navigation }) => {
  const { driver, isOnline, toggleOnline, updateLocation, fetchEarnings, earnings } = useDriverStore();
  const [location,    setLocation]    = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const mapRef    = useRef(null);
  const socketRef = useRef(null);
  const locTimer  = useRef(null);

  const showOnlineNotification = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('status', {
        name: 'Online Status',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
      });
    }
    await Notifications.scheduleNotificationAsync({
      identifier: ONLINE_NOTIFICATION_ID,
      content: {
        title: "🟢 You're Online",
        body: 'Receiving order requests. Tap to open Sahara Driver.',
        sticky: true,
        autoDismiss: false,
        sound: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
      },
      trigger: Platform.OS === 'android' ? { channelId: 'status' } : null,
    });
  };

  const hideOnlineNotification = () => Notifications.dismissNotificationAsync(ONLINE_NOTIFICATION_ID);

  useEffect(() => {
    // Restore the persistent "online" notification if the app was reopened
    // while the driver was already toggled online from a previous session.
    if (isOnline) showOnlineNotification();
  }, []);

  useEffect(() => {
    fetchEarnings('daily');

    // Socket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('driver:join', driver?._id);
    socket.on('order:new', (order) => {
      setPendingOrder(order);
      navigation.navigate('IncomingOrder', { order });
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Order Request!',
          body: `Pickup: ${order.pickup?.address || 'Nearby'} • ₹${order.fareBreakdown?.total || ''}`,
          sound: Platform.OS === 'ios' ? 'booking_ring.mp3' : true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: Platform.OS === 'android' ? { seconds: 1, channelId: 'orders-v4' } : null,
      });
    });

    // Location tracking
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locTimer.current = setInterval(async () => {
        try {
          const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setLocation({ latitude: coords.latitude, longitude: coords.longitude });
          if (isOnline) {
            updateLocation(coords.latitude, coords.longitude);
            socket.emit('driver:location', { driverId: driver?._id, lat: coords.latitude, lng: coords.longitude });
          }
        } catch (err) { console.warn(err); }
      }, 5000);
    })();

    return () => {
      socket.disconnect();
      clearInterval(locTimer.current);
    };
  }, [isOnline]);

  const handleToggle = async () => {
    const online = await toggleOnline();
    if (online) {
      await showOnlineNotification();
    } else {
      await hideOnlineNotification();
    }
    Alert.alert(online ? 'You are Online' : 'You are Offline', online ? 'You will now receive order requests.' : 'You will not receive orders now.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {driver?.name?.split(' ')[0]} 👋</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, isOnline && styles.statusDotGreen]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.togglePill}>
            <Text style={[styles.togglePillText, !isOnline && styles.togglePillTextActive]}>OFFLINE</Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggle}
              trackColor={{ false: COLORS.grayLight, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>
          <Text style={[styles.toggleLabel, isOnline && { color: COLORS.error }]}>
            {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningItem}>
            <Text style={styles.earningVal}>₹{earnings?.driverShare || 0}</Text>
            <Text style={styles.earningLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.earningDivider} />
          <View style={styles.earningItem}>
            <Text style={styles.earningVal}>{earnings?.trips || 0}</Text>
            <Text style={styles.earningLabel}>Trips Today</Text>
          </View>
          <View style={styles.earningDivider} />
          <View style={styles.earningItem}>
            <Text style={styles.earningVal}>⭐ {driver?.rating || 5}</Text>
            <Text style={styles.earningLabel}>Rating</Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            showsUserLocation={true}
            showsMyLocationButton={true}
            initialRegion={{
              latitude:       location?.latitude  || 12.9716,
              longitude:      location?.longitude || 77.5946,
              latitudeDelta:  0.05,
              longitudeDelta: 0.05,
            }}
          >
            {location && (
              <Marker coordinate={location} title="You">
                <View style={styles.myMarker}><Text style={{ fontSize: 20 }}>🚛</Text></View>
              </Marker>
            )}
          </MapView>
          {!isOnline && (
            <View style={styles.offlineOverlay}>
              <Text style={styles.offlineText}>You are Offline</Text>
              <Text style={styles.offlineSub}>Toggle switch to go online</Text>
            </View>
          )}
        </View>

        {/* Pro Actions */}
        <Text style={styles.sectionTitle}>Pro Actions</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'cash-multiple',   label: 'Earnings', bg: '#DCFCE7', color: '#16A34A', action: () => navigation.navigate('Earnings') },
            { icon: 'map-marker-path', label: 'Trips',    bg: '#DBEAFE', color: '#2563EB', action: () => navigation.getParent()?.navigate('Trips') },
            { icon: 'account-circle',  label: 'Profile',  bg: '#EDE9FE', color: '#7C3AED', action: () => navigation.navigate('Profile') },
            { icon: 'headset',         label: 'Support',  bg: '#D1FAE5', color: '#059669', action: () => Alert.alert('Support', 'Need help? Call us at +91 98765 43210 or email support@saharalogistics.com') },
          ].map(({ icon, label, bg, color, action }) => (
            <TouchableOpacity key={label} style={styles.quickCard} onPress={action} activeOpacity={0.8}>
              <View style={[styles.quickIcon, { backgroundColor: bg }]}>
                <Icon name={icon} size={30} color={color} />
              </View>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:        { flex: 1, backgroundColor: COLORS.primary },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, padding: 20 },
  greeting:        { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  statusDotGreen:  { backgroundColor: COLORS.success },
  statusText:      { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)' },
  toggleRow:       { alignItems: 'center', gap: 6 },
  togglePill:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 4, gap: 6 },
  togglePillText:  { fontSize: SIZES.xs, fontWeight: '700', color: 'rgba(255,255,255,0.6)', paddingHorizontal: 4 },
  togglePillTextActive: { color: COLORS.white },
  toggleLabel:     { fontSize: 11, color: COLORS.success, textAlign: 'center', fontWeight: '700', letterSpacing: 0.5 },
  container:       { flex: 1, backgroundColor: COLORS.bgLight },
  earningsCard:    { flexDirection: 'row', backgroundColor: COLORS.white, margin: 16, borderRadius: SIZES.radiusLg, padding: 20, elevation: 4 },
  earningItem:     { flex: 1, alignItems: 'center' },
  earningVal:      { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.primary },
  earningLabel:    { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  earningDivider:  { width: 1, backgroundColor: COLORS.grayLight },
  mapContainer:    { marginHorizontal: 16, borderRadius: SIZES.radiusLg, overflow: 'hidden', elevation: 3, height: 220 },
  map:             { flex: 1 },
  myMarker:        { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  offlineOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', alignItems: 'center' },
  offlineText:     { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  offlineSub:      { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  sectionTitle:    { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
  quickActions:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginHorizontal: 16, gap: 14 },
  quickCard:       { width: '47%', backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, paddingVertical: 24, alignItems: 'center', gap: 12, elevation: 3 },
  quickIcon:       { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
  quickLabel:      { fontSize: SIZES.base, color: COLORS.textPrimary, fontWeight: '600' },
});

export default DashboardScreen;

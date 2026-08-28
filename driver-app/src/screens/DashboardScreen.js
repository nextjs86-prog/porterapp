import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Switch,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import { COLORS, SIZES } from '../utils/theme';
import useDriverStore from '../store/useDriverStore';

const SOCKET_URL = 'https://porterapp-7y12.onrender.com';

const DashboardScreen = ({ navigation }) => {
  const { driver, isOnline, toggleOnline, updateLocation, fetchEarnings, earnings } = useDriverStore();
  const [location,    setLocation]    = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const mapRef    = useRef(null);
  const socketRef = useRef(null);
  const locTimer  = useRef(null);

  useEffect(() => {
    fetchEarnings('daily');

    // Socket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('driver:join', driver?._id);
    socket.on('order:new', (order) => {
      setPendingOrder(order);
      navigation.navigate('IncomingOrder', { order });
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
          <Text style={styles.toggleLabel}>{isOnline ? 'GO\nOFFLINE' : 'GO\nONLINE'}</Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            trackColor={{ false: COLORS.grayLight, true: COLORS.success }}
            thumbColor={COLORS.white}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
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

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'cash',    label: 'Earnings', action: () => navigation.navigate('Earnings') },
            { icon: 'history', label: 'Trips',     action: () => navigation.getParent()?.navigate('Trips') },
            { icon: 'account', label: 'Profile',   action: () => navigation.navigate('Profile') },
            { icon: 'headset', label: 'Support',   action: () => Alert.alert('Support', 'Need help? Call us at +91 98765 43210 or email support@saharalogistics.com') },
          ].map(({ icon, label, action }) => (
            <TouchableOpacity key={label} style={styles.quickBtn} onPress={action}>
              <View style={styles.quickIcon}><Icon name={icon} size={22} color={COLORS.primary} /></View>
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
  toggleRow:       { alignItems: 'center', gap: 4 },
  toggleLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontWeight: '700' },
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
  quickActions:    { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16 },
  quickBtn:        { alignItems: 'center', gap: 8 },
  quickIcon:       { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  quickLabel:      { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
});

export default DashboardScreen;

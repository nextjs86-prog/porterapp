import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '../utils/theme';

const { width } = Dimensions.get('window');

const slides = [
  { id: '1', emoji: '📦', title: 'Book a Vehicle', desc: 'Choose from bikes, mini trucks, tempos and large trucks to move your goods.' },
  { id: '2', emoji: '📍', title: 'Real-Time Tracking', desc: 'Track your driver live on the map with turn-by-turn updates.' },
  { id: '3', emoji: '💳', title: 'Easy Payments', desc: 'Pay via UPI, card, net banking or cash on delivery — your choice.' },
];

const OnboardingScreen = ({ navigation }) => {
  const [current, setCurrent] = useState(0);
  const flatRef = useRef(null);

  const next = async () => {
    if (current < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      await AsyncStorage.setItem('onboarding_seen', 'true');
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={slides}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
        keyExtractor={i => i.id}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={next}>
          <Text style={styles.btnText}>{current === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  slide:     { width, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emoji:     { fontSize: 80, marginBottom: 32 },
  title:     { fontSize: SIZES.xxxl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },
  desc:      { fontSize: SIZES.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  footer:    { padding: 32, alignItems: 'center' },
  dots:      { flexDirection: 'row', marginBottom: 24 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.grayLight, marginHorizontal: 4 },
  dotActive: { backgroundColor: COLORS.primary, width: 24 },
  btn:       { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: SIZES.radiusLg, width: '100%', alignItems: 'center' },
  btnText:   { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default OnboardingScreen;


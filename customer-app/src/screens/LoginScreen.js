import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import useAuthStore from '../store/useAuthStore';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const sendOtp = useAuthStore(s => s.sendOtp);

  const handleSend = async () => {
    if (phone.length !== 10) return Alert.alert('Error', 'Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      await sendOtp(phone);
      navigation.navigate('OTP', { phone });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚚</Text>
        <Text style={styles.title}>Welcome to QuickHaul</Text>
        <Text style={styles.sub}>Enter your mobile number to continue</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputRow}>
          <View style={styles.countryCode}><Text style={styles.countryText}>🇮🇳 +91</Text></View>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={COLORS.gray}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bgLight },
  header:      { backgroundColor: COLORS.primary, padding: 40, paddingTop: 80, alignItems: 'center' },
  logo:        { fontSize: 52, marginBottom: 12 },
  title:       { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  sub:         { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  card:        { backgroundColor: COLORS.white, margin: 20, borderRadius: SIZES.radiusLg, padding: 24, elevation: 4 },
  label:       { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
  inputRow:    { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, overflow: 'hidden', marginBottom: 20 },
  countryCode: { backgroundColor: COLORS.bgLight, padding: 14, borderRightWidth: 1, borderRightColor: COLORS.grayLight, justifyContent: 'center' },
  countryText: { fontSize: SIZES.base, color: COLORS.textPrimary },
  input:       { flex: 1, padding: 14, fontSize: SIZES.base, color: COLORS.textPrimary },
  btn:         { backgroundColor: COLORS.primary, padding: 16, borderRadius: SIZES.radius, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  terms:       { fontSize: SIZES.xs, color: COLORS.gray, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});

export default LoginScreen;


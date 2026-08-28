import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import useAuthStore from '../store/useAuthStore';

const OTPScreen = ({ navigation, route }) => {
  const { phone } = route.params;
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef([]);
  const { verifyOtp, sendOtp } = useAuthStore();

  const handleChange = (val, idx) => {
    const updated = [...otp];
    updated[idx] = val;
    setOtp(updated);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return Alert.alert('Error', 'Enter complete 6-digit OTP');
    setLoading(true);
    try {
      await verifyOtp(phone, code, referralCode.trim() || undefined);
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendOtp(phone);
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.sub}>6-digit OTP sent to +91 {phone}</Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={r => inputs.current[i] = r}
            style={[styles.otpBox, digit && styles.otpBoxFilled]}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={v => handleChange(v, i)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i-1]?.focus();
            }}
          />
        ))}
      </View>

      <TextInput
        style={styles.referralInput}
        placeholder="Referral code (optional)"
        placeholderTextColor={COLORS.gray}
        autoCapitalize="characters"
        value={referralCode}
        onChangeText={setReferralCode}
      />

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleVerify} disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend}>
        <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bgLight, padding: 24, paddingTop: 60 },
  back:         { marginBottom: 32 },
  backText:     { color: COLORS.primary, fontSize: SIZES.base },
  title:        { fontSize: SIZES.xxxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  sub:          { fontSize: SIZES.base, color: COLORS.textSecondary, marginBottom: 40 },
  otpRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  otpBox:       { width: 50, height: 56, borderWidth: 1.5, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, textAlign: 'center', fontSize: SIZES.xxl, color: COLORS.textPrimary, backgroundColor: COLORS.white },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: '#EFF6FF' },
  referralInput: { borderWidth: 1.5, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, padding: 14, fontSize: SIZES.base, color: COLORS.textPrimary, backgroundColor: COLORS.white, marginBottom: 20 },
  btn:          { backgroundColor: COLORS.primary, padding: 16, borderRadius: SIZES.radius, alignItems: 'center', marginBottom: 20 },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  resend:       { textAlign: 'center', color: COLORS.primary, fontSize: SIZES.base, fontWeight: '600' },
  resendDisabled: { color: COLORS.gray },
});

export default OTPScreen;


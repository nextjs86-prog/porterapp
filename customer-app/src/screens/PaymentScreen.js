import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';

const PAYMENT_METHODS = [
  { id: 'upi',       label: 'UPI',          icon: 'bank-transfer', desc: 'GPay, PhonePe, Paytm' },
  { id: 'card',      label: 'Credit/Debit Card', icon: 'credit-card', desc: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking',label: 'Net Banking',   icon: 'bank',          desc: 'All major banks' },
  { id: 'cod',       label: 'Cash on Delivery', icon: 'cash',       desc: 'Pay when delivered' },
];

const PaymentScreen = ({ navigation, route }) => {
  const { orderId, amount, nextScreen = 'Confirmation' } = route.params;
  const user = useAuthStore(s => s.user);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [promoCode,      setPromoCode]      = useState('');
  const [loading,        setLoading]        = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      if (selectedMethod === 'cod') {
        await api.post('/payment/cod-confirm', { orderId });
        navigation.replace(nextScreen, { orderId });
        return;
      }

      const { razorpayOrderId, amount: amt, key } = (await api.post('/payment/create-order', { orderId })).data;

      const options = {
        description:  'QuickHaul Logistics',
        image:        'https://your-logo.png',
        currency:     'INR',
        key,
        amount:       amt,
        order_id:     razorpayOrderId,
        name:         'QuickHaul',
        prefill:      { contact: user?.phone, email: user?.email || '' },
        theme:        { color: COLORS.primary },
      };

      const data = await RazorpayCheckout.open(options);
      await api.post('/payment/verify', {
        razorpayOrderId,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
        orderId,
      });

      navigation.replace(nextScreen, { orderId });
    } catch (err) {
      Alert.alert('Payment Failed', err.description || err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountVal}>₹{amount}</Text>
          <Text style={styles.orderId}>Order #{orderId?.slice(-8)?.toUpperCase()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodRow, selectedMethod === m.id && styles.methodRowActive]}
            onPress={() => setSelectedMethod(m.id)}
          >
            <Icon name={m.icon} size={24} color={selectedMethod === m.id ? COLORS.primary : COLORS.textSecondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.methodLabel}>{m.label}</Text>
              <Text style={styles.methodDesc}>{m.desc}</Text>
            </View>
            <View style={[styles.radio, selectedMethod === m.id && styles.radioActive]}>
              {selectedMethod === m.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>₹{amount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handlePay} disabled={loading}
        >
          <Text style={styles.payBtnText}>{loading ? 'Processing...' : `Pay ₹${amount}`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bgLight },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.primary, paddingTop: 48 },
  headerTitle:    { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white },
  body:           { flex: 1 },
  amountCard:     { backgroundColor: COLORS.primary, margin: 16, padding: 24, borderRadius: SIZES.radiusLg, alignItems: 'center' },
  amountLabel:    { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)' },
  amountVal:      { fontSize: 42, fontWeight: '700', color: COLORS.white, marginVertical: 8 },
  orderId:        { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.6)' },
  sectionTitle:   { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginBottom: 8 },
  methodRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: 'transparent' },
  methodRowActive:{ borderColor: COLORS.primary, backgroundColor: '#EFF6FF' },
  methodLabel:    { fontSize: SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  methodDesc:     { fontSize: SIZES.xs, color: COLORS.textSecondary },
  radio:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.grayLight, justifyContent: 'center', alignItems: 'center' },
  radioActive:    { borderColor: COLORS.primary },
  radioDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  footer:         { backgroundColor: COLORS.white, padding: 16, elevation: 8 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel:     { fontSize: SIZES.base, color: COLORS.textSecondary },
  totalVal:       { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.primary },
  payBtn:         { backgroundColor: COLORS.primary, padding: 16, borderRadius: SIZES.radiusLg, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText:     { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default PaymentScreen;


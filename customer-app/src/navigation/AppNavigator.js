import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/theme';

import SplashScreen       from '../screens/SplashScreen';
import OnboardingScreen   from '../screens/OnboardingScreen';
import LoginScreen        from '../screens/LoginScreen';
import OTPScreen          from '../screens/OTPScreen';
import HomeScreen         from '../screens/HomeScreen';
import BookingScreen      from '../screens/BookingScreen';
import SearchDriverScreen from '../screens/SearchDriverScreen';
import TrackingScreen     from '../screens/TrackingScreen';
import PaymentScreen      from '../screens/PaymentScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ProfileScreen      from '../screens/ProfileScreen';

import useAuthStore from '../store/useAuthStore';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.grayLight, height: 60, paddingBottom: 8 },
      tabBarIcon: ({ color, size }) => {
        const icons = { Home: 'home', Orders: 'clipboard-list', Profile: 'account' };
        return <Icon name={icons[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home"    component={HomeScreen}         />
    <Tab.Screen name="Orders"  component={OrderHistoryScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen}      />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash"       component={SplashScreen}       />
        <Stack.Screen name="Onboarding"   component={OnboardingScreen}   />
        <Stack.Screen name="Login"        component={LoginScreen}        />
        <Stack.Screen name="OTP"          component={OTPScreen}          />
        <Stack.Screen name="Main"         component={MainTabs}           />
        <Stack.Screen name="Booking"      component={BookingScreen}      />
        <Stack.Screen name="SearchDriver" component={SearchDriverScreen} />
        <Stack.Screen name="Tracking"     component={TrackingScreen}     />
        <Stack.Screen name="Payment"      component={PaymentScreen}      />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

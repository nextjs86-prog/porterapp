import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen       from './src/screens/SplashScreen';
import OnboardingScreen   from './src/screens/OnboardingScreen';
import LoginScreen        from './src/screens/LoginScreen';
import OTPScreen          from './src/screens/OTPScreen';
import HomeScreen         from './src/screens/HomeScreen';
import BookingScreen      from './src/screens/BookingScreen';
import SearchDriverScreen from './src/screens/SearchDriverScreen';
import TrackingScreen     from './src/screens/TrackingScreen';
import PaymentScreen      from './src/screens/PaymentScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import ProfileScreen      from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const COLORS = { primary: '#1E3A8A', gray: '#94A3B8', white: '#FFFFFF', grayLight: '#E2E8F0' };

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.grayLight,
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home:    focused ? 'home'            : 'home-outline',
            Orders:  focused ? 'list'            : 'list-outline',
            Profile: focused ? 'person'          : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}         />
      <Tab.Screen name="Orders"  component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen}      />
    </Tab.Navigator>
  );
}

export default function App() {
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
}

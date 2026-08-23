import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/theme';

import SplashScreen        from '../screens/SplashScreen';
import LoginScreen         from '../screens/LoginScreen';
import OTPScreen           from '../screens/OTPScreen';
import RegisterScreen      from '../screens/RegisterScreen';
import DashboardScreen     from '../screens/DashboardScreen';
import IncomingOrderScreen from '../screens/IncomingOrderScreen';
import NavigationScreen    from '../screens/NavigationScreen';
import EarningsScreen      from '../screens/EarningsScreen';
import ProfileScreen       from '../screens/ProfileScreen';

import useDriverStore from '../store/useDriverStore';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: { backgroundColor: COLORS.white, height: 60, paddingBottom: 8 },
      tabBarIcon: ({ color, size }) => {
        const icons = { Dashboard: 'view-dashboard', Earnings: 'cash', Profile: 'account' };
        return <Icon name={icons[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen}  />
    <Tab.Screen name="Earnings"  component={EarningsScreen}   />
    <Tab.Screen name="Profile"   component={ProfileScreen}    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const isLoggedIn = useDriverStore(s => s.isLoggedIn);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash"         component={SplashScreen}        />
        <Stack.Screen name="Login"          component={LoginScreen}         />
        <Stack.Screen name="OTP"            component={OTPScreen}           />
        <Stack.Screen name="Register"       component={RegisterScreen}      />
        <Stack.Screen name="Main"           component={MainTabs}            />
        <Stack.Screen name="IncomingOrder"  component={IncomingOrderScreen} />
        <Stack.Screen name="Navigation"     component={NavigationScreen}    />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

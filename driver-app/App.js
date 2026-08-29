import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    if (Platform.OS === 'android') {
      // Android locks a channel's sound/importance at creation time — changing
      // the config here won't affect a channel id that already exists on a
      // device from an earlier build, hence the new id (v3, now with the
      // custom chime instead of the system default sound).
      Notifications.setNotificationChannelAsync('orders-v3', {
        name: 'New Orders',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'notification.wav',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }, []);

  return <AppNavigator />;
}

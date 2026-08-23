const admin = require('firebase-admin');

let initialized = false;

const initFirebase = () => {
  if (initialized) return;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  initialized = true;
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    initFirebase();
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) {
    console.error('FCM error:', err.message);
  }
};

const sendToMultiple = async (tokens, title, body, data = {}) => {
  if (!tokens.length) return;
  initFirebase();
  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens,
  };
  try {
    await admin.messaging().sendEachForMulticast(message);
  } catch (err) {
    console.error('FCM multicast error:', err.message);
  }
};

module.exports = { sendPushNotification, sendToMultiple };

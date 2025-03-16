import * as Notifications from "expo-notifications";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { Platform } from "react-native";
import Constants from "expo-constants";

// 📌 Kullanıcıdan bildirim izni al ve FCM token'ı döndür
export async function registerForPushNotifications() {
  console.log("🚀 registerForPushNotifications() çağrıldı!"); // EKLEDİK
  // Expo istemcisinde değilsek token alınmaz
  console.log("Constants:", Constants);
  console.log("🚀 registerForPushNotifications() çağrıldı!");
  console.log("Constants.isDevice:", Constants.isDevice);
  const isRealDevice = typeof Constants.isDevice === "boolean"
    ? Constants.isDevice
    : (Platform.OS === "android" || Platform.OS === "ios");

  if (!isRealDevice) {
    console.log("📵 Push bildirimleri yalnızca gerçek cihazda çalışır.");
    return null;
  }

  let { status } = await Notifications.getPermissionsAsync();
  console.log("🔍 Bildirim izni durumu:", status);
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      console.log("🚫 Bildirim izni reddedildi.");
      return null;
    }
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log("📌 Expo Project ID:", projectId); // ✅ Test için ekledik
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    console.log("📌 Expo Push Token:", token); // ✅ Test için ekledik
    if (!token) {
      console.log("❌ Token alınamadı.");
      return null;
    }

    console.log("✅ FCM Token:", token);
    return token;
  } catch (error) {
    console.error("❌ Token alma hatası:", error);
    return null;
  }
}

// 📌 Firestore'a kullanıcının FCM token'ını kaydet
export async function saveTokenToFirestore(userId: string, token: string) {
  if (!userId || !token) {
    console.log("❌ Kullanıcı ID veya token eksik.");
    return;
  }

  try {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);

    await setDoc(
      userRef,
      { fcmToken: token },
      { merge: true } // Veriyi silmeden günceller
    );

    console.log(`✅ Token Firestore'a kaydedildi: ${token}`);
  } catch (error) {
    console.error("❌ Firestore token kaydetme hatası:", error);
  }
}

export async function saveNotificationPreferences(userId: string) {
  const db = getFirestore();
  const preferencesRef = doc(db, "notification_preferences", userId);

  const defaultPreferences = {
    comment: true,
    reply: true,
    follow: true,
    book: true,
    chapter: true,
  };

  try {
    await setDoc(preferencesRef, defaultPreferences, { merge: true });
    console.log(`✅ Kullanıcı ${userId} için bildirim tercihleri kaydedildi.`);
  } catch (error) {
    console.error("❌ Firestore bildirim tercihleri kaydetme hatası:", error);
  }
}
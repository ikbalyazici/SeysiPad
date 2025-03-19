import * as Notifications from "expo-notifications";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { Platform } from "react-native";
import Constants from "expo-constants";

// 📌 Kullanıcıdan bildirim izni al ve FCM token'ı döndür
export async function registerForPushNotifications() {
  const isRealDevice = typeof Constants.isDevice === "boolean"
    ? Constants.isDevice
    : (Platform.OS === "android" || Platform.OS === "ios");

  if (!isRealDevice) {
    return null;
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      return null;
    }
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    if (!token) {
      return null;
    }

    return token;
  } catch (error) {
    return null;
  }
}

// 📌 Firestore'a kullanıcının FCM token'ını kaydet
export async function saveTokenToFirestore(userId: string, token: string) {
  if (!userId || !token) return;

  try {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    // 📌 Mevcut token'ı kontrol et
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.fcmToken === token) {
        return; // Aynı token varsa tekrar kaydetmeye gerek yok
      }
    }

    // 📌 Token değiştiyse kaydet
    await setDoc(userRef, { fcmToken: token }, { merge: true });
  } catch (error) {
    console.error("❌ Token kaydedilirken hata oluştu:", error);
  }
}

export async function saveNotificationPreferences(userId: string) {
  if (!userId) return;

  const db = getFirestore();
  const preferencesRef = doc(db, "notification_preferences", userId);
  const preferencesSnap = await getDoc(preferencesRef);

  // 📌 Eğer kullanıcıya ait bildirim tercihleri varsa tekrar kaydetme
  if (preferencesSnap.exists()) {
    return;
  }

  const defaultPreferences = {
    new_comment: true,
    reply: true,
    follow: true,
    book: true,
    chapter: true,
  };

  try {
    await setDoc(preferencesRef, defaultPreferences);
  } catch (error) {
    console.error("❌ Bildirim tercihleri kaydedilirken hata oluştu:", error);
  }
}
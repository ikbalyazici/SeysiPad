import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import Expo from "expo-server-sdk"; // ✅ Hata burada düzeltiliyor!

admin.initializeApp();

// Tetikleyicileri içe aktar
import {updateReadCounts} from "./triggers/updateReadCounts";

exports.updateReadCounts = updateReadCounts;

export const deleteUnverifiedUsers = onSchedule("every 10 minutes", async () => {
  const now = Date.now();
  const threshold = now - 10 * 60 * 1000;

  try {
    const auth = admin.auth();
    const db = admin.firestore();
    const storage = admin.storage().bucket();

    // Tüm kullanıcıları getir
    const listUsersResult = await auth.listUsers();
    const usersToDelete = listUsersResult.users
      .filter(
        (user) =>
          !user.emailVerified &&
          user.metadata.creationTime &&
          new Date(user.metadata.creationTime).getTime() < threshold
      )
      .map((user) => user.uid);

    if (usersToDelete.length > 0) {
      for (const uid of usersToDelete) {
        try {
          // Kullanıcının Firestore'daki verilerini sil
          await db.collection("users").doc(uid).delete();
          const querySnapshot = await db.collection("usernames").where("uid", "==", uid).get();
          querySnapshot.forEach(async (doc) => {
            await doc.ref.delete();
          });

          // Kullanıcının profil fotoğrafını Firebase Storage'dan sil
          await storage.deleteFiles({prefix: `profile_images/${uid}/`});

          console.log(`✅ Kullanıcı ${uid} ve tüm verileri temizlendi.`);
        } catch (userError) {
          console.error(`❌ Kullanıcı ${uid} verileri temizlenirken hata oluştu:`, userError);
        }
      }

      // Kullanıcıları Firebase Authentication'dan sil
      await auth.deleteUsers(usersToDelete);
      console.log(`🗑️ ${usersToDelete.length} doğrulanmamış kullanıcı silindi.`);
    } else {
      console.log("✅ Silinecek kullanıcı yok.");
    }
  } catch (error) {
    console.error("❌ Kullanıcıları silerken hata oluştu:", error);
  }
});

export const deleteOldNotifications = onSchedule("every day 00:00", async () => {
  const db = admin.firestore();
  const now = Date.now();
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000; // 3 gün önce

  try {
    const notificationsRef = db.collection("notifications");
    const snapshot = await notificationsRef
      .where("read", "==", true)
      .where("createdAt", "<", new Date(threeDaysAgo))
      .get();

    if (snapshot.empty) {
      console.log("✅ Silinecek eski bildirim yok.");
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`🗑️ ${snapshot.size} eski bildirim başarıyla silindi.`);
  } catch (error) {
    console.error("❌ Eski bildirimleri silerken hata oluştu:", error);
  }
});

// 📌 Firestore'daki `notifications` koleksiyonuna yeni bir bildirim eklendiğinde çalışır.
export const sendPushNotification = onDocumentCreated(
  "notifications/{notificationId}",
  async (event) => {
    const db = admin.firestore();
    const expo = new Expo(); // ✅ Doğru kullanım
    const snapshot = event.data;
    if (!snapshot) return;

    const notificationData = snapshot.data();
    const recipientId: string = notificationData.recipientUid; // Bildirim alacak kullanıcı
    const type: string = notificationData.type; // Örn: "comment", "reply", "follow", "book", "chapter"

    console.log(`📢 Yeni bildirim: ${type} -> Kullanıcı: ${recipientId}`);

    // 📌 Kullanıcının Firestore'daki bildirim tercihlerini al
    const preferencesSnap = await db.collection("notification_preferences").doc(recipientId).get();
    const preferences = preferencesSnap.exists ? preferencesSnap.data() : {};

    // 📌 Kullanıcı bu bildirim türünü kapattıysa işlemi iptal et
    const isEnabled = preferences?.[type] ?? true; // Varsayılan: açık (true)
    if (!isEnabled) {
      console.log(`🚫 Kullanıcı ${recipientId}, '${type}' bildirimlerini kapattı.`);
      return;
    }

    // 📌 Kullanıcının Firestore'daki Expo Push Token'ını al
    const userSnap = await db.collection("users").doc(recipientId).get();
    const senderName = (await db.collection("users").doc(notificationData.senderUid).get()).data()?.username;
    if (!userSnap.exists) {
      console.log(`❌ Kullanıcı ${recipientId} bulunamadı.`);
      return;
    }

    const userData = userSnap.data();
    const pushToken: string | undefined = userData?.fcmToken;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      console.log(`❌ Kullanıcının Expo push token'ı geçersiz veya eksik: ${pushToken}`);
      return;
    }

    const message = {
      to: pushToken,
      sound: "default",
      title: notificationData.title || "HEYY!",
      body: senderName + notificationData.text, // 🔥 Bildirim mesajı formatlandı
      data: {type, ...notificationData},
    };

    try {
      // 📌 Expo Sunucusuna Bildirim Gönder
      const response = await expo.sendPushNotificationsAsync([message]);
      console.log("📨 Bildirim gönderildi:", response);
    } catch (error) {
      console.error("❌ Bildirim gönderme hatası:", error);
    }
  }
);

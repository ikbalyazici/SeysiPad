import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();

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

          // 📌 Gelecekte eklenecek içerikleri de temizleme
          // Kullanıcının yüklediği kitapları sil
          // const booksSnapshot = await db.collection("books").where("ownerUid", "==", uid).get();
          // for (const book of booksSnapshot.docs) {
          //   await book.ref.delete();
          //   await storage.deleteFiles({ prefix: `books/${book.id}/cover_page/` }); // Kapak fotoğrafı
          // }

          // Kullanıcının yazdığı bölümleri (chapters) sil
          // const chaptersSnapshot = await db.collection("chapters").where("authorUid", "==", uid).get();
          // for (const chapter of chaptersSnapshot.docs) {
          //   await chapter.ref.delete();
          // }

          // Kullanıcının yaptığı yorumları sil
          // const commentsSnapshot = await db.collection("comments").where("userUid", "==", uid).get();
          // for (const comment of commentsSnapshot.docs) {
          //   await comment.ref.delete();
          // }

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

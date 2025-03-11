import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const updateReadCounts = onDocumentWritten(
  "user_chapter_progress/{progressId}",
  async (event) => {
    interface ChapterProgress {
        status: string;
        chapterId: string;
        bookId: string;
      }
    const before = event.data?.before?.data() as ChapterProgress | null;
    const after = event.data?.after?.data() as ChapterProgress | null;

    if (!before && after && after.status === "true") {
      await modifyReadCounts(after.chapterId, after.bookId, 1);
    } else if (before && !after && before.status === "true") {
      await modifyReadCounts(before.chapterId, before.bookId, -1);
    } else if (before && after && before.status !== after.status) {
      const increment = after.status === "true" ? 1 : -1;
      await modifyReadCounts(after.chapterId, after.bookId, increment);
    }
  }
);

/**
 * Kullanıcının okuma durumunu günceller ve ilgili kitap ile bölümün okunma sayısını değiştirir.
 * @param {string} chapterId - Güncellenen bölümün ID'si.
 * @param {string} bookId - Güncellenen kitabın ID'si.
 * @param {number} increment - Okuma sayısındaki değişiklik (+1 veya -1).
 */
async function modifyReadCounts(chapterId: string, bookId: string, increment: number) {
  const chapterRef = db.collection("chapters").doc(chapterId);
  const bookRef = db.collection("books").doc(bookId);

  await db.runTransaction(async (transaction) => {
    const chapterDoc = await transaction.get(chapterRef);
    const bookDoc = await transaction.get(bookRef);

    if (chapterDoc.exists) {
      transaction.update(chapterRef, {
        readCount: admin.firestore.FieldValue.increment(increment),
      });
    }

    if (bookDoc.exists) {
      transaction.update(bookRef, {
        totalReads: admin.firestore.FieldValue.increment(increment),
      });
    }
  });
}

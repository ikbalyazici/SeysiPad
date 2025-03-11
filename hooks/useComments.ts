import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../constants/firebaseConfig";
import { Alert } from "react-native";
import { useLanguage } from "@/context/LanguageContext";

export type Comment = {
  id: string;
  chapterId: string;
  text: string;
  sentenceId: string | null;
  createdAt: any;
  authorUid: string;
  author: {
    username: string;
    photoURL: string | null;
  };
  parentId: string | null;
  replies: Comment[];
};

export function useComments(chapterId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    if (!chapterId) return;

    const q = query(
      collection(db, "comments"),
      where("chapterId", "==", chapterId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        chapterId: doc.data().chapterId,
        text: doc.data().text,
        sentenceId: doc.data().sentenceId || null,
        createdAt: doc.data().createdAt,
        authorUid: doc.data().authorUid || null,
        parentId: doc.data().parentId || null,
      }));

      // Kullanıcı UID'lerini çek
      const authorUids = [
        ...new Set(rawComments.map((comment) => comment.authorUid).filter((uid) => uid)),
      ];

      let userMap: Record<string, { username: string; photoURL: string | null }> = {};

      if (authorUids.length > 0) {
        try {
          const usersQuery = query(collection(db, "users"), where("__name__", "in", authorUids));
          const usersSnapshot = await getDocs(usersQuery);

          usersSnapshot.forEach((doc) => {
            userMap[doc.id] = {
              username: doc.data().username,
              photoURL: doc.data().photoURL || null,
            };
          });
        } catch (error) {
          console.error(t("kulcekhata"), error);
        }
      }

      // Kullanıcı bilgilerini yorumlara ekleyelim
      const commentsWithAuthors = rawComments.map((comment) => ({
        ...comment,
        author: userMap[comment.authorUid] || { username: t("bilinmeyen"), photoURL: null },
      }));

      // Yorumları gruplama
      const groupedComments: Record<string, any[]> = {};
      const topLevelComments: any[] = [];

      commentsWithAuthors.forEach((comment) => {
        if (comment.parentId) {
          if (!groupedComments[comment.parentId]) {
            groupedComments[comment.parentId] = [];
          }
          groupedComments[comment.parentId].push(comment);
        } else {
          topLevelComments.push(comment);
        }
      });

      // Ana yorumlara bağlı yanıtları ekleyelim
      const finalComments = topLevelComments.map((comment) => ({
        ...comment,
        replies: groupedComments[comment.id] || [],
      }));

      setComments(finalComments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chapterId]);

  // Yorum ekleme (Normal Yorum ve Yanıt)
  const addComment = async (text: string, sentenceId: string | null = null, parentId: string | null = null) => {
    if (!text.trim() || !auth.currentUser) return;
  
    const senderUid = auth.currentUser.uid;
    const createdAt = new Date();
  
    // 📌 Firestore'a yorum ekle ve ID al
    const commentRef = await addDoc(collection(db, "comments"), {
      chapterId,
      text,
      sentenceId: sentenceId || null,
      createdAt,
      authorUid: senderUid,
      parentId: parentId || null, // Yanıtsa parentId olur
    });
  
    const commentId = commentRef.id; // 🔥 Firestore'un otomatik oluşturduğu ID
  
    // 📌 **Bildirimi kaydet**
    try {
      let recipientUid: string | null = null;
      let bookId: string | null = null;
  
      // 🔥 Bölümün bağlı olduğu kitabın sahibini al (Ana yorumsa)
      if (!parentId) {
        const chapterDoc = await getDoc(doc(db, "chapters", chapterId));
        if (chapterDoc.exists()) {
          recipientUid = chapterDoc.data().authorUid;
          bookId = chapterDoc.data().bookId;
        }
  
        if (recipientUid) {
          await sendNotification(recipientUid, senderUid, "new_comment", text, chapterId, bookId!, false, commentId);
        }
      } 
      // 🔥 Yanıt ekleniyorsa (Yanıt verilen kişinin UID'sini al)
      else {
        const parentCommentDoc = await getDoc(doc(db, "comments", parentId));
        if (parentCommentDoc.exists()) {
          recipientUid = parentCommentDoc.data().authorUid;
        }
  
        // **Yanıtın kitabını öğrenmek için ana yorumun bölümünü al**
        if (recipientUid) {
          const chapterDoc = await getDoc(doc(db, "chapters", chapterId));
          if (chapterDoc.exists()) {
            bookId = chapterDoc.data().bookId;
          }
  
          await sendNotification(recipientUid, senderUid, "reply", text, chapterId, bookId!, false, commentId);
        }
      }
    } catch (error) {
      console.error(t("bildirimgonderhata"), error);
    }
  };

  // Yorum silme
  // Yorum silme
  const deleteComment = async (commentId: string, authorUid: string, parentId: string | null = null) => {
    if (!auth.currentUser || auth.currentUser.uid !== authorUid) {
      Alert.alert(t("yetkisizislem"), t("yorumsilemen"));
      return;
    }

    const alertMessage = parentId
      ? t("yanıtsilcenmi")
      : t("yorumsilcenmi");

    Alert.alert(t("silonay"), alertMessage, [
      { text: t("iptal"), style: "cancel" },
      {
        text: t("sil"),
        onPress: async () => {
          try {
            // Yorumun kendisini sil
            await deleteDoc(doc(db, "comments", commentId));

            if (!parentId) {
              // Ana yorum ise, yanıtları da sil
              const repliesQuery = query(collection(db, "comments"), where("parentId", "==", commentId));
              const repliesSnapshot = await getDocs(repliesQuery);
              const deletePromises = repliesSnapshot.docs.map((replyDoc) => deleteDoc(replyDoc.ref));
              await Promise.all(deletePromises);
            }

            //Alert.alert("Başarılı", "Yorum silindi.");
          } catch (err) {
            console.error(t("yshata"), err);
            Alert.alert(t("hata"), t("yorumsilhata"));
          }
        },
      },
    ]);
  };
  /**
   * 🔥 Bildirim oluşturma fonksiyonu
   * @param recipientUid - Bildirimi alacak kullanıcı
   * @param senderUid - Yorumu yapan kullanıcı
   * @param type - "reply" veya "new_comment"
   * @param text - Yoruma önizleme amaçlı metin
   * @param chapterId - Bölüm ID'si
   * @param bookId - Kitap ID'si
   * @param read - Okundu bilgisi
   * @param commentId - Hedef yorum
   */
  const sendNotification = async (recipientUid: string, senderUid: string, type: "reply" | "new_comment", text: string, chapterId: string, bookId: string, read: boolean, commentId:string) => {
    if (!recipientUid || recipientUid === senderUid) return; // Kendi yorumuna yanıt veriyorsa bildirim gönderme

    await addDoc(collection(db, "notifications"), {
      recipientUid,
      senderUid,
      type,
      text,
      chapterId,
      bookId,
      createdAt: new Date(),
      read,
      commentId,
    });
  };

  return { comments, loading, addComment, deleteComment, sendNotification };
}

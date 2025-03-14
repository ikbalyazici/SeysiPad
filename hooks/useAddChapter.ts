import { useState } from "react";
import { db } from "../constants/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./useAuth";
import { useLanguage } from "@/context/LanguageContext";

export function useAddChapter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const addChapter = async (bookId: string, title: string, content: string) => {
    if (!user) return { success: false, message: t("girisyapin") };
    if (!bookId) return { success: false, message: t("gecersizkitapid")};
    if (!title || !content) return { success: false, message: t("bosolamazlar") };

    setLoading(true);
    setError(null);

    try {
      const docRef = await addDoc(collection(db, "chapters"), {
        bookId, // Kitap ile bağlantıyı sağlıyoruz
        authorUid: user.uid,
        title,
        content,
        createdAt: serverTimestamp(),
      });

      return { success: true, chapterId: docRef.id };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { addChapter, loading, error };
}

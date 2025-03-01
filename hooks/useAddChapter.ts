import { useState } from "react";
import { db } from "../constants/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./useAuth";

export function useAddChapter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChapter = async (bookId: string, title: string, content: string) => {
    if (!user) return { success: false, message: "Giriş yapmalısınız." };
    if (!bookId) return { success: false, message: "Geçersiz kitap ID." };
    if (!title || !content) return { success: false, message: "Başlık ve içerik boş olamaz." };

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "chapters"), {
        bookId, // Kitap ile bağlantıyı sağlıyoruz
        authorUid: user.uid,
        title,
        content,
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { addChapter, loading, error };
}

import { db } from "../constants/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useLanguage } from "@/context/LanguageContext";

export const addBook = async (userUid: string, title: string, description: string) => {
    const { t } = useLanguage();
  if (!userUid || !title.trim()) {
    return { success: false, message: t("gecersizgiris") };
  }

  try {
    const docRef = await addDoc(collection(db, "books"), {
      title,
      authorUid: userUid,
      createdAt: serverTimestamp(),
      description,
    });

    return { success: true, bookId: docRef.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

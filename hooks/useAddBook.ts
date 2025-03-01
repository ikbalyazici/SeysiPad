import { db } from "../constants/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const addBook = async (userUid: string, title: string, description: string) => {
  if (!userUid || !title.trim()) {
    return { success: false, message: "Geçersiz giriş." };
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

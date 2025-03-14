import { db } from "../constants/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const addBook = async (userUid: string, title: string, description: string, 
                              totalLikes: number, totalReads: number, selectedCategories: string[]) => {
  if (!userUid || !title.trim()) {
    return { success: false, message: "Geçersiz giriş" }; // Sabit string kullan
  }

  try {
    const docRef = await addDoc(collection(db, "books"), {
      title,
      authorUid: userUid,
      createdAt: serverTimestamp(),
      description,
      totalLikes,
      totalReads,
      selectedCategories,
    });

    return { success: true, bookId: docRef.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

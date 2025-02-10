import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../constants/firebaseConfig";

export const addChapter = async (title: string, content: string) => {
  try {
    // Mevcut bölümleri sıraya göre al
    const chaptersRef = collection(db, "chapters");
    const q = query(chaptersRef, orderBy("index", "desc"));
    const snapshot = await getDocs(q);

    // En son eklenen bölümü bul
    const lastIndex = snapshot.docs.length > 0 ? snapshot.docs[0].data().index : 0;

    // Yeni bölümü 1 artan index ile ekle
    await addDoc(chaptersRef, {
      title,
      content,
      index: lastIndex + 1,
      createdAt: new Date(),
    });

    console.log("Yeni bölüm eklendi!");
  } catch (error) {
    console.error("Bölüm ekleme hatası:", error);
  }
};

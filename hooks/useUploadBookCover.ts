import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage, db } from "../constants/firebaseConfig";
import { updateDoc, doc } from "firebase/firestore";
import { useLanguage } from "@/context/LanguageContext";

export const useUploadBookCover = () => {
  const { t } = useLanguage();

  const uploadBookCover = async (bookId: string, imageUri: string) => {
    try {
      if (!imageUri) {
        return { success: false, message: t("resimsecilmedi")};
      }

      // 📌 1. Resmi Storage'a yükleme için hazırla
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `book_covers/${bookId}/cover.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      // 📌 2. Yükleme tamamlanınca URL'yi al
      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);

      // 📌 3. Firestore'da `books/{bookId}` dokümanını güncelle
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, { coverURL: downloadURL });

      return { success: true, url: downloadURL };
    } catch (error) {
      console.error(t("kapakyuklehata"), error);
      return { success: false, message: t("kapakyuklehata") };
    }
  };

  return { uploadBookCover };
};

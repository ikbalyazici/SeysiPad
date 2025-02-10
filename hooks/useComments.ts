import { useEffect, useState } from "react";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../constants/firebaseConfig";

export function useComments(chapterId: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) return;

    const q = query(collection(db, "comments"), where("chapterId", "==", chapterId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setComments(fetchedComments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chapterId]);

  const addComment = async (text: string, sentenceId: string | null = null) => {
    if (!text.trim()) return;
    await addDoc(collection(db, "comments"), {
      chapterId,
      text,
      sentenceId, // ✅ Artık burada tanımlı olduğu için hata vermez
      createdAt: new Date(),
    });
  };

  return { comments, loading, addComment };
}

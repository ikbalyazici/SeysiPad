import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../constants/firebaseConfig";

export function useFetchChapters(bookId?: string) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    setError(null);
    
    const q = query(
      collection(db, "chapters"),
      where("bookId", "==", bookId), // Sadece belirli kitabın bölümlerini alıyoruz
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setChapters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [bookId]);

  return { chapters, loading, error };
}

import { useState, useEffect } from "react";
import { db } from "../constants/firebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export const useFetchBooks = (onlyUserBooks: boolean = false, p0?: string) => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);

      try {
        let booksQuery;
        if (onlyUserBooks && p0) {
          // Kullanıcının kitaplarını getir
          booksQuery = query(
            collection(db, "books"),
            where("authorUid", "==", p0),
            orderBy("createdAt", "desc")
          );
        } else {
          // Tüm kitapları getir
          booksQuery = query(collection(db, "books"), orderBy("createdAt", "desc"));
        }

        const querySnapshot = await getDocs(booksQuery);
        const booksList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBooks(booksList);
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    };

    fetchBooks();
  }, [onlyUserBooks, p0]);

  return { books, loading, error };
};

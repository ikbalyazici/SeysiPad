import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../constants/firebaseConfig";

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribeNotifications = () => {}; // İlk başta boş bir fonksiyon

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // Önceki bildirim dinleyicisini kapat
      unsubscribeNotifications();

      if (user) {
        const q = query(
          collection(db, "notifications"),
          where("recipientUid", "==", user.uid),
          where("read", "==", false)
        );

        unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          setUnreadCount(snapshot.size);
        });
      } else {
        setUnreadCount(0); // Kullanıcı çıkış yapınca sayıyı sıfırla
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotifications();
    };
  }, []);

  return { unreadCount };
}

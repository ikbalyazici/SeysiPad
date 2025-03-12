import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { db, auth } from "../../constants/firebaseConfig";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, getDoc, onSnapshot, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { FontAwesome } from "@expo/vector-icons"; // 👍 Beğeni ikonu için
import { useTheme } from "@/hooks/useThemeContext";

const LikeButton = ({ contentId, bookId }: { contentId: string; bookId?: string }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const userId = auth.currentUser?.uid;
  const { theme } = useTheme();

  useEffect(() => {
    if (!userId) return;
    
    const q = query(collection(db, "likes"), where("contentId", "==", contentId));

    const unsubscribe = onSnapshot(q, snapshot => {
      setLikeCount(snapshot.size);

      // Kullanıcının beğenip beğenmediğini kontrol et
      const userLiked = snapshot.docs.some(doc => doc.data().userId === userId);
      setLiked(userLiked);
    });

    return () => unsubscribe();
  }, [userId, contentId]);

  const toggleLike = async () => {
    if (!auth.currentUser?.uid) return;

    const userId = auth.currentUser.uid;
    const likeRef = doc(db, "likes", `${contentId}_${userId}`);
    const chapterRef = doc(db, "chapters", contentId);
    const bookRef = bookId ? doc(db, "books", bookId) : null;

    const likeSnapshot = await getDocs(
      query(collection(db, "likes"), where("contentId", "==", contentId), where("userId", "==", userId))
    );

    const isLiked = !likeSnapshot.empty;

    if (isLiked) {
      // Beğeniyi kaldır
      await deleteDoc(likeRef);

      const chapterDoc = await getDoc(chapterRef);
      if (chapterDoc.exists()) {
        await updateDoc(chapterRef, { likeCount: increment(-1) });
      }

      if (bookRef) {
        const bookDoc = await getDoc(bookRef);
        if (bookDoc.exists()) {
          await updateDoc(bookRef, { totalLikes: increment(-1) });
        }
      }
    } else {
      // Beğeniyi ekle
      await setDoc(likeRef, { contentId, userId, bookId: bookId || null, createdAt: serverTimestamp() });

      const chapterDoc = await getDoc(chapterRef);
      if (chapterDoc.exists()) {
        await updateDoc(chapterRef, { likeCount: increment(1) });
      }

      if (bookRef) {
        const bookDoc = await getDoc(bookRef);
        if (bookDoc.exists()) {
          await updateDoc(bookRef, { totalLikes: increment(1) });
        }
      }
    }
  };

  return (
    <TouchableOpacity onPress={toggleLike} style={{ marginRight: 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <FontAwesome name={liked ? "heart" : "heart-o"} size={24} color={liked ? "red" : "gray"} />
        <Text style={{ fontSize: 14, color: theme.text, marginLeft: 5 }}>{likeCount}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default LikeButton;

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { db, auth } from "../../constants/firebaseConfig";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { FontAwesome } from "@expo/vector-icons"; // 👍 Beğeni ikonu için
import { useTheme } from "@/hooks/useThemeContext"; 

const LikeButton = ({ contentId }: { contentId: string }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const userId = auth.currentUser?.uid;
  const { theme } = useTheme(); 

  useEffect(() => {
    if (!userId) return;
    
    const likeRef = doc(db, "likes", `${contentId}_${userId}`);

    // Kullanıcının beğeni durumunu kontrol et
    getDocs(query(collection(db, "likes"), where("contentId", "==", contentId), where("userId", "==", userId)))
      .then(snapshot => setLiked(!snapshot.empty))
      .catch(console.error);

    // Gerçek zamanlı beğeni sayısı güncelleme
    const q = query(collection(db, "likes"), where("contentId", "==", contentId));
    const unsubscribe = onSnapshot(q, snapshot => setLikeCount(snapshot.size));

    return () => unsubscribe();
  }, [userId, contentId]);

  const toggleLike = async () => {
    if (!userId) return;

    const likeRef = doc(db, "likes", `${contentId}_${userId}`);

    if (liked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, { contentId, userId, createdAt: new Date() });
    }
    setLiked(!liked);
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

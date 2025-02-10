import { useLocalSearchParams, useNavigation } from "expo-router";
import { View, Text, ActivityIndicator, ScrollView, TextInput, Button, FlatList } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../constants/firebaseConfig";
import { collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { useComments } from "../../hooks/useComments";
import React from "react";

export const addComment = async (chapterId: string, text: string, sentenceId?: string) => {
  try {
    const commentsRef = collection(db, "comments");

    await addDoc(commentsRef, {
      chapterId,
      text,
      sentenceId: sentenceId || null,
      createdAt: Timestamp.now(),
    });

    console.log("Yorum başarıyla eklendi!");
  } catch (error) {
    console.error("Yorum ekleme hatası:", error);
  }
};

export const getComments = async (chapterId: string, sentenceId?: string) => {
  try {
    const commentsRef = collection(db, "comments");
    let q;

    if (sentenceId) {
      q = query(commentsRef, where("chapterId", "==", chapterId), where("sentenceId", "==", sentenceId));
    } else {
      q = query(commentsRef, where("chapterId", "==", chapterId));
    }

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return comments;
  } catch (error) {
    console.error("Yorumları alma hatası:", error);
    return [];
  }
};

export default function ChapterDetailScreen() {
  const { id } = useLocalSearchParams(); // URL'den bölüm ID'sini al
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  const navigation = useNavigation();
  const { comments, loading: commentsLoading, addComment } = useComments(id as string);


  useEffect(() => {
    const fetchChapter = async () => {
      if (!id) return;
      const docRef = doc(db, "chapters", id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setChapter(docSnap.data());
      }
      setLoading(false);
    };

    fetchChapter();
  }, [id]);

  // 🔥 Yeni useEffect: chapter yüklendiğinde başlığı günceller
  useEffect(() => {
    if (chapter && chapter.index !== undefined) {
      navigation.setOptions({ title: `Bölüm ${chapter.index}` });
    }
  }, [chapter]);

  if (loading) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  return (
    <FlatList
    contentContainerStyle={{ padding: 20 }} // Kenarlara boşluk ekler
    ListHeaderComponent={
      <>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>{chapter?.title}</Text>
        <Text style={{ fontSize: 16, marginBottom: 20 }}>{chapter?.content}</Text>
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Yorumlar</Text>
        </View>
      </>
    }
    data={comments}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View style={{ paddingVertical: 5 }}>
        <Text>{item.text}</Text>
      </View>
    )}
    ListFooterComponent={
      <View style={{ marginTop: 20 }}>
        <TextInput
          placeholder="Yorum yaz..."
          value={newComment}
          onChangeText={setNewComment}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
          }}
        />
        <Button title="Gönder" onPress={() => { addComment(newComment); setNewComment(""); }} />
      </View>
    }
  />
  );
}

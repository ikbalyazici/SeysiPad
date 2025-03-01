import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable, Button, Alert, Image, StatusBar, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../../constants/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { useFetchChapters } from "../../hooks/useFetchChapters";
import { deleteObject, getStorage, listAll, ref } from "firebase/storage";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useThemeContext"; 

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [authorUsername, setAuthorUsername] = useState("");
  const { chapters, loading } = useFetchChapters(id as string);
  const [readStatuses, setReadStatuses] = useState<Record<string, "false" | "partial" | "true">>({}); 
  const { theme } = useTheme(); 
  const [menuVisible, setMenuVisible] = useState(false);

  type Book = {
    authorUid: string;
    createdAt: any;
    title: string;
    description: string;
    coverURL: string;
  };

  useEffect(() => {
    const fetchBookAndAuthor = async () => {
      if (!id) return;

      const bookDoc = await getDoc(doc(db, "books", id as string));
      if (bookDoc.exists()) {
        const bookData = bookDoc.data();
        setBook(bookData as Book);

        const userDoc = await getDoc(doc(db, "users", bookData.authorUid));
        if (userDoc.exists()) {
          setAuthorUsername(userDoc.data().username);
        }
      }
    };

    fetchBookAndAuthor();
  }, [id]);

  useEffect(() => {
    const fetchReadStatuses = async () => {
      if (!user || !chapters.length) return;
      
      const progressQuery = query(collection(db, "user_chapter_progress"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(progressQuery);

      const statuses: Record<string, "false" | "partial" | "true"> = {};
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        statuses[data.chapterId] = data.status;
      });

      setReadStatuses(statuses);
    };

    fetchReadStatuses();
  }, [user, chapters]);

  const handleDelete = async () => {
    if (!id || !user || !book) return;

    if (user.uid !== book.authorUid) {
      Alert.alert("Yetkisiz işlem", "Bu kitabı silme yetkiniz yok.");
      return;
    }

    Alert.alert("Kitabı Sil", "Bu kitabı ve tüm bölümlerini silmek istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        onPress: async () => {
          try {
            const chaptersRef = collection(db, "chapters");
            const q = query(chaptersRef, where("bookId", "==", id));
            const querySnapshot = await getDocs(q);

            const deleteChapterPromises = querySnapshot.docs.map((docSnap) =>
              deleteDoc(doc(db, "chapters", docSnap.id))
            );

            await Promise.all(deleteChapterPromises);

            // 📌 İlgili user_chapter_progress kayıtlarını da sil
            const progressRef = collection(db, "user_chapter_progress");
            const progressQuery = query(progressRef, where("bookId", "==", id));
            const progressSnapshot = await getDocs(progressQuery);

            const deleteProgressPromises = progressSnapshot.docs.map((docSnap) =>
              deleteDoc(doc(db, "user_chapter_progress", docSnap.id))
            );

            await Promise.all(deleteProgressPromises);

            // 📌 Kitabın kapak fotoğrafını sil
            const storage = getStorage();
            const coverImagesRef = ref(storage, `book_covers/${id}/`);
            const files = await listAll(coverImagesRef);
            for (const fileRef of files.items) {
              await deleteObject(fileRef);
            }

            // 📌 Kitabı sil
            const bookRef = doc(db, "books", id as string);
            await deleteDoc(bookRef);

            Alert.alert("Başarılı", "Kitap ve tüm bölümleri silindi.");
            router.push("/(tabs)");
          } catch (err) {
            console.error("Kitap silinirken hata:", err);
            Alert.alert("Hata", "Kitap silinirken bir hata oluştu.");
          }
        },
      },
    ]);
  };

  if (!book) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      {user?.uid === book.authorUid && (
        <TouchableOpacity
          onPress={() => setMenuVisible(!menuVisible)}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
        >
          <MaterialIcons name="more-vert" size={24} color={theme.text} />
        </TouchableOpacity>
      )}

      {menuVisible && (
        <View
          style={{
            position: "absolute",
            top: 40,
            right: 10,
            backgroundColor: theme.modalbg,
            padding: 10,
            borderRadius: 5,
            elevation: 5,
            zIndex: 10,
          }}
        >
          <Pressable onPress={() => router.push(`/book/edit-book?id=${id}`)}>
            <Text style={{ color: theme.text, paddingVertical: 5 }}>Kitabı Düzenle</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: "/book/add-chapter", params: { bookId: id } })}>
            <Text style={{ color: theme.text, paddingVertical: 5 }}>Bölüm Ekle</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={{ color: "red", paddingVertical: 5 }}>Kitabı Sil</Text>
          </Pressable>
        </View>
      )}
      
      <Text style={{ fontSize: 24, fontWeight: "bold", color:theme.text }}>{book.title}</Text>

      <Pressable onPress={() => router.push(`/profile/${book.authorUid}`)}>
        <Text style={{ color: theme.tint, marginTop: 4 }}>
          Yazar: {authorUsername || "Yükleniyor..."}
        </Text>
      </Pressable>

      {book?.coverURL ? (
        <Image source={{ uri: book.coverURL }} style={{ width: 205, height: 288, marginBottom: 10, alignSelf: "center", marginTop: 5 }} />
      ) : (
        <Image source={{ uri: "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900" }} style={{ width: 300, height: 400, marginBottom: 10, alignSelf: "center", marginTop: 5 }} />
      )}

      <Text style={{ fontSize: 16, marginBottom: 20, color: theme.text }}>{book?.description}</Text>

      <Text style={{ marginTop: 8, color:theme.text }}>Bölümler:</Text>
      {user?.uid === book.authorUid && (
        <Pressable onPress={() => router.push({ pathname: "/book/add-chapter", params: { bookId: id } })}>
        <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.tint }}>
          <FontAwesome name="plus-circle" size={24} color= {theme.text} />
          <Text style={{color:theme.text, marginLeft:10, fontWeight:"bold", fontSize:15, fontFamily:"Comic-Neue"}}>{"Yeni Bölüm Ekle"}</Text>
        </View>
      </Pressable>
      )}
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/chapter/${item.id}`)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.tint }}>
                <Text style={{color:theme.text}}>{item.title}</Text>
                <FontAwesome name="check-circle" size={24} color={readStatuses[item.id] === "true" ? "green" : "red"} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

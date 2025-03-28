import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable, Alert, Image, StatusBar, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../../constants/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { useFetchChapters } from "../../hooks/useFetchChapters";
import { deleteObject, getStorage, listAll, ref } from "firebase/storage";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useThemeContext"; 
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();

  const [sortAscending, setSortAscending] = useState(true); // Başlangıçta en eski bölüm üstte olacak

  type Book = {
    authorUid: string;
    createdAt: any;
    title: string;
    description: string;
    coverURL: string;
    totalReads: number;
    totalLikes: number;
    selectedCategories: [];
    selectedAgeBounds: [];
    selectedContents:[];
  };

  // Chapters sıralaması
  const sortedChapters = [...chapters].sort((a, b) => {
    const aTime = a.createdAt.seconds;
    const bTime = b.createdAt.seconds;

    return sortAscending ? aTime - bTime : bTime - aTime;
  });

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
      Alert.alert(t("yetkisizislem"), t("kitapsilemen"));
      return;
    }

    Alert.alert(t("kitabısil"), t("kitabısileminmisin"), [
      { text: t("iptal"), style: "cancel" },
      {
        text: t("sil"),
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

            Alert.alert(t("basarili"), t("kitapsilindi"));
            router.back();
          } catch (err) {
            console.error(t("kitapsilhata"), err);
            Alert.alert(t("hata"), t("kitapsilhataoldu"));
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
    <TouchableWithoutFeedback onPress={() => setMenuVisible(false)} accessible={false}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
        <FlatList
          contentContainerStyle={{ padding: 18, paddingBottom: 80 }}
          data={sortedChapters}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={(
            <View>
              <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
              
              {user?.uid === book.authorUid && (
                <TouchableOpacity
                  onPress={() => setMenuVisible(!menuVisible)}
                  style={{ position: "absolute", top: 5, right: 5, zIndex: 10 }}
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
                    <Text style={{ color: theme.text, padding: 7, paddingHorizontal: 8 }}>{t("kitapduzenle")}</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push({ pathname: "/book/add-chapter", params: { bookId: id } })}>
                    <Text style={{ color: theme.text, padding: 7, paddingHorizontal: 8 }}>{t("bolumekle")}</Text>
                  </Pressable>
                  <Pressable onPress={handleDelete}>
                    <Text style={{ color: "red", padding: 7, paddingHorizontal: 8 }}>{t("kitabısil")}</Text>
                  </Pressable>
                </View>
              )}

              <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>{book.title}</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Pressable onPress={() => router.push(`/profile/${book.authorUid}`)}>
                  <Text style={{ color: theme.tint, marginTop: 4 }}>
                    {t("yazar")} {authorUsername || t("yükleniyor")}
                  </Text>
                </Pressable>
                <View style={{ flexDirection: "row" }}>
                  <FontAwesome name="heart" size={22} color="red" style={{ marginRight: 10 }} />
                  <Text style={{ color: theme.text, marginRight: 15, fontSize: 16 }}>{book.totalLikes}</Text>
                  <FontAwesome name="eye" size={22} color={theme.text} style={{ marginRight: 10 }} />
                  <Text style={{ color: theme.text, marginRight: 10, fontSize: 16 }}>{book.totalReads}</Text>
                </View>
              </View>

              {book?.coverURL ? (
                <Image source={{ uri: book.coverURL }} style={{ width: 205, height: 288, marginBottom: 10, alignSelf: "center", marginTop: 5, borderRadius: 15 }} />
              ) : (
                <Image source={{ uri: "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900" }} style={{ width: 205, height: 288, marginBottom: 10, alignSelf: "center", marginTop: 5, borderRadius: 15 }} />
              )}

              <Text style={{ fontSize: 16, marginBottom: 20, color: theme.text }}>{book?.description}</Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 5 }}>
                {book.selectedCategories?.map((category, index) => (
                  <Pressable 
                    key={index} 
                    onPress={() => router.push(`/book/category?category=${category}`)}
                    style={{
                      backgroundColor: theme.tint, 
                      paddingVertical: 6,
                      paddingHorizontal: 12, 
                      borderRadius: 15, 
                      marginRight: 10, 
                      marginBottom: 5,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>{t(category)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 5 }}>
                {book.selectedAgeBounds?.map((category, index) => (
                  <Pressable 
                    key={index} 
                    style={{
                      backgroundColor: "red", 
                      paddingVertical: 6,
                      paddingHorizontal: 12, 
                      borderRadius: 15, 
                      marginRight: 10, 
                      marginBottom: 5,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>{t(category)}</Text>
                  </Pressable>
                ))}
                {book.selectedContents?.map((category, index) => (
                  <Pressable 
                    key={index} 
                    style={{
                      backgroundColor: "red", 
                      paddingVertical: 6,
                      paddingHorizontal: 12, 
                      borderRadius: 15, 
                      marginRight: 10, 
                      marginBottom: 5,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>{t(category)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <Text style={{ color: theme.text }}>{t("bolumler")}</Text>

                <TouchableOpacity onPress={() => setSortAscending(!sortAscending)}>
                  <MaterialIcons name={sortAscending ? "arrow-circle-up" : "arrow-circle-down"} size={30} color={theme.text} />
                </TouchableOpacity>
              </View>

              {user?.uid === book.authorUid && (
                <Pressable onPress={() => router.push({ pathname: "/book/add-chapter", params: { bookId: id } })}>
                  <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.tint }}>
                    <FontAwesome name="plus-circle" size={24} color={theme.text} />
                    <Text style={{ color: theme.text, marginLeft: 10, fontWeight: "bold", fontSize: 15 }}>{t("yenibolumekle")}</Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/chapter/${item.id}`)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.tint }}>
                <Text style={{ color: theme.text }}>{item.title}</Text>
                <FontAwesome name="check-circle" size={24} color={readStatuses[item.id] === "true" ? "green" : "red"} />
              </View>
            </Pressable>
          )}
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
  
}

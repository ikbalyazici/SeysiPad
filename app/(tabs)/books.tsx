import { View, Text, FlatList, ActivityIndicator, Pressable, Image, StatusBar, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useFetchBooks } from "../../hooks/useFetchBooks";
import { useTheme } from "@/hooks/useThemeContext";
import { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/constants/firebaseConfig";
import { useLanguage } from "@/context/LanguageContext";

export default function BooksScreen() {
  const router = useRouter();
  const { books, loading } = useFetchBooks(false);
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [authors, setAuthors] = useState<{ [key: string]: string }>({});
  const [sortOption, setSortOption] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAuthors = async () => {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersData: { [key: string]: string } = {};

      usersSnapshot.forEach((doc) => {
        usersData[doc.id] = doc.data().username;
      });

      setAuthors(usersData);
    };

    fetchAuthors();
  }, []);

  const sortedBooks = [...books].filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortOption === "likesAsc") sortedBooks.sort((a, b) => a.totalLikes - b.totalLikes);
  else if (sortOption === "likesDesc") sortedBooks.sort((a, b) => b.totalLikes - a.totalLikes);
  else if (sortOption === "readsAsc") sortedBooks.sort((a, b) => a.totalReads - b.totalReads);
  else if (sortOption === "readsDesc") sortedBooks.sort((a, b) => b.totalReads - a.totalReads);
  else if (sortOption === "newest") sortedBooks.sort((a, b) => b.createdAt - a.createdAt);
  else if (sortOption === "oldest") sortedBooks.sort((a, b) => a.createdAt - b.createdAt);

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: theme.background, paddingBottom: 60 }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
      
      {/* Arama Çubuğu */}
      <TextInput
        style={{
          height: 40,
          borderColor: theme.tint,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 10,
          marginBottom: 10,
          color: theme.inputText,
          backgroundColor: theme.inputBackground,
        }}
        placeholder={t("kitapara")}
        placeholderTextColor={theme.inputPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      {/* Başlık ve Sıralama */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>{t("kitaplar")}</Text>
        <Pressable onPress={() => setMenuVisible(!menuVisible)}>
          <Text style={{ fontSize: 16, color: theme.tint, marginRight:5 }}>{t("sırala")}</Text>
        </Pressable>
      </View>
      
      {/* Sıralama Menüsü */}
      {menuVisible && (
        <View style={{
          position: "absolute",
          top: 60,
          right: 20,
          backgroundColor: theme.modalbg,
          padding: 10,
          borderRadius: 5,
          zIndex: 10,
          elevation: 5,
        }}>
          {["likesAsc", "likesDesc", "readsAsc", "readsDesc", "newest", "oldest"].map((option) => (
            <Pressable key={option} onPress={() => { setSortOption(option); setMenuVisible(false); }}>
              <Text style={{ color: theme.text, padding: 5 }}>{t(option)}</Text>
            </Pressable>
          ))}
        </View>
      )}
      
      {/* Kitap Listesi */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={sortedBooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`../book/${item.id}`)}>
              <View style={{ flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderColor: theme.tint }}>
                <Image
                  source={{ uri: item.coverURL || "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900" }}
                  style={{ width: 75, height: 100, marginRight: 10, borderRadius: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text }}>{item.title}</Text>
                  <Pressable onPress={() => router.push(`/profile/${item.authorUid}`)}>
                    <Text style={{ fontSize: 12, color: theme.tint, marginTop: 4 }}>{t("yazar")} {authors[item.authorUid] || t("yükleniyor")}</Text>
                  </Pressable>
                  <Text style={{ fontSize: 13, color: theme.text }} numberOfLines={2}>{item.description}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
      {/* FAB - Yeni Kitap Ekle */}
      <Pressable
        onPress={() => router.push("../book/add-book")}
        style={{
          position: "absolute",
          bottom: 60,
          right: 20,
          backgroundColor: theme.tint,
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 2 },
          elevation: 5,
        }}
      >
        <AntDesign name="plus" size={28} color="white" />
      </Pressable>
    </View>
  );
}

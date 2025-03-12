import { View, Text, ActivityIndicator, Image, Pressable, StatusBar, TextInput, FlatList } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { db } from "@/constants/firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function HomeScreen() {
  const { loading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const [book, setBook] = useState<{ id: string; title: string; coverURL?: string } | null>(null);
  const [searchText, setSearchText] = useState(""); // Arama girdisi
  const [books, setBooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const FEATURED_BOOK_ID = "Kd08Yc2LfBi3NXDc38JY"; // Öne çıkan kitap

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookRef = doc(db, "books", FEATURED_BOOK_ID);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists() && bookSnap.data()) {
          setBook({ id: bookSnap.id, ...bookSnap.data() } as any);
        }
      } catch (error) {
        console.error("Kitap yüklenirken hata oluştu:", error);
      }
    };

    fetchBook();
  }, []);

  const handleSearch = async (text: string) => {
    setSearchText(text);

    if (text.length < 1) {
      setBooks([]);
      setUsers([]);
      return;
    }

    try {
      // Kitapları Ara
      const booksQuery = query(collection(db, "books"), where("title", ">=", text), where("title", "<=", text + "\uf8ff"));
      const booksSnapshot = await getDocs(booksQuery);
      const booksResults = booksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Kullanıcıları Ara
      const usersQuery = query(collection(db, "users"), where("username", ">=", text), where("username", "<=", text + "\uf8ff"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersResults = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setBooks(booksResults);
      setUsers(usersResults);
    } catch (error) {
      console.error("Arama sırasında hata oluştu:", error);
    }
  };

  if (loading || !book) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const defaultCoverURL =
    "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900";

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
      
      {/* Hoşgeldin Mesajı */}
      <Text style={{ fontSize: 44, fontWeight: "bold", color: theme.text, textAlign: "center" }}>
        {t("hosgeldin")}
      </Text>

      {/* Arama Kutusu */}
      <TextInput
        style={{
          height: 40,
          borderColor: theme.tint,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 10,
          color: theme.inputText,
          backgroundColor:theme.inputBackground,
          marginTop: 20
        }}
        placeholder={t("ara")}
        placeholderTextColor={theme.inputPlaceholder}
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* Arama Sonuçları */}
      {searchText.length > 0 && (
        <View style={{ marginTop: 20 }}>
          {/* Kitaplar */}
          {books.length > 0 && (
            <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 10 }}>{t("kitaplar")}</Text>
          )}
          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/book/${item.id}`)} 
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 10,borderBottomWidth: 1, borderColor: theme.tint, padding:10 }}>
                <Image source={{ uri: item.coverURL || defaultCoverURL }} style={{ width: 50, height: 70, borderRadius: 5 }} />
                <Text style={{ marginLeft: 10, fontSize: 16, color: theme.text }}>{item.title}</Text>
              </Pressable>
            )}
          />

          {/* Kullanıcılar */}
          {users.length > 0 && (
            <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginTop: 5, marginBottom: 10 }}>{t("kullanicilar")}</Text>
          )}
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/profile/${item.id}`)} 
                style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: theme.tint, padding:5 }}>
                <Image source={{ uri: item.photoURL || defaultCoverURL }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                <Text style={{ marginLeft: 10, fontSize: 16, color: theme.text }}>{item.username}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Öne Çıkan Kitap */}
      <Text style={{ fontSize: 22, fontWeight: "bold", marginTop: 10, color: theme.text }}>{t("onecikan")}</Text>
      <Pressable onPress={() => router.push(`/book/${book.id}`)} style={{ alignItems: "center", marginTop: 20 }}>
        <Image source={{ uri: book.coverURL || defaultCoverURL }} style={{ width: 150, height: 200, borderRadius: 10 }} />
        <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 10, color: theme.text }}>{book.title}</Text>
      </Pressable>

      
    </View>
  );
}

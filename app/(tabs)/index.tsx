import { View, Text, ActivityIndicator, Image, Pressable, StatusBar, FlatList, ScrollView, TextInput } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { db } from "../../constants/firebaseConfig";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function HomeScreen() {
  const { loading: authLoading } = useAuth(); // Auth yükleme durumu
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true); // Tüm veri yükleme durumu

  const [mostReadBooks, setMostReadBooks] = useState<any[]>([]);
  const [mostLikedBooks, setMostLikedBooks] = useState<any[]>([]);
  const [popularFantasy, setPopularFantasy] = useState<any[]>([]);
  const [popularRomance, setPopularRomance] = useState<any[]>([]);
  const [popularAdventure, setPopularAdventure] = useState<any[]>([]);
  const [popularMystery, setPopularMystery] = useState<any[]>([]);

  const [searchText, setSearchText] = useState(""); // Arama girdisi
  const [books, setBooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const defaultCoverURL =
    "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900";

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

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Promise.all kullanarak tüm sorguları aynı anda çalıştırıyoruz
        const queries = [
          getDocs(query(collection(db, "books"), orderBy("totalReads", "desc"), limit(5))),
          getDocs(query(collection(db, "books"), orderBy("totalLikes", "desc"), limit(5))),
          getDocs(query(collection(db, "books"), where("selectedCategories", "array-contains", "Fantezi"), orderBy("totalLikes", "desc"), limit(5))),
          getDocs(query(collection(db, "books"), where("selectedCategories", "array-contains", "Romantizm"), orderBy("totalLikes", "desc"), limit(5))),
          getDocs(query(collection(db, "books"), where("selectedCategories", "array-contains", "Macera"), orderBy("totalLikes", "desc"), limit(5))),
          getDocs(query(collection(db, "books"), where("selectedCategories", "array-contains", "Gizem"), orderBy("totalLikes", "desc"), limit(5))),
        ];

        const [
          mostReadSnapshot,
          mostLikedSnapshot,
          fantasySnapshot,
          romanceSnapshot,
          adventureSnapshot,
          mysterySnapshot,
        ] = await Promise.all(queries);

        // Verileri state'e aktarıyoruz
        setMostReadBooks(mostReadSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setMostLikedBooks(mostLikedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPopularFantasy(fantasySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPopularRomance(romanceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPopularAdventure(adventureSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPopularMystery(mysterySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Kitaplar yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false); // Tüm veriler geldikten sonra yükleme bitiyor
      }
    };

    fetchBooks();
  }, []);

  if (authLoading || loading) { // Hem giriş yüklenirken hem de veriler gelmeden yükleme ekranı göster
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const renderBookItem = ({ item }: { item: any }) => (
    <Pressable 
      onPress={() => router.push(`/book/${item.id}`)} 
      style={{ marginRight: 15, alignItems: "center" }}
    >
      <Image source={{ uri: item.coverURL || defaultCoverURL }} 
        style={{ width: 100, height: 150, borderRadius: 5 }} />
      <Text style={{ marginTop: 5, fontSize: 14, color: theme.text, width: 100, textAlign: "center" }} numberOfLines={2}>
        {item.title}
      </Text>
    </Pressable>
  );

  const renderMoreButton = (onPress: () => void) => (
    <Pressable onPress={onPress}>
      <Text style={{ fontSize: 16, fontWeight: "bold", color: theme.tint, marginLeft: 10 }}>
        {t("tümünügör")}
      </Text>
    </Pressable>
  );

  type SectionProps = {
    title: string;
    onPress: () => void;
    data: { id: string }[]; // Kitap nesneleri için id içeren bir dizi
  };
  
  const Section: React.FC<SectionProps> = ({ title, onPress, data }) => (
    <View style={{ marginBottom: 30 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: theme.text }}>{title}</Text>
        {renderMoreButton(onPress)}
      </View>
      <FlatList 
        data={data} 
        keyExtractor={(item) => item.id} 
        renderItem={renderBookItem} 
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  const combinedData = [
    ...(books.length > 0 ? [{ type: "header", title: t("kitaplar") }] : []),
    ...books.map((book) => ({ ...book, type: "book" })),
    ...(users.length > 0 ? [{ type: "header", title: t("kullanicilar") }] : []),
    ...users.map((user) => ({ ...user, type: "user" })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
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
          <View style={{ marginTop: 10, backgroundColor: theme.modalbg }}>
            <FlatList
              nestedScrollEnabled={true}
              data={combinedData}
              keyExtractor={(item, index) => item.id || `header-${index}`}
              renderItem={({ item }) => {
                if (item.type === "header") {
                  return <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 10 }}>{item.title}</Text>;
                }
                if (item.type === "book") {
                  return (
                    <Pressable
                      onPress={() => router.push(`/book/${item.id}`)}
                      style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, borderBottomWidth: 1, borderColor: theme.tint, padding: 10 }}
                    >
                      <Image source={{ uri: item.coverURL || defaultCoverURL }} style={{ width: 50, height: 70, borderRadius: 5 }} />
                      <Text style={{ marginLeft: 10, fontSize: 16, color: theme.text }}>{item.title}</Text>
                    </Pressable>
                  );
                }
                if (item.type === "user") {
                  return (
                    <Pressable
                      onPress={() => router.push(`/profile/${item.id}`)}
                      style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: theme.tint, padding: 5 }}
                    >
                      <Image source={{ uri: item.photoURL || defaultCoverURL }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                      <Text style={{ marginLeft: 10, fontSize: 16, color: theme.text }}>{item.username}</Text>
                    </Pressable>
                  );
                }
                return null;
              }}
              style={{ maxHeight: 290 }}
            />;
          </View>
        )}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        {/* 📚 Çok Okunanlar */}
        <Section title={t("cokOkunanlar")} onPress={() => router.push("/books")} data={mostReadBooks} />

        {/* ❤️ Çok Beğenilenler */}
        <Section title={t("cokBegenilenler")} onPress={() => router.push("/books")} data={mostLikedBooks} />

        {/* 🏰 Fantastikte Popüler */}
        <Section title={t("fantastiktePopuler")} onPress={() => router.push(`/book/category?category=Fantezi`)} data={popularFantasy} />

        {/* 💕 Romantizmde Popüler */}
        <Section title={t("romantizmdePopuler")} onPress={() => router.push(`/book/category?category=Romantizm`)} data={popularRomance} />

        {/* 🏕 Macerada Popüler */}
        <Section title={t("maceradaPopuler")} onPress={() => router.push(`/book/category?category=Macera`)} data={popularAdventure} />

        {/* 🕵️ Gizemde Popüler */}
        <Section title={t("gizemdePopuler")} onPress={() => router.push(`/book/category?category=Gizem`)} data={popularMystery} />
      </ScrollView>
    </View>
  );
}

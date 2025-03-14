import { View, Text, ActivityIndicator, Image, Pressable, StatusBar, FlatList, ScrollView } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { db } from "@/constants/firebaseConfig";
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
      <Image source={{ uri: item.coverURL || "https://via.placeholder.com/100x150" }} style={{ width: 100, height: 150, borderRadius: 5 }} />
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={{ fontSize: 44, fontWeight: "bold", color: theme.text, textAlign: "center" }}>
          {t("hosgeldin")}
        </Text>

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

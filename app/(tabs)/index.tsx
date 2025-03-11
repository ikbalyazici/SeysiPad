import { View, Text, ActivityIndicator, Image, Pressable, StatusBar } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { db } from "@/constants/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "@/hooks/useThemeContext"; // Tema Hook'unu içe aktardık
import { useLanguage } from "@/context/LanguageContext";

export default function HomeScreen() {
  const { loading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme(); // Mevcut temayı al
  const { language, setLanguage, t } = useLanguage();
  const [book, setBook] = useState<{ id: string; title: string; coverURL?: string } | null>(null);
  const FEATURED_BOOK_ID = "Kd08Yc2LfBi3NXDc38JY"; // Öne çıkan kitabın ID'si

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

  if (loading || !book) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const defaultCoverURL =
    "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: theme.background, // Temaya uygun arka plan rengi
      }}
    >
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <Text style={{ fontSize: 44, fontWeight: "bold", color: theme.text }}>{t("hosgeldin")}</Text>

      {/* Kitap Bilgisi */}
      <Pressable onPress={() => router.push(`/book/${book.id}`)} style={{ alignItems: "center", marginTop: 20 }}>
        <Image source={{ uri: book.coverURL || defaultCoverURL }} style={{ width: 150, height: 200, borderRadius: 10 }} />
        <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 10, color: theme.text }}>
          {book.title}
        </Text>
      </Pressable>
    </View>
  );
}

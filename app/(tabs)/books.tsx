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
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAuthors = async () => {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersData: { [key: string]: string } = {};

      usersSnapshot.forEach((doc) => {
        usersData[doc.id] = doc.data().username; // Kullanıcı ID'si ile eşleştir
      });

      setAuthors(usersData);
    };

    fetchAuthors();
  }, []);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        placeholder= {t("kitapara")}
        placeholderTextColor={theme.inputPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 10, color: theme.text }}>
        {t("kitaplar")}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }} // Tab barın altında içerik kaybolmasın
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`../book/${item.id}`)}>
              <View
                style={{
                  flexDirection: "row", // Yatay hizalama
                  alignItems: "center",
                  padding: 15,
                  borderBottomWidth: 1,
                  borderColor: theme.tint,
                }}
              >
                {/* Kitap Kapağı */}
                <Image
                  source={{
                    uri: item?.coverURL
                      ? item.coverURL
                      : "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900",
                  }}
                  style={{ width: 75, height: 100, marginRight: 10, borderRadius:10 }} // Yan yana görünmesi için `marginRight` ekledik
                />

                {/* Kitap Bilgileri */}
                <View style={{ flex: 1 }}> 
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text }}>{item.title}</Text>
                  <Pressable onPress={() => router.push(`/profile/${item.authorUid}`)}>
                    <Text style={{ fontSize: 12, color: theme.tint, marginTop: 4 }}>
                      {t("yazar")} {authors[item.authorUid] || t("yükleniyor")}
                    </Text>
                  </Pressable>
                  <Text style={{ fontSize: 13, color: theme.text }} numberOfLines={2}>
                    {item.description}
                  </Text>
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

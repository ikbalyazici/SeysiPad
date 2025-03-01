import { useState, useEffect } from "react";
import { View, Text, Image, ActivityIndicator, FlatList, Pressable, StatusBar } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { db } from "../../constants/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useFetchBooks } from "../../hooks/useFetchBooks";
import { useTheme } from "@/hooks/useThemeContext"; 

export default function UserProfileScreen() {
  type UserProfile = {
    username: string;
    bio?: string;
    photoURL?: string;
  };

  const { id } = useLocalSearchParams(); // URL'den kullanıcı UID'sini al
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false); // Kullanıcı bulunamazsa işaretle
  const { books, loading, error } = useFetchBooks(true, id as string); // Kullanıcının kitaplarını getir
  const { theme } = useTheme(); 

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      const userDoc = await getDoc(doc(db, "users", id as string));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        setNotFound(true);
      }
    };
    fetchProfile();
  }, [id]);

  if (!profile && !notFound) {
    return <ActivityIndicator size="large" />;
  }

  if (notFound) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "red" }}>Bu profil artık mevcut değil.</Text>
        <Text style={{ fontSize: 16, marginTop: 10, textAlign: "center", color: theme.text }}>
          Kullanıcı hesabını silmiş olabilir veya hiç var olmamış olabilir.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background  }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      {/* Profil Bilgileri */}
      <View style={{ alignItems: "center", padding: 20 }}>
        <Image
          source={{ uri: profile?.photoURL || "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/profile_images%2Fno_profile_picture%2Ficone-x-avec-cercle-gris.png?alt=media&token=78a3007c-c98c-49b8-97cc-f8bf4f01098e" }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>{profile?.username}</Text>
        <Text style={{ color: theme.text }}>{profile?.bio || ""}</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text, marginHorizontal: 15, marginBottom: 10 }}>Kitapları</Text>

      {loading && <Text style={{ textAlign: "center", color: theme.text }}>Yükleniyor...</Text>}
      {error && <Text style={{ textAlign: "center", color: theme.text }}>Hata: {error}</Text>}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }} // Tab barın altında içerik kaybolmasın
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`../book/${item.id}`)}>
            <View style={{ flexDirection: "row", padding: 15, borderBottomWidth: 1, borderColor: theme.tint }}>
              <Image
                source={{ uri: item.coverURL || "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900" }}
                style={{ width: 75, height: 100, marginRight: 15, borderRadius:10}}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: theme.text }} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

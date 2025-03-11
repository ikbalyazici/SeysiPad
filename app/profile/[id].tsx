import { useState, useEffect } from "react";
import { View, Text, Image, ActivityIndicator, FlatList, Pressable, StatusBar, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { auth, db } from "../../constants/firebaseConfig";
import { collection, doc, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { useFetchBooks } from "../../hooks/useFetchBooks";
import { useTheme } from "@/hooks/useThemeContext"; 
import { useLanguage } from "@/context/LanguageContext";
import FollowButton from "./follow/FollowButton";

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
  const { t } = useLanguage();
  const currentUser = auth.currentUser;
  const [followers, setFollowers] = useState<string[]>([]); // Takipçileri tutacak state
  const [followings, setFollowings] = useState<string[]>([]); // Takip edilenleri tutacak state

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

    // Takipçileri dinlemek için onSnapshot kullan
    const followersRef = collection(db, "users", id as string, "followers");
    const unsubscribeFollowers = onSnapshot(followersRef, (snapshot) => {
      const followersData = snapshot.docs.map((doc) => doc.id);
      setFollowers(followersData); // Takipçileri state'e güncelle
    });

    // Takip edilenleri dinlemek için onSnapshot kullan
    const followingsRef = collection(db, "users", id as string, "following");
    const unsubscribeFollowings = onSnapshot(followingsRef, (snapshot) => {
      const followingsData = snapshot.docs.map((doc) => doc.id);
      setFollowings(followingsData); // Takip edilenleri state'e güncelle
    });

    // Temizlik fonksiyonu
    return () => {
      unsubscribeFollowers();
      unsubscribeFollowings();
    };
  }, [id]);

  if (!profile && !notFound) {
    return <ActivityIndicator size="large" />;
  }

  if (notFound) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "red" }}>{t("profilyok")}</Text>
        <Text style={{ fontSize: 16, marginTop: 10, textAlign: "center", color: theme.text }}>
          {t("hesapsilinmis")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background  }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      {/* Profil Bilgileri */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 20 }}>
        {/* Profil Fotoğrafı */}
        <View style={{ position: "relative" }}>
          <Image
            source={{
              uri:
                profile?.photoURL ||
                "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/profile_images%2Fno_profile_picture%2Ficone-x-avec-cercle-gris.png?alt=media&token=78a3007c-c98c-49b8-97cc-f8bf4f01098e",
            }}
            style={{ width: 100, height: 100, borderRadius: 30, marginRight: 10 }}
          />
          {/* Versiyon 2: Takip Butonu Sayıların Altında */}
          {currentUser?.uid !== id && (
            <View style={{ marginTop: 10 }}>
              <FollowButton profileUserId={id as string} />
            </View>
          )}
        </View>

        {/* Kullanıcı Bilgileri */}
        <View style={{ flex: 1, marginLeft:20 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>{profile?.username}</Text>

          {/* Takipçi ve Takip Sayıları */}
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => router.push(`/profile/follow/FollowersScreen?id=${id}`)}
              style={{ alignItems: "center", marginRight: 20 }}
            >
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>{t("takipeden")}</Text>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>{followers.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push(`/profile/follow/FollowingScreen?id=${id}`)} 
              style={{ alignItems: "center" }}
            >
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>{t("takipedilen")}</Text>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>{followings.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
    </View>
      <Text style={{ color: theme.text, marginLeft: 30, marginBottom: 10, fontSize:15 }}>{profile?.bio || ""}</Text>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text, marginHorizontal: 15, marginBottom: 10 }}>{t("kitaplar")}</Text>

      {loading && <Text style={{ textAlign: "center", color: theme.text }}>{t("yükleniyor")}</Text>}
      {error && <Text style={{ textAlign: "center", color: theme.text }}>{t("hata")} {error}</Text>}

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

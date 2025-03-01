import { useState, useEffect } from "react";
import { View, Text, Image, FlatList, Alert, Pressable, StatusBar, Switch, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../constants/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { useFetchBooks } from "../../hooks/useFetchBooks";
import { deleteUser } from "firebase/auth";
import { deleteObject, getStorage, listAll, ref } from "firebase/storage";
import { useTheme } from "@/hooks/useThemeContext";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<{ username: string; bio?: string; photoURL?: string } | null>(null);
  const { books, loading, error } = useFetchBooks(true, user?.uid);
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as any);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const deleteUserAccount = async (userId: string) => {
    if (!userId) return;
  
    try {
      // 📌 1️⃣ Kullanıcının bölümlerini sil
      const chaptersQuery = query(collection(db, "chapters"), where("authorUid", "==", userId));
      const chaptersSnapshot = await getDocs(chaptersQuery);
      for (const chapterDoc of chaptersSnapshot.docs) {
        await deleteDoc(doc(db, "chapters", chapterDoc.id));
      }
  
      // 📌 2️⃣ Kullanıcının kitaplarını sil
      const booksQuery = query(collection(db, "books"), where("authorUid", "==", userId));
      const booksSnapshot = await getDocs(booksQuery);
      for (const bookDoc of booksSnapshot.docs) {
        await deleteDoc(doc(db, "books", bookDoc.id));
      }
  
      // 📌 3️⃣ Kullanıcının yorumlarını anonimleştir
      const commentsQuery = query(collection(db, "comments"), where("authorUid", "==", userId));
      const commentsSnapshot = await getDocs(commentsQuery);
      for (const commentDoc of commentsSnapshot.docs) {
        await updateDoc(doc(db, "comments", commentDoc.id), { authorUid: null });
      }

      // 📌 4️⃣ Kullanıcının okuma ilerlemelerini (user_chapter_progress) sil
      const progressQuery = query(collection(db, "user_chapter_progress"), where("userUid", "==", userId));
      const progressSnapshot = await getDocs(progressQuery);
      for (const progressDoc of progressSnapshot.docs) {
        await deleteDoc(doc(db, "user_chapter_progress", progressDoc.id));
      }

       // 📌 5️⃣ Kullanıcının profil fotoğraflarını sil
      const storage = getStorage();
      const profileImagesRef = ref(storage, `profile_images/${userId}/`);
      
      // Klasördeki tüm dosyaları listele ve sil
      const files = await listAll(profileImagesRef);
      for (const fileRef of files.items) {
        await deleteObject(fileRef);
      }

      //Kullanıcının usernameini sil
      const usernamesQuery = query(collection(db, "usernames"), where("uid", "==", userId));
      const usernamesSnapshot = await getDocs(usernamesQuery);
      for (const usernamesDoc of usernamesSnapshot.docs) {
        await deleteDoc(doc(db, "usernames", usernamesDoc.id));
      }

      // 📌 5️⃣ Firestore’daki kullanıcı profilini sil
      await deleteDoc(doc(db, "users", userId));
  
      // 📌 4️⃣ Firebase Authentication’dan kullanıcıyı sil
      const user = auth.currentUser;
      if (user && user.uid === userId) {
        await deleteUser(user);
      }
  
      Alert.alert("Hesap Silindi", "Kullanıcı hesabı başarıyla silindi.");
      logout();
    } catch (error) {
      console.error("Hesap silinirken hata:", error);
      Alert.alert("Hata", "Hesap silinirken bir hata oluştu.");
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
        <Text style={{ textAlign: "center", marginTop: 20, color: theme.text }}>Giriş yapmalısınız!</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />

      {/* Üç Nokta Menüsü */}
      <TouchableOpacity
        onPress={() => setMenuVisible(!menuVisible)}
        style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
      >
        <MaterialIcons name="more-vert" size={24} color={theme.text} />
      </TouchableOpacity>

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
          <Pressable onPress={() => router.push("../edit-profile")}>
            <Text style={{ color: theme.text, paddingVertical: 5 }}>Profili Düzenle</Text>
          </Pressable>
          <Pressable onPress={logout}>
            <Text style={{ color: "red", paddingVertical: 5 }}>Çıkış Yap</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Hesabı Sil",
                "Hesabınızı kalıcı olarak silmek istediğinize emin misiniz?",
                [
                  { text: "İptal", style: "cancel" },
                  { text: "Evet, Sil", onPress: () => deleteUserAccount(user.uid) },
                ]
              )
            }
          >
            <Text style={{ color: "red", paddingVertical: 5 }}>Hesabı Sil</Text>
          </Pressable>
        </View>
      )}

      {/* Profil Bilgileri */}
      <View style={{ alignItems: "center", padding: 20 }}>
        <Image
          source={{ uri: profile?.photoURL || "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/profile_images%2Fno_profile_picture%2Ficone-x-avec-cercle-gris.png?alt=media&token=78a3007c-c98c-49b8-97cc-f8bf4f01098e" }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>{profile?.username}</Text>
        <Text style={{ color: theme.text }}>{profile?.bio || ""}</Text>
      </View>

      {/* Tema Değiştirme Toggle Switch */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Text style={{ color: theme.text, marginRight: 10 }}>Aydınlık</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: "#ccc", true: "#444" }}
          thumbColor={isDarkMode ? "#fff" : "#000"}
        />
        <Text style={{ color: theme.text, marginLeft: 10 }}>Karanlık</Text>
      </View>

      {/* Kullanıcının Kitapları */}
      <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text, marginHorizontal: 15, marginBottom: 10 }}>
        Eklediğim Kitaplar
      </Text>

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

import { useState, useEffect } from "react";
import { View, Text, Image, Button } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../constants/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<{ username: string; bio?: string; photoURL?: string } | null>(null);

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

  if (!user) {
    return <Text>Giriş yapmalısınız.</Text>;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {profile?.photoURL ? (
        <Image source={{ uri: profile.photoURL }} style={{ width: 100, height: 100, borderRadius: 50 }} />
      ) : (
        <Text>Profil Fotoğrafı Yok</Text>
      )}
      <Text>Kullanıcı Adı: {profile?.username}</Text>
      <Text>Biyografi: {profile?.bio || ""}</Text>
      <Button title="Profili Düzenle" onPress={() => router.push("/edit-profile")} />
    </View>
  );
}

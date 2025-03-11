import { db } from "../../../constants/firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Image, Text, View, ActivityIndicator, Pressable, StatusBar } from "react-native";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";

interface FollowingUser {
  id: string;
  username: string;
  photoURL: string;
}

export default function FollowingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [followings, setFollowings] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowings = async () => {
      try {
        if (!id) return;

        const followingsRef = collection(db, "users", id as string, "following");
        const querySnapshot = await getDocs(followingsRef);

        const followingsData = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const userId = docSnapshot.id;
            const userDoc = await getDoc(doc(db, "users", userId));

            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: userId,
                username: userData.username || "Unknown",
                photoURL:
                  userData.photoURL ||
                  "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900",
              };
            } else {
              return { id: userId, username: "Unknown", photoURL: "" };
            }
          })
        );

        setFollowings(followingsData);
      } catch (error) {
        console.error("Error fetching followings: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowings();
  }, [id]);

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />

      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: theme.text }}>
        {t("takipedilenler")} : {followings.length}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} />
      ) : (
        <FlatList
          data={followings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/profile/${item.id}`)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.tint,
                }}
              >
                <Image
                  source={{ uri: item.photoURL }}
                  style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                />
                <Text style={{ fontSize: 16, fontWeight: "500", color: theme.text }}>
                  {item.username}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

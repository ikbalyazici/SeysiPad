import { useState, useEffect } from "react";
import { View, Text, Switch, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationSettings() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const userId = auth.currentUser?.uid;

  // Bildirim ayarlarını saklayan state
  const [preferences, setPreferences] = useState({
    new_comment: true,
    reply: true,
    follow: true,
    book: true,
    chapter: true,
    like: true
  });

  // Firestore'dan kullanıcının mevcut bildirim ayarlarını çek
  useEffect(() => {
    if (!userId) return;

    const fetchPreferences = async () => {
        try {
          const docRef = doc(db, "notification_preferences", userId);
          const docSnap = await getDoc(docRef);
    
          if (docSnap.exists()) {
            const data = docSnap.data();
    
            setPreferences((prev) => ({
              new_comment: data.new_comment ?? prev.new_comment,
              reply: data.reply ?? prev.reply,
              follow: data.follow ?? prev.follow,
              book: data.book ?? prev.book,
              chapter: data.chapter ?? prev.chapter,
              like: data.like ?? prev.like
            }));
          }
        } catch (error) {
          console.error("Bildirim tercihleri alınamadı:", error);
        }
      };
    
      fetchPreferences();
    }, [userId]);

  // Firestore'a değişiklikleri kaydet
  const updatePreference = async (key: string, value: boolean) => {
    if (!userId) return;

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      await setDoc(doc(db, "notification_preferences", userId), updatedPreferences, { merge: true });
    } catch (error) {
      console.error("Tercih güncellenirken hata oluştu:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />

      <Text style={{ color: theme.text, fontSize: 20, marginBottom: 20 }}>
        {t("bildirim_ayarları")}
      </Text>

      {/* Bildirim Tercihlerini Aç/Kapat */}
      {Object.entries(preferences).map(([key, value]) => (
        <View key={key} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }}>
          <Text style={{ color: theme.text }}>{t(key)}</Text>
          <Switch
            value={value}
            onValueChange={(newValue) => updatePreference(key, newValue)}
            trackColor={{ false: "#ccc", true: "#444" }}
            thumbColor={value ? "#fff" : "#000"}
          />
        </View>
      ))}
    </View>
  );
}

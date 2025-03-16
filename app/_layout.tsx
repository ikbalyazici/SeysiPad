import { useEffect, useState } from "react";
import { Slot, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useThemeContext";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";
import { FontProvider } from "./context/FontContext";
import { useFonts } from "../hooks/useFonts";
import LanguageProvider from "./context/LanguageContext";
import { registerForPushNotifications, saveTokenToFirestore, saveNotificationPreferences } from "@/src/utils/notifications";

SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(["Text strings must be rendered within a <Text> component"]);

export default function Layout() {
  const router = useRouter();
  const { user } = useAuth();
  const fontsLoaded = useFonts();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setAppReady(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (appReady) {
      if (user) {
        router.replace("/(tabs)");

        // 🔹 Kullanıcı giriş yaptıysa bildirim izni al ve Firestore'a token kaydet
        registerForPushNotifications().then((token) => {
          if (token) {
            saveTokenToFirestore(user.uid, token);
            saveNotificationPreferences(user.uid); // 🔹 Bildirim tercihlerini kaydet
          }
        });
      } else {
        router.replace("/login");
      }
      SplashScreen.hideAsync();
    }
  }, [appReady, user]);

  if (!appReady) {
    return null; // Fontlar ve kullanıcı verisi yüklenene kadar boş ekran göster
  }

  return (
    <LanguageProvider>
      <FontProvider>
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      </FontProvider>
    </LanguageProvider>
  );
}

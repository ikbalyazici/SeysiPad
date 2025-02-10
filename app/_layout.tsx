import { useEffect } from "react";
import { Slot, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync(); // Splash Screen'i açık tut

export default function Layout() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
    SplashScreen.hideAsync(); // Yönlendirme tamamlandıktan sonra Splash Screen kapanır
  }, [user]);

  return <Slot />; // Hiçbir şey göstermiyoruz
}

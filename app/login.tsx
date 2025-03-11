import { useState, useEffect } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, Alert, BackHandler, StatusBar, TouchableOpacity ,StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { usePathname, useRouter } from "expo-router";
import { useTheme } from "@/hooks/useThemeContext"; // Tema Hook'unu içe aktardık
import { useLanguage } from "@/context/LanguageContext";

export const unstable_settings = {
  headerBackVisible: false,
};

export default function LoginScreen() {
  const { signIn, user, loading, error/*, signInWithGoogle*/} = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { theme } = useTheme(); // Mevcut temayı al
  const { t } = useLanguage();


  useEffect(() => {
    const backAction = () => {
      if (pathname === "/login") {
        Alert.alert(t("cikis"), t("cikmakmiistiyon"), [
          { text: t("hayir"), style: "cancel" },
          { text: t("evet"), onPress: () => BackHandler.exitApp() },
        ]);
        return true; // Geri tuşunu engelle
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, [pathname]);

  // Eğer kullanıcı giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (user) {
        router.replace("/(tabs)"); // Giriş yapınca ana sayfaya yönlendir
    }
  }, [user]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: theme.background, // Temaya uygun arka plan rengi
      }}
    >
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, color: theme.text }}>{t("girisyap")}</Text>

      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <TextInput
        placeholder={t("eposta")}
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius:12, borderColor: theme.tint, backgroundColor: theme.inputBackground }}
      />
      <TextInput
        placeholder={t("sifre")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, borderRadius:12, marginBottom: 10, borderColor: theme.tint, backgroundColor: theme.inputBackground }}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={() => signIn(email, password)} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? t("girisyapiliyor") : t("girisyap")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <Text style={{ color: theme.tint, marginTop: 10 }}>{t("sifremiunuttun")}</Text>
          </TouchableOpacity>
          </>
      )}

      <Text
        onPress={() => router.push("/signup")}
        style={{ marginTop: 20, textAlign: "center", color: theme.tint}}
      >
        {t("hesapyokmu")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    alignSelf: "center",
    width: "100%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});


import { useState, useEffect } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, Alert, BackHandler, StatusBar } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { usePathname, useRouter } from "expo-router";

export const unstable_settings = {
  headerBackVisible: false,
};

export default function LoginScreen() {
  const { signIn, user, loading, error, signInWithGoogle} = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const backAction = () => {
      if (pathname === "/login") {
        Alert.alert("Çıkış", "Uygulamadan çıkmak istiyor musunuz?", [
          { text: "Hayır", style: "cancel" },
          { text: "Evet", onPress: () => BackHandler.exitApp() },
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
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <StatusBar hidden />
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Giriş Yap</Text>

      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <TextInput
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button title="Giriş Yap" onPress={() => signIn(email, password)} />
          <Button title="Google ile Giriş Yap" onPress={signInWithGoogle} />
          </>
      )}

      <Text
        onPress={() => router.push("/signup")}
        style={{ marginTop: 20, textAlign: "center", color: "blue" }}
      >
        Hesabın yok mu? Kayıt ol
      </Text>
    </View>
  );
}

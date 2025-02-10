import { View, Text, Button, ActivityIndicator } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { auth } from "@/constants/firebaseConfig";

export default function HomeScreen() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // // Kullanıcı giriş yapmamışsa login ekranına yönlendir
  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged((user) => {
  //     if (!user) {
  //       router.replace("/login"); // Eğer giriş yapılmamışsa login ekranına yönlendir
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Hoş geldin!</Text>

      {user && (
        <>
          <Text style={{ marginVertical: 10 }}>E-posta: {user.email}</Text>
          <Button title="Çıkış Yap" onPress={() => logout()} color="red" />
        </>
      )}
    </View>
  );
}

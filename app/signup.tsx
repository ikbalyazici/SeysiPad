import { useState, useEffect } from "react";
import { View, TextInput, Button, Alert, Text, StatusBar, StyleSheet, TouchableOpacity } from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../constants/firebaseConfig";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useThemeContext"; // Tema Hook'unu içe aktardık

export default function SignupScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { theme } = useTheme(); // Mevcut temayı al

  // useEffect(() => {
  //   if (user && user.emailVerified) {
  //     router.replace("/login");
  //   }
  // }, [user]);

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Hata", "Tüm alanları doldurun!");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor!");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      Alert.alert(
        "Hata",
        "Şifre en az 8 karakter olmalı, büyük harf, küçük harf, sayı ve özel karakter içermelidir!"
      );
      return;
    }

    try {
      const usernameRef = doc(db, "usernames", username);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        Alert.alert("Hata", "Bu kullanıcı adı zaten alınmış!");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), { username, email });
      await setDoc(doc(db, "usernames", username), { uid: user.uid });

      await sendEmailVerification(user);
      Alert.alert("Başarılı", "Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.");

      // 24 saat içinde doğrulanmazsa hesabı sil
      setTimeout(async () => {
        await user.reload(); // Kullanıcının en son durumunu güncelle
        if (!user.emailVerified) {
          await deleteUser(user);
          Alert.alert("Hata", "E-posta doğrulanmadığı için hesabınız silindi.");
        }
      }, 10 * 60 * 1000); // 24 saat
    } catch (error) {
      Alert.alert("Hata", error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <TextInput
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.inputPlaceholder}
        keyboardType="email-address"
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={theme.inputPlaceholder}
        secureTextEntry
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        placeholder="Şifreyi Tekrar Gir"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor={theme.inputPlaceholder}
        secureTextEntry
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleSignup}>
        <Text style={styles.buttonText}>{"Kayıt Ol"}</Text>
      </TouchableOpacity>
      <Text style={{ marginTop: 10, color: theme.text, textAlign: "center" }}>
        Kayıt olduktan sonra lütfen e-posta adresinizi doğrulayın.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  submitButton: {
    alignSelf: "center",
    width: "90%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
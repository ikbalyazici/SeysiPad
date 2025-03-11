import { useState, useEffect } from "react";
import { View, TextInput, Button, Alert, Text, StatusBar, StyleSheet, TouchableOpacity } from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../constants/firebaseConfig";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useThemeContext"; // Tema Hook'unu içe aktardık
import { useLanguage } from "@/context/LanguageContext";

export default function SignupScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { theme } = useTheme(); // Mevcut temayı al

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert(t("hata"), t("tumalanlaridoldur"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("hata"), t("sifreeslesmiyor"));
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password)) {
      Alert.alert(
        t("hata"),
        t("sifrehatasi")
      );
      return;
    }    

    try {
      const usernameRef = doc(db, "usernames", username);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        Alert.alert(t("hata"), t("nickalinmis"));
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), { username, email });
      await setDoc(doc(db, "usernames", username), { uid: user.uid });

      await sendEmailVerification(user);
      Alert.alert(t("basarili"), t("epostadogrula"));
      router.back();

      // 10 dakika içinde doğrulanmazsa hesabı sil
    } catch (error) {
      Alert.alert(t("hata"), error instanceof Error ? error.message : t("bilinmeyenhata"));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <TextInput
        placeholder={t("kullaniciadi")}
        value={username}
        onChangeText={setUsername}
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        placeholder={t("eposta")}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.inputPlaceholder}
        keyboardType="email-address"
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        placeholder={t("sifre")}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={theme.inputPlaceholder}
        secureTextEntry
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        placeholder={t("sifretekrar")}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor={theme.inputPlaceholder}
        secureTextEntry
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleSignup}>
        <Text style={styles.buttonText}>{t("kayıtol")}</Text>
      </TouchableOpacity>
      <Text style={{ marginTop: 10, color: theme.text, textAlign: "center" }}>
        {t("kayitdogrula")}
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
import { useState, useEffect } from "react";
import { View, TextInput, Button, Alert, Text } from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../constants/firebaseConfig";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";

export default function SignupScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <TextInput
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Şifreyi Tekrar Gir"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <Button title="Kayıt Ol" onPress={handleSignup} />
      <Text style={{ marginTop: 10, color: "gray", textAlign: "center" }}>
        Kayıt olduktan sonra lütfen e-posta adresinizi doğrulayın.
      </Text>
    </View>
  );
}

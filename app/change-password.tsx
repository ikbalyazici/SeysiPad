import { useState } from "react";
import { View, TextInput, Button, Alert, StatusBar, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useTheme } from "@/hooks/useThemeContext"; 
import { router } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";

export default function ChangePasswordScreen() {
  const { user, changePassword } = useAuth();
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme(); 

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("hata"), t("tumalanlaridoldur"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("hata"), t("sifreeslesmiyor"));
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(newPassword)) {
      Alert.alert(
        t("hata"),
        t("sifrehatasi")
      );
      return;
    }    

    if (!user || !user.email) {
      Alert.alert(t("hata"), t("bilgieksik"));
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      const result = await changePassword(newPassword);
      
      if (result.success) {
        Alert.alert(t("basarili"), t("sifreguncel"));
        router.back();
      } else {
        Alert.alert(t("hata"), result.message);
      }
    } catch (error) {
      Alert.alert(t("hata"), t("kimlikhata"));
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1,padding: 20, backgroundColor: theme.background, justifyContent: "center" }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <TextInput
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholderTextColor={theme.inputPlaceholder}
        placeholder={t("mevcutsifre")}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />
      <TextInput
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        placeholderTextColor={theme.inputPlaceholder}
        placeholder={t("yenisifre")}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />
      <TextInput
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor={theme.inputPlaceholder}
        placeholder={t("yenisifretekrar")}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />
      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleChangePassword} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t("güncelleniyor") : t("sifredegis")}</Text>
      </TouchableOpacity>
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
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { View, TextInput, Button, Text, Alert, StatusBar, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useThemeContext"; // Tema Hook'unu içe aktardık
import { router } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { resetPassword } = useAuth();
  const { theme } = useTheme(); // Mevcut temayı al
  const { t } = useLanguage();

  const handleResetPassword = async () => {
    setLoading(true);
    const response = await resetPassword(email);
    setLoading(false);

    if (response.success) {
      Alert.alert(t("basarili"), t("sifirlamapostasi"));
      router.back();
    } else {
      Alert.alert(t("hata"), response.message);
    }
  };

  return (
    <View style={{ flex: 1,padding: 20, backgroundColor: theme.background , justifyContent: "center"}}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <Text style={{color: theme.text}}>{t("sifresifirlamail")}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t("eposta")}
        autoCapitalize="none"
        placeholderTextColor={theme.inputPlaceholder}
        keyboardType="email-address"
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}

      />

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleResetPassword} disabled={loading}>
        <Text style={styles.buttonText}>{t("sifresifirla")}</Text>
      </TouchableOpacity>  
      {message ? <Text style={{ color: "green" }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    marginTop: 5
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
    marginLeft: 8,
  },
});

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import * as Linking from "expo-linking";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function FeedbackScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sendFeedback = () => {
    if (!subject || !message) {
      Alert.alert(t("hata"), t("lutfen_tum_alanlari_doldur"));
      return;
    }

    const email = "support@seysipad.com";
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    Linking.openURL(mailto).catch(() => {
      Alert.alert(t("hata"), t("eposta_uygulamasi_bulunamadi"));
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 20, justifyContent: "center" }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        
        <Text style={{ color: theme.text, fontSize: 20, marginBottom: 10, fontWeight:"bold" }}>
            {t("geribildirim")}
        </Text>

        <TextInput
            placeholder={t("konu")}
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor={theme.inputPlaceholder}
            style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
        />

        <TextInput
            placeholder={t("mesaj")}
            value={message}
            onChangeText={setMessage}
            multiline
            placeholderTextColor={theme.inputPlaceholder}
            style={[styles.textarea, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
        />

        <TouchableOpacity
            onPress={sendFeedback}
            style={[styles.submitButton, { backgroundColor: theme.tint }]}
        >
            <Text style={styles.buttonText}>{t("gonder")}</Text>
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
      marginBottom: 10,
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
    },
    textarea: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      textAlignVertical:"top",
      height: 100, // Sabit 5 satır için yükseklik
      marginBottom: 15,
    },
  });

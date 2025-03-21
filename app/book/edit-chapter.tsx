import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TextInput, Button, ActivityIndicator, StatusBar, StyleSheet, TouchableOpacity } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../constants/firebaseConfig"; // Firebase bağlantısını doğru verdiğinden emin ol
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "@/hooks/useThemeContext"; 
import { useLanguage } from "@/context/LanguageContext";


export default function EditChapterScreen() {
  const { id } = useLocalSearchParams(); // 📌 ID'yi al
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme(); 
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {t } = useLanguage();

  useEffect(() => {
    const fetchChapter = async () => {
      if (!id) {
        setError(t("bolumidyok"));
        setLoading(false);
        return;
      }

      try {
        const chapterRef = doc(db, "chapters", id as string);
        const chapterSnap = await getDoc(chapterRef);

        if (chapterSnap.exists()) {
          const chapterData = chapterSnap.data();
          setTitle(chapterData.title);
          setContent(chapterData.content);
        } else {
          setError(t("bolumyok"));
        }
      } catch (err) {
        setError(t("bolumyuklehata"));
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [id]);

  const handleSave = async () => {
    if (!id || !user) return;

    if (!title || !content) {
      setError(t("bosolamazlar"));
      return { 
        success: false };
    }

    try {
      setLoading(true);
      const chapterRef = doc(db, "chapters", id as string);
      await updateDoc(chapterRef, { title, content });

      router.back();
    } catch (err) {
      setError(t("bolumguncelhata"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color:theme.text }}>{t("bolumduzenle")}</Text>
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t("bolumbasligi")}
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder={t("bolumicerigi")}
        maxLength={30000}
        placeholderTextColor={theme.inputPlaceholder}
        multiline
        style={[styles.textarea, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t("kaydediliyor") : t("kaydet")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    textAlignVertical:"top",
    padding: 10,
    height: 600, // Sabit 30 satır için yükseklik
    marginBottom: 15,
  },
  placeholderText: {
    textAlignVertical:"top",
    textAlign: "auto",
    marginBottom: 10,
  },

  submitButton: {
    position: "absolute",
    bottom: 30, // Sayfanın altına yakın ama tam dipte değil
    alignSelf: "center",
    width: "90%",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

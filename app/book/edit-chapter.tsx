import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  KeyboardAvoidingView} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../constants/firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function EditChapterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  
  // Klavye durumu için state oluşturuyoruz
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(600); // Başlangıçta yüksekliği 600

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      setTextareaHeight(500); // Klavye açıldığında yükseklik 400
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      setTextareaHeight(600); // Klavye kapandığında yükseklik 600
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
      return { success: false };
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }} 
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
          
          <View style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: theme.text }}>
              {t("bolumduzenle")}
            </Text>

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
              style={[styles.textarea, { borderColor: theme.tint, backgroundColor: theme.inputBackground, height: textareaHeight }]}
            />

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: theme.tint }]} 
              onPress={handleSave} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? t("kaydediliyor") : t("kaydet")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
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
    textAlignVertical: "top",
    padding: 10,
    marginBottom: 15,
  },
  submitButton: {
    alignSelf: "center",
    width: "90%",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TextInput, StatusBar, StyleSheet, TouchableOpacity, Keyboard, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, ScrollView } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useAddChapter } from "../../hooks/useAddChapter";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../constants/firebaseConfig";

export default function AddChapterScreen() {
  const { bookId } = useLocalSearchParams(); 
  const router = useRouter();
  const { user } = useAuth();
  const { addChapter } = useAddChapter();
  const { theme } = useTheme(); 
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  // Klavye durumu için state oluşturuyoruz
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(600); // Başlangıçta yüksekliği 600

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      setTextareaHeight(400); // Klavye açıldığında yükseklik 400
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

  const sendNotification = async (recipientUid: string, senderUid: string, chapterId: string, text: string) => {
    if (!recipientUid || recipientUid === senderUid) return; 

    await addDoc(collection(db, "notifications"), {
      recipientUid,
      senderUid,
      type: "chapter",
      chapterId,
      createdAt: new Date(),
      read: false,
      text,
    });
  };

  const handleAddChapter = async () => {
    if (!bookId || !user) return;
    setLoading(true);
    setError(null);

    const result = await addChapter(bookId as string, title, content);
    
    if (result.success) {
      const followersRef = collection(db, "users", user.uid as string, "followers");
      const querySnapshot = await getDocs(followersRef);

      const followersData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const followerId = docSnapshot.id;
          await sendNotification(followerId, user.uid, result.chapterId as string, t("bolumbildirim")+ " " +title);
        })
      );
      router.back(); // Bölüm eklenince kitaba geri dön
    } else {
      setError(result.message);
    }
    setLoading(false);
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
              {t("yenibolumekle")}
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
              onPress={handleAddChapter} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? t("ekleniyor") : t("bolumekle")}</Text>
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

import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TextInput, StatusBar, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useAddChapter } from "../../hooks/useAddChapter";
import { useTheme } from "@/hooks/useThemeContext"; 
import { useLanguage } from "@/context/LanguageContext";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/constants/firebaseConfig";

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
    <View style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: theme.text }}>{t("yenibolumekle")}</Text>
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

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleAddChapter} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t("ekleniyor") : t("bolumekle")}</Text>
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

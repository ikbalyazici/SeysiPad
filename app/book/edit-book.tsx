import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TextInput, Button, ActivityIndicator, Image, Alert, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../constants/firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { useUploadBookCover } from "../../hooks/useUploadBookCover";
import { useTheme } from "@/hooks/useThemeContext"; 
import { MaterialIcons } from "@expo/vector-icons";

export default function EditBookScreen() {
  const { id } = useLocalSearchParams(); // 📌 Kitap ID'sini al
  const router = useRouter();
  const { user } = useAuth();
  const { uploadBookCover } = useUploadBookCover();
  const { theme } = useTheme(); 
  const [coverURL, setCoverURL] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) {
        setError("Kitap ID bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        const bookRef = doc(db, "books", id as string);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          const bookData = bookSnap.data();
          setTitle(bookData.title);
          setDescription(bookData.description);
          setCoverURL(bookData.coverURL || null);
        } else {
          setError("Kitap bulunamadı.");
        }
      } catch (err) {
        console.error("Kitap yüklenirken hata oluştu:", err);
        setError("Kitap yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleSave = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      const bookRef = doc(db, "books", id as string);
      await updateDoc(bookRef, { title, description, coverURL });

      router.push(`/book/${id}`);
    } catch (err) {
      console.error("Kitap güncellenirken hata oluştu:", err);
      setError("Kitap güncellenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!id) return;

    try {
      // Kullanıcıdan resim seçmesini iste
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Resim oranı (isteğe bağlı)
        quality: 1,
      });

      if (result.canceled) {
        Alert.alert("İşlem iptal edildi", "Resim seçilmedi.");
        return;
      }

      const imageUri = result.assets?.[0]?.uri;
      if (!imageUri) {
        Alert.alert("Hata", "Geçerli bir resim bulunamadı.");
        return;
      }

      // Resmi Firebase'e yükle
      const uploadResult = await uploadBookCover(id as string, imageUri);
      if (uploadResult.success && uploadResult.url) {
        setCoverURL(uploadResult.url);

        // Firestore'a yeni kapak URL'sini kaydet
        const bookRef = doc(db, "books", id as string);
        await updateDoc(bookRef, { coverURL: uploadResult.url });
      } else {
        Alert.alert("Kapak yüklenemedi", uploadResult.message || "Bilinmeyen hata.");
      }
    } catch (err) {
      console.error("Kapak yüklenirken hata oluştu:", err);
      setError("Kapak yüklenirken hata oluştu.");
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
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: theme.text }}>Kitabı Düzenle</Text>
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Kitap Adı</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Kitap Adı"
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <Text style={[styles.label, { color: theme.text }]}>Açıklama</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Kitabınızı tanıtın"
        maxLength={1000}
        placeholderTextColor={theme.inputPlaceholder}
        multiline
        style={[styles.textarea, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <Text style={[styles.label, { color: theme.text }]}>Kapak Resmi</Text>
      {coverURL ? (
        <Image source={{ uri: coverURL }} style={{ width: 150, height: 200, marginBottom: 10 }} />
      ) : (
        <Image source={{ uri: "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900" }} style={{ width: 150, height: 200, marginBottom: 10 }} />
      )}

      <TouchableOpacity style={[styles.imageButton, { backgroundColor: theme.tint }]} onPress={handleUploadCover}>
        <MaterialIcons name="photo-library" size={20} color="white" />
        <Text style={styles.buttonText}>Kapak Resmi Seç</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Kaydediliyor..." : "Kaydet"}</Text>
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
    padding: 10,
    textAlignVertical:"top",
    height: 150, // Sabit 5 satır için yükseklik
    marginBottom: 15,
  },
  placeholderText: {
    textAlign: "center",
    marginBottom: 10,
  },
  coverImage: {
    width: 150,
    height: 200,
    alignSelf: "center",
    marginBottom: 10,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
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
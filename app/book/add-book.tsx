import { useState } from "react";
import { View, TextInput, Button, Text, Alert, Image, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { addBook } from "../../hooks/useAddBook";
import { useUploadBookCover } from "../../hooks/useUploadBookCover";
import { useTheme } from "@/hooks/useThemeContext"; 
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";

export default function AddBookScreen() {
  const auth = useAuth();
  const user = auth.user;
  const { uploadBookCover } = useUploadBookCover();
  const { theme } = useTheme(); 
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  // 📌 Resim seçme fonksiyonu
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  // 📌 Kitap ekleme işlemi
  const handleAddBook = async () => {
    if (!user) {
      Alert.alert(t("hata"), t("kimseyok"));
      return;
    }

    if (!title.trim()) {
      Alert.alert(t("hata"), t("kitapadılazım"));
      return;
    }

    setLoading(true);

    try {
      const result = await addBook(user.uid, title, description);

      if (!result.success) {
        throw new Error(result.message);
      }

      let coverURL = null;

      // 📌 Kapak resmi yükleme işlemi
      if (coverImage) {
        const uploadResult = await uploadBookCover(result.bookId as string, coverImage);
        if (uploadResult.success) {
          coverURL = uploadResult.url;
        }
      }

      Alert.alert(t("basarili"), t("kitapeklendi"));

      // 📌 Form temizleme
      setTitle("");
      setDescription("");
      setCoverImage(null);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(t("hata"), t("kitapeklehata"));
    }

    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />
      
      <Text style={[styles.label, { color: theme.text }]}>{t("kitapadi")}</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t("kitapadigir")}
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <Text style={[styles.label, { color: theme.text }]}>{t("aciklama")}</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t("kitaptanit")}
        maxLength={1000}
        placeholderTextColor={theme.inputPlaceholder}
        multiline
        style={[styles.textarea, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <Text style={[styles.label, { color: theme.text }]}>{t("kapakresmi")}</Text>
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.coverImage} />
      ) : (
        <Text style={[styles.placeholderText, { color: theme.text }]}>{t("kapakresmisecilmedi")}</Text>
      )}

      <TouchableOpacity style={[styles.imageButton, { backgroundColor: theme.tint }]} onPress={pickImage}>
        <MaterialIcons name="photo-library" size={20} color="white" />
        <Text style={styles.buttonText}>{t("kapakresmisec")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleAddBook} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t("ekleniyor") : t("kitapekle")}</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    height: 150, // Sabit 5 satır için yükseklik
    textAlignVertical:"top",
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



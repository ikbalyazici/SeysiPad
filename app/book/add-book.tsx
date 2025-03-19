import { useState } from "react";
import { View, TextInput, Button, Text, Alert, Image, StatusBar, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { addBook } from "../../hooks/useAddBook";
import { useUploadBookCover } from "../../hooks/useUploadBookCover";
import { useTheme } from "@/hooks/useThemeContext"; 
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/constants/firebaseConfig";

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

  // 📌 Kategoriler
  const categoriesList = [
    "Aksiyon", 
    "Macera", 
    "Fantezi", 
    "BilimKurgu", 
    "Romantizm",
    "GenelKurgu", 
    "Korku", 
    "Gizem", 
    "Gerilim", 
    "Doğaüstü",
    "Mizah", 
    "Tarihi", 
    "GençKurgu", 
    "Şiir",
    "Hikaye"
  ];
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false); // Dropdown aç/kapat

  const sendNotification = async (recipientUid: string, senderUid: string, bookId: string, text: string) => {
    if (!recipientUid || recipientUid === senderUid) return; 

    await addDoc(collection(db, "notifications"), {
      recipientUid,
      senderUid,
      type: "book",
      bookId,
      createdAt: new Date(),
      read: false,
      text,
    });
  };

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

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else if (prev.length < 3) {
        return [...prev, category];
      } else {
        Alert.alert(t("hata"), t("enfazla3kategori"));
        return prev;
      }
    });
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

    if (selectedCategories.length === 0) {
      Alert.alert(t("hata"), t("enkatkategorigerekli"));
      return;
    }

    setLoading(true);

    try {
      const result = await addBook(user.uid, title, description, 0, 0, selectedCategories);

      if (!result.success) {
        throw new Error(t("gecersizgiris"));
      }

      let coverURL = null;

      if (coverImage) {
        const uploadResult = await uploadBookCover(result.bookId as string, coverImage);
        if (uploadResult.success) {
          coverURL = uploadResult.url;
        }
      }

      Alert.alert(t("basarili"), t("kitapeklendi"));

      setTitle("");
      setDescription("");
      setCoverImage(null);
      setSelectedCategories([]);

      const followersRef = collection(db, "users", user.uid as string, "followers");
      const querySnapshot = await getDocs(followersRef);

      const followersData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const followerId = docSnapshot.id;
          await sendNotification(followerId, user.uid, result.bookId as string, t("kitapbildirim")+ " " +title);
        })
      );

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(t("hata"), t("kitapeklehata"));
    }

    setLoading(false);
  };

  const styles = StyleSheet.create({
    dropdownButton: {
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 10,
    },
    dropdownMenu: {
      maxHeight: 200,
      borderRadius: 10,
      borderWidth: 1,
      paddingVertical: 5,
      borderColor: theme.tint,
      backgroundColor: theme.modalbg
    },
    categoryOption: {
      padding: 10,
      alignItems: "center",
      borderColor: theme.tint,
      borderBottomWidth: 1,
    },
    categorySelected: {
      backgroundColor: "#4CAF50",
    },
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
      height: 90, // Sabit 5 satır için yükseklik
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
        maxLength={750}
        placeholderTextColor={theme.inputPlaceholder}
        multiline
        style={[styles.textarea, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      {/* 📌 Kategori Seçimi */}
      <Text style={[styles.label, { color: theme.text }]}>{t("kategorisec")}</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: theme.tint }]}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {t("kategorisec")}
        </Text>
      </TouchableOpacity>

      {showDropdown && (
        <ScrollView style={styles.dropdownMenu}>
          {categoriesList.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryOption,
                selectedCategories.includes(category) && styles.categorySelected,
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text style={{ color: selectedCategories.includes(category) ? "white" : theme.text }}>
                {t(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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




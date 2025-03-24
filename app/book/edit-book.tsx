import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TextInput, Button, ActivityIndicator, Image, Alert, StatusBar, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../constants/firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { useUploadBookCover } from "../../hooks/useUploadBookCover";
import { useTheme } from "@/hooks/useThemeContext"; 
import { MaterialIcons } from "@expo/vector-icons";
import { useLanguage } from "@/context/LanguageContext";

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

  const agesList = [
    "GenelOkuyucu",
    "13-14",
    "15-16",
    "17-18",
    "19-20",
    "21+",
  ];
  
  const contentsList = [
    "GenelOkuyucu",
    "Şiddet",
    "KorkuGerilim",
    "KüfürArgo",
    "Cinselİçerik",
    "UyuşturucuAlkol",
    "AğırPsikolojikTemalar",
  ];
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAgeBounds, setSelectedAgeBounds] = useState<string[]>([]);
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false); // Dropdown aç/kapat
  const [showDropdownAge, setShowDropdownAge] = useState(false); // Dropdown aç/kapat
  const [showDropdownContent, setShowDropdownContent] = useState(false); // Dropdown aç/kapat

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) {
        setError(t("kitapidyok"));
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
          // 📌 Seçili Kategorileri Yükle
          if (bookData.selectedCategories && Array.isArray(bookData.selectedCategories)) {
            setSelectedCategories(bookData.selectedCategories);
          }
          if (bookData.selectedAgeBounds && Array.isArray(bookData.selectedAgeBounds)) {
            setSelectedAgeBounds(bookData.selectedAgeBounds);
          }
          if (bookData.selectedContents && Array.isArray(bookData.selectedContents)) {
            setSelectedContents(bookData.selectedContents);
          }
        } else {
          setError(t("kitapyok"));
        }
      } catch (err) {
        console.error(t("kitapyuklehata"), err);
        setError(t("kitapyuklehata"));
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  // 📌 Kategori Seçimini Güncelle
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

   // 📌 Yaş Sınırları Seçimini Güncelle
  const toggleAgeBounds = (category: string) => {
    setSelectedAgeBounds((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else if (prev.length < 3) {
        return [...prev, category];
      } else {
        Alert.alert(t("hata"), t("enfazla3yas"));
        return prev;
      }
    });
  };

    // 📌 İçerik Sınırları Seçimini Güncelle
    const toggleContent = (category: string) => {
    setSelectedContents((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category); // Seçilmişse kaldır
      } else {
        return [...prev, category]; // Yeni seçim ekle
      }
    });
  };    

  const handleSave = async () => {
    if (!id || !user) return;
    if (!title)  { 
      setError(t("baslikbosolamaz"));
      return { 
        success: false };
    };

    if (selectedCategories.length === 0) {
      Alert.alert(t("hata"), t("enkatkategorigerekli"));
      return;
    }

    if (selectedAgeBounds.length === 0) {
      Alert.alert(t("hata"), t("enkatyasgerekli"));
      return;
    }

    if (selectedContents.length === 0) {
      Alert.alert(t("hata"), t("enkaticerikgerekli"));
      return;
    }

    try {
      setLoading(true);
      const bookRef = doc(db, "books", id as string);
      await updateDoc(bookRef, { 
        title, 
        description, 
        coverURL, 
        selectedCategories: selectedCategories, // 📌 Kategorileri Firestore'a kaydet
        selectedAgeBounds: selectedAgeBounds,
        selectedContents: selectedContents
      });

      router.back();
    } catch (err) {
      setError(t("kitapguncelhata"));
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
        Alert.alert(t("islemiptal"), t("resimsecilmedi"));
        return;
      }

      const imageUri = result.assets?.[0]?.uri;
      if (!imageUri) {
        Alert.alert(t("hata"), t("resimbulunamadi"));
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
        Alert.alert(t("kapakyuklenemedi"), uploadResult.message || t("bilinmeyenhata"));
      }
    } catch (err) {
      console.error(t("kapakyuklehata"), err);
      setError(t("kapakyuklehata"));
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

  const styles = StyleSheet.create({
    dropdownButton: {
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 10,
    },
    dropdownMenu: {
      //maxHeight: 200,
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
      marginTop: 10,
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
      //position: "absolute",
      //bottom: 30, // Sayfanın altına yakın ama tam dipte değil
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
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: theme.background }} contentContainerStyle={{paddingBottom: 80 }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: theme.text }}>{t("kitapduzenle")}</Text>
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>{t("kitapadi")}</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t("kitapadi")}
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

      {/*📌 Kategori Seçimi */}
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

      {/*📌 Yaş Seçimi */}
      <Text style={[styles.label, { color: theme.text }]}>{t("yassec")}</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: theme.tint }]}
        onPress={() => setShowDropdownAge(!showDropdownAge)}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {t("yassec")}
        </Text>
      </TouchableOpacity>

      {showDropdownAge && (
        <ScrollView style={styles.dropdownMenu}>
          {agesList.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryOption,
                selectedAgeBounds.includes(category) && styles.categorySelected,
              ]}
              onPress={() => toggleAgeBounds(category)}
            >
              <Text style={{ color: selectedAgeBounds.includes(category) ? "white" : theme.text }}>
                {t(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}  

      {/*📌 İçerik Seçimi */}
      <Text style={[styles.label, { color: theme.text }]}>{t("iceriksec")}</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: theme.tint }]}
        onPress={() => setShowDropdownContent(!showDropdownContent)}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {t("iceriksec")}
        </Text>
      </TouchableOpacity>

      {showDropdownContent && (
        <ScrollView style={styles.dropdownMenu}>
          {contentsList.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryOption,
                selectedContents.includes(category) && styles.categorySelected,
              ]}
              onPress={() => toggleContent(category)}
            >
              <Text style={{ color: selectedContents.includes(category) ? "white" : theme.text }}>
                {t(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}  

      <Text style={[styles.label, { color: theme.text }]}>{t("kapakresmi")}</Text>
      {coverURL ? (
        <Image source={{ uri: coverURL }} style={{ width: 225, height: 300, marginBottom: 10, alignSelf: "center" }} />
      ) : (
        <Image source={{ uri: "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/book_covers%2Fno_cover%2Fimages.png?alt=media&token=ea0b3a6a-c8a2-4b91-ab9b-4926e815b900" }} style={{ width: 225, height: 300, marginBottom: 10, alignSelf: "center" }} />
      )}

      <TouchableOpacity style={[styles.imageButton, { backgroundColor: theme.tint }]} onPress={handleUploadCover}>
        <MaterialIcons name="photo-library" size={20} color="white" />
        <Text style={styles.buttonText}>{t("kapakresmisec")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t("kaydediliyor"): t("kaydet")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


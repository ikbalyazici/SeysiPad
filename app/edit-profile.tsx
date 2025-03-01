import { useState, useEffect } from "react";
import { View, TextInput, Button, Image, Alert, StatusBar, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db, storage } from "../constants/firebaseConfig";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useTheme } from "@/hooks/useThemeContext"; 

export default function EditProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUsername(userData.username || "");
        setBio(userData.bio || "");
        setImage(userData.photoURL || null);
      }
    };

    fetchUserData();
  }, [user]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!uri || uri.trim() === "" || !user) {
      Alert.alert("Hata", "Geçersiz işlem.");
      return null;
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `profile_images/${user.uid}/profile.jpg`);
      const uploadTask = uploadBytesResumable(imageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (error) {
      Alert.alert("Hata", "Fotoğraf yüklenirken bir hata oluştu.");
      return null;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      Alert.alert("Hata", "Kullanıcı adı boş bırakılamaz.");
      return;
    }
    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert("Hata", "Kullanıcı bulunamadı.");
        return;
      }

      const currentData = userSnap.data();
      let newPhotoURL = currentData.photoURL;

      // Kullanıcı adı değiştiyse kontrol et
      if (username !== currentData.username) {
        const usernameRef = doc(db, "usernames", username);
        const usernameSnap = await getDoc(usernameRef);

        if (usernameSnap.exists()) {
          Alert.alert("Hata", "Bu kullanıcı adı zaten alınmış!");
          setLoading(false);
          return;
        }

        // Yeni kullanıcı adını `usernames` koleksiyonuna ekle
        await setDoc(usernameRef, { uid: user.uid });

        // Eski kullanıcı adını `usernames` koleksiyonundan sil
        if (currentData.username) {
          await updateDoc(doc(db, "usernames", currentData.username), { uid: null });
        }
      }

      // Eğer yeni bir resim seçildiyse ve farklıysa, yükle
      if (image && image.trim() !== "" && image !== currentData.photoURL) {
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) {
          newPhotoURL = uploadedUrl;
        }
      }

      const updatedData: Partial<{ username: string; bio: string; photoURL: string }> = {};

      if (username !== currentData.username) {
        updatedData.username = username.trim();
      }

      if (bio.trim() && bio !== currentData.bio) {
        updatedData.bio = bio.trim();
      }

      if (newPhotoURL !== currentData.photoURL) {
        updatedData.photoURL = newPhotoURL;
      }

      // Firebase Authentication'daki profili güncelle
      await updateProfile(user, {
        displayName: updatedData.username,
        photoURL: updatedData.photoURL,
      });

      // Firestore'daki profili güncelle
      if (Object.keys(updatedData).length > 0) {
        await updateDoc(userRef, updatedData);
        Alert.alert("Başarılı", "Profiliniz güncellendi!");
      } else {
        Alert.alert("Bilgi", "Herhangi bir değişiklik yapılmadı.");
      }

      router.back();
    } catch (error) {
      Alert.alert("Hata", "Profil güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
      {image ? (
        <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 50, alignSelf: "center", marginBottom: 10 }} />
      ) : (
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "gray", alignSelf: "center" }} />
      )}
  
      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={pickImage} disabled={loading}>
        <Text style={styles.buttonText}>{"Fotoğraf Seç"}</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor={theme.inputPlaceholder}
        style={[styles.input, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TextInput
        placeholder="Biyografi"
        value={bio}
        onChangeText={setBio}
        maxLength={500}
        placeholderTextColor={theme.inputPlaceholder}
        multiline
        style={[styles.textarea, { borderColor: theme.tint, backgroundColor: theme.inputBackground }]}
      />

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={() => router.push("/change-password")} disabled={loading}>
        <Text style={styles.buttonText}>{"Şifreyi değiştir"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.tint }]} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Kaydediliyor..." : "Kaydet"}</Text>
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

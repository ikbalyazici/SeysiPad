import { useState } from "react";
import { View, TextInput, Button, Image, Alert } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../../constants/firebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function EditProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState(user?.photoURL || "");

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

  const handleSave = async () => {
    if (!user) return;
    try {
      let imageUrl = image;

      if (image && image !== user.photoURL) {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "users", user.uid), {
        username,
        bio,
        photoURL: imageUrl,
      });

      Alert.alert("Başarılı", "Profil güncellendi!");
      router.back();
    } catch (error) {
      Alert.alert("Hata", "Profil güncellenirken bir hata oluştu.");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 50, alignSelf: "center" }} />
      <Button title="Fotoğraf Seç" onPress={pickImage} />

      <TextInput
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Biyografi"
        value={bio}
        onChangeText={setBio}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <Button title="Kaydet" onPress={handleSave} />
    </View>
  );
}

import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { addChapter } from "../../hooks/useAddChapter";

export default function AddChapterScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleAddChapter = async () => {
    if (!title || !content) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    await addChapter(title, content);
    Alert.alert("Başarılı", "Bölüm eklendi!");
    setTitle("");
    setContent("");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Yeni Bölüm Ekle</Text>
      
      <TextInput
        placeholder="Bölüm Başlığı"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <TextInput
        placeholder="Bölüm İçeriği"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <Button title="Bölümü Kaydet" onPress={handleAddChapter} />
    </View>
  );
}

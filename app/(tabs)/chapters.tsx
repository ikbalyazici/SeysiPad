import { View, Text, Button, FlatList, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFetchChapters } from "../../hooks/useFetchChapters";

export default function ChaptersScreen() {
  const router = useRouter();
  const { chapters, loading } = useFetchChapters();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Yeni Bölüm Ekle" onPress={() => router.push("../chapter/add-chapter")} />

      <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 10 }}>Bölümler</Text>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`../chapter/${item.id}`)}>
              <View style={{ padding: 15, borderBottomWidth: 1, borderColor: "#ddd" }}>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.title}</Text>
                <Text numberOfLines={2}>{item.content}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

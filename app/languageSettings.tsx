import React from "react";
import { View, Text, FlatList, Pressable, StatusBar } from "react-native";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/hooks/useThemeContext";

const languages = [
  { code: "tr", label: "🇹🇷 Türkçe" },
  { code: "en", label: "🇬🇧 English" },
  { code: "de", label: "🇩🇪 Deutsch" }

];

const LanguageSettings = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}>
      <StatusBar barStyle={theme.bar} backgroundColor={theme.background} />

      {/* Başlık */}
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, color: theme.text }}>
        {t("dilsecimi")}
      </Text>

      {/* Dil Seçenekleri */}
      <FlatList
        data={languages}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setLanguage(item.code)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 15,
              marginBottom: 10,
              borderRadius: 10,
              backgroundColor: language === item.code ? theme.tint : theme.inputBackground,
            }}
          >
            <Text style={{ fontSize: 18, color: language === item.code ? "white" : theme.inputText }}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
};

export default LanguageSettings;

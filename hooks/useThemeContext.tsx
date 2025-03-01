import { createContext, useContext, useState, useEffect } from "react";
import { Appearance, ColorSchemeName, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";

// Tema Tipini Tanımla
interface ThemeContextType {
  theme: {
    background: string;
    text: string;
    tint: string;
    modalbg: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
    bar: "dark-content" | "light-content";
    inputBackground: string;
    inputText: string;
    inputPlaceholder: string;
  };
  colorScheme: ColorSchemeName;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Context Oluştur
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook: Temayı Kullan
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Provider: Tema Sağlayıcı
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme(); // Cihaz temasını al
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>("light");

  // AsyncStorage'dan kullanıcı tercihini yükle
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setColorScheme(savedTheme);
      } else {
        setColorScheme(systemColorScheme ?? "light"); // Varsayılan cihaz temasını kullan
      }
    };
    loadTheme();
  }, []);

  const isDarkMode = colorScheme === "dark";

  // Kullanıcı temayı değiştirdiğinde çağrılır
  const toggleTheme = async () => {
    const newTheme = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme); // Kullanıcının seçimini kaydet
  };

  const theme = Colors[colorScheme as "light" | "dark"]; // Renkleri belirle

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

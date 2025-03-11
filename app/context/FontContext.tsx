import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FontContextType {
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFont, setSelectedFont] = useState("Roboto-Regular"); // Varsayılan font
  const [fontSize, setFontSize] = useState(16); // Varsayılan font boyutu

  // AsyncStorage'dan kayıtlı font ve font boyutunu al
  useEffect(() => {
    const loadFontSettings = async () => {
      const storedFont = await AsyncStorage.getItem("selectedFont");
      const storedFontSize = await AsyncStorage.getItem("fontSize");

      if (storedFont) setSelectedFont(storedFont);
      if (storedFontSize) setFontSize(parseInt(storedFontSize));
    };

    loadFontSettings();
  }, []);

  // Font değiştiğinde AsyncStorage'a kaydet
  useEffect(() => {
    AsyncStorage.setItem("selectedFont", selectedFont);
  }, [selectedFont]);

  // Font boyutu değiştiğinde AsyncStorage'a kaydet
  useEffect(() => {
    const saveFontSize = async () => {
      await AsyncStorage.setItem("fontSize", fontSize.toString());
    };
    saveFontSize();
  }, [fontSize]);
  
  return (
    <FontContext.Provider value={{ selectedFont, setSelectedFont, fontSize, setFontSize }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};

export default FontProvider;

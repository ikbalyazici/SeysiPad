import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FontContextType = {
  selectedFont: string;
  changeFont: (font: string) => void;
};

const FontContext = createContext<FontContextType | null>(null);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFont, setSelectedFont] = useState("Roboto-Regular");

  useEffect(() => {
    const loadFont = async () => {
      const savedFont = await AsyncStorage.getItem("selectedFont");
      if (savedFont) {
        setSelectedFont(savedFont);
      }
    };
    loadFont();
  }, []);

  const changeFont = async (font: string) => {
    setSelectedFont(font);
    await AsyncStorage.setItem("selectedFont", font);
  };

  return (
    <FontContext.Provider value={{ selectedFont, changeFont }}>
      {children}
    </FontContext.Provider>
  );
};

// 🚀 Default export ekledik!
export default FontProvider;

// Custom hook
export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};

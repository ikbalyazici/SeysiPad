import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "../localization/translations";

const DEFAULT_LANGUAGE = "tr"; // Varsayılan dil Türkçe
const STORAGE_KEY = "app_language"; // AsyncStorage anahtarı

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: (lang: string) => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const loadLanguage = async () => {
      const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLanguage) {
        setLanguage(storedLanguage);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang: string) => {
    setLanguage(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang); // Seçimi kaydet
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

// Default export ekleyelim
export default LanguageProvider;

import * as Font from "expo-font";
import { useEffect, useState } from "react";

export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        "ComicNeue-Bold": require("../assets/fonts/ComicNeue-Bold.ttf"),
        "ComicNeue-BoldItalic": require("../assets/fonts/ComicNeue-BoldItalic.ttf"),
        "ComicNeue-Italic": require("../assets/fonts/ComicNeue-Italic.ttf"),
        "ComicNeue-Regular": require("../assets/fonts/ComicNeue-Regular.ttf"),
        "EBGaramond-Bold": require("../assets/fonts/EBGaramond-Bold.ttf"),
        "EBGaramond-BoldItalic": require("../assets/fonts/EBGaramond-BoldItalic.ttf"),
        "EBGaramond-Italic": require("../assets/fonts/EBGaramond-Italic.ttf"),
        "EBGaramond-Regular": require("../assets/fonts/EBGaramond-Regular.ttf"),
        "Helvetica-Bold": require("../assets/fonts/Helvetica-Bold.ttf"),
        "Helvetica-BoldOblique": require("../assets/fonts/Helvetica-BoldOblique.ttf"),
        "Helvetica-Oblique": require("../assets/fonts/Helvetica-Oblique.ttf"),
        "Helvetica": require("../assets/fonts/Helvetica.ttf"),
        "Lora-Bold": require("../assets/fonts/Lora-Bold.ttf"),
        "Lora-BoldItalic": require("../assets/fonts/Lora-BoldItalic.ttf"),
        "Lora-Italic": require("../assets/fonts/Lora-Italic.ttf"),
        "Lora-Regular": require("../assets/fonts/Lora-Regular.ttf"),
        "Merriweather-Bold": require("../assets/fonts/Merriweather-Bold.ttf"),
        "Merriweather-BoldItalic": require("../assets/fonts/Merriweather-BoldItalic.ttf"),
        "Merriweather-Italic": require("../assets/fonts/Merriweather-Italic.ttf"),
        "Merriweather-Regular": require("../assets/fonts/Merriweather-Regular.ttf"),
        "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
        "Montserrat-BoldItalic": require("../assets/fonts/Montserrat-BoldItalic.ttf"),
        "Montserrat-Italic": require("../assets/fonts/Montserrat-Italic.ttf"),
        "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
        "OpenSans-Bold": require("../assets/fonts/OpenSans-Bold.ttf"),
        "OpenSans-BoldItalic": require("../assets/fonts/OpenSans-BoldItalic.ttf"),
        "OpenSans-Italic": require("../assets/fonts/OpenSans-Italic.ttf"),
        "OpenSans-Regular": require("../assets/fonts/OpenSans-Regular.ttf"),
        "Oswald-Bold": require("../assets/fonts/Oswald-Bold.ttf"),
        "Oswald-Regular": require("../assets/fonts/Oswald-Regular.ttf"),
        "PlayfairDisplay-Bold": require("../assets/fonts/PlayfairDisplay-Bold.ttf"),
        "PlayfairDisplay-BoldItalic": require("../assets/fonts/PlayfairDisplay-BoldItalic.ttf"),
        "PlayfairDisplay-Italic": require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
        "PlayfairDisplay-Regular": require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
        "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
        "Poppins-BoldItalic": require("../assets/fonts/Poppins-BoldItalic.ttf"),
        "Poppins-Italic": require("../assets/fonts/Poppins-Italic.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Raleway-Bold": require("../assets/fonts/Raleway-Bold.ttf"),
        "Raleway-BoldItalic": require("../assets/fonts/Raleway-BoldItalic.ttf"),
        "Raleway-Italic": require("../assets/fonts/Raleway-Italic.ttf"),
        "Raleway-Regular": require("../assets/fonts/Raleway-Regular.ttf"),
        "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
        "Roboto-BoldItalic": require("../assets/fonts/Roboto-BoldItalic.ttf"),
        "Roboto-Italic": require("../assets/fonts/Roboto-Italic.ttf"),
        "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
        "SourceSans3-Bold": require("../assets/fonts/SourceSans3-Bold.ttf"),
        "SourceSans3-BoldItalic": require("../assets/fonts/SourceSans3-BoldItalic.ttf"),
        "SourceSans3-Italic": require("../assets/fonts/SourceSans3-Italic.ttf"),
        "SourceSans3-Regular": require("../assets/fonts/SourceSans3-Regular.ttf"),
        "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
      });
      setFontsLoaded(true);
    };

    loadFonts();
  }, []);

  return fontsLoaded;
};

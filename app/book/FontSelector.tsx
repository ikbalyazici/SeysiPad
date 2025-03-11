import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useFont } from "@/context/FontContext"; // useFont ekledik

const FontSelector: React.FC= () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { selectedFont, setSelectedFont, fontSize, setFontSize } = useFont(); // useFont ile değerleri al

  const increaseFontSize = () => setFontSize(fontSize + 2);
  const decreaseFontSize = () => setFontSize(Math.max(fontSize - 2, 10));

  const styles = StyleSheet.create({
    pickerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // Sağ tarafa itmek için
      marginVertical: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.tint,
      borderRadius: 5,
      backgroundColor: theme.inputBackground,
    },
    label: {
      fontSize: 16,
      color: "black",
      fontWeight: "500",
    },
    picker: {
      height: "auto",
      width: 180,
      color: "black",
    },
    fontSizeControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    button: {
      padding: 6,
      backgroundColor: theme.inputBackground,
      borderRadius: 5,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "black",
    },
  });

  return (
    <View style={styles.pickerContainer}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={styles.label}>{t("fontsec")}</Text>
        <Picker selectedValue={selectedFont} onValueChange={setSelectedFont} style={styles.picker}>
        <Picker.Item label="Comic Neue" value="ComicNeue-Regular" />
        <Picker.Item label="Comic Neue Bold" value="ComicNeue-Bold" />
        <Picker.Item label="Comic Neue Italic" value="ComicNeue-Italic" />
        <Picker.Item label="Comic Neue BoldItalic" value="ComicNeue-BoldItalic" />
        <Picker.Item label="EBGaramond" value="EBGaramond-Regular" />
        <Picker.Item label="EBGaramond Bold" value="EBGaramond-Bold" />
        <Picker.Item label="EBGaramond Italic" value="EBGaramond-Italic" />
        <Picker.Item label="EBGaramond BoldItalic" value="EBGaramond-BoldItalic" />
        <Picker.Item label="Helvetica" value="Helvetica" />
        <Picker.Item label="Helvetica Bold" value="Helvetica-Bold" />
        <Picker.Item label="Helvetica Italic" value="Helvetica-Oblique" />
        <Picker.Item label="Helvetica BoldItalic" value="Helvetica-BoldOblique" />
        <Picker.Item label="Lora" value="Lora-Regular" />
        <Picker.Item label="Lora Bold" value="Lora-Bold" />
        <Picker.Item label="Lora Italic" value="Lora-Italic" />
        <Picker.Item label="Lora BoldItalic" value="Lora-BoldItalic" />
        <Picker.Item label="Merriweather" value="Merriweather-Regular" />
        <Picker.Item label="Merriweather Bold" value="Merriweather-Bold" />
        <Picker.Item label="Merriweather Italic" value="Merriweather-Italic" />
        <Picker.Item label="Merriweather BoldItalic" value="Merriweather-BoldItalic" />
        <Picker.Item label="Montserrat" value="Montserrat-Regular" />
        <Picker.Item label="Montserrat Bold" value="Montserrat-Bold" />
        <Picker.Item label="Montserrat Italic" value="Montserrat-Italic" />
        <Picker.Item label="Montserrat BoldItalic" value="Montserrat-BoldItalic" />
        <Picker.Item label="Open Sans" value="OpenSans-Regular" />
        <Picker.Item label="Open Sans Bold" value="OpenSans-Bold" />
        <Picker.Item label="Open Sans Italic" value="OpenSans-Italic" />
        <Picker.Item label="Open Sans BoldItalic" value="OpenSans-BoldItalic" />
        <Picker.Item label="Oswald" value="Oswald-Regular" />
        <Picker.Item label="Oswald Bold" value="Oswald-Bold" />
        <Picker.Item label="Playfair Display" value="PlayfairDisplay-Regular" />
        <Picker.Item label="Playfair Display Bold" value="PlayfairDisplay-Bold" />
        <Picker.Item label="Playfair Display Italic" value="PlayfairDisplay-Italic" />
        <Picker.Item label="Playfair Display BoldItalic" value="PlayfairDisplay-BoldItalic" />
        <Picker.Item label="Poppins" value="Poppins-Regular" />
        <Picker.Item label="Poppins Bold" value="Poppins-Bold" />
        <Picker.Item label="Poppins Italic" value="Poppins-Italic" />
        <Picker.Item label="Poppins BoldItalic" value="Poppins-BoldItalic" />
        <Picker.Item label="Raleway" value="Raleway-Regular" />
        <Picker.Item label="Raleway Bold" value="Raleway-Bold" />
        <Picker.Item label="Raleway Italic" value="Raleway-Italic" />
        <Picker.Item label="Raleway BoldItalic" value="Raleway-BoldItalic" />
        <Picker.Item label="Roboto" value="Roboto-Regular" />
        <Picker.Item label="Roboto Bold" value="Roboto-Bold" />
        <Picker.Item label="Roboto Italic" value="Roboto-Italic" />
        <Picker.Item label="Roboto BoldItalic" value="Roboto-BoldItalic" />
        <Picker.Item label="Source Sans 3" value="SourceSans3-Regular" />
        <Picker.Item label="Source Sans 3 Bold" value="SourceSans3-Bold" />
        <Picker.Item label="Source Sans 3 Italic" value="SourceSans3-Italic" />
        <Picker.Item label="Source Sans 3 BoldItalic" value="SourceSans3-BoldItalic" />
        <Picker.Item label="Space Mono" value="SpaceMono-Regular" />
        </Picker>
      </View>

      {/* Font boyutu ayarları */}
      <View style={styles.fontSizeControls}>
        <TouchableOpacity onPress={decreaseFontSize} style={styles.button}>
          <Text style={styles.buttonText}>A-</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={increaseFontSize} style={styles.button}>
          <Text style={styles.buttonText}>A+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FontSelector;

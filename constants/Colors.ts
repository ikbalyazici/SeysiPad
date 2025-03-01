/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#007BFF"; // Açık mavi (ana tema rengi)
const tintColorDark = "#3399FF"; // Gece mavisine uyumlu açık mavi

export const Colors = {
  light: {
    text: "#1E1E1E", // Siyaha yakın koyu gri/mavi (okunaklı olsun diye)
    background: "#F0F8FF", // Beyaza yakın açık mavi
    tint: tintColorLight,
    modalbg:"#aac8e3",
    icon: "#000000", // Varsayılan ikon rengi siyah
    tabIconDefault: "#0056B3", // Daha koyu mavi detay rengi
    tabIconSelected: tintColorLight, // Seçili tab rengi ana mavi
    bar: "dark-content" as "dark-content",
    inputBackground: "#E0F8FF",
    inputText: "000000",
    inputPlaceholder: "#4c4e52"
  },
  dark: {
    text: "#E0E0E0", // Açık gri (karanlık modda okunaklı olması için)
    background: "#0A0F1A", // Siyaha yakın gece mavisi
    tint: tintColorDark,
    modalbg: "#141f36",
    icon: "#FFFFFF", // Koyu temada ikonları beyaz yapalım
    tabIconDefault: "#66B3FF", // Açık detay mavisi
    tabIconSelected: tintColorDark, // Seçili tab rengi açık mavi
    bar: "light-content" as "light-content",
    inputBackground: "#E0F8FF",
    inputText: "#000000",
    inputPlaceholder: "#4c4e52"
  },
};


import { Tabs } from "expo-router";
import React from "react";
import { useNotifications } from "../../hooks/useNotifications";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/useThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/context/LanguageContext";

export default function TabLayout() {
  const { unreadCount } = useNotifications();
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.tabIconDefault,
          position: "absolute",
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
      //initialRouteName=""
      backBehavior="history"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("anasayfa"),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="books"
        options={{
          title: t("kitaplar"),
          tabBarIcon: ({ color }) => <Ionicons name="book" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: t("bildirimler"),
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={28} color={color} />,
          tabBarBadge: unreadCount || undefined,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("profilim"),
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}

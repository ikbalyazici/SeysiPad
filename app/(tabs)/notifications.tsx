import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, Image, StyleSheet, StatusBar } from "react-native";
import { collection, query, where, onSnapshot, orderBy, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../constants/firebaseConfig";
import { useRouter } from "expo-router";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@/hooks/useThemeContext"; 
import { useLanguage } from "@/context/LanguageContext";

type Notification = {
  id: string;
  senderUid: string;
  type: "reply" | "new_comment" | "follow";
  text: string;
  chapterId: string;
  bookId: string;
  createdAt: any;
  read: boolean;
  commentId: string;
  sender: {
    username: string;
    photoURL: string | null;
  };
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentUser = auth.currentUser;
  const { theme } = useTheme(); 
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    notification: {
      padding: 10,
      borderBottomWidth: 1,
      borderColor: theme.tint,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    unreadNotification: {
      backgroundColor: theme.tint,
    },
    deleteButton: {
      backgroundColor: "red",
      justifyContent: "center",
      alignItems: "center",
      width: 80,
      height: "100%",
    },
    deleteText: {
      color: "white",
      fontWeight: "bold",
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
  });

  useEffect(() => {
    if (!currentUser) return;

    // Kullanıcının kendi bildirimlerini çek
    const q = query(
      collection(db, "notifications"),
      where("recipientUid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        senderUid: doc.data().senderUid,
        type: doc.data().type,
        text: doc.data().text,
        chapterId: doc.data().chapterId,
        bookId: doc.data().bookId,
        createdAt: doc.data().createdAt,
        read: doc.data().read ?? false, // Varsayılan olarak false
        commentId: doc.data().commentId,
      }));

      // Kullanıcı bilgilerini çek
      const senderUids = [...new Set(rawNotifications.map((n) => n.senderUid))];
      let userMap: Record<string, { username: string; photoURL: string | null }> = {};

      if (senderUids.length > 0) {
        const usersQuery = query(collection(db, "users"), where("__name__", "in", senderUids));
        const usersSnapshot = await getDocs(usersQuery);

        usersSnapshot.forEach((doc) => {
          userMap[doc.id] = {
            username: doc.data().username,
            photoURL: doc.data().photoURL || null,
          };
        });
      }

      // Bildirimlere kullanıcı bilgisini ekle
      const notificationsWithSenders = rawNotifications.map((notification) => ({
        ...notification,
        sender: userMap[notification.senderUid] || { username: t("bilinmeyen"), photoURL: null },
      }));

      setNotifications(notificationsWithSenders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error(t("bilsilhata"), error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <Text style={{ textAlign: "center", marginTop: 20, color: theme.text }}>{t("bildirimyok")}</Text>;
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar backgroundColor={theme.background}></StatusBar>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>{t("sil")}</Text>
              </Pressable>
            )}
          >
            <Pressable
              onPress={async () => {
                try {
                  const notificationRef = doc(db, "notifications", item.id);
                  await updateDoc(notificationRef, { read: true });

                  // Bildirimin yorum mu yoksa sadece bölüme mi yönlendireceğine karar ver
                  if (item.type === "reply" || item.type === "new_comment") {
                    router.push({
                      pathname: `../chapter/${item.chapterId}`,
                      params: { commentId: item.commentId }, // Yorumun ID’sini gönderiyoruz
                    });
                  } 
                  else if(item.type === "follow"){
                    router.push(`../profile/${item.senderUid}`)
                  }
                  else if(item.type === "book"){
                    router.push(`../book/${item.bookId}`)
                  }
                  else if(item.type === "chapter"){
                    router.push(`../chapter/${item.chapterId}`)
                  }
                  else {
                    console.error("Bildirim hatası");
                  }

                  // State içinde bildirimi okunmuş olarak güncelle
                  setNotifications((prevNotifications) =>
                    prevNotifications.map((notif) =>
                      notif.id === item.id ? { ...notif, read: true } : notif
                    )
                  );
                } catch (error) {
                  console.error(t("bilgüncelhata"), error);
                }
              }}
              style={[styles.notification, !item.read && styles.unreadNotification]}
            >

              {item.sender.photoURL && (
                <Image
                  source={{ uri: item.sender.photoURL }}
                  style={styles.profileImage}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{color: theme.text}}>
                  <Text 
                    onPress={() => router.push(`../profile/${item.senderUid}`)}
                    style={{fontWeight: "bold", }}
                  >
                    {item.sender.username}
                  </Text>
                  {item.type === "new_comment"
                    ? `${t("yorumbildirim")} "${item.text}"`
                    : item.type === "reply"
                    ? `${t("yanıtbildirim")} "${item.text}"`
                    : item.type === "follow"
                    ? `${t("takipbildirim")}`
                    : item.type === "book"
                    ? `${t("kitapbildirim")}${item.text}`
                    : `${t("bolumbildirim")}${item.text}`}

                </Text>
              </View>
            </Pressable>
          </Swipeable>
        )}
      />
    </GestureHandlerRootView>
  );  
}

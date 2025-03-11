import { useEffect, useState } from "react";
import { Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { auth, db } from "../../../constants/firebaseConfig";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useTheme } from "@/hooks/useThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { FontAwesome } from "@expo/vector-icons";

interface FollowButtonProps {
  profileUserId: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({ profileUserId }) => {
  const currentUser = auth.currentUser;
  const [isFollowing, setIsFollowing] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    if (!currentUser) return;

    const checkFollowingStatus = async () => {
      const followingRef = doc(
        db,
        `users/${currentUser.uid}/following/${profileUserId}`
      );
      const followingSnap = await getDoc(followingRef);

      setIsFollowing(followingSnap.exists());
    };

    checkFollowingStatus();
  }, [currentUser, profileUserId]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    const followingRef = doc(
      db,
      `users/${currentUser.uid}/following/${profileUserId}`
    );
    const followerRef = doc(
      db,
      `users/${profileUserId}/followers/${currentUser.uid}`
    );

    if (isFollowing) {
      Alert.alert(
        t("takiptencik"), // "Emin misiniz?"
        t("takipten_cik_emin_misin"), // "Bu kullanıcıyı takipten çıkmak istediğinizden emin misiniz?"
        [
          {
            text: t("iptal"), // "İptal"
            style: "cancel",
          },
          {
            text: t("evet"), // "Evet"
            onPress: async () => {
              await deleteDoc(followingRef);
              await deleteDoc(followerRef);
              setIsFollowing(false);
            },
          },
        ]
      );
    } else {
      await setDoc(followingRef, { followedAt: new Date() });
      await setDoc(followerRef, { followedAt: new Date() });
      setIsFollowing(true);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleFollowToggle}
      style={{
        position: "absolute",
        bottom: 0,
        right: -5,
        backgroundColor: isFollowing ? "red" : theme.tint,
        borderRadius: 30,
        padding: 12,
      }}
    >
      <FontAwesome
        name={isFollowing ? "user-times" : "user-plus"}
        size={16}
        color={"white"}
      />
    </TouchableOpacity>
  );
};

export default FollowButton;

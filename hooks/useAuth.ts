import { useState, useEffect } from "react";
import { auth, db } from "../constants/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  reload,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // 📌 AsyncStorage'den oturumu yükleme
  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
  
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
  
        // 📌 Kullanıcı verisini Firebase Auth ile karşılaştır
        const currentUser = auth.currentUser;
  
        if (currentUser && currentUser.uid === parsedUser.uid) {
          setUser(currentUser);
        } else {
          setUser(null);
          await AsyncStorage.removeItem("user"); // Eşleşme yoksa siliyoruz
        }
      }
    } catch (error) {
      console.error("Stored user could not be loaded:", error);
    }
  };
  

  useEffect(() => {
    loadStoredUser(); // 📌 İlk önce AsyncStorage’den kullanıcıyı al

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await reload(currentUser);
        if (!currentUser.emailVerified) {
          setUser(null);
        } else {
          setUser(currentUser);
          await AsyncStorage.setItem("user", JSON.stringify(currentUser)); // 📌 Firebase oturumu gelince AsyncStorage’e kaydet
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem("user"); // 📌 Çıkış yapınca kaydı temizle
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const usernameRef = doc(db, "usernames", username);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        throw new Error("Bu kullanıcı adı zaten alınmış!");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: username });
      await setDoc(doc(db, "users", newUser.uid), { username, email });
      await setDoc(usernameRef, { uid: newUser.uid });

      await sendEmailVerification(newUser);
      await signOut(auth);

      setUser(null);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      await reload(loggedInUser);

      if (!loggedInUser.emailVerified) {
        await signOut(auth);
        throw new Error("Lütfen e-posta adresinizi doğrulayın!");
      }

      setUser(loggedInUser);
      await AsyncStorage.setItem("user", JSON.stringify(loggedInUser)); // 📌 Kullanıcıyı sakla
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    await AsyncStorage.removeItem("user"); // 📌 Çıkış yapınca AsyncStorage'deki kullanıcıyı sil
    router.replace("/login");
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return { success: false, message: "Kullanıcı oturum açmış değil." };
    try {
      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const changeEmail = async (newEmail: string) => {
    if (!user) return { success: false, message: "Kullanıcı oturum açmış değil." };
    try {
      await updateEmail(user, newEmail);
      await sendEmailVerification(user);
      return { success: true, message: "E-posta değiştirildi. Lütfen doğrulayın!" };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  return { user, initializing, signUp, signIn, logout, loading, error, resetPassword, changePassword, changeEmail };
}

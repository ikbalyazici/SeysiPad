import { useState, useEffect } from "react";
import { auth, db } from "../constants/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  reload,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await reload(currentUser); // Kullanıcı durumunu güncelle
        if (!currentUser.emailVerified) {
          setUser(null); // Eğer e-posta doğrulanmamışsa giriş yapma
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
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
      await signOut(auth); // Kayıttan sonra hemen çıkış yap, doğrulama olmadan girişe izin verme

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

      await reload(loggedInUser); // Kullanıcıyı güncelle

      if (!loggedInUser.emailVerified) {
        await signOut(auth); // Doğrulanmamışsa hemen çıkış yap
        throw new Error("Lütfen e-posta adresinizi doğrulayın!");
      }

      setUser(loggedInUser);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.replace("/login");
  };

  // // Google Auth (Expo AuthSession)
  // const redirectUri = makeRedirectUri({ useProxy: true } as any);
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   clientId: "585626519839-9svc6er2qnvn7548t6vjocm03ap2cjc3.apps.googleusercontent.com",
  //   androidClientId: "585626519839-huh6vfpdps75on38sg1ptkj69f60ivo9.apps.googleusercontent.com",
  //   iosClientId: "585626519839-lgdea0jcf0lqe6dea2o1i8teorlcub4.apps.googleusercontent.com",
  //   redirectUri,
  // });

  // const signInWithGoogle = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const result = await promptAsync();
  //     if (result.type !== "success") {
  //       throw new Error("Google authentication failed");
  //     }

  //     const { id_token } = result.params;
  //     const credential = GoogleAuthProvider.credential(id_token);
  //     const userCredential = await signInWithCredential(auth, credential);

  //     setUser(userCredential.user);
  //   } catch (error: any) {
  //     setError(error.message);
  //   }
  //   setLoading(false);
  // };

  return { user, signUp, signIn, logout,/* signInWithGoogle,*/ loading, error };
}

// Firebase SDK fonksiyonlarını içe aktar
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyBXRSY3Nxm-aOdzrhDQD9cCIB2LaIAXOL0",
  authDomain: "seysi-224ce.firebaseapp.com",
  projectId: "seysi-224ce",
  storageBucket: "seysi-224ce.firebasestorage.app",
  messagingSenderId: "585626519839",
  appId: "1:585626519839:web:80b98e88422dbaebde082a",
  measurementId: "G-ZVSLFJJS9X"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Dışa aktar
export { app, db, auth, storage };

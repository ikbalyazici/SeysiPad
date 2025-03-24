import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Modal,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback
} from "react-native";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, Timestamp, where, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../../constants/firebaseConfig";
import { useComments, Comment } from "../../hooks/useComments";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useThemeContext"; 
import FontSelector from "../book/FontSelector";
import { useLanguage } from "@/context/LanguageContext";
import { useFont } from "../context/FontContext";
import LikeButton from "./LikeButton";

type Chapter = {
  id: string;
  title: string;
  createdAt: Timestamp; // Eğer tarihse `Firebase Firestore` için `Timestamp` kullanabilirsin
  content: string;
  bookId: string;
  authorUid: string;
};

export default function ChapterDetailScreen() {
  const { id, commentId } = useLocalSearchParams();
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState<string | null>(null);
  const { user } = useAuth();
  const { comments, addComment, deleteComment } = useComments(id as string);
  const [selectedParagraphPreview, setSelectedParagraphPreview] = useState<string | null>(null);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [previousChapter, setPreviousChapter] = useState<Chapter | null>(null);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [readStatus, setReadStatus] = useState<"false" | "partial" | "true">("false");
  const { theme } = useTheme(); 
  const { selectedFont, fontSize } = useFont();
  const commentListRef = useRef<FlatList<Comment>>(null); // Yorum listesini refere et
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const { t } = useLanguage();
  const fetchReadStatus = async () => {
    if (!user || !chapter) return;
  
    const progressRef = doc(db, "user_chapter_progress", `${user.uid}_${id}`);
    const progressSnap = await getDoc(progressRef);
  
    if (progressSnap.exists()) {
      setReadStatus(progressSnap.data().status);
    } else {
      setReadStatus("false"); // Hiç kayıt yoksa "false" yap
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    const aTime = a.createdAt.seconds;
    const bTime = b.createdAt.seconds;

    return sortAscending ? aTime - bTime : bTime - aTime;
  });
  
  // useEffect içinde çağır:
  useEffect(() => {
    fetchReadStatus();
  }, [user, id, chapter]);
  

  useEffect(() => {
    const fetchChapter = async () => {
      if (!id) return;

      const chapterRef = doc(db, "chapters", id as string);
      const chapterSnap = await getDoc(chapterRef);

      if (chapterSnap.exists()) {
        const chapterData = chapterSnap.data();
        setChapter(chapterData);

        // Önceki bölümü getir
        const prevQuery = query(
          collection(db, "chapters"),
          where("bookId", "==", chapterData.bookId),
          where("createdAt", "<", chapterData.createdAt), // Daha eski olanı al
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const prevSnapshot = await getDocs(prevQuery);
        if (!prevSnapshot.empty) {
          const prevData = prevSnapshot.docs[0].data();
          setPreviousChapter({
            id: prevSnapshot.docs[0].id,
            title: prevData.title,
            createdAt: prevData.createdAt,
            content: prevData.content,
            bookId: prevData.bookId,
            authorUid: prevData.authorUid,
          });
        } else {
          setPreviousChapter(null);
        }

        // Sonraki bölümü getir
        const nextQuery = query(
          collection(db, "chapters"),
          where("bookId", "==", chapterData.bookId),
          where("createdAt", ">", chapterData.createdAt), // Daha yeni olanı al
          orderBy("createdAt", "asc"),
          limit(1)
        );

        const nextSnapshot = await getDocs(nextQuery);
        if (!nextSnapshot.empty) {
          const nextData = nextSnapshot.docs[0].data();
          setNextChapter({
            id: nextSnapshot.docs[0].id,
            title: nextData.title,
            createdAt: nextData.createdAt,
            content: nextData.content,
            bookId: nextData.bookId,
            authorUid: nextData.authorUid,
          });
        } else {
          setNextChapter(null);
        }

      }
      setLoading(false);
    };

    fetchChapter();
  }, [id]);

  useEffect(() => {
    if (user) {
      trackChapterProgress(user.uid, chapter?.bookId, id as string);
    }
  }, [user, id, chapter]);

  const handleDelete = async () => {
    if (!id || !user || !chapter) return;
  
    if (user.uid !== chapter.authorUid) {
      Alert.alert(t("yetkisizislem"), t("bolumsilemen"));
      return;
    }
  
    Alert.alert(t("bolumusil"), t("bolumusileminmisin"), [
      { text: t("iptal"), style: "cancel" },
      {
        text: t("sil"),
        onPress: async () => {
          try {
            const chapterRef = doc(db, "chapters", id as string);
            const commentsQuery = query(
              collection(db, "comments"),
              where("chapterId", "==", id)
            );
  
            // Yorumları çek ve sil
            const commentsSnapshot = await getDocs(commentsQuery);
            const deletePromises = commentsSnapshot.docs.map((doc) =>
              deleteDoc(doc.ref)
            );
  
            await Promise.all(deletePromises); // Tüm yorumları sil
  
            await deleteDoc(chapterRef); // Bölümü sil
            Alert.alert(t("basarili"), t("bolumsilindi"));
            router.back();
          } catch (err) {
            console.error(t("bolumsilhata"), err);
            Alert.alert(t("hata"), t("bolumsilhataoldu"));
          }
        },
      },
    ]);
  };
  

  const trackChapterProgress = async (userId: string, bookId: string, chapterId: string) => {
    if (!userId || !chapterId) return;
    
    const progressRef = doc(db, "user_chapter_progress", `${userId}_${chapterId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (!progressSnap.exists()) {
        await setDoc(progressRef, {
            userId,
            bookId,
            chapterId,
            status: "partial", // İlk açılışta "partial"
            updatedAt: serverTimestamp(),
        });
    }
  };

  const toggleReadStatus = async () => {
    if (!user || !chapter) return;
  
    const progressRef = doc(db, "user_chapter_progress", `${user.uid}_${id}`);
    const progressSnap = await getDoc(progressRef);
  
    if (progressSnap.exists()) {
      const currentStatus = progressSnap.data().status;
      const newStatus = currentStatus === "true" ? "partial" : "true";
  
      await updateDoc(progressRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
  
      setReadStatus(newStatus);
    }
  };

  const getIconColor = () => {
    return readStatus === "true" ? "green" : "red";
  };  

  const getStatusText = () => {
    return readStatus === "true" ? t("okudum"): t("yarimkaldi");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const paragraphs = chapter.content.split(/\n+/).filter((p: string) => p.trim() !== "");

  return (
    <TouchableWithoutFeedback onPress={() => setMenuVisible(false)} accessible={false}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.bar} backgroundColor={theme.background}></StatusBar>
        <FlatList
          contentContainerStyle={{ padding: 20 }}
          ListHeaderComponent={
            <>
              <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: theme.text }}>{chapter?.title}</Text>
              {user?.uid === chapter.authorUid && (
                <TouchableOpacity
                  onPress={() => setMenuVisible(!menuVisible)}
                  style={{ position: "absolute", top: 5, right: 5, zIndex: 10 }}
                >
                  <MaterialIcons name="more-vert" size={24} color={theme.text} />
                </TouchableOpacity>)}
              {menuVisible && (
                <View
                  style={{
                    position: "absolute",
                    top: 40,
                    right: 10,
                    backgroundColor: theme.modalbg,
                    padding: 10,
                    borderRadius: 5,
                    elevation: 5,
                    zIndex: 10,
                  }}
                >
                  <Pressable onPress={() => router.push(`/book/edit-chapter?id=${id}`)}>
                    <Text style={{ color: theme.text, padding: 7, paddingHorizontal: 8 }}>{t("duzenle")}</Text>
                  </Pressable>
                  <Pressable onPress={handleDelete}>
                    <Text style={{ color: "red", padding: 7, paddingHorizontal: 8 }}>{t("bolumusil")}</Text>
                  </Pressable>
                </View>
              )}

              <FontSelector />
              
              {paragraphs.map((paragraph: string, index: number) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    setSelectedParagraphIndex(index.toString());
                    setSelectedParagraphPreview(paragraph.slice(0, 50) + "...");
                    setModalVisible(true);
                  }}
                  onLongPress={() => {
                    setSelectedParagraphIndex(index.toString());
                    setSelectedParagraphPreview(paragraph.slice(0, 50) + "...");
                    setModalVisible(true);
                  }}
                >
                  <Text style={{ fontFamily: selectedFont, fontSize: fontSize, marginBottom: 10, color: theme.text }}>{paragraph}</Text>
                </Pressable>
              ))}

              <View style={{flex:1, flexDirection:"row", justifyContent: "space-between"}}>
                <TouchableOpacity onPress={toggleReadStatus} style={{ alignItems: "flex-end", marginTop: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <FontAwesome name="check-circle" size={24} color={getIconColor()} />
                    <Text style={{ fontSize: 16, color: getIconColor() }}>{getStatusText()}</Text>                
                  </View>
                </TouchableOpacity>

                <LikeButton contentId={`chapter_${id}`} bookId={chapter.bookId} chapterId={id as string} title={chapter.title} authorId={chapter.authorUid} />   // Bölüm beğenisi
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                {previousChapter ? (
                  <TouchableOpacity style={[styles.routeButton, { backgroundColor: theme.tint }]} onPress={() => router.replace(`/chapter/${previousChapter.id}`)}>
                    <Text style={styles.buttonText}>{t("oncekibolum")}</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                {nextChapter ? (
                  <TouchableOpacity style={[styles.routeButton, { backgroundColor: theme.tint }]} onPress={() => router.replace(`/chapter/${nextChapter.id}`)}>
                    <Text style={styles.buttonText}>{t("sonrakibolum")}</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text }}>{t("yorumlar")}</Text>

                <TouchableOpacity onPress={() => setSortAscending(!sortAscending)}>
                  <MaterialIcons name={sortAscending ? "arrow-circle-up" : "arrow-circle-down"} size={30} color={theme.text} />
                </TouchableOpacity>
              </View>
            </>
          }
          data={sortedComments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 15, padding: 10, borderBottomWidth: 1, borderColor: "#ddd" }}>
              {item.sentenceId !== null && (
                <Text onPress={() => {
                  if (item.sentenceId !== null) {
                    setSelectedParagraphPreview(paragraphs[parseInt(item.sentenceId, 10)]);
                  }
                  setReplyToCommentId(item.id);
                  setModalVisible(true);
                }} style={{ fontSize: 12, fontStyle: "italic", color: theme.tint, marginBottom: 5 }}>
                  {`"${paragraphs[parseInt(item.sentenceId, 10)].slice(0, 50)}..."`} {t("alıntı")}
                </Text>
              )}
          
              {/* PROFİL FOTOĞRAFI + KULLANICI ADI + YORUM */}
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                {/* Profil Fotoğrafı */}

                  <Image
                    source={{ uri: item.author.photoURL || "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/profile_images%2Fno_profile_picture%2Ficone-x-avec-cercle-gris.png?alt=media&token=78a3007c-c98c-49b8-97cc-f8bf4f01098e"}}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      marginRight: 10,
                    }}
                  />

                {/* Kullanıcı Adı, Yorum Metni ve Silme İkonu */}
                <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  {/* Kullanıcı Adı ve Yorum */}
                  <View style={{ flexShrink: 1 }}>
                    <Pressable onPress={() => router.push(`/profile/${item.authorUid}`)}>
                      <Text style={{ fontWeight: "bold", color: theme.text }}>{item.author.username}</Text>
                    </Pressable>
                    <Text style={{color: theme.text}}>{item.text}</Text>
                  </View>

                  <LikeButton contentId={`comment_${item.id}`} /> // Yorum beğenisi
                </View>
              </View>
          
              {/* YANITLAR */}
              {item.replies.length > 0 && (
                <View style={{ marginLeft: 40, marginTop: 5 }}>
                  {item.replies.map((reply: Comment) => (
                    <View
                      key={reply.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        paddingLeft: 10,
                        borderLeftWidth: 1,
                        borderColor: "#ccc",
                        marginTop: 20,
                        position: "relative",  // Bu, silme butonunu dışarıya yerleştirebilmemiz için gerekiyor
                      }}
                    >
                      {/* PROFİL FOTOĞRAFI */}
                      {reply.author.photoURL && (
                        <Image
                          source={{ uri: reply.author.photoURL || "https://firebasestorage.googleapis.com/v0/b/seysi-224ce.firebasestorage.app/o/profile_images%2Fno_profile_picture%2Ficone-x-avec-cercle-gris.png?alt=media&token=78a3007c-c98c-49b8-97cc-f8bf4f01098e" }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            marginRight: 10,
                            marginTop: 2,
                          }}
                        />
                      )}

                      {/* KULLANICI ADI, YANIT METNİ VE BEĞENİ BUTONU */}
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                        {/* Kullanıcı Adı ve Yanıt Metni */}
                        <View style={{ flexShrink: 1 }}>
                          <Text onPress={() => router.push(`/profile/${reply.authorUid}`)} style={{ fontWeight: "bold", color: theme.text }}>
                            {reply.author.username}
                          </Text>
                          <Text style={{ color: theme.text }}>{reply.text}</Text>
                        </View>
                        <LikeButton contentId={`reply_${reply.id}`}/> {/* Yanıt beğenisi */}
                      </View>

                      {/* Silme Butonu (Sağ Altta) */}
                      {user?.uid === reply.authorUid && (
                        <TouchableOpacity
                          onPress={() => deleteComment(reply.id, reply.authorUid, reply.parentId)}
                          style={{
                            position: "absolute",  // Silme butonunu dikdörtgen dışında konumlandırmak için
                            bottom: -20,  // Dikdörtgenin altında biraz boşluk
                            right: 0,  // Sağ altta konumlandırma
                          }}
                        >
                          <Text style={{ color: "red", fontSize: 14 }}>{t("yanıtsil")}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                {/* YANITLA BUTONU */}
                <TouchableOpacity 
                  onPress={() => { 
                    setReplyToCommentId(item.id);
                    setModalVisible(true);
                  }} 
                >
                  <Text style={{ color: theme.tint }}>{t("yanıtla")}</Text>
                </TouchableOpacity>

                {/* Silme Butonu */}
                {user?.uid === item.authorUid && (
                  <TouchableOpacity onPress={() => deleteComment(item.id, item.authorUid)} style={{ marginLeft:20 }}>
                    <Text style={{ color: "red" }}>{t("yorumusil")}</Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          )}
        />

        <KeyboardAvoidingView behavior="position">
          <View style={{ padding: 10, borderTopWidth: 1, borderColor: theme.tint }}>
            <View 
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.tint,
                borderRadius: 10,
                backgroundColor: theme.inputBackground,
                paddingHorizontal: 10,
              }}
            >
              <TextInput
                placeholder={t("yorumyaz")}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                style={{
                  flex: 1,
                  paddingVertical: 10, // Dikey ortalamak için
                  color: theme.inputText,
                }}
              />
              
              <TouchableOpacity
                onPress={async () => {
                  if (newComment.trim()) {
                    await addComment(newComment);
                    setNewComment("");
                  }
                }}
                style={{ padding: 2 }} // Butona dokunma alanı vermek için
              >
                <MaterialIcons name="send" size={30} color={theme.tint} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>


        <Modal visible={isModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.8)" }}>
            <View style={{ width: "80%", backgroundColor: theme.modalbg, padding: 20, borderRadius: 10 }}>
              {selectedParagraphPreview && (
                <Text style={{ fontSize: 14, fontStyle: "italic", color: theme.text, marginBottom: 5 }}>
                  {`"${selectedParagraphPreview}"`}
                </Text>
              )}
              <TextInput
                placeholder={replyToCommentId ? t("yanıtyaz") : t("yorumyaz")}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 10,
                  backgroundColor: theme.inputBackground
                }}
              />
              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: theme.tint }]} 
                onPress={async () => {
                  if (newComment.trim()) {
                    await addComment(newComment, selectedParagraphIndex, replyToCommentId);
                    setNewComment("");
                    setReplyToCommentId(null); // Yanıt tamamlandıktan sonra sıfırla
                    setModalVisible(false);
                  }
                }}
                disabled={loading}>
                <Text style={styles.buttonText}>{t("gonder")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
                <Text style={{ color: "red", textAlign: "center" }}>{t("iptal")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    alignSelf: "center",
    width: "90%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  routeButton: {
    alignSelf: "center",
    width: "40%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
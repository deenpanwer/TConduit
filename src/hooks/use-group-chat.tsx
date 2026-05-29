"use client";

import { useState, useEffect, useCallback } from "react";
import { db, storage } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, doc, orderBy,
  addDoc, setDoc, where, serverTimestamp, getDoc, limitToLast
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "./use-auth";

export interface GroupChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  type: "text" | "image" | "video" | "audio" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface GroupChat {
  id: string;
  name: string;
  createdBy: string;
  createdByName: string;
  createdAt: any;
  updatedAt: any;
  members: string[];
  lastMessage?: string;
  lastMessageAt?: any;
}

export function useGroupChat(selectedGroupId: string | null, orgId: string | undefined) {
  const { user, userData } = useAuth();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [isSettingUpChat, setIsSettingUpChat] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Pagination states
  const [messageLimit, setMessageLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  // 1. Sync list of groups where current user is a member
  useEffect(() => {
    if (!user?.uid || !orgId) {
      setGroups([]);
      setLoadingGroups(false);
      return;
    }

    setLoadingGroups(true);
    const groupsRef = collection(db, "organizations", orgId, "group_chats");
    const q = query(groupsRef, where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupList: GroupChat[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GroupChat[];
      
      // Sort by lastMessageAt descending
      groupList.sort((a, b) => {
        const getMs = (timestamp: any): number => {
          if (!timestamp) return 0;
          if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
          if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
          if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
          if (timestamp instanceof Date) return timestamp.getTime();
          if (typeof timestamp === "string") return new Date(timestamp).getTime();
          if (typeof timestamp === "number") return timestamp;
          return 0;
        };
        const timeA = getMs(a.lastMessageAt) || getMs(a.createdAt) || 0;
        const timeB = getMs(b.lastMessageAt) || getMs(b.createdAt) || 0;
        return timeB - timeA;
      });

      setGroups(groupList);
      setLoadingGroups(false);
    }, (error) => {
      console.error("Error subscribing to group list:", error);
      setLoadingGroups(false);
    });

    return () => unsubscribe();
  }, [user?.uid, orgId]);

  // 2. Sync messages for selected group with pagination
  useEffect(() => {
    if (!selectedGroupId || !orgId || !user?.uid) {
      setMessages([]);
      setIsSettingUpChat(false);
      return;
    }

    setIsSettingUpChat(true);
    const messagesRef = collection(db, "organizations", orgId, "group_chats", selectedGroupId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limitToLast(messageLimit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: GroupChatMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as GroupChatMessage[];
      
      setMessages(msgs);
      setHasMore(msgs.length >= messageLimit);
      setIsSettingUpChat(false);
    }, (error) => {
      console.error("Error subscribing to group messages:", error);
      setIsSettingUpChat(false);
    });

    return () => unsubscribe();
  }, [selectedGroupId, orgId, user?.uid, messageLimit]);

  const loadMore = useCallback(() => {
    setMessageLimit((prev) => prev + 20);
  }, []);

  // Reset pagination limit when switching groups
  useEffect(() => {
    setMessageLimit(20);
  }, [selectedGroupId]);

  // 3. Create a new group
  const createGroupChat = useCallback(async (name: string, members: string[]): Promise<string> => {
    if (!orgId || !user?.uid || !userData) throw new Error("Unauthenticated or missing organization ID");
    
    // Auto-include creator in members if not already present
    const finalMembers = members.includes(user.uid) ? members : [...members, user.uid];
    const groupName = name.trim();
    
    if (!groupName) throw new Error("Group name cannot be empty");
    if (finalMembers.length < 2) throw new Error("Group must have at least 2 members");

    const groupsRef = collection(db, "organizations", orgId, "group_chats");
    
    // Create new group document with auto-generated ID
    const newGroupDocRef = doc(groupsRef);
    const groupId = newGroupDocRef.id;

    const groupData: GroupChat = {
      id: groupId,
      name: groupName,
      createdBy: user.uid,
      createdByName: userData.name || user.displayName || user.email || "System",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      members: finalMembers,
      lastMessage: "Group created",
      lastMessageAt: serverTimestamp()
    };

    await setDoc(newGroupDocRef, groupData);

    // Add initial system message in subcollection
    const messagesRef = collection(db, "organizations", orgId, "group_chats", groupId, "messages");
    await addDoc(messagesRef, {
      senderId: "system",
      senderName: "System",
      text: `${groupData.createdByName} created the group "${groupName}"`,
      timestamp: serverTimestamp(),
      type: "text"
    });

    return groupId;
  }, [orgId, user?.uid, userData]);

  // 4. Send group message
  const sendGroupMessage = useCallback(async (
    groupId: string,
    text: string,
    type: "text" | "image" | "video" | "audio" | "file" = "text",
    fileUrl?: string,
    fileName?: string,
    fileSize?: number
  ): Promise<void> => {
    if (!orgId || !user?.uid || !userData) return;
    if (!text.trim() && !fileUrl) return;

    const messagesRef = collection(db, "organizations", orgId, "group_chats", groupId, "messages");
    const senderName = userData.name || user.displayName || user.email || "Unknown";

    const msgPayload: any = {
      senderId: user.uid,
      senderName,
      text: text.trim(),
      timestamp: serverTimestamp(),
      type
    };

    if (fileUrl) {
      msgPayload.fileUrl = fileUrl;
      msgPayload.fileName = fileName;
      msgPayload.fileSize = fileSize;
    }

    await addDoc(messagesRef, msgPayload);

    // Update parent group chat metadata
    const groupDocRef = doc(db, "organizations", orgId, "group_chats", groupId);
    let previewText = text.trim();
    if (!previewText && type !== "text") {
      previewText = `Shared a ${type}`;
    }
    
    await setDoc(groupDocRef, {
      lastMessage: `${senderName}: ${previewText}`,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, [orgId, user?.uid, userData]);

  // 5. Upload Rich Media file to storage scoped path
  const uploadGroupFile = useCallback(async (
    groupId: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!orgId) throw new Error("Missing organization ID");
    
    // Generate a unique filename under storage path
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const originalName = file instanceof File ? file.name : "recording.webm";
    const storagePath = `organizations/${orgId}/group_chats/${groupId}/${fileId}_${originalName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Storage upload failed:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }, [orgId]);

  return {
    groups,
    messages,
    isSettingUpChat,
    loadingGroups,
    createGroupChat,
    sendGroupMessage,
    uploadGroupFile,
    loadMore,
    hasMore
  };
}

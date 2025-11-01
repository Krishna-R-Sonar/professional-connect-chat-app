// frontend/src/store/useChatStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  conversations: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  selectedConversation: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => {
    set({ selectedUser, selectedConversation: null });
  },
  setSelectedConversation: (conversation) => {
    set({ selectedConversation: conversation, selectedUser: null });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Get or create one-to-one conversation
  getOrCreateOneToOneConversation: async (userId) => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get(`/conversations/one-to-one/${userId}`);
      get().setSelectedConversation(res.data);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Get all conversations
  getMyConversations: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Create group conversation
  createGroupConversation: async (groupData) => {
    try {
      const res = await axiosInstance.post("/conversations/group", groupData);
      const updatedConversations = await axiosInstance.get("/conversations");
      set({ conversations: updatedConversations.data });
      get().setSelectedConversation(res.data);
      toast.success("Group created successfully!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    }
  },

  // Get messages by conversation ID
  getMessagesByConversationId: async (conversationId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/conversation/${conversationId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Get messages by user ID (backward compatibility)
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send message to conversation
  sendMessageToConversation: async (messageData) => {
    const { selectedConversation, messages } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedConversation) {
      toast.error("No conversation selected");
      return;
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      conversationId: selectedConversation._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    // immediately update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(
        `/messages/conversation/${selectedConversation._id}/send`,
        messageData
      );
      // Replace optimistic message with actual message
      set({
        messages: messages.filter((m) => m._id !== tempId).concat(res.data),
      });
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages.filter((m) => m._id !== tempId) });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  // Send message to user (backward compatibility)
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    // immediately update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: messages.filter((m) => m._id !== tempId).concat(res.data) });
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages.filter((m) => m._id !== tempId) });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, selectedConversation, isSoundEnabled } = get();
    if (!selectedUser && !selectedConversation) return;

    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();

    socket.on("newMessage", (newMessage) => {
      // Check if message is for current conversation
      let shouldAddMessage = false;

      if (selectedConversation) {
        // For conversations, check if conversationId matches
        shouldAddMessage =
          newMessage.conversationId?.toString() === selectedConversation._id.toString();
      } else if (selectedUser) {
        // For one-to-one chats, check if sender/receiver matches
        shouldAddMessage =
          newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id;
      }

      if (!shouldAddMessage || newMessage.senderId === authUser._id) return;

      const currentMessages = get().messages;
      // Avoid duplicates
      const messageExists = currentMessages.some((m) => m._id === newMessage._id);
      if (!messageExists) {
        set({ messages: [...currentMessages, newMessage] });

        if (isSoundEnabled) {
          const notificationSound = new Audio("/sounds/notification.mp3");
          notificationSound.currentTime = 0;
          notificationSound.play().catch((e) => console.log("Audio play failed:", e));
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Block/unblock user functions
  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/block/${userId}`);
      toast.success("User blocked successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
      return false;
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.delete(`/block/${userId}`);
      toast.success("User unblocked successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
      return false;
    }
  },

  checkIfBlocked: async (userId) => {
    try {
      const res = await axiosInstance.get(`/block/check/${userId}`);
      return res.data;
    } catch (error) {
      console.error("Error checking block status:", error);
      return { blocked: false, isBlocked: false, hasBlockedUs: false };
    }
  },

  // Remove participant from group
  removeParticipantFromGroup: async (conversationId, participantId) => {
    try {
      await axiosInstance.delete(`/conversations/${conversationId}/participants`, {
        data: { participantId },
      });
      toast.success("Member removed successfully");
      await get().getMyConversations();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
      return false;
    }
  },

  // Leave group
  leaveGroup: async (conversationId) => {
    try {
      const { authUser } = useAuthStore.getState();
      await axiosInstance.delete(`/conversations/${conversationId}/participants`, {
        data: { participantId: authUser._id },
      });
      toast.success("Left group successfully");
      get().setSelectedConversation(null);
      await get().getMyConversations();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
      return false;
    }
  },
}));

// frontend/src/components/ChatContainer.jsx
import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    selectedConversation,
    getMessagesByUserId,
    getMessagesByConversationId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedConversation) {
      getMessagesByConversationId(selectedConversation._id);
    } else if (selectedUser) {
      getMessagesByUserId(selectedUser._id);
    }
    subscribeToMessages();

    // clean up
    return () => unsubscribeFromMessages();
  }, [
    selectedConversation,
    selectedUser,
    getMessagesByConversationId,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isOwnMessage = msg.senderId?._id === authUser?._id || msg.senderId === authUser?._id;
              const senderName = msg.senderId?.fullName || "Unknown";
              
              return (
                <div
                  key={msg._id}
                  className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
                >
                  {!isOwnMessage && selectedConversation?.isGroup && (
                    <div className="chat-header mb-1">
                      <span className="text-xs text-slate-400">{senderName}</span>
                    </div>
                  )}
                  <div
                    className={`chat-bubble relative ${
                      isOwnMessage
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {msg.image && (
                      <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                    )}
                    {msg.text && <p className="mt-2">{msg.text}</p>}
                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            {/* 👇 scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder
            name={
              selectedConversation
                ? selectedConversation.isGroup
                  ? selectedConversation.name
                  : selectedConversation.otherParticipant?.fullName ||
                    selectedConversation.participants?.find((p) => p._id !== authUser?._id)
                      ?.fullName ||
                    "User"
                : selectedUser?.fullName || "User"
            }
          />
        )}
      </div>

      <MessageInput />
    </>
  );
}

export default ChatContainer;

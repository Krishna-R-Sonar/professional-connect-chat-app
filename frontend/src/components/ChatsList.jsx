// frontend/src/components/ChatsList.jsx
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

function ChatsList() {
  const {
    getMyConversations,
    conversations,
    isUsersLoading,
    setSelectedConversation,
    getOrCreateOneToOneConversation,
  } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getMyConversations();
  }, [getMyConversations]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!conversations || conversations.length === 0) return <NoChatsFound />;

  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <>
      {conversations.map((conversation) => {
        // Determine display info based on conversation type
        let displayName, displayImage, displayInfo;

        if (conversation.isGroup) {
          displayName = conversation.name;
          displayImage = conversation.groupImage || "/avatar.png";
          displayInfo = `${conversation.participants?.length || 0} members`;
        } else {
          // One-to-one chat
          const otherParticipant =
            conversation.otherParticipant ||
            conversation.participants?.find((p) => p._id !== authUser?._id);
          displayName = otherParticipant?.fullName || "Unknown User";
          displayImage = otherParticipant?.profilePic || "/avatar.png";
          displayInfo = conversation.lastMessage
            ? conversation.lastMessage.text || "Image"
            : "No messages yet";
        }

        return (
          <div
            key={conversation._id}
            className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
            onClick={() => handleConversationClick(conversation)}
          >
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="size-12 rounded-full">
                  <img src={displayImage} alt={displayName} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-slate-200 font-medium truncate">{displayName}</h4>
                <p className="text-xs text-slate-400 truncate">{displayInfo}</p>
              </div>
              {conversation.isGroup && (
                <span className="text-xs text-cyan-400 font-medium">Group</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
export default ChatsList;

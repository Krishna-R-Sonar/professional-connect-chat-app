// frontend/src/components/ChatHeader.jsx
import { XIcon, Users, Ban, UserCheck } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import GroupMembersModal from "./GroupMembersModal";

function ChatHeader() {
  const {
    selectedUser,
    selectedConversation,
    setSelectedUser,
    setSelectedConversation,
    blockUser,
    unblockUser,
    checkIfBlocked,
    leaveGroup,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ blocked: false, isBlocked: false, hasBlockedUs: false });
  const [isCheckingBlock, setIsCheckingBlock] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    // Check block status for one-to-one chats
    if (selectedConversation && !selectedConversation.isGroup) {
      const otherParticipant =
        selectedConversation.otherParticipant ||
        selectedConversation.participants?.find((p) => p._id !== authUser?._id);
      if (otherParticipant) {
        setIsCheckingBlock(true);
        checkIfBlocked(otherParticipant._id || otherParticipant).then((status) => {
          setBlockStatus(status);
          setIsCheckingBlock(false);
        });
      }
    } else if (selectedUser) {
      setIsCheckingBlock(true);
      checkIfBlocked(selectedUser._id).then((status) => {
        setBlockStatus(status);
        setIsCheckingBlock(false);
      });
    }
  }, [selectedConversation, selectedUser, authUser, checkIfBlocked]);

  const handleClose = () => {
    if (selectedConversation) {
      setSelectedConversation(null);
    } else if (selectedUser) {
      setSelectedUser(null);
    }
  };

  const handleBlockUnblock = async () => {
    if (!selectedConversation && !selectedUser) return;

    const targetUserId = selectedConversation && !selectedConversation.isGroup
      ? (selectedConversation.otherParticipant?._id || selectedConversation.participants?.find((p) => p._id !== authUser?._id)?._id)
      : selectedUser?._id;

    if (!targetUserId) return;

    setIsBlocking(true);
    try {
      if (blockStatus.isBlocked) {
        await unblockUser(targetUserId);
        setBlockStatus({ ...blockStatus, isBlocked: false, blocked: false });
      } else {
        await blockUser(targetUserId);
        setBlockStatus({ ...blockStatus, isBlocked: true, blocked: true });
      }
    } catch (error) {
      console.error("Error blocking/unblocking:", error);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedConversation || !selectedConversation.isGroup) return;
    
    if (confirm("Are you sure you want to leave this group?")) {
      await leaveGroup(selectedConversation._id);
    }
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (selectedConversation) {
          setSelectedConversation(null);
        } else if (selectedUser) {
          setSelectedUser(null);
        }
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [selectedConversation, selectedUser, setSelectedConversation, setSelectedUser]);

  // Determine what to display
  let displayName, displayImage, displayInfo;

  if (selectedConversation) {
    if (selectedConversation.isGroup) {
      displayName = selectedConversation.name;
      displayImage = selectedConversation.groupImage || "/avatar.png";
      displayInfo = `${selectedConversation.participants?.length || 0} members`;
    } else {
      // One-to-one
      const otherParticipant =
        selectedConversation.otherParticipant ||
        selectedConversation.participants?.find((p) => p._id !== authUser?._id);
      displayName = otherParticipant?.fullName || "Unknown User";
      displayImage = otherParticipant?.profilePic || "/avatar.png";
      const isOnline = otherParticipant
        ? onlineUsers.includes(otherParticipant._id)
        : false;
      displayInfo = isOnline ? "Online" : "Offline";
    }
  } else if (selectedUser) {
    displayName = selectedUser.fullName;
    displayImage = selectedUser.profilePic || "/avatar.png";
    const isOnline = onlineUsers.includes(selectedUser._id);
    displayInfo = isOnline ? "Online" : "Offline";
  } else {
    return null;
  }

  const isOneToOneChat = (selectedConversation && !selectedConversation.isGroup) || selectedUser;
  const showBlockOption = isOneToOneChat && !isCheckingBlock;

  return (
    <>
      <div className="flex justify-between items-center bg-slate-800/50 border-b border-slate-700/50 max-h-[84px] px-6 flex-1">
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <div className="w-12 rounded-full">
              <img src={displayImage} alt={displayName} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-slate-200 font-medium">{displayName}</h3>
              {selectedConversation?.isGroup && (
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
                  Group
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{displayInfo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Group Members Button */}
          {selectedConversation?.isGroup && (
            <button
              onClick={() => setIsGroupMembersModalOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              title="View group members"
            >
              <Users size={18} />
            </button>
          )}

          {/* Block/Unblock Button for one-to-one */}
          {showBlockOption && (
            <button
              onClick={handleBlockUnblock}
              disabled={isBlocking}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                blockStatus.isBlocked
                  ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
              }`}
              title={blockStatus.isBlocked ? "Unblock user" : "Block user"}
            >
              {blockStatus.isBlocked ? (
                <UserCheck size={18} />
              ) : (
                <Ban size={18} />
              )}
            </button>
          )}

          {/* Leave Group Button */}
          {selectedConversation?.isGroup && (
            <button
              onClick={handleLeaveGroup}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Leave group"
            >
              <XIcon size={18} />
            </button>
          )}

          <button onClick={handleClose}>
            <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
          </button>
        </div>
      </div>

      {selectedConversation?.isGroup && (
        <GroupMembersModal
          isOpen={isGroupMembersModalOpen}
          onClose={() => setIsGroupMembersModalOpen(false)}
          conversation={selectedConversation}
        />
      )}
    </>
  );
}
export default ChatHeader;

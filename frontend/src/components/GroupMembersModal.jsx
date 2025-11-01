// frontend/src/components/GroupMembersModal.jsx
import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, UserMinus, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

function GroupMembersModal({ isOpen, onClose, conversation }) {
  const { authUser } = useAuthStore();
  const { getMyConversations, setSelectedConversation } = useChatStore();
  const [isRemoving, setIsRemoving] = useState(false);

  if (!isOpen || !conversation || !conversation.isGroup) return null;

  const isAdmin = conversation.groupAdmin?._id === authUser?._id || 
                  conversation.groupAdmin === authUser?._id;

  const handleRemoveMember = async (participantId) => {
    if (!confirm("Are you sure you want to remove this member from the group?")) {
      return;
    }

    setIsRemoving(true);
    try {
      await axiosInstance.delete(`/conversations/${conversation._id}/participants`, {
        data: { participantId },
      });
      toast.success("Member removed successfully");
      
      // Refresh conversations
      await getMyConversations();
      
      // Refresh selected conversation
      const updatedConversations = await axiosInstance.get("/conversations");
      const updated = updatedConversations.data.find(c => c._id === conversation._id);
      if (updated) {
        setSelectedConversation(updated);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) {
      return;
    }

    setIsRemoving(true);
    try {
      await axiosInstance.delete(`/conversations/${conversation._id}/participants`, {
        data: { participantId: authUser._id },
      });
      toast.success("Left group successfully");
      
      // Close the conversation
      setSelectedConversation(null);
      onClose();
      
      // Refresh conversations
      await getMyConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-200">Group Members</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-slate-300 text-sm mb-2">
            {conversation.participants?.length || 0} members
          </p>
          {isAdmin && (
            <p className="text-xs text-cyan-400 mb-4">You are the group admin</p>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {conversation.participants?.map((participant) => {
            const participantId = participant._id || participant;
            const participantName = participant.fullName || participant;
            const participantPic = participant.profilePic || "/avatar.png";
            const isCurrentUser = participantId === authUser?._id;
            const canRemove = isAdmin && !isCurrentUser;

            return (
              <div
                key={participantId}
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="avatar">
                    <div className="size-10 rounded-full">
                      <img src={participantPic} alt={participantName} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium truncate">
                      {participantName}
                      {isCurrentUser && (
                        <span className="text-xs text-slate-400 ml-2">(You)</span>
                      )}
                      {conversation.groupAdmin?._id === participantId ||
                      conversation.groupAdmin === participantId ? (
                        <span className="text-xs text-cyan-400 ml-2">(Admin)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {participant.profession || participant.email || ""}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(participantId)}
                      disabled={isRemoving}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      <UserMinus size={18} />
                    </button>
                  )}
                  {isCurrentUser && (
                    <button
                      onClick={handleLeaveGroup}
                      disabled={isRemoving}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      title="Leave group"
                    >
                      <LogOut size={18} />
                      <span className="text-xs">Leave</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GroupMembersModal;


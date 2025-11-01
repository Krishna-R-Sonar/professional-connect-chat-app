// frontend/src/components/CreateGroupModal.jsx
import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X } from "lucide-react";

function CreateGroupModal({ isOpen, onClose }) {
  const { allContacts, createGroupConversation } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return;
    }
    if (selectedParticipants.length === 0) {
      return;
    }

    try {
      await createGroupConversation({
        name: groupName.trim(),
        participantIds: selectedParticipants,
      });
      setGroupName("");
      setSelectedParticipants([]);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-200">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter group name"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Participants ({selectedParticipants.length} selected)
            </label>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {allContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => toggleParticipant(contact._id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedParticipants.includes(contact._id)
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  <div className="avatar">
                    <div className="size-10 rounded-full">
                      <img
                        src={contact.profilePic || "/avatar.png"}
                        alt={contact.fullName}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
                    <p className="text-xs text-slate-400">{contact.email}</p>
                  </div>
                  {selectedParticipants.includes(contact._id) && (
                    <div className="size-5 rounded-full bg-cyan-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || selectedParticipants.length === 0}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;


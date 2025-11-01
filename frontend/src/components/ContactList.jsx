// frontend/src/components/ContactList.jsx
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import CreateGroupModal from "./CreateGroupModal";
import { Users } from "lucide-react";

function ContactList() {
  const {
    getAllContacts,
    allContacts,
    setSelectedUser,
    getOrCreateOneToOneConversation,
    isUsersLoading,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  const handleContactClick = async (contact) => {
    // Create or get one-to-one conversation
    await getOrCreateOneToOneConversation(contact._id);
  };

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      <div className="mb-4">
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Users size={18} />
          <span>Create Group</span>
        </button>
      </div>

      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => handleContactClick(contact)}
        >
          <div className="flex items-center gap-3">
            <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
              <div className="size-12 rounded-full">
                <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
              <p className="text-xs text-slate-400">{contact.profession || "No profession listed"}</p>
            </div>
          </div>
        </div>
      ))}

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </>
  );
}
export default ContactList;

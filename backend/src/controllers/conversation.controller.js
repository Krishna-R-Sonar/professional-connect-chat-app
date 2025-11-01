// backend/src/controllers/conversation.controller.js
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// Get or create a one-to-one conversation
export const getOrCreateOneToOneConversation = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { userId } = req.params;

    if (loggedInUserId.toString() === userId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Check if receiver exists
    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find existing one-to-one conversation
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [loggedInUserId, userId] },
    }).populate("participants", "-password");

    // If no conversation exists, create one
    if (!conversation) {
      conversation = new Conversation({
        isGroup: false,
        participants: [loggedInUserId, userId],
      });
      await conversation.save();
      conversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "-password"
      );
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.log("Error in getOrCreateOneToOneConversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a group conversation
export const createGroupConversation = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { name, participantIds, groupImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({ message: "At least one participant is required" });
    }

    // Add the creator to participants
    const allParticipants = [...new Set([loggedInUserId.toString(), ...participantIds])];

    // Verify all participants exist
    const users = await User.find({ _id: { $in: allParticipants } });
    if (users.length !== allParticipants.length) {
      return res.status(400).json({ message: "Some participants not found" });
    }

    const conversation = new Conversation({
      name: name.trim(),
      isGroup: true,
      participants: allParticipants,
      groupAdmin: loggedInUserId,
      groupImage: groupImage || "",
    });

    await conversation.save();
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(populatedConversation);
  } catch (error) {
    console.log("Error in createGroupConversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all conversations for logged-in user
export const getMyConversations = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: loggedInUserId,
    })
      .populate("participants", "-password")
      .populate("groupAdmin", "-password")
      .sort({ updatedAt: -1 });

    // Transform conversations to include last message and unread count
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          conversationId: conversation._id,
        })
          .sort({ createdAt: -1 })
          .populate("senderId", "fullName profilePic");

        const conversationObj = conversation.toObject();
        conversationObj.lastMessage = lastMessage;

        // For one-to-one chats, get the other participant's info
        if (!conversation.isGroup && conversation.participants.length === 2) {
          const otherParticipant = conversation.participants.find(
            (p) => p._id.toString() !== loggedInUserId.toString()
          );
          conversationObj.otherParticipant = otherParticipant;
        }

        return conversationObj;
      })
    );

    res.status(200).json(conversationsWithLastMessage);
  } catch (error) {
    console.log("Error in getMyConversations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single conversation by ID
export const getConversationById = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: loggedInUserId,
    })
      .populate("participants", "-password")
      .populate("groupAdmin", "-password");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.log("Error in getConversationById:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add participants to a group
export const addParticipantsToGroup = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { conversationId } = req.params;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: "At least one participant is required" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Cannot add participants to a one-to-one chat" });
    }

    if (conversation.groupAdmin.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ message: "Only group admin can add participants" });
    }

    // Verify participants exist
    const users = await User.find({ _id: { $in: participantIds } });
    if (users.length !== participantIds.length) {
      return res.status(400).json({ message: "Some participants not found" });
    }

    // Add new participants (avoid duplicates)
    const existingParticipantIds = conversation.participants.map((id) => id.toString());
    const newParticipantIds = participantIds.filter(
      (id) => !existingParticipantIds.includes(id.toString())
    );

    if (newParticipantIds.length === 0) {
      return res.status(400).json({ message: "All participants are already in the group" });
    }

    conversation.participants.push(...newParticipantIds);
    await conversation.save();

    const populatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(populatedConversation);
  } catch (error) {
    console.log("Error in addParticipantsToGroup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove participant from group
export const removeParticipantFromGroup = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { conversationId } = req.params;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Cannot remove participants from a one-to-one chat" });
    }

    // Only admin can remove participants (or user can leave themselves)
    if (
      conversation.groupAdmin.toString() !== loggedInUserId.toString() &&
      participantId !== loggedInUserId.toString()
    ) {
      return res.status(403).json({ message: "Only group admin can remove participants" });
    }

    // Remove participant
    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== participantId.toString()
    );

    if (conversation.participants.length < 2) {
      return res.status(400).json({ message: "Group must have at least 2 participants" });
    }

    // If admin leaves, assign new admin
    if (conversation.groupAdmin.toString() === participantId.toString()) {
      conversation.groupAdmin = conversation.participants[0];
    }

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(populatedConversation);
  } catch (error) {
    console.log("Error in removeParticipantFromGroup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update group info
export const updateGroupInfo = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { conversationId } = req.params;
    const { name, groupImage } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Can only update group conversations" });
    }

    if (conversation.groupAdmin.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ message: "Only group admin can update group info" });
    }

    if (name !== undefined && name.trim()) {
      conversation.name = name.trim();
    }

    if (groupImage !== undefined) {
      conversation.groupImage = groupImage;
    }

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(populatedConversation);
  } catch (error) {
    console.log("Error in updateGroupInfo:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


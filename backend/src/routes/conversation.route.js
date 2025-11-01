// backend/src/routes/conversation.route.js
import express from "express";
import {
  createGroupConversation,
  getMyConversations,
  getConversationById,
  getOrCreateOneToOneConversation,
  addParticipantsToGroup,
  removeParticipantFromGroup,
  updateGroupInfo,
} from "../controllers/conversation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

// Get or create one-to-one conversation
router.get("/one-to-one/:userId", getOrCreateOneToOneConversation);

// Get all conversations for logged-in user
router.get("/", getMyConversations);

// Get single conversation by ID
router.get("/:conversationId", getConversationById);

// Create group conversation
router.post("/group", createGroupConversation);

// Update group info
router.put("/:conversationId", updateGroupInfo);

// Add participants to group
router.post("/:conversationId/participants", addParticipantsToGroup);

// Remove participant from group
router.delete("/:conversationId/participants", removeParticipantFromGroup);

export default router;


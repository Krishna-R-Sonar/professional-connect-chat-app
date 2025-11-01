// backend/src/routes/message.route.js
import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  getMessagesByConversationId,
  sendMessage,
  sendMessageToConversation,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);

// New conversation-based routes
router.get("/conversation/:conversationId", getMessagesByConversationId);
router.post("/conversation/:conversationId/send", sendMessageToConversation);

// Backward compatibility routes
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

export default router;

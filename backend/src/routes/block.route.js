// backend/src/routes/block.route.js
import express from "express";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkIfBlocked,
} from "../controllers/block.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/", getBlockedUsers);
router.get("/check/:userId", checkIfBlocked);
router.post("/:userId", blockUser);
router.delete("/:userId", unblockUser);

export default router;


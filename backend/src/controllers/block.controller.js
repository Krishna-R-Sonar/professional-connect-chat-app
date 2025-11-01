// backend/src/controllers/block.controller.js
import User from "../models/User.js";

// Block a user
export const blockUser = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { userId } = req.params;

    if (loggedInUserId.toString() === userId) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = await User.findById(loggedInUserId);
    
    // Check if already blocked
    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: "User is already blocked" });
    }

    // Add to blocked list
    currentUser.blockedUsers.push(userId);
    await currentUser.save();

    res.status(200).json({ 
      message: "User blocked successfully",
      blockedUsers: currentUser.blockedUsers,
    });
  } catch (error) {
    console.log("Error in blockUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { userId } = req.params;

    const currentUser = await User.findById(loggedInUserId);
    
    // Check if user is blocked
    if (!currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: "User is not blocked" });
    }

    // Remove from blocked list
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== userId.toString()
    );
    await currentUser.save();

    res.status(200).json({ 
      message: "User unblocked successfully",
      blockedUsers: currentUser.blockedUsers,
    });
  } catch (error) {
    console.log("Error in unblockUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get blocked users list
export const getBlockedUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const currentUser = await User.findById(loggedInUserId).populate(
      "blockedUsers",
      "fullName email profilePic profession"
    );

    res.status(200).json(currentUser.blockedUsers || []);
  } catch (error) {
    console.log("Error in getBlockedUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check if user is blocked
export const checkIfBlocked = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { userId } = req.params;

    const currentUser = await User.findById(loggedInUserId);
    const isBlocked = currentUser.blockedUsers.some(
      (id) => id.toString() === userId.toString()
    );

    // Also check if the other user has blocked us
    const otherUser = await User.findById(userId);
    const hasBlockedUs = otherUser.blockedUsers.some(
      (id) => id.toString() === loggedInUserId.toString()
    );

    res.status(200).json({ 
      isBlocked,
      hasBlockedUs,
      blocked: isBlocked || hasBlockedUs,
    });
  } catch (error) {
    console.log("Error in checkIfBlocked:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


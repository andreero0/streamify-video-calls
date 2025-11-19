import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { friendRequestLimiter } from "../middleware/rateLimiter.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  unfriend,
} from "../controllers/user.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

// User discovery
router.get("/", getRecommendedUsers); // Supports pagination and search via query params
router.get("/friends", getMyFriends);

// Friend request management
router.post("/friend-request/:id", friendRequestLimiter, sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.delete("/friend-request/:id/decline", declineFriendRequest);
router.delete("/friend-request/:id/cancel", cancelFriendRequest);

// Friend requests queries
router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

// Unfriend
router.delete("/unfriend/:id", unfriend);

export default router;

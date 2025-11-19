import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import logger from "../lib/logger.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get search and filter params
    const search = req.query.search || "";
    const nativeLanguage = req.query.nativeLanguage || "";
    const learningLanguage = req.query.learningLanguage || "";

    // Build query
    const query = {
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    };

    // Add search filter
    if (search) {
      query.$and.push({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Add language filters
    if (nativeLanguage) {
      query.$and.push({ nativeLanguage });
    }
    if (learningLanguage) {
      query.$and.push({ learningLanguage });
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error in getRecommendedUsers controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    logger.error("Error in getMyFriends controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    logger.error("Error in sendFriendRequest controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    logger.error("Error in acceptFriendRequest controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    logger.error("Error in getFriendRequests controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    logger.error("Error in getOutgoingFriendReqs controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function cancelFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the sender
    if (friendRequest.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to cancel this request" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    logger.info(`Friend request cancelled by user: ${req.user.email}`);

    res.status(200).json({ success: true, message: "Friend request cancelled" });
  } catch (error) {
    logger.error("Error in cancelFriendRequest controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function declineFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to decline this request" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    logger.info(`Friend request declined by user: ${req.user.email}`);

    res.status(200).json({ success: true, message: "Friend request declined" });
  } catch (error) {
    logger.error("Error in declineFriendRequest controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function unfriend(req, res) {
  try {
    const { id: friendId } = req.params;
    const myId = req.user.id;

    if (myId === friendId) {
      return res.status(400).json({ message: "You cannot unfriend yourself" });
    }

    const currentUser = await User.findById(myId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if they are actually friends
    if (!currentUser.friends.includes(friendId)) {
      return res.status(400).json({ message: "You are not friends with this user" });
    }

    // Remove from both users' friends arrays
    await User.findByIdAndUpdate(myId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: myId },
    });

    logger.info(`User ${req.user.email} unfriended user ${friendId}`);

    res.status(200).json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    logger.error("Error in unfriend controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

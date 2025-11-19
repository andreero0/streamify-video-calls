import { upsertStreamUser } from "../lib/stream.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import logger from "../lib/logger.js";

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Password validation is handled by express-validator middleware
    // This is just a fallback
    if (password.length < 12) {
      return res.status(400).json({
        message:
          "Password must be at least 12 characters long and contain uppercase, lowercase, number, and special character",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a different one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await User.create({
      email: email.toLowerCase(),
      fullName,
      password,
      profilePic: randomAvatar,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false,
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      newUser.email,
      verificationToken,
      newUser.fullName
    );

    if (!emailResult.success) {
      logger.error(`Failed to send verification email to ${newUser.email}:`, emailResult.error);
    }

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      logger.info(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      logger.error("Error creating Stream user:", error);
    }

    // Generate JWT token (user can login but some features require email verification)
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    logger.info(`New user registered: ${newUser.email}`);

    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        profilePic: newUser.profilePic,
        isEmailVerified: newUser.isEmailVerified,
        isOnboarded: newUser.isOnboarded,
      },
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (error) {
    logger.error("Error in signup controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now access all features.",
    });
  } catch (error) {
    logger.error("Error in verifyEmail controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resendVerificationEmail(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, verificationToken, user.fullName);

    if (!emailResult.success) {
      logger.error(`Failed to resend verification email to ${user.email}:`, emailResult.error);
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    logger.info(`Verification email resent to: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    logger.error("Error in resendVerificationEmail controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(`Failed login attempt for non-existent email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
        bio: user.bio,
        nativeLanguage: user.nativeLanguage,
        learningLanguage: user.learningLanguage,
        location: user.location,
        isEmailVerified: user.isEmailVerified,
        isOnboarded: user.isOnboarded,
        friends: user.friends,
      },
    });
  } catch (error) {
    logger.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  const userEmail = req.user?.email || "Unknown";
  res.clearCookie("jwt");
  logger.info(`User logged out: ${userEmail}`);
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      logger.info(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      logger.error("Error updating Stream user during onboarding:", streamError);
    }

    logger.info(`User onboarded: ${updatedUser.email}`);

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, location, profilePic, nativeLanguage, learningLanguage } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profilePic) updateData.profilePic = profilePic;
    if (nativeLanguage) updateData.nativeLanguage = nativeLanguage;
    if (learningLanguage) updateData.learningLanguage = learningLanguage;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select(
      "-password"
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      logger.info(`Stream user updated for ${updatedUser.fullName}`);
    } catch (streamError) {
      logger.error("Error updating Stream user:", streamError);
    }

    logger.info(`Profile updated for user: ${updatedUser.email}`);

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        success: true,
        message: "If that email exists, a password reset link has been sent.",
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.fullName);

    if (!emailResult.success) {
      logger.error(`Failed to send password reset email to ${user.email}:`, emailResult.error);
    }

    logger.info(`Password reset requested for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error("Error in requestPasswordReset controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Password validation is handled by express-validator middleware
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    logger.info(`Password reset successfully for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    logger.error("Error in resetPassword controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteAccount(req, res) {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Remove user from all friends' friend lists
    await User.updateMany({ friends: userId }, { $pull: { friends: userId } });

    // Delete all friend requests involving this user
    const FriendRequest = (await import("../models/FriendRequest.js")).default;
    await FriendRequest.deleteMany({
      $or: [{ sender: userId }, { recipient: userId }],
    });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Clear the cookie
    res.clearCookie("jwt");

    logger.info(`Account deleted for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logger.error("Error in deleteAccount controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMe(req, res) {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    logger.error("Error in getMe controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Multi-tenant support
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: false, // Optional for backward compatibility with existing language exchange users
    },

    // Basic info
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 12,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    profilePic: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
      maxlength: 100,
    },
    phoneNumber: {
      type: String,
      default: "",
    },

    // Role within tenant
    role: {
      type: String,
      enum: ["user", "admin", "super_admin", "provider", "patient", "mentor", "mentee"],
      default: "user",
    },

    // Language exchange fields (original use case)
    nativeLanguage: {
      type: String,
      default: "",
    },
    learningLanguage: {
      type: String,
      default: "",
    },

    // Corporate mentorship fields
    corporateProfile: {
      department: String,
      jobTitle: String,
      yearsExperience: Number,
      skills: [String],
      skillsToLearn: [String],
      mentorshipTopics: [String],
      availableAsMentor: {
        type: Boolean,
        default: false,
      },
      seekingMentorship: {
        type: Boolean,
        default: false,
      },
    },

    // Healthcare fields
    healthcareProfile: {
      providerType: {
        type: String,
        enum: ["doctor", "nurse", "therapist", "physician_assistant", "nurse_practitioner"],
      },
      licenseNumber: String,
      specialty: String,
      npiNumber: String,
      acceptsNewPatients: {
        type: Boolean,
        default: true,
      },
      availability: {
        type: mongoose.Schema.Types.Mixed, // JSON object for schedule
        default: {},
      },
      // For patients
      dateOfBirth: Date,
      medicalRecordNumber: String,
      insuranceInfo: {
        provider: String,
        policyNumber: String,
        groupNumber: String,
      },
    },

    // Account status
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true, // For tenants that require admin approval
    },

    // Security tokens
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // Relationships (scoped to tenant)
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Analytics
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Add indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ tenantId: 1, isOnboarded: 1 });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ friends: 1 });
userSchema.index({ isOnboarded: 1 });
userSchema.index({ nativeLanguage: 1, learningLanguage: 1 });
userSchema.index({ "corporateProfile.department": 1 });
userSchema.index({ "healthcareProfile.specialty": 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  const isPasswordCorrect = await bcrypt.compare(enteredPassword, this.password);
  return isPasswordCorrect;
};

const User = mongoose.model("User", userSchema);

export default User;

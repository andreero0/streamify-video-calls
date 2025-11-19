import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    industry: {
      type: String,
      required: true,
      enum: ["language_exchange", "corporate_mentorship", "healthcare", "fitness", "education"],
      default: "language_exchange",
    },
    subdomain: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but enforces uniqueness when present
      lowercase: true,
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    branding: {
      logo: {
        type: String,
        default: "",
      },
      primaryColor: {
        type: String,
        default: "#667eea",
      },
      secondaryColor: {
        type: String,
        default: "#764ba2",
      },
    },
    features: {
      enabledModules: {
        type: [String],
        default: ["video", "chat", "matching"],
      },
      customFields: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      matchingCriteria: {
        type: [String],
        default: ["skills", "interests"],
      },
    },
    // Industry-specific configurations
    corporateConfig: {
      departments: {
        type: [String],
        default: [],
      },
      jobTitles: {
        type: [String],
        default: [],
      },
      skills: {
        type: [String],
        default: [],
      },
      enableDepartmentMatching: {
        type: Boolean,
        default: true,
      },
      enableSkillMatching: {
        type: Boolean,
        default: true,
      },
    },
    healthcareConfig: {
      practiceType: {
        type: String,
        enum: ["pediatrics", "family_medicine", "obgyn", "general", "specialty"],
      },
      providers: {
        type: [
          {
            userId: mongoose.Schema.Types.ObjectId,
            licenseNumber: String,
            specialty: String,
            acceptsNewPatients: Boolean,
          },
        ],
        default: [],
      },
      appointmentDuration: {
        type: Number,
        default: 30, // minutes
      },
      enableAppointmentScheduling: {
        type: Boolean,
        default: true,
      },
      enableSessionNotes: {
        type: Boolean,
        default: true,
      },
      requireConsent: {
        type: Boolean,
        default: true,
      },
      hipaaCompliant: {
        type: Boolean,
        default: false, // Must be explicitly enabled
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "starter", "growth", "pro", "enterprise"],
        default: "free",
      },
      seats: {
        type: Number,
        default: 50,
      },
      monthlyPrice: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["active", "suspended", "cancelled", "trial"],
        default: "trial",
      },
      trialEndsAt: {
        type: Date,
      },
      billingEmail: {
        type: String,
      },
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    settings: {
      allowPublicSignup: {
        type: Boolean,
        default: false,
      },
      requireEmailVerification: {
        type: Boolean,
        default: true,
      },
      requireAdminApproval: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
tenantSchema.index({ slug: 1 });
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ customDomain: 1 });
tenantSchema.index({ industry: 1 });

// Pre-save hook to generate slug from name
tenantSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

const Tenant = mongoose.model("Tenant", tenantSchema);

export default Tenant;

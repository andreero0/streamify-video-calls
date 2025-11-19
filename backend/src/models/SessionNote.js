import mongoose from "mongoose";

const sessionNoteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // SOAP format (common in healthcare)
    subjective: {
      chiefComplaint: String,
      historyOfPresentIllness: String,
      reviewOfSystems: String,
    },
    objective: {
      vitalSigns: {
        temperature: Number,
        bloodPressure: String,
        heartRate: Number,
        respiratoryRate: Number,
        weight: Number,
        height: Number,
      },
      physicalExam: String,
      labResults: String,
    },
    assessment: {
      diagnosis: String,
      differentialDiagnosis: String,
      icdCodes: [String],
    },
    plan: {
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
        },
      ],
      treatmentPlan: String,
      followUpInstructions: String,
      referrals: String,
      patientEducation: String,
    },
    // Generic notes field for non-healthcare use cases
    generalNotes: {
      type: String,
    },
    // For corporate mentorship
    mentorshipNotes: {
      discussionTopics: [String],
      goalsSet: [String],
      actionItems: [String],
      progressNotes: String,
    },
    // Encryption and security
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    lastAccessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastAccessedAt: {
      type: Date,
    },
    // Audit trail
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        editedAt: Date,
        changes: String,
      },
    ],
  },
  { timestamps: true }
);

// Indexes
sessionNoteSchema.index({ tenantId: 1, patient: 1, createdAt: -1 });
sessionNoteSchema.index({ provider: 1, createdAt: -1 });
sessionNoteSchema.index({ appointmentId: 1 });

// Update lastAccessedAt on read
sessionNoteSchema.methods.recordAccess = function (userId) {
  this.lastAccessedBy = userId;
  this.lastAccessedAt = new Date();
  return this.save();
};

const SessionNote = mongoose.model("SessionNote", sessionNoteSchema);

export default SessionNote;

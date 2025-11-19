import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
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
    appointmentType: {
      type: String,
      enum: ["consultation", "follow_up", "initial_visit", "annual_checkup", "urgent_care"],
      default: "consultation",
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    notes: {
      type: String,
      default: "",
    },
    chiefComplaint: {
      type: String,
    },
    videoCallId: {
      type: String,
    },
    // For corporate mentorship - can be "mentorship_session", "training", etc.
    sessionType: {
      type: String,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    reminderSentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
appointmentSchema.index({ tenantId: 1, scheduledAt: 1 });
appointmentSchema.index({ provider: 1, scheduledAt: 1 });
appointmentSchema.index({ patient: 1, scheduledAt: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

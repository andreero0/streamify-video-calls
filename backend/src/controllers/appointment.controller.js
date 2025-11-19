import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import logger from "../lib/logger.js";

/**
 * Create appointment
 * POST /api/appointments
 */
export async function createAppointment(req, res) {
  try {
    const { providerId, scheduledAt, duration, appointmentType, chiefComplaint } = req.body;

    if (!providerId || !scheduledAt) {
      return res.status(400).json({ message: "Provider and scheduled time are required" });
    }

    // Verify provider exists and belongs to same tenant
    const provider = await User.findOne({
      _id: providerId,
      tenantId: req.tenant._id,
      role: { $in: ["provider", "admin"] },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Check for conflicting appointments
    const scheduledDate = new Date(scheduledAt);
    const appointmentDuration = duration || req.tenant.healthcareConfig.appointmentDuration || 30;
    const endTime = new Date(scheduledDate.getTime() + appointmentDuration * 60000);

    const conflictingAppointment = await Appointment.findOne({
      provider: providerId,
      status: { $in: ["scheduled", "confirmed"] },
      $or: [
        {
          scheduledAt: {
            $gte: scheduledDate,
            $lt: endTime,
          },
        },
        {
          $expr: {
            $and: [
              { $lte: ["$scheduledAt", scheduledDate] },
              {
                $gt: [
                  { $add: ["$scheduledAt", { $multiply: ["$duration", 60000] }] },
                  scheduledDate,
                ],
              },
            ],
          },
        },
      ],
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        message: "Provider already has an appointment at this time",
      });
    }

    const appointment = await Appointment.create({
      tenantId: req.tenant._id,
      provider: providerId,
      patient: req.user._id,
      appointmentType: appointmentType || "consultation",
      scheduledAt: scheduledDate,
      duration: appointmentDuration,
      chiefComplaint,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("provider", "fullName profilePic healthcareProfile")
      .populate("patient", "fullName profilePic");

    logger.info(`Appointment created: ${appointment._id} for tenant: ${req.tenant.name}`);

    res.status(201).json({
      success: true,
      appointment: populatedAppointment,
    });
  } catch (error) {
    logger.error("Error creating appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get appointments for current user
 * GET /api/appointments
 */
export async function getMyAppointments(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const upcoming = req.query.upcoming === "true";

    // Build query based on user role
    const query = {
      tenantId: req.tenant._id,
    };

    if (req.user.role === "provider" || req.user.role === "admin") {
      query.provider = req.user._id;
    } else {
      query.patient = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (upcoming) {
      query.scheduledAt = { $gte: new Date() };
      query.status = { $in: ["scheduled", "confirmed"] };
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate("provider", "fullName profilePic healthcareProfile")
        .populate("patient", "fullName profilePic")
        .limit(limit)
        .skip(skip)
        .sort({ scheduledAt: upcoming ? 1 : -1 }),
      Appointment.countDocuments(query),
    ]);

    res.status(200).json({
      appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    logger.error("Error getting appointments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get single appointment
 * GET /api/appointments/:id
 */
export async function getAppointment(req, res) {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    })
      .populate("provider", "fullName profilePic healthcareProfile")
      .populate("patient", "fullName profilePic healthcareProfile");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check authorization
    const isAuthorized =
      appointment.provider._id.toString() === req.user._id.toString() ||
      appointment.patient._id.toString() === req.user._id.toString() ||
      req.user.role === "admin";

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized to view this appointment" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    logger.error("Error getting appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Update appointment
 * PUT /api/appointments/:id
 */
export async function updateAppointment(req, res) {
  try {
    const { scheduledAt, status, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check authorization
    const isProvider = appointment.provider.toString() === req.user._id.toString();
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isProvider && !isPatient && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this appointment" });
    }

    // Update fields
    if (scheduledAt && (isProvider || isAdmin)) {
      appointment.scheduledAt = new Date(scheduledAt);
    }

    if (status) {
      appointment.status = status;
    }

    if (notes && (isProvider || isAdmin)) {
      appointment.notes = notes;
    }

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate("provider", "fullName profilePic healthcareProfile")
      .populate("patient", "fullName profilePic");

    logger.info(`Appointment updated: ${appointment._id}`);

    res.status(200).json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    logger.error("Error updating appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Cancel appointment
 * DELETE /api/appointments/:id
 */
export async function cancelAppointment(req, res) {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check authorization
    const isProvider = appointment.provider.toString() === req.user._id.toString();
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isProvider && !isPatient && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to cancel this appointment" });
    }

    appointment.status = "cancelled";
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();

    await appointment.save();

    logger.info(`Appointment cancelled: ${appointment._id} by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    logger.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get provider availability
 * GET /api/appointments/providers/:providerId/availability
 */
export async function getProviderAvailability(req, res) {
  try {
    const { providerId } = req.params;
    const { date } = req.query; // YYYY-MM-DD format

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const provider = await User.findOne({
      _id: providerId,
      tenantId: req.tenant._id,
      role: { $in: ["provider", "admin"] },
    });

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    // Get all appointments for the provider on that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      provider: providerId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ["scheduled", "confirmed"] },
    }).select("scheduledAt duration");

    // Return booked time slots
    const bookedSlots = appointments.map((apt) => ({
      start: apt.scheduledAt,
      end: new Date(apt.scheduledAt.getTime() + apt.duration * 60000),
    }));

    res.status(200).json({
      providerId,
      date,
      bookedSlots,
      availability: provider.healthcareProfile?.availability || {},
    });
  } catch (error) {
    logger.error("Error getting provider availability:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

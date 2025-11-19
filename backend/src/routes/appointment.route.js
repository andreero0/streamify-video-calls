import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/tenant.middleware.js";
import {
  createAppointment,
  getMyAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  getProviderAvailability,
} from "../controllers/appointment.controller.js";

const router = express.Router();

// All routes require authentication and tenant
router.use(protectRoute);
router.use(requireTenant);

// Appointment management
router.post("/", createAppointment);
router.get("/", getMyAppointments);
router.get("/:id", getAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", cancelAppointment);

// Provider availability
router.get("/providers/:providerId/availability", getProviderAvailability);

export default router;

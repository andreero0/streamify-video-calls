import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireTenant, requireTenantAdmin } from "../middleware/tenant.middleware.js";
import {
  createTenant,
  getTenantConfig,
  updateTenantConfig,
  getTenantAnalytics,
  getAllTenants,
  getTenantUsers,
} from "../controllers/tenant.controller.js";

const router = express.Router();

// Public routes
router.post("/", createTenant); // Create new organization/tenant

// Protected routes - require authentication
router.get("/:id/config", protectRoute, getTenantConfig);

// Admin-only routes
router.put("/:id/config", protectRoute, requireTenantAdmin, updateTenantConfig);
router.get("/:id/analytics", protectRoute, requireTenantAdmin, getTenantAnalytics);
router.get("/:id/users", protectRoute, requireTenantAdmin, getTenantUsers);

// Super admin routes (for platform owner)
router.get("/", protectRoute, getAllTenants); // TODO: Add super admin middleware

export default router;

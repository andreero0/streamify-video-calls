import Tenant from "../models/Tenant.js";
import logger from "../lib/logger.js";

/**
 * Middleware to identify and attach tenant to request
 * Supports:
 * - Subdomain routing (corporate.streamify.com)
 * - Custom domain routing (mentorship.company.com)
 * - Header-based routing (X-Tenant-ID header)
 * - Default tenant (for language exchange users)
 */
export async function identifyTenant(req, res, next) {
  try {
    let tenant = null;

    // Method 1: Check for X-Tenant-ID header (for API calls)
    const tenantIdHeader = req.headers["x-tenant-id"];
    if (tenantIdHeader) {
      tenant = await Tenant.findById(tenantIdHeader);
      if (tenant) {
        logger.debug(`Tenant identified by header: ${tenant.name}`);
      }
    }

    // Method 2: Check for subdomain
    if (!tenant) {
      const hostname = req.hostname;
      const subdomain = hostname.split(".")[0];

      // Ignore common non-tenant subdomains
      const ignoredSubdomains = ["www", "api", "localhost", "127"];

      if (!ignoredSubdomains.includes(subdomain) && hostname.includes(".")) {
        tenant = await Tenant.findOne({ subdomain });
        if (tenant) {
          logger.debug(`Tenant identified by subdomain: ${tenant.name}`);
        }
      }
    }

    // Method 3: Check for custom domain
    if (!tenant) {
      const customDomain = req.hostname;
      tenant = await Tenant.findOne({ customDomain });
      if (tenant) {
        logger.debug(`Tenant identified by custom domain: ${tenant.name}`);
      }
    }

    // Method 4: Check if user is authenticated and has a tenantId
    if (!tenant && req.user?.tenantId) {
      tenant = await Tenant.findById(req.user.tenantId);
      if (tenant) {
        logger.debug(`Tenant identified from authenticated user: ${tenant.name}`);
      }
    }

    // If still no tenant found, this might be the default language exchange platform
    // We allow this for backward compatibility
    if (!tenant) {
      logger.debug("No tenant identified - using default platform");
    }

    // Attach tenant to request
    req.tenant = tenant;
    next();
  } catch (error) {
    logger.error("Error in tenant identification middleware:", error);
    next(error);
  }
}

/**
 * Middleware to require a tenant
 * Use this for routes that must belong to a tenant
 */
export function requireTenant(req, res, next) {
  if (!req.tenant) {
    return res.status(400).json({
      message: "Tenant identification required. Please access via your organization's domain.",
    });
  }

  // Check if tenant is active
  if (!req.tenant.isActive) {
    return res.status(403).json({
      message: "This organization's account is currently inactive.",
    });
  }

  // Check subscription status
  if (req.tenant.subscription.status === "suspended") {
    return res.status(403).json({
      message: "This organization's subscription is suspended. Please contact support.",
    });
  }

  next();
}

/**
 * Middleware to check if user is a tenant admin
 */
export function requireTenantAdmin(req, res, next) {
  if (!req.tenant) {
    return res.status(400).json({ message: "Tenant identification required." });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const isTenantAdmin =
    req.tenant.admins.includes(req.user._id) ||
    req.user.role === "admin" ||
    req.user.role === "super_admin";

  if (!isTenantAdmin) {
    return res.status(403).json({
      message: "You do not have administrator privileges for this organization.",
    });
  }

  next();
}

/**
 * Middleware to scope queries to current tenant
 * Automatically adds tenantId filter to queries
 */
export function scopeToTenant(req, res, next) {
  if (req.tenant) {
    // Add tenant filter to query object
    req.tenantFilter = { tenantId: req.tenant._id };
  } else {
    // For default platform (language exchange), only show users without tenant
    req.tenantFilter = { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] };
  }
  next();
}

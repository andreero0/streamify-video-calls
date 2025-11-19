import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import logger from "../lib/logger.js";

/**
 * Create a new tenant (organization)
 * POST /api/tenants
 */
export async function createTenant(req, res) {
  try {
    const {
      name,
      industry,
      subdomain,
      adminEmail,
      adminName,
      adminPassword,
      practiceType, // For healthcare
      departments, // For corporate
    } = req.body;

    // Validate required fields
    if (!name || !industry || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({
        message: "Name, industry, admin email, name, and password are required",
      });
    }

    // Check if subdomain is already taken
    if (subdomain) {
      const existingTenant = await Tenant.findOne({ subdomain });
      if (existingTenant) {
        return res.status(400).json({ message: "Subdomain already taken" });
      }
    }

    // Check if admin email is already registered
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Admin email already registered" });
    }

    // Create tenant with industry-specific config
    const tenantData = {
      name,
      industry,
      subdomain: subdomain || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      subscription: {
        plan: "free",
        status: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    };

    // Add industry-specific configuration
    if (industry === "healthcare") {
      tenantData.healthcareConfig = {
        practiceType: practiceType || "general",
        enableAppointmentScheduling: true,
        enableSessionNotes: true,
        requireConsent: true,
      };
      tenantData.features = {
        enabledModules: ["video", "chat", "appointments", "notes"],
        matchingCriteria: ["specialty", "availability"],
      };
    } else if (industry === "corporate_mentorship") {
      tenantData.corporateConfig = {
        departments: departments || [],
        enableDepartmentMatching: true,
        enableSkillMatching: true,
      };
      tenantData.features = {
        enabledModules: ["video", "chat", "matching", "analytics"],
        matchingCriteria: ["skills", "department", "experience"],
      };
    }

    const tenant = await Tenant.create(tenantData);

    // Create admin user
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const adminUser = await User.create({
      tenantId: tenant._id,
      fullName: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      profilePic: randomAvatar,
      role: "admin",
      isOnboarded: true,
      isEmailVerified: false,
    });

    // Add admin to tenant's admins list
    tenant.admins.push(adminUser._id);
    await tenant.save();

    logger.info(`New tenant created: ${tenant.name} (${tenant.industry})`);

    res.status(201).json({
      success: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        industry: tenant.industry,
        subdomain: tenant.subdomain,
        subscription: tenant.subscription,
      },
      admin: {
        id: adminUser._id,
        email: adminUser.email,
        fullName: adminUser.fullName,
      },
      message: "Organization created successfully! Please check email for verification.",
    });
  } catch (error) {
    logger.error("Error creating tenant:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get tenant configuration
 * GET /api/tenants/:id/config
 */
export async function getTenantConfig(req, res) {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.status(200).json({
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      industry: tenant.industry,
      branding: tenant.branding,
      features: tenant.features,
      settings: tenant.settings,
      corporateConfig: tenant.industry === "corporate_mentorship" ? tenant.corporateConfig : undefined,
      healthcareConfig: tenant.industry === "healthcare" ? tenant.healthcareConfig : undefined,
    });
  } catch (error) {
    logger.error("Error getting tenant config:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Update tenant configuration (admin only)
 * PUT /api/tenants/:id/config
 */
export async function updateTenantConfig(req, res) {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const { branding, features, corporateConfig, healthcareConfig, settings } = req.body;

    if (branding) {
      tenant.branding = { ...tenant.branding, ...branding };
    }

    if (features) {
      tenant.features = { ...tenant.features, ...features };
    }

    if (settings) {
      tenant.settings = { ...tenant.settings, ...settings };
    }

    if (corporateConfig && tenant.industry === "corporate_mentorship") {
      tenant.corporateConfig = { ...tenant.corporateConfig, ...corporateConfig };
    }

    if (healthcareConfig && tenant.industry === "healthcare") {
      tenant.healthcareConfig = { ...tenant.healthcareConfig, ...healthcareConfig };
    }

    await tenant.save();

    logger.info(`Tenant config updated: ${tenant.name}`);

    res.status(200).json({
      success: true,
      message: "Configuration updated successfully",
      tenant,
    });
  } catch (error) {
    logger.error("Error updating tenant config:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get tenant analytics (admin only)
 * GET /api/tenants/:id/analytics
 */
export async function getTenantAnalytics(req, res) {
  try {
    const tenantId = req.params.id;

    // Get user counts
    const totalUsers = await User.countDocuments({ tenantId });
    const activeUsers = await User.countDocuments({
      tenantId,
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const onboardedUsers = await User.countDocuments({ tenantId, isOnboarded: true });

    // Get role distribution
    const roleDistribution = await User.aggregate([
      { $match: { tenantId: mongoose.Types.ObjectId(tenantId) } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // Get connections/matches count
    const FriendRequest = (await import("../models/FriendRequest.js")).default;
    const totalConnections = await FriendRequest.countDocuments({
      tenantId,
      status: "accepted",
    });

    // Get appointments count (for healthcare)
    let appointmentStats = null;
    if (req.tenant.industry === "healthcare") {
      const Appointment = (await import("../models/Appointment.js")).default;
      const totalAppointments = await Appointment.countDocuments({ tenantId });
      const completedAppointments = await Appointment.countDocuments({
        tenantId,
        status: "completed",
      });
      const upcomingAppointments = await Appointment.countDocuments({
        tenantId,
        status: "scheduled",
        scheduledAt: { $gte: new Date() },
      });

      appointmentStats = {
        total: totalAppointments,
        completed: completedAppointments,
        upcoming: upcomingAppointments,
      };
    }

    res.status(200).json({
      users: {
        total: totalUsers,
        active: activeUsers,
        onboarded: onboardedUsers,
        roleDistribution,
      },
      connections: {
        total: totalConnections,
      },
      appointments: appointmentStats,
    });
  } catch (error) {
    logger.error("Error getting tenant analytics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get all tenants (super admin only)
 * GET /api/tenants
 */
export async function getAllTenants(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      Tenant.find()
        .select("-corporateConfig -healthcareConfig")
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 }),
      Tenant.countDocuments(),
    ]);

    res.status(200).json({
      tenants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTenants: total,
      },
    });
  } catch (error) {
    logger.error("Error getting all tenants:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get tenant users (admin only)
 * GET /api/tenants/:id/users
 */
export async function getTenantUsers(req, res) {
  try {
    const tenantId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const role = req.query.role;

    const query = { tenantId };
    if (role) {
      query.role = role;
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
      },
    });
  } catch (error) {
    logger.error("Error getting tenant users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTenantConfig, getTenantAnalytics, getTenantUsers } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import {
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Building2,
  Heart,
  Award,
  Activity,
  UserPlus,
  Mail,
} from "lucide-react";

const AdminDashboardPage = () => {
  const { authUser } = useAuthUser();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch tenant config
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["tenant-config", authUser?.tenantId],
    queryFn: () => getTenantConfig(authUser?.tenantId),
    enabled: !!authUser?.tenantId,
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["tenant-analytics", authUser?.tenantId],
    queryFn: () => getTenantAnalytics(authUser?.tenantId),
    enabled: !!authUser?.tenantId,
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["tenant-users", authUser?.tenantId],
    queryFn: () => getTenantUsers(authUser?.tenantId, { limit: 50 }),
    enabled: !!authUser?.tenantId && activeTab === "users",
  });

  const tenant = configData?.tenant;
  const analytics = analyticsData?.analytics;
  const users = usersData?.users || [];

  const isLoading = configLoading || analyticsLoading;

  const getIndustryIcon = (industry) => {
    const icons = {
      corporate_mentorship: Building2,
      healthcare: Heart,
      education: Award,
      fitness: Activity,
    };
    return icons[industry] || Building2;
  };

  const IndustryIcon = tenant ? getIndustryIcon(tenant.industry) : Building2;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-base-content/70">
            Manage your organization and view insights
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {!isLoading && tenant && (
          <>
            {/* Organization Card */}
            <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl mb-6">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-base-100/20 rounded-lg">
                      <IndustryIcon className="size-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{tenant.name}</h2>
                      <p className="opacity-90">
                        {tenant.subdomain}.streamify.com
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="badge badge-lg bg-base-100/20 border-0">
                      {tenant.subscription?.plan || "Free"} Plan
                    </div>
                    <p className="text-sm opacity-90 mt-2 capitalize">
                      {tenant.industry?.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed mb-6 bg-base-100 shadow-lg p-2">
              <button
                className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <TrendingUp className="size-4 mr-2" />
                Overview
              </button>
              <button
                className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                <Users className="size-4 mr-2" />
                Users
              </button>
              <button
                className={`tab ${activeTab === "settings" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="size-4 mr-2" />
                Settings
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={Users}
                    label="Total Users"
                    value={analytics?.totalUsers || 0}
                    color="primary"
                  />
                  <StatCard
                    icon={Activity}
                    label="Active Users"
                    value={analytics?.activeUsers || 0}
                    color="success"
                  />
                  {tenant.industry === "healthcare" && (
                    <>
                      <StatCard
                        icon={Calendar}
                        label="Appointments"
                        value={analytics?.totalAppointments || 0}
                        color="info"
                      />
                      <StatCard
                        icon={Heart}
                        label="Providers"
                        value={
                          users.filter((u) => u.role === "provider").length || 0
                        }
                        color="error"
                      />
                    </>
                  )}
                  {tenant.industry === "corporate_mentorship" && (
                    <>
                      <StatCard
                        icon={Award}
                        label="Mentors"
                        value={
                          users.filter((u) =>
                            u.corporateProfile?.mentorshipPreference?.includes(
                              "mentor"
                            )
                          ).length || 0
                        }
                        color="warning"
                      />
                      <StatCard
                        icon={UserPlus}
                        label="Mentees"
                        value={
                          users.filter((u) =>
                            u.corporateProfile?.mentorshipPreference?.includes(
                              "mentee"
                            )
                          ).length || 0
                        }
                        color="info"
                      />
                    </>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button className="btn btn-outline btn-primary justify-start">
                        <UserPlus className="size-4" />
                        Invite Users
                      </button>
                      <button className="btn btn-outline btn-secondary justify-start">
                        <Mail className="size-4" />
                        Send Announcement
                      </button>
                      <button className="btn btn-outline btn-accent justify-start">
                        <Settings className="size-4" />
                        Configure Settings
                      </button>
                    </div>
                  </div>
                </div>

                {/* Industry-Specific Config */}
                {tenant.industry === "healthcare" && tenant.healthcareConfig && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h3 className="card-title mb-4">Healthcare Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-base-content/60 mb-1">
                            Practice Type
                          </p>
                          <p className="font-medium capitalize">
                            {tenant.healthcareConfig.practiceType?.replace(
                              "_",
                              " "
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-base-content/60 mb-1">
                            Default Appointment Duration
                          </p>
                          <p className="font-medium">
                            {tenant.healthcareConfig.appointmentDuration || 30}{" "}
                            minutes
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-base-content/60 mb-1">
                            Appointment Scheduling
                          </p>
                          <p className="font-medium">
                            {tenant.healthcareConfig.enableAppointmentScheduling
                              ? "Enabled"
                              : "Disabled"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-base-content/60 mb-1">
                            HIPAA Compliance
                          </p>
                          <p className="font-medium">
                            {tenant.healthcareConfig.hipaaCompliant
                              ? "Enabled"
                              : "Disabled"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tenant.industry === "corporate_mentorship" &&
                  tenant.corporateConfig && (
                    <div className="card bg-base-100 shadow-xl">
                      <div className="card-body">
                        <h3 className="card-title mb-4">
                          Corporate Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-base-content/60 mb-2">
                              Departments
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {tenant.corporateConfig.departments?.map((dept) => (
                                <span key={dept} className="badge badge-primary">
                                  {dept}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-base-content/60 mb-2">
                              Skills
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {tenant.corporateConfig.skills?.map((skill) => (
                                <span key={skill} className="badge badge-secondary">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="card-title">Users ({users.length})</h3>
                      <button className="btn btn-primary btn-sm">
                        <UserPlus className="size-4" />
                        Invite User
                      </button>
                    </div>

                    {usersLoading ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Role</th>
                              <th>Email</th>
                              <th>Status</th>
                              <th>Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user._id}>
                                <td>
                                  <div className="flex items-center gap-3">
                                    <div className="avatar">
                                      <div className="w-10 h-10 rounded-full">
                                        <img
                                          src={user.profilePic || "/avatar.png"}
                                          alt={user.fullName}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-bold">
                                        {user.fullName}
                                      </div>
                                      {user.corporateProfile?.department && (
                                        <div className="text-sm opacity-50">
                                          {user.corporateProfile.department}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge badge-ghost capitalize">
                                    {user.role}
                                  </span>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      user.isOnboarded
                                        ? "badge-success"
                                        : "badge-warning"
                                    }`}
                                  >
                                    {user.isOnboarded ? "Active" : "Pending"}
                                  </span>
                                </td>
                                <td>
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title mb-4">Organization Settings</h3>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Organization Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={tenant.name}
                        disabled
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Subdomain</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={`${tenant.subdomain}.streamify.com`}
                        disabled
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Industry</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered capitalize"
                        value={tenant.industry?.replace("_", " ")}
                        disabled
                      />
                    </div>
                    <p className="text-sm text-base-content/60 mt-4">
                      Contact support to change these settings
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-content/60 mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={`p-3 bg-${color}/10 rounded-lg`}>
            <Icon className={`size-8 text-${color}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

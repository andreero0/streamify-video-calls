import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getTenantConfig } from "../lib/api";
import { CheckCircle2, Users, Settings, Calendar, MessageSquare, ArrowRight } from "lucide-react";

const TenantWelcomePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tenantId = searchParams.get("id");

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenantConfig(tenantId),
    enabled: !!tenantId,
  });

  const getNextSteps = () => {
    const industry = tenant?.industry;

    if (industry === "corporate_mentorship") {
      return [
        {
          icon: Users,
          title: "Invite Your Team",
          description: `Share ${tenant.subdomain}.streamify.com with your employees`,
          action: "Copy Link",
          link: `https://${tenant.subdomain}.streamify.com`,
        },
        {
          icon: Settings,
          title: "Configure Departments",
          description: "Set up your company structure and skill categories",
          action: "Go to Settings",
          link: "/admin/settings",
        },
        {
          icon: MessageSquare,
          title: "Start Matching",
          description: "Connect mentors with mentees based on skills and experience",
          action: "View Dashboard",
          link: "/admin",
        },
      ];
    }

    if (industry === "healthcare") {
      return [
        {
          icon: Users,
          title: "Add Providers",
          description: "Invite doctors, nurses, and medical staff to join",
          action: "Copy Link",
          link: `https://${tenant.subdomain}.streamify.com`,
        },
        {
          icon: Calendar,
          title: "Set Availability",
          description: "Configure provider schedules and appointment slots",
          action: "Manage Schedule",
          link: "/settings",
        },
        {
          icon: MessageSquare,
          title: "Accept Patients",
          description: "Start accepting patient appointments and consultations",
          action: "View Appointments",
          link: "/appointments",
        },
      ];
    }

    // Default for other industries
    return [
      {
        icon: Users,
        title: "Invite Your Team",
        description: `Share ${tenant?.subdomain}.streamify.com with your team`,
        action: "Copy Link",
        link: `https://${tenant?.subdomain}.streamify.com`,
      },
      {
        icon: Settings,
        title: "Customize Settings",
        description: "Configure your organization preferences",
        action: "Go to Settings",
        link: "/admin/settings",
      },
      {
        icon: MessageSquare,
        title: "Start Connecting",
        description: "Begin matching users and facilitating connections",
        action: "View Dashboard",
        link: "/admin",
      },
    ];
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Organization Not Found</h2>
          <Link to="/create-organization" className="btn btn-primary">
            Create Organization
          </Link>
        </div>
      </div>
    );
  }

  const nextSteps = getNextSteps();
  const industryLabels = {
    corporate_mentorship: "Corporate Mentorship",
    healthcare: "Healthcare Practice",
    education: "Education & Tutoring",
    fitness: "Fitness & Wellness",
    language_exchange: "Language Exchange",
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto p-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Streamify!</h1>
          <p className="text-xl text-base-content/70">
            Your organization <strong>{tenant.name}</strong> is ready
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="badge badge-lg">{industryLabels[tenant.industry]}</span>
            <span className="badge badge-lg badge-success">30-Day Trial</span>
          </div>
        </div>

        {/* Organization Details Card */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">Your Organization Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Organization Name</span>
                </label>
                <div className="text-lg">{tenant.name}</div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-medium">Subdomain</span>
                </label>
                <div className="text-lg flex items-center gap-2">
                  <code className="bg-base-200 px-3 py-1 rounded">
                    {tenant.subdomain}.streamify.com
                  </code>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => handleCopyLink(`https://${tenant.subdomain}.streamify.com`)}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-medium">Industry</span>
                </label>
                <div className="text-lg">{industryLabels[tenant.industry]}</div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-medium">Subscription</span>
                </label>
                <div className="text-lg">
                  {tenant.subscription?.plan?.charAt(0).toUpperCase() + tenant.subscription?.plan?.slice(1)} Plan
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-base-content/70 mb-4">{step.description}</p>
                    {step.link.startsWith("http") ? (
                      <button
                        className="btn btn-sm btn-outline w-full"
                        onClick={() => handleCopyLink(step.link)}
                      >
                        {step.action}
                      </button>
                    ) : (
                      <Link to={step.link} className="btn btn-sm btn-outline w-full">
                        {step.action}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Quick Start Guide</h2>
            <ol className="list-decimal list-inside space-y-2 mt-4">
              <li>Check your email for verification link</li>
              <li>Invite team members to join your organization</li>
              {tenant.industry === "healthcare" && (
                <>
                  <li>Add providers and set their availability</li>
                  <li>Start accepting patient appointments</li>
                </>
              )}
              {tenant.industry === "corporate_mentorship" && (
                <>
                  <li>Configure departments and skills</li>
                  <li>Encourage employees to set up mentor/mentee profiles</li>
                  <li>Review and facilitate mentorship connections</li>
                </>
              )}
              <li>Explore the admin dashboard for insights and settings</li>
            </ol>
            <div className="card-actions justify-end mt-6">
              <Link to="/" className="btn btn-primary-content">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center mt-8">
          <p className="text-base-content/60">
            Need help getting started?{" "}
            <a href="#" className="link link-primary">
              View Documentation
            </a>{" "}
            or{" "}
            <a href="#" className="link link-primary">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantWelcomePage;

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { createTenant } from "../lib/api";
import toast from "react-hot-toast";
import { Building2, Users, Heart, GraduationCap, Dumbbell, CheckCircle2 } from "lucide-react";

const TenantSignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Industry, 2: Details
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    subdomain: "",
    adminEmail: "",
    adminName: "",
    adminPassword: "",
    confirmPassword: "",
    // Industry-specific
    practiceType: "",
    departments: [],
  });

  const industries = [
    {
      value: "corporate_mentorship",
      label: "Corporate Mentorship",
      icon: Building2,
      description: "Connect employees with mentors for professional development",
      color: "primary",
    },
    {
      value: "healthcare",
      label: "Healthcare Practice",
      icon: Heart,
      description: "Telehealth platform for doctors, nurses, and patients",
      color: "error",
    },
    {
      value: "education",
      label: "Education & Tutoring",
      icon: GraduationCap,
      description: "Connect students with tutors and educators",
      color: "info",
    },
    {
      value: "fitness",
      label: "Fitness & Wellness",
      icon: Dumbbell,
      description: "Virtual personal training and wellness coaching",
      color: "success",
    },
  ];

  const practiceTypes = [
    { value: "pediatrics", label: "Pediatrics" },
    { value: "family_medicine", label: "Family Medicine" },
    { value: "obgyn", label: "OB/GYN" },
    { value: "general", label: "General Practice" },
    { value: "specialty", label: "Specialty Practice" },
  ];

  const { mutate: createOrganization, isPending } = useMutation({
    mutationFn: createTenant,
    onSuccess: (data) => {
      toast.success("Organization created successfully!");
      navigate(`/tenant-welcome?id=${data.tenant.id}`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to create organization";
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 12) {
      toast.error("Password must be at least 12 characters");
      return;
    }

    const payload = {
      name: formData.name,
      industry: formData.industry,
      subdomain: formData.subdomain,
      adminEmail: formData.adminEmail,
      adminName: formData.adminName,
      adminPassword: formData.password,
    };

    if (formData.industry === "healthcare" && formData.practiceType) {
      payload.practiceType = formData.practiceType;
    }

    if (formData.industry === "corporate_mentorship" && formData.departments.length > 0) {
      payload.departments = formData.departments;
    }

    createOrganization(payload);
  };

  const generateSubdomain = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      subdomain: formData.subdomain || generateSubdomain(name),
    });
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto p-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Your Organization</h1>
          <p className="text-base-content/70">
            Set up your workspace in minutes and start connecting your team
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-base-content/40"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-primary-content" : "bg-base-300"}`}>
                {step > 1 ? <CheckCircle2 className="size-5" /> : "1"}
              </div>
              <span className="hidden sm:inline">Choose Industry</span>
            </div>
            <div className="w-12 h-0.5 bg-base-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-base-content/40"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-primary-content" : "bg-base-300"}`}>
                2
              </div>
              <span className="hidden sm:inline">Organization Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Choose Industry */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">What type of organization are you?</h2>
              <p className="text-base-content/60">Choose the industry that best fits your needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {industries.map((industry) => {
                const Icon = industry.icon;
                const isSelected = formData.industry === industry.value;

                return (
                  <button
                    key={industry.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, industry: industry.value })}
                    className={`card bg-base-100 hover:shadow-xl transition-all cursor-pointer border-2 ${
                      isSelected ? `border-${industry.color}` : "border-transparent"
                    }`}
                  >
                    <div className="card-body">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-${industry.color}/10`}>
                          <Icon className={`size-6 text-${industry.color}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="card-title text-lg">{industry.label}</h3>
                          <p className="text-sm text-base-content/70">{industry.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className={`size-6 text-${industry.color}`} />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center mt-8">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStep(2)}
                disabled={!formData.industry}
              >
                Continue
              </button>
            </div>

            <div className="text-center mt-6">
              <Link to="/login" className="link link-primary">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Organization Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-2xl">Organization Details</h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
              </div>

              {/* Organization Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Organization Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              {/* Subdomain */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Subdomain *</span>
                </label>
                <label className="input-group">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    placeholder="acme"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    pattern="[a-z0-9-]+"
                    required
                  />
                  <span>.streamify.com</span>
                </label>
                <label className="label">
                  <span className="label-text-alt">Your organization's unique URL</span>
                </label>
              </div>

              {/* Healthcare-specific: Practice Type */}
              {formData.industry === "healthcare" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Practice Type *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.practiceType}
                    onChange={(e) => setFormData({ ...formData, practiceType: e.target.value })}
                    required
                  >
                    <option value="">Select practice type</option>
                    {practiceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Corporate-specific: Departments */}
              {formData.industry === "corporate_mentorship" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Departments (Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., Engineering, Sales, Marketing (comma-separated)"
                    value={formData.departments.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departments: e.target.value.split(",").map((d) => d.trim()).filter(Boolean),
                      })
                    }
                  />
                  <label className="label">
                    <span className="label-text-alt">You can add more later</span>
                  </label>
                </div>
              )}

              <div className="divider">Administrator Account</div>

              {/* Admin Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Your Full Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="John Doe"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  required
                />
              </div>

              {/* Admin Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Your Email *</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  placeholder="admin@example.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  required
                />
              </div>

              {/* Admin Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password *</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Minimum 12 characters</span>
                </label>
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Confirm Password *</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              {/* Submit */}
              <div className="card-actions justify-end mt-6">
                <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
                  {isPending ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Creating Organization...
                    </>
                  ) : (
                    "Create Organization"
                  )}
                </button>
              </div>

              <p className="text-sm text-center text-base-content/60">
                By creating an organization, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TenantSignupPage;

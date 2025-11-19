import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "../lib/api";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import { Briefcase, Heart, GraduationCap, Languages, MapPin, User } from "lucide-react";
import { LANGUAGES } from "../constants";

const IndustryOnboardingPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  // Determine industry from authUser.tenantId (you'd fetch tenant config in real app)
  // For now, we'll default to language_exchange if no tenant
  const industry = authUser?.tenantId ? "corporate_mentorship" : "language_exchange"; // Placeholder

  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: "",
    location: "",
    profilePic: authUser?.profilePic || "",

    // Language Exchange
    nativeLanguage: "",
    learningLanguage: "",

    // Corporate Mentorship
    department: "",
    jobTitle: "",
    yearsExperience: "",
    skills: [],
    skillsToLearn: [],
    availableAsMentor: false,
    seekingMentorship: false,

    // Healthcare
    providerType: "",
    specialty: "",
    licenseNumber: "",
    npiNumber: "",
    acceptsNewPatients: true,
    dateOfBirth: "",
    insuranceProvider: "",
    policyNumber: "",
  });

  const { mutate: onboard, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Onboarding completed!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Onboarding failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build payload based on industry
    const payload = {
      fullName: formData.fullName,
      bio: formData.bio,
      location: formData.location,
      profilePic: formData.profilePic,
    };

    if (industry === "language_exchange") {
      payload.nativeLanguage = formData.nativeLanguage;
      payload.learningLanguage = formData.learningLanguage;
    } else if (industry === "corporate_mentorship") {
      payload.corporateProfile = {
        department: formData.department,
        jobTitle: formData.jobTitle,
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        skills: formData.skills,
        skillsToLearn: formData.skillsToLearn,
        availableAsMentor: formData.availableAsMentor,
        seekingMentorship: formData.seekingMentorship,
      };
    } else if (industry === "healthcare") {
      // Determine role based on providerType
      if (formData.providerType) {
        payload.role = "provider";
        payload.healthcareProfile = {
          providerType: formData.providerType,
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          npiNumber: formData.npiNumber,
          acceptsNewPatients: formData.acceptsNewPatients,
        };
      } else {
        payload.role = "patient";
        payload.healthcareProfile = {
          dateOfBirth: formData.dateOfBirth,
          insuranceInfo: {
            provider: formData.insuranceProvider,
            policyNumber: formData.policyNumber,
          },
        };
      }
    }

    onboard(payload);
  };

  const handleAvatarChange = () => {
    const randomIdx = Math.floor(Math.random() * 100) + 1;
    const newAvatar = `https://avatar.iran.liara.run/public/${randomIdx}.png`;
    setFormData({ ...formData, profilePic: newAvatar });
  };

  const renderIndustryFields = () => {
    if (industry === "language_exchange") {
      return (
        <>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Languages className="size-4" />
                Native Language *
              </span>
            </label>
            <select
              className="select select-bordered"
              value={formData.nativeLanguage}
              onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
              required
            >
              <option value="">Select your native language</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Languages className="size-4" />
                Learning Language *
              </span>
            </label>
            <select
              className="select select-bordered"
              value={formData.learningLanguage}
              onChange={(e) => setFormData({ ...formData, learningLanguage: e.target.value })}
              required
            >
              <option value="">Select language you want to learn</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </>
      );
    }

    if (industry === "corporate_mentorship") {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Department *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g., Engineering"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Job Title *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g., Senior Developer"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Years of Experience</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              placeholder="5"
              min="0"
              max="50"
              value={formData.yearsExperience}
              onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Your Skills</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="e.g., React, Python, Leadership (comma-separated)"
              value={formData.skills.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Skills You Want to Learn</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="e.g., Machine Learning, Public Speaking"
              value={formData.skillsToLearn.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  skillsToLearn: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <div className="divider">Mentorship Preferences</div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={formData.availableAsMentor}
                onChange={(e) => setFormData({ ...formData, availableAsMentor: e.target.checked })}
              />
              <div>
                <span className="label-text font-medium">I'm available as a mentor</span>
                <p className="text-sm text-base-content/60">
                  Help others by sharing your knowledge and experience
                </p>
              </div>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={formData.seekingMentorship}
                onChange={(e) => setFormData({ ...formData, seekingMentorship: e.target.checked })}
              />
              <div>
                <span className="label-text font-medium">I'm seeking mentorship</span>
                <p className="text-sm text-base-content/60">
                  Find mentors to help you grow professionally
                </p>
              </div>
            </label>
          </div>
        </>
      );
    }

    if (industry === "healthcare") {
      return (
        <>
          <div className="alert alert-info mb-6">
            <Heart className="size-5" />
            <div>
              <h3 className="font-bold">Are you a healthcare provider or patient?</h3>
              <p className="text-sm">Select your role to customize your profile</p>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">I am a...</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer flex-1 border rounded-lg p-4">
                <input
                  type="radio"
                  name="role"
                  className="radio radio-primary"
                  checked={formData.providerType !== ""}
                  onChange={() => setFormData({ ...formData, providerType: "doctor" })}
                />
                <span className="label-text font-medium">Healthcare Provider</span>
              </label>
              <label className="label cursor-pointer flex-1 border rounded-lg p-4">
                <input
                  type="radio"
                  name="role"
                  className="radio radio-primary"
                  checked={formData.providerType === "" && formData.dateOfBirth !== ""}
                  onChange={() => setFormData({ ...formData, providerType: "", dateOfBirth: new Date().toISOString().split('T')[0] })}
                />
                <span className="label-text font-medium">Patient</span>
              </label>
            </div>
          </div>

          {/* Provider Fields */}
          {formData.providerType !== "" && (
            <>
              <div className="divider">Provider Information</div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Provider Type *</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.providerType}
                  onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
                  required
                >
                  <option value="">Select provider type</option>
                  <option value="doctor">Doctor/Physician</option>
                  <option value="nurse">Nurse</option>
                  <option value="therapist">Therapist</option>
                  <option value="physician_assistant">Physician Assistant</option>
                  <option value="nurse_practitioner">Nurse Practitioner</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Specialty *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., Pediatrics, Cardiology"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">License Number *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="MD-12345"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">NPI Number (Optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="1234567890"
                  value={formData.npiNumber}
                  onChange={(e) => setFormData({ ...formData, npiNumber: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={formData.acceptsNewPatients}
                    onChange={(e) => setFormData({ ...formData, acceptsNewPatients: e.target.checked })}
                  />
                  <span className="label-text font-medium">Accepting new patients</span>
                </label>
              </div>
            </>
          )}

          {/* Patient Fields */}
          {formData.providerType === "" && formData.dateOfBirth !== "" && (
            <>
              <div className="divider">Patient Information</div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Date of Birth *</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>

              <div className="divider">Insurance Information (Optional)</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Insurance Provider</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., Blue Cross"
                    value={formData.insuranceProvider}
                    onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Policy Number</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="POLICY-123456"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </>
      );
    }

    return null;
  };

  const getPageTitle = () => {
    const titles = {
      language_exchange: "Complete Your Language Profile",
      corporate_mentorship: "Complete Your Professional Profile",
      healthcare: "Complete Your Healthcare Profile",
      education: "Complete Your Education Profile",
      fitness: "Complete Your Fitness Profile",
    };
    return titles[industry] || "Complete Your Profile";
  };

  const getPageIcon = () => {
    const icons = {
      language_exchange: Languages,
      corporate_mentorship: Briefcase,
      healthcare: Heart,
      education: GraduationCap,
      fitness: null,
    };
    return icons[industry] || User;
  };

  const PageIcon = getPageIcon();

  return (
    <div className="min-h-screen bg-base-200 py-12">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          {PageIcon && (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <PageIcon className="w-8 h-8 text-primary" />
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{getPageTitle()}</h1>
          <p className="text-base-content/60">
            Help us personalize your experience by completing your profile
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
          <div className="card-body space-y-6">
            {/* Avatar */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Profile Picture</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={formData.profilePic} alt="avatar" />
                  </div>
                </div>
                <button type="button" className="btn btn-outline" onClick={handleAvatarChange}>
                  Generate Random Avatar
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            {/* Bio */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Bio *</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={500}
                required
              />
              <label className="label">
                <span className="label-text-alt">{formData.bio.length}/500</span>
              </label>
            </div>

            {/* Location */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <MapPin className="size-4" />
                  Location *
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g., San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="divider"></div>

            {/* Industry-Specific Fields */}
            {renderIndustryFields()}

            {/* Submit */}
            <div className="card-actions justify-end mt-6">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Completing Setup...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IndustryOnboardingPage;

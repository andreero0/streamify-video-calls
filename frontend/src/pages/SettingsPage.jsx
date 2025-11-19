import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, deleteAccount, resendVerificationEmail } from "../lib/api";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import { useNavigate } from "react-router";
import { User, Mail, MapPin, Languages, Trash2, Shield } from "lucide-react";
import { LANGUAGES } from "../constants";
import Layout from "../components/Layout";

const SettingsPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    profilePic: authUser?.profilePic || "",
  });

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { mutate: updateProfileMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const { mutate: deleteAccountMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      queryClient.clear();
      navigate("/login");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete account");
    },
  });

  const { mutate: resendVerification, isPending: isResending } = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success("Verification email sent! Check your inbox.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send verification email");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation(formData);
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }
    deleteAccountMutation(deletePassword);
  };

  const handleAvatarChange = () => {
    const randomIdx = Math.floor(Math.random() * 100) + 1;
    const newAvatar = `https://avatar.iran.liara.run/public/${randomIdx}.png`;
    setFormData({ ...formData, profilePic: newAvatar });
  };

  return (
    <Layout showSidebar={true}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-base-content/60 mt-1">Manage your account and preferences</p>
        </div>

        {/* Email Verification Alert */}
        {!authUser?.isEmailVerified && (
          <div className="alert alert-warning">
            <Mail className="size-5" />
            <div className="flex-1">
              <h3 className="font-semibold">Email not verified</h3>
              <p className="text-sm">Please verify your email to access all features</p>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => resendVerification()}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Email"}
            </button>
          </div>
        )}

        {/* Profile Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <User className="size-5" />
              Profile Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Avatar */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Profile Picture</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="avatar">
                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img src={formData.profilePic || authUser?.profilePic} alt="avatar" />
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
                  <span className="label-text font-medium">Full Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              {/* Bio */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Bio</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  maxLength={500}
                />
                <label className="label">
                  <span className="label-text-alt"></span>
                  <span className="label-text-alt">
                    {formData.bio.length}/500
                  </span>
                </label>
              </div>

              {/* Location */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <MapPin className="size-4" />
                    Location
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Languages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <Languages className="size-4" />
                      Native Language
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.nativeLanguage}
                    onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                  >
                    <option value="">Select language</option>
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
                      Learning Language
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.learningLanguage}
                    onChange={(e) =>
                      setFormData({ ...formData, learningLanguage: e.target.value })
                    }
                  >
                    <option value="">Select language</option>
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.name}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card bg-base-100 shadow-xl border border-error/20">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2 text-error">
              <Shield className="size-5" />
              Danger Zone
            </h2>

            <div className="divider"></div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Delete Account</h3>
                <p className="text-sm text-base-content/60">
                  Permanently delete your account and all your data
                </p>
              </div>
              <button
                className="btn btn-error btn-outline"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="size-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-error">Delete Account</h3>
              <p className="py-4">
                This action cannot be undone. All your data, including friends, messages, and
                profile information will be permanently deleted.
              </p>

              <form onSubmit={handleDeleteAccount}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Enter your password to confirm</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    placeholder="Your password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>

                <div className="modal-action">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-error"
                    disabled={isDeleting || !deletePassword}
                  >
                    {isDeleting ? "Deleting..." : "Delete My Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage;

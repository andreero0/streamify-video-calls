import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../lib/api";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: resetPasswordMutation, isPending } = useMutation({
    mutationFn: ({ token, password }) => resetPassword(token, password),
    onSuccess: () => {
      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to reset password";
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error(message);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 12) {
      toast.error("Password must be at least 12 characters long");
      return;
    }

    resetPasswordMutation({ token, password: formData.password });
  };

  const passwordRequirements = [
    { text: "At least 12 characters", met: formData.password.length >= 12 },
    { text: "One uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "One lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "One number", met: /[0-9]/.test(formData.password) },
    { text: "One special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl text-error">Invalid Reset Link</h2>
            <p className="text-base-content/70 mb-4">
              This password reset link is invalid or has expired.
            </p>
            <div className="card-actions">
              <Link to="/forgot-password" className="btn btn-primary">
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Lock className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Set New Password</h1>
              <p className="text-base-content/60">
                Choose a strong password for your account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pr-12"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="input input-bordered w-full pr-12"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-base-200 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium mb-2">Password must contain:</p>
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={`size-4 ${req.met ? "text-success" : "text-base-content/30"}`}
                    />
                    <span className={req.met ? "text-success" : "text-base-content/60"}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isPending || !formData.password || !formData.confirmPassword}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="link link-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Image/Info */}
      <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
        <div className="max-w-md text-center">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-primary/10"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animation: "pulse 2s infinite",
                }}
              />
            ))}
          </div>
          <h2 className="text-3xl font-bold mb-4">Create a Strong Password</h2>
          <p className="text-base-content/60">
            Make sure your new password is strong and unique. We recommend using a mix of letters, numbers, and special characters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

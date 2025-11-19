import { useState } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "../lib/api";
import toast from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate: requestReset, isPending } = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Password reset link sent! Check your email.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    requestReset(email);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <Mail className="w-16 h-16 text-success mb-4" />
            <h2 className="card-title text-2xl mb-2">Check Your Email</h2>
            <p className="text-base-content/70 mb-6">
              If an account exists with <strong>{email}</strong>, you will receive a password reset
              link shortly.
            </p>
            <p className="text-sm text-base-content/60 mb-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="card-actions flex-col w-full gap-2">
              <button
                className="btn btn-outline btn-block"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
              >
                Try Another Email
              </button>
              <Link to="/login" className="btn btn-primary btn-block">
                Back to Login
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
                <Mail className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Reset Password</h1>
              <p className="text-base-content/60">
                Enter your email address and we'll send you a reset link
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="link link-primary inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
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
          <h2 className="text-3xl font-bold mb-4">Forgot Your Password?</h2>
          <p className="text-base-content/60">
            No worries! It happens to the best of us. Enter your email and we'll send you a link to
            reset your password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

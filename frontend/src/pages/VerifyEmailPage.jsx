import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "../lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying"); // verifying, success, error

  const { mutate: verify } = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => navigate("/"), 3000);
    },
    onError: (error) => {
      setStatus("error");
    },
  });

  useEffect(() => {
    if (token) {
      verify(token);
    } else {
      setStatus("error");
    }
  }, [token, verify]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <h2 className="card-title text-2xl mb-2">Verifying Your Email</h2>
              <p className="text-base-content/70">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-success mb-4" />
              <h2 className="card-title text-2xl mb-2">Email Verified!</h2>
              <p className="text-base-content/70 mb-4">
                Your email has been successfully verified. You can now access all features of
                Streamify.
              </p>
              <p className="text-sm text-base-content/60 mb-6">
                Redirecting to home page in 3 seconds...
              </p>
              <div className="card-actions">
                <Link to="/" className="btn btn-primary">
                  Go to Home
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-error mb-4" />
              <h2 className="card-title text-2xl mb-2">Verification Failed</h2>
              <p className="text-base-content/70 mb-6">
                This verification link is invalid or has expired. Please request a new verification
                email.
              </p>
              <div className="card-actions flex-col w-full gap-2">
                <Link to="/" className="btn btn-primary btn-block">
                  Go to Home
                </Link>
                <Link to="/login" className="btn btn-outline btn-block">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

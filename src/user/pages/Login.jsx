// src/user/pages/Login.jsx
import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import {
  ensureCanonicalAccount,
  ensureDesignatedAdmin,
} from "../utils/ensureUserAccount";
import {
  PROTECTED_ADMIN_EMAIL,
  isDesignatedAdmin,
  routePath,
} from "../../admin/adminHelpers";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const navigate = useNavigate();

  // Handle deleted account cleanup
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("deleted") === "true") {
      localStorage.clear();
      sessionStorage.clear();
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          if (isDesignatedAdmin(user)) {
            try {
              await ensureDesignatedAdmin(user);
            } catch (createErr) {
              console.error("Error restoring admin account:", createErr);
            }
            navigate("/admin", { replace: true });
            return;
          }

          try {
            const account = await ensureCanonicalAccount(user);
            navigate(routePath(account.data), { replace: true });
          } catch (createErr) {
            console.error("Error creating user account:", createErr);
            navigate("/pending", { replace: true });
          }
        } catch (err) {
          console.error("Auth check error:", err);
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const saveUserToFirestore = async (user) => {
    try {
      if (isDesignatedAdmin(user)) {
        await ensureDesignatedAdmin(user);
        return {
          success: true,
          status: "approved",
          accountStatus: "approved",
          accountType: "admin",
          role: "admin",
          email: user.email || PROTECTED_ADMIN_EMAIL,
        };
      }

      const account = await ensureCanonicalAccount(user);
      const data = account.data || {};
      return {
        success: true,
        status: data.accountStatus || "pending",
        accountStatus: data.accountStatus || "pending",
        accountType: data.accountType || "user",
        role: data.role,
        email: data.email || user.email,
      };
    } catch (error) {
      console.error("Error checking user:", error);
      return { success: false, error: error.message };
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreeToTerms) {
      setError(
        "Please agree to the Terms of Service and Privacy Policy to continue.",
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("User signed in:", user.email);

      const saveResult = await saveUserToFirestore(user);

      if (!saveResult.success) {
        if (isDesignatedAdmin(user)) {
          navigate("/admin", { replace: true });
          setLoading(false);
          return;
        }
        await signOut(auth);
        setError(
          saveResult.error || "Failed to create account. Please try again.",
        );
        setLoading(false);
        return;
      }

      navigate(routePath(saveResult), { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        setLoading(false);
        return;
      }
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full mx-auto"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 sm:p-8">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold tracking-wide text-gray-900">
              DIGICARD
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-2">
              Welcome back
            </h1>
            <p className="text-gray-500 text-sm sm:text-base mt-2">
              Sign in to access your digital business card
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl mb-6 text-sm bg-red-50 border border-red-200 text-red-600 text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-2xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Continue with Google"
            )}
          </button>

          {/* Terms Checkbox */}
          <div className="mt-6">
            <button
              onClick={() => setAgreeToTerms(!agreeToTerms)}
              className="flex items-start gap-3 w-full text-left group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    agreeToTerms
                      ? "bg-gray-900 border-gray-900"
                      : "border-gray-300 group-hover:border-gray-400"
                  }`}
                >
                  {agreeToTerms && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                I agree to the{" "}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTerms(true);
                  }}
                  className="text-gray-900 font-medium underline underline-offset-2 cursor-pointer hover:text-gray-700 transition"
                >
                  Terms of Service
                </span>{" "}
                and{" "}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPrivacy(true);
                  }}
                  className="text-gray-900 font-medium underline underline-offset-2 cursor-pointer hover:text-gray-700 transition"
                >
                  Privacy Policy
                </span>
              </span>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 DIGICARD. All rights reserved.
          </p>
        </div>
      </motion.div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Terms of Service
              </h2>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 space-y-4">
              <p className="text-xs text-gray-400">Last updated: March 2026</p>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  1. Eligibility
                </h3>
                <p>
                  DIGICARD is a digital business card. New accounts stay pending
                  until they are approved.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  2. Use of Service
                </h3>
                <p>
                  You agree to use DIGICARD in accordance with all applicable laws.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  3. Account Approval
                </h3>
                <p>
                  New accounts remain pending until they are approved. An account
                  may be approved or rejected.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowTerms(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAgreeToTerms(true);
                  setShowTerms(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition"
              >
                Agree & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 space-y-4">
              <p className="text-xs text-gray-400">Last updated: March 2026</p>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Information We Collect
                </h3>
                <p>
                  When you sign in with Google, we collect your profile picture
                  and username to personalize your DIGICARD experience.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  How We Use Your Information
                </h3>
                <p>
                  Your profile picture and username are used solely to display
                  your identity within the DIGICARD platform.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Data Security
                </h3>
                <p>
                  We take reasonable measures to protect your information using
                  industry-standard practices.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowPrivacy(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAgreeToTerms(true);
                  setShowPrivacy(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition"
              >
                Agree & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Login;

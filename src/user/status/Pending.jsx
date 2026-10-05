// src/user/pages/Pending.jsx - with real-time status listener and sign out
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { isDesignatedAdmin } from "../../admin/adminHelpers";
import { subscribeCanonicalAccount } from "../utils/ensureUserAccount";
import { redeemActivationKey } from "../../shared/activationKeys";
import { formatActivationKey } from "../../shared/activationKeyFormat";

function Pending() {
  const [isChecking, setIsChecking] = useState(true);
  const [activationKey, setActivationKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (isDesignatedAdmin(currentUser)) {
      navigate("/admin", { replace: true });
      return;
    }

    return subscribeCanonicalAccount(
      currentUser,
      (doc) => {
        if (doc.exists()) {
          if (isDesignatedAdmin({ id: doc.id, ...doc.data() })) {
            navigate("/admin", { replace: true });
            return;
          }
          const status = doc.data()?.accountStatus;

          // If status changes to approved, redirect to home
          if (status === "approved") {
            navigate("/home", { replace: true });
          }
          // If status changes to rejected, redirect to rejected page
          else if (status === "rejected") {
            navigate("/rejected", { replace: true });
          }
          // If status changes to deleted, redirect to login
          else if (status === "deleted") {
            navigate("/login?deleted=true", { replace: true });
          }
        }
        setIsChecking(false);
      },
      (error) => {
        console.error("Error checking status:", error);
        setIsChecking(false);
      },
    );
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const handleActivate = async (event) => {
    event.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setActivating(true);
    setActivationError("");
    try {
      await redeemActivationKey(currentUser, activationKey);
    } catch (err) {
      setActivationError(err.message || "This activation key is not valid.");
      setActivating(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-7"
      >
        {/* Animated clock icon */}
        <div className="flex justify-center mb-7">
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.55, 1], opacity: [0.18, 0, 0.18] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-16 h-16 rounded-full bg-amber-100"
            />
            <motion.div
              animate={{ scale: [1, 1.28, 1], opacity: [0.25, 0, 0.25] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              className="absolute w-16 h-16 rounded-full bg-amber-100"
            />
            <div className="relative w-14 h-14 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-xl font-bold text-gray-900 text-center leading-snug mb-2">
          Account Pending Approval
        </h1>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-6">
          Your account is currently under review.
        </p>
        <p className="text-gray-400 text-xs text-center leading-relaxed mb-7">
          You'll be able to access your dashboard once your account is approved.
        </p>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <p className="text-xs text-gray-400">Waiting for approval</p>
        </div>

        <form onSubmit={handleActivate} className="mb-4">
          <label
            htmlFor="activation-key"
            className="block text-xs font-medium text-gray-500 mb-1.5"
          >
            Have an activation key?
          </label>
          <input
            id="activation-key"
            value={activationKey}
            onChange={(e) => {
              setActivationKey(formatActivationKey(e.target.value));
              setActivationError("");
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full px-3 py-2.5 mb-2 rounded-xl border border-gray-200 text-sm font-mono tracking-wide text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400"
          />
          {activationError && (
            <p className="text-xs text-red-500 mb-2">{activationError}</p>
          )}
          <button
            type="submit"
            disabled={activating || !activationKey.trim()}
            className="w-full py-2.5 rounded-xl bg-gray-900 text-sm text-white font-medium hover:bg-gray-700 transition disabled:opacity-40"
          >
            {activating ? "Checking key…" : "Activate account"}
          </button>
        </form>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="w-full py-2.5 mb-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition"
        >
          Sign Out
        </button>

        {/* Note */}
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[0.7rem] text-gray-400 text-center">
            Please check back later.
          </p>
        </div>
      </motion.div>

      <p className="text-[0.65rem] text-gray-300 mt-5 text-center">
        © 2026 Digical
      </p>
    </div>
  );
}

export default Pending;

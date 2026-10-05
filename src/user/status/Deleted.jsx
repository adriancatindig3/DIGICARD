// src/user/pages/Deleted.jsx - with real-time status listener
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth, db } from "../../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

function Deleted() {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);

    // Real-time listener for status changes
    const unsubscribe = onSnapshot(
      userDocRef,
      async (doc) => {
        if (doc.exists()) {
          const status = doc.data()?.accountStatus;

          // If status changes to approved, redirect to home
          if (status === "approved") {
            navigate("/home", { replace: true });
          }
          // If status changes to pending, redirect to pending page
          else if (status === "pending") {
            navigate("/pending", { replace: true });
          }
          // If status changes to rejected, redirect to rejected page
          else if (status === "rejected") {
            navigate("/rejected", { replace: true });
          }
        } else {
          // Document doesn't exist, sign out
          await signOut(auth);
          navigate("/login", { replace: true });
        }
        setIsChecking(false);
      },
      (error) => {
        console.error("Error checking status:", error);
        setIsChecking(false);
      },
    );

    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
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
        {/* Animated warning/trash icon */}
        <div className="flex justify-center mb-7">
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.55, 1], opacity: [0.18, 0, 0.18] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-16 h-16 rounded-full bg-red-100"
            />
            <motion.div
              animate={{ scale: [1, 1.28, 1], opacity: [0.25, 0, 0.25] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              className="absolute w-16 h-16 rounded-full bg-red-100"
            />
            <div className="relative w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 4V3c0-1 1-2 2-2h4c1 0 2 1 2 2v1" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-xl font-bold text-gray-900 text-center leading-snug mb-2">
          Account Deleted
        </h1>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-6">
          Your account has been permanently removed from our system.
        </p>
        <p className="text-gray-400 text-xs text-center leading-relaxed mb-7">
          If you believe this is a mistake, please contact the administrator.
        </p>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <p className="text-xs text-gray-400">Account permanently deleted</p>
        </div>

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
            Please contact support if you need to reinstate your account.
          </p>
        </div>
      </motion.div>

      <p className="text-[0.65rem] text-gray-300 mt-5 text-center">
        © 2026 e-CARD · City College of Calamba
      </p>
    </div>
  );
}

export default Deleted;

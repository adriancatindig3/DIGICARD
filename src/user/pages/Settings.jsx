// src/user/pages/Settings.jsx

import { useState, useEffect } from "react";
import {
  signOut,
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../../config/firebase";
import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  AlertTriangle,
  X,
  HelpCircle,
  ChevronRight,
  BookOpen,
} from "lucide-react";

function Settings({ darkMode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [openManual, setOpenManual] = useState(false);

  // Theme-based classes
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textSubClass = darkMode ? "text-gray-400" : "text-gray-500";
  const textLightClass = darkMode ? "text-gray-500" : "text-gray-400";
  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorderClass = darkMode ? "border-gray-700" : "border-gray-100";
  const iconBgClass = darkMode ? "bg-gray-700" : "bg-gray-100";
  const iconTextClass = darkMode ? "text-gray-400" : "text-gray-500";
  const dividerClass = darkMode ? "border-gray-700" : "border-gray-50";
  const inputBgClass = darkMode ? "bg-gray-900" : "bg-white";
  const inputBorderClass = darkMode
    ? "border-gray-700 focus:border-red-600"
    : "border-gray-200 focus:border-red-300";
  const inputTextClass = darkMode ? "text-white" : "text-gray-900";
  const placeholderClass = darkMode
    ? "placeholder-gray-600"
    : "placeholder-gray-300";
  const buttonBorderClass = darkMode
    ? "border-gray-700 hover:bg-gray-800"
    : "border-gray-200 hover:bg-gray-50";
  const deleteButtonClass = darkMode
    ? "bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
    : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100";
  const modalBgClass = darkMode ? "bg-gray-900" : "bg-white";
  const modalBorderClass = darkMode ? "border-gray-700" : "border-gray-100";
  const warningBgClass = darkMode
    ? "bg-amber-900/10 border-amber-800/30"
    : "bg-amber-50 border-amber-100";
  const warningTextClass = darkMode ? "text-amber-400" : "text-amber-700";
  const errorBgClass = darkMode
    ? "bg-red-900/20 border-red-800"
    : "bg-red-50 border-red-100";
  const errorTextClass = darkMode ? "text-red-400" : "text-red-500";
  const manualBgClass = darkMode ? "bg-gray-800" : "bg-gray-50";

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setDeleteError("");
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDeleteError("No user is currently signed in.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const originalUid = currentUser.uid;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await reauthenticateWithPopup(currentUser, provider);
      if (result.user.uid !== originalUid)
        throw new Error("User mismatch after reauthentication");

      const user = auth.currentUser;
      if (!user || user.uid !== originalUid)
        throw new Error("User session changed during reauthentication");
      const uid = user.uid;

      await deleteDoc(doc(db, "users", uid));

      const relatedCollections = ["qr_codes", "scans", "analytics"];
      for (const colName of relatedCollections) {
        try {
          const q = query(collection(db, colName), where("uid", "==", uid));
          const snapshot = await getDocs(q);
          await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
        } catch (err) {
          console.warn(`Error deleting from ${colName}:`, err);
        }
      }

      await deleteUser(user);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Delete account error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setDeleteError("Popup closed before completing. Please try again.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setDeleteError("Authentication cancelled. Please try again.");
      } else if (error.code === "auth/network-request-failed") {
        setDeleteError("Network error. Check your connection and try again.");
      } else if (error.code === "auth/user-mismatch") {
        setDeleteError(
          "User session changed. Sign out and back in, then retry.",
        );
      } else if (error.code === "auth/too-many-requests") {
        setDeleteError("Too many attempts. Please try again later.");
      } else if (error.code === "auth/requires-recent-login") {
        setDeleteError("Session expired. Sign out and back in, then retry.");
      } else {
        setDeleteError(
          `Failed to delete account: ${error.message || "Unknown error"}.`,
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const canDelete = deleteConfirmText === "DELETE";

  const Section = ({ icon: Icon, title, children }) => (
    <div
      className={`${cardBgClass} rounded-2xl border ${cardBorderClass} overflow-hidden shadow-sm`}
    >
      <div
        className={`px-5 py-4 border-b ${dividerClass} flex items-center gap-2.5`}
      >
        <div
          className={`w-7 h-7 rounded-lg ${iconBgClass} flex items-center justify-center`}
        >
          <Icon size={14} className={iconTextClass} />
        </div>
        <h2 className={`font-semibold ${textClass} text-sm`}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${textClass}`}>{label}</p>
        {description && (
          <p className={`text-xs ${textSubClass} mt-0.5`}>{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${textClass}`}>
            Settings
          </h1>
          <p className={`${textSubClass} mt-1 text-sm`}>
            Manage your account preferences
          </p>
        </div>

        <div className="space-y-4">
          {/* User Manual Section */}
          <Section icon={BookOpen} title="User Manual">
            <button
              onClick={() => setOpenManual(!openManual)}
              className="w-full flex items-center justify-between"
            >
              <span className={`text-sm ${textClass}`}>How to use e-CARD</span>
              <ChevronRight
                size={16}
                className={`${textSubClass} transition-transform duration-200 ${openManual ? "rotate-90" : ""}`}
              />
            </button>

            <AnimatePresence>
              {openManual && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-3"
                >
                  <div className={`${manualBgClass} rounded-xl p-4 space-y-4`}>
                    {/* Getting Started */}
                    <div>
                      <h3 className={`text-sm font-semibold ${textClass} mb-2`}>
                        📱 Getting Started
                      </h3>
                      <div className="space-y-2">
                        <p className={`text-xs ${textSubClass}`}>
                          1. Sign in with your Google account to create your
                          profile
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          2. Go to Edit Profile to add your name, photo, and
                          contact details
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          3. Your profile is automatically saved and ready to
                          share
                        </p>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div>
                      <h3 className={`text-sm font-semibold ${textClass} mb-2`}>
                        📸 Sharing Your QR Code
                      </h3>
                      <div className="space-y-2">
                        <p className={`text-xs ${textSubClass}`}>
                          1. Click "My QR Code" from the sidebar menu
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          2. Download your QR code as PNG image
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          3. Print or display your QR code anywhere
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          4. Anyone can scan it with their phone camera to see
                          your profile
                        </p>
                      </div>
                    </div>

                    {/* Share Link */}
                    <div>
                      <h3 className={`text-sm font-semibold ${textClass} mb-2`}>
                        🔗 Sharing Your Profile Link
                      </h3>
                      <div className="space-y-2">
                        <p className={`text-xs ${textSubClass}`}>
                          1. Copy your profile link from the QR Code page
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          2. Share via text, email, or social media
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          3. Add to your email signature or social bios
                        </p>
                      </div>
                    </div>

                    {/* Pro Tips */}
                    <div>
                      <h3 className={`text-sm font-semibold ${textClass} mb-2`}>
                        💡 Tips
                      </h3>
                      <div className="space-y-2">
                        <p className={`text-xs ${textSubClass}`}>
                          • Update your profile anytime - the link stays the
                          same!
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          • Toggle dark/light mode for better visibility
                        </p>
                        <p className={`text-xs ${textSubClass}`}>
                          • Perfect for networking events, job fairs, and
                          meetings
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* Account Section - Delete Account */}
          <Section icon={AlertTriangle} title="Account">
            <SettingRow
              label="Delete Account"
              description="Permanently remove your account and all data"
            >
              <button
                onClick={() => setShowDeleteModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 ${deleteButtonClass} border rounded-lg text-xs font-medium transition`}
              >
                <AlertTriangle size={12} />
                Delete Account
              </button>
            </SettingRow>
          </Section>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 ${cardBgClass} border ${cardBorderClass} ${textSubClass} py-3 rounded-2xl font-medium text-sm hover:bg-opacity-80 transition disabled:opacity-50 shadow-sm`}
          >
            <LogOut size={15} />
            {loading ? "Signing out…" : "Sign Out"}
          </button>

          <p
            className={`text-center text-xs ${darkMode ? "text-gray-700" : "text-gray-300"} pb-4`}
          >
            © 2026 e-CARD · City College of Calamba
          </p>
        </div>
      </motion.div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className={`${modalBgClass} rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden`}
            >
              <div
                className={`flex items-center justify-between px-5 pt-5 pb-4 border-b ${modalBorderClass}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle size={14} className="text-red-500" />
                  </div>
                  <h3 className={`font-semibold ${textClass} text-sm`}>
                    Delete account
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${textLightClass} transition`}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                <p className={`text-sm ${textSubClass} leading-relaxed`}>
                  This will permanently delete your account, profile, and all
                  associated data.{" "}
                  <span className={`font-semibold ${textClass}`}>
                    This cannot be undone.
                  </span>
                </p>

                <div
                  className={`flex items-start gap-2.5 p-3 ${warningBgClass} border rounded-xl`}
                >
                  <AlertTriangle
                    size={13}
                    className="text-amber-500 flex-shrink-0 mt-0.5"
                  />
                  <p className={`text-xs ${warningTextClass}`}>
                    You'll be asked to sign in with Google to confirm your
                    identity before deletion.
                  </p>
                </div>

                <div>
                  <label
                    className={`block text-xs font-medium ${textSubClass} mb-1.5`}
                  >
                    Type{" "}
                    <span className={`font-bold ${textClass} font-mono`}>
                      DELETE
                    </span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                    className={`w-full px-3 py-2 border ${inputBorderClass} rounded-xl text-sm ${inputBgClass} ${inputTextClass} ${placeholderClass} focus:outline-none transition font-mono`}
                  />
                </div>

                {deleteError && (
                  <p
                    className={`text-xs ${errorTextClass} ${errorBgClass} border rounded-xl px-3 py-2`}
                  >
                    {deleteError}
                  </p>
                )}
              </div>

              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={handleCloseModal}
                  className={`flex-1 py-2.5 border ${buttonBorderClass} rounded-xl text-sm ${textSubClass} transition font-medium`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!canDelete || deleteLoading}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    "Delete account"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Settings;

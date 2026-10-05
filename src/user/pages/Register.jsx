// src/user/pages/Register.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import {
  User,
  Mail,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [affiliation, setAffiliation] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedRoleLabel, setSelectedRoleLabel] = useState("");
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch roles from Firebase
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesQuery = query(
          collection(db, "userRoles"),
          orderBy("createdAt", "asc"),
        );
        const snapshot = await getDocs(rolesQuery);

        if (snapshot.empty) {
          setRoles([]);
        } else {
          const rolesList = snapshot.docs.map((doc) => ({
            id: doc.id,
            label: doc.data().label,
            value:
              doc.data().value ||
              doc.data().label.toLowerCase().replace(/\s+/g, "-"),
          }));
          setRoles(rolesList);
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        setError("Failed to load roles. Please refresh the page.");
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Get current Firebase Auth user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
        });
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAffiliation = (answer) => {
    setAffiliation(answer);
    if (answer === "yes") {
      setStep(2);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role.value);
    setSelectedRoleLabel(role.label);
  };

  const handleContinueToConfirm = () => {
    if (selectedRole) {
      setStep(3);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!currentUser) {
      setError("No user found. Please sign in again.");
      return;
    }

    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const userDocRef = doc(db, "users", currentUser.uid);

      // ✅ CREATE USER DOCUMENT ONLY HERE - AFTER CONFIRMATION
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL || "",
        occupation: selectedRoleLabel,
        roleValue: selectedRole,
        accountStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bio: "",
        location: "",
        phoneNumber: "",
        company: "City College of Calamba",
        skills: "",
        socialLinks: {},
        selectedLayout: 1,
        accountType: "user",
      });

      // Redirect to pending page
      navigate("/pending", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.message || "Failed to submit registration. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  // Access Denied Component
  if (affiliation === "no") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-red-50 p-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 text-sm">
              This platform is exclusively for individuals affiliated with City
              College of Calamba (CCC).
            </p>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={() => setAffiliation(null)}
              className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Go Back
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-gray-400 mx-auto mb-4"
          />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Progress Steps */}
        <div className="flex justify-between mb-6 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                  ${
                    step >= s
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
              >
                {step > s ? <CheckCircle size={18} /> : s}
              </div>
              <span
                className={`text-xs mt-1 ${step >= s ? "text-gray-700" : "text-gray-400"}`}
              >
                {s === 1 ? "Affiliation" : s === 2 ? "Role" : "Confirm"}
              </span>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Step 1: Affiliation Question */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <img
                      src="/image.png"
                      alt="CCC Logo"
                      className="h-20 w-auto object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"%3E%3C/path%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Affiliation Verification
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    This platform is for the CCC community
                  </p>
                </div>

                <p className="text-center text-gray-700 font-medium mb-4">
                  Are you affiliated with City College of Calamba (CCC)?
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleAffiliation("yes")}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} /> Yes, I am affiliated
                  </button>
                  <button
                    onClick={() => handleAffiliation("no")}
                    className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    No, I am not
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-6">
                  Including students, alumni, faculty, and staff
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-gray-500 text-sm mb-4 hover:text-gray-700 transition"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <img
                      src="/image.png"
                      alt="CCC Logo"
                      className="h-20 w-auto object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"%3E%3C/path%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Select Your Role
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Choose your affiliation type
                  </p>
                </div>

                {rolesLoading ? (
                  <div className="text-center py-8">
                    <Loader2
                      size={32}
                      className="animate-spin text-gray-400 mx-auto mb-2"
                    />
                    <p className="text-sm text-gray-500">Loading roles...</p>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle
                      size={32}
                      className="text-amber-500 mx-auto mb-2"
                    />
                    <p className="text-sm text-gray-600">
                      No roles available. Please contact administrator.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className={`flex items-center p-4 border rounded-xl cursor-pointer transition
                            ${
                              selectedRole === role.value
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={selectedRole === role.value}
                            onChange={() => handleRoleSelect(role)}
                            className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                          />
                          <span className="ml-3 text-gray-700 font-medium">
                            {role.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={handleContinueToConfirm}
                      disabled={!selectedRole}
                      className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
                        ${
                          selectedRole
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-gray-500 text-sm mb-4 hover:text-gray-700 transition"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <img
                      src="/image.png"
                      alt="CCC Logo"
                      className="h-20 w-auto object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"%3E%3C/path%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Confirm Registration
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Please verify your information
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <User size={18} className="text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-400">Full Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser.displayName || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <Mail size={18} className="text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-400">Email Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Briefcase size={18} className="text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-400">Selected Role</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedRoleLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-amber-700 text-center">
                      ⚠️ Your account will be reviewed by an administrator
                      before you can access the platform.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSubmitRegistration}
                  disabled={submitting}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
                    ${
                      !submitting
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} /> Confirm & Submit Registration
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          © 2026 e-CARD · City College of Calamba
        </p>
      </motion.div>
    </div>
  );
};

export default Register;

import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { uploadImage } from "../config/cloudinary";
import { logAdminAction } from "./adminHelpers";
import {
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ImageIcon,
} from "lucide-react";

const AdminSettings = ({ darkMode, currentUser }) => {
  const [schoolLogoURL, setSchoolLogoURL] = useState("");
  const [schoolLogoUploading, setSchoolLogoUploading] = useState(false);
  const [schoolLogoError, setSchoolLogoError] = useState("");
  const [schoolLogoSuccess, setSchoolLogoSuccess] = useState("");
  const logoInputRef = useRef(null);

  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const textSubClass = darkMode ? "text-gray-400" : "text-gray-500";
  const textMutedClass = darkMode ? "text-gray-500" : "text-gray-400";
  const successBgClass = darkMode
    ? "bg-green-900/20 text-green-400"
    : "bg-green-50 text-green-600";
  const errorBgClass = darkMode
    ? "bg-red-900/20 text-red-400"
    : "bg-red-50 text-red-500";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "school"));
        if (snap.exists()) setSchoolLogoURL(snap.data().logoURL || "");
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const valid = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!valid.includes(file.type)) {
      setSchoolLogoError("Please select a JPEG, PNG, WEBP, or SVG file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSchoolLogoError("Image must be under 5MB.");
      return;
    }
    setSchoolLogoError("");
    setSchoolLogoSuccess("");
    setSchoolLogoUploading(true);
    try {
      const result = await uploadImage(file, "settings/school-logo");
      const newUrl = result.url;
      await setDoc(
        doc(db, "settings", "school"),
        {
          logoURL: newUrl,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || "admin",
        },
        { merge: true },
      );
      setSchoolLogoURL(newUrl);
      await logAdminAction(
        currentUser?.email,
        "UPDATE_LOGO",
        null,
        "School logo updated",
        { adminName: currentUser?.displayName },
      );
      setSchoolLogoSuccess("School logo saved successfully!");
      setTimeout(() => setSchoolLogoSuccess(""), 3000);
    } catch (err) {
      setSchoolLogoError("Upload failed: " + err.message);
    } finally {
      setSchoolLogoUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await setDoc(
        doc(db, "settings", "school"),
        { logoURL: "", updatedAt: new Date().toISOString() },
        { merge: true },
      );
      setSchoolLogoURL("");
      await logAdminAction(
        currentUser?.email,
        "UPDATE_LOGO",
        null,
        "School logo removed",
        { adminName: currentUser?.displayName },
      );
      setSchoolLogoSuccess("Logo removed.");
      setTimeout(() => setSchoolLogoSuccess(""), 2000);
    } catch {
      setSchoolLogoError("Failed to remove logo.");
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border ${cardBorderClass} ${cardBgClass} p-6 shadow-sm`}
      >
        <h3
          className={`text-xs font-bold tracking-wider ${textMutedClass} uppercase mb-4`}
        >
          School Logo
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div
            className={`w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-dashed ${cardBorderClass}`}
          >
            {schoolLogoUploading ? (
              <Loader2 size={28} className={`${textMutedClass} animate-spin`} />
            ) : schoolLogoURL ? (
              <img
                src={schoolLogoURL}
                alt="School logo"
                className="w-full h-full object-contain p-3"
              />
            ) : (
              <ImageIcon size={32} className={textMutedClass} />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className={`text-sm ${textSubClass} mb-3`}>
              Upload your school's logo. It will appear across the platform for
              all users.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={schoolLogoUploading}
                className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition
                  ${darkMode ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-700"}
                  ${schoolLogoUploading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Upload size={13} />{" "}
                {schoolLogoUploading ? "Uploading..." : "Upload Logo"}
              </button>
              {schoolLogoURL && (
                <button
                  onClick={handleRemoveLogo}
                  className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="hidden"
            />
            {schoolLogoError && (
              <p
                className={`text-xs ${errorBgClass} mt-2 flex items-center justify-center sm:justify-start gap-1`}
              >
                <AlertCircle size={12} /> {schoolLogoError}
              </p>
            )}
            {schoolLogoSuccess && (
              <p
                className={`text-xs ${successBgClass} mt-2 flex items-center justify-center sm:justify-start gap-1`}
              >
                <CheckCircle size={12} /> {schoolLogoSuccess}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

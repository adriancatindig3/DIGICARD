// UpdateProfile.jsx - with dark mode support
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { uploadImage } from "../../config/cloudinary";
import Cropper from "react-easy-crop";
import { useUserRoles } from "../../shared/hooks/useUserRoles";
import {
  ArrowLeft,
  Save,
  Camera,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  User,
  Image as ImageIcon,
  Trash2,
  Plus,
  X,
  Check,
  Wifi,
  Radio,
  Smartphone,
  Cpu,
  CreditCard,
  Upload,
  Loader2,
  Move,
  ZoomIn,
  RotateCw,
  Crop,
  CheckCircle,
} from "lucide-react";

const UpdateProfile = ({ darkMode, onSaveComplete }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    displayName: "",
    bio: "",
    location: "",
    email: "",
    occupation: "",
    company: "City College Of Calamba",
    phoneNumber: "",
    skills: "",
  });

  const [socialLinks, setSocialLinks] = useState([{ id: Date.now(), url: "" }]);

  // Profile picture cropping states
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [currentPhotoURL, setCurrentPhotoURL] = useState("");
  const [isProfilePicRemoved, setIsProfilePicRemoved] = useState(false);
  const [showProfileCropper, setShowProfileCropper] = useState(false);
  const [profileCrop, setProfileCrop] = useState({ x: 0, y: 0 });
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileCroppedAreaPixels, setProfileCroppedAreaPixels] =
    useState(null);
  const [profileImageToCrop, setProfileImageToCrop] = useState(null);
  const [isSavingProfilePic, setIsSavingProfilePic] = useState(false);

  // Cover photo cropping states
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState("");
  const [currentCoverURL, setCurrentCoverURL] = useState("");
  const [isCoverPhotoRemoved, setIsCoverPhotoRemoved] = useState(false);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [coverCrop, setCoverCrop] = useState({ x: 0, y: 0 });
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverCroppedAreaPixels, setCoverCroppedAreaPixels] = useState(null);
  const [coverImageToCrop, setCoverImageToCrop] = useState(null);
  const [isSavingCoverPic, setIsSavingCoverPic] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const profilePicInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  const navigate = useNavigate();

  const defaultProfilePic =
    "https://res.cloudinary.com/dduu3qj8q/image/upload/v1770705831/users/profile-photos/fflqvlvzyt2cec7yukfp.jpg";
  const defaultCoverPhoto =
    "https://res.cloudinary.com/dduu3qj8q/image/upload/v1770705831/users/profile-photos/fflqvlvzyt2cec7yukfp.jpg";
  const cccLogo =
    "https://res.cloudinary.com/dduu3qj8q/image/upload/v1770705831/users/company-logos/ccc.png";

  // Theme-based classes
  const bgClass = darkMode ? "bg-gray-900" : "bg-gray-50";
  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const cardHeaderBgClass = darkMode ? "bg-gray-800/50" : "bg-gray-50";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textSubClass = darkMode ? "text-gray-400" : "text-gray-500";
  const textLightClass = darkMode ? "text-gray-500" : "text-gray-400";
  const inputBgClass = darkMode ? "bg-gray-900" : "bg-white";
  const inputBorderClass = darkMode
    ? "border-gray-700 focus:border-gray-500"
    : "border-gray-200 focus:border-gray-400";
  const inputTextClass = darkMode ? "text-white" : "text-gray-900";
  const placeholderClass = darkMode
    ? "placeholder-gray-600"
    : "placeholder-gray-400";
  const buttonPrimaryClass = darkMode
    ? "bg-white text-gray-900 hover:bg-gray-200"
    : "bg-gray-900 text-white hover:bg-gray-700";
  const buttonSecondaryClass = darkMode
    ? "border-gray-700 text-gray-300 hover:bg-gray-700"
    : "border-gray-200 text-gray-600 hover:bg-gray-50";
  const errorBgClass = darkMode
    ? "bg-red-900/20 border-red-800 text-red-400"
    : "bg-red-50 border-red-200 text-red-600";
  const successBgClass = darkMode
    ? "bg-green-900/20 border-green-800 text-green-400"
    : "bg-green-50 border-green-200 text-green-700";
  const dividerClass = darkMode ? "border-gray-700" : "border-gray-100";
  const modalBgClass = darkMode ? "bg-gray-900" : "bg-white";
  const modalBorderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const cropperBgClass = darkMode ? "bg-gray-800" : "bg-gray-100";
  const badgeClass = darkMode
    ? "text-amber-400 bg-amber-900/20 border-amber-800"
    : "text-amber-600 bg-amber-50 border-amber-200";
  const progressBarBgClass = darkMode ? "bg-gray-700" : "bg-gray-100";
  const progressBarFillClass = darkMode ? "bg-white" : "bg-gray-900";

  const { positionOptions, rolesLoading } = useUserRoles();
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
    });
  };

  const onProfileCropComplete = (_, croppedAreaPixels) =>
    setProfileCroppedAreaPixels(croppedAreaPixels);
  const onCoverCropComplete = (_, croppedAreaPixels) =>
    setCoverCroppedAreaPixels(croppedAreaPixels);

  const autoSaveProfilePicture = async (croppedFile) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      const result = await uploadImage(croppedFile, "users/profile-photos");
      const newPhotoUrl = result.url;
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        photoURL: newPhotoUrl,
        profilePic: newPhotoUrl,
        updatedAt: new Date().toISOString(),
      });
      if (currentUser.updateProfile)
        await currentUser.updateProfile({ photoURL: newPhotoUrl });
      setCurrentPhotoURL(newPhotoUrl);
      setProfilePicPreview(newPhotoUrl);
      return true;
    } catch (error) {
      console.error("Error auto-saving profile picture:", error);
      setError("Failed to save profile picture: " + error.message);
      return false;
    }
  };

  const autoSaveCoverPhoto = async (croppedFile) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      const result = await uploadImage(croppedFile, "users/cover-photos");
      const newCoverUrl = result.url;
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        coverPhotoURL: newCoverUrl,
        coverPhoto: newCoverUrl,
        updatedAt: new Date().toISOString(),
      });
      setCurrentCoverURL(newCoverUrl);
      setCoverPhotoPreview(newCoverUrl);
      return true;
    } catch (error) {
      console.error("Error auto-saving cover photo:", error);
      setError("Failed to save cover photo: " + error.message);
      return false;
    }
  };

  const handleFileChange = (file, setImageToCrop, setShowCropper) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, WEBP, GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleProfileFileChange = (e) =>
    handleFileChange(
      e.target.files[0],
      setProfileImageToCrop,
      setShowProfileCropper,
    );
  const handleCoverFileChange = (e) =>
    handleFileChange(
      e.target.files[0],
      setCoverImageToCrop,
      setShowCoverCropper,
    );

  const handleProfileCropSave = async () => {
    if (!profileCroppedAreaPixels || !profileImageToCrop) return;
    setIsSavingProfilePic(true);
    setError("");
    try {
      const croppedBlob = await getCroppedImg(
        profileImageToCrop,
        profileCroppedAreaPixels,
      );
      const croppedFile = new File([croppedBlob], "cropped-profile.jpg", {
        type: "image/jpeg",
      });
      const ok = await autoSaveProfilePicture(croppedFile);
      if (ok) {
        setSuccess("Profile picture updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
      setProfilePicFile(null);
      setIsProfilePicRemoved(false);
      setShowProfileCropper(false);
      setProfileImageToCrop(null);
      setProfileCrop({ x: 0, y: 0 });
      setProfileZoom(1);
    } catch (err) {
      setError("Failed to crop and save image");
    } finally {
      setIsSavingProfilePic(false);
    }
  };

  const handleCoverCropSave = async () => {
    if (!coverCroppedAreaPixels || !coverImageToCrop) return;
    setIsSavingCoverPic(true);
    setError("");
    try {
      const croppedBlob = await getCroppedImg(
        coverImageToCrop,
        coverCroppedAreaPixels,
      );
      const croppedFile = new File([croppedBlob], "cropped-cover.jpg", {
        type: "image/jpeg",
      });
      const ok = await autoSaveCoverPhoto(croppedFile);
      if (ok) {
        setSuccess("Cover photo updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
      setCoverPhotoFile(null);
      setIsCoverPhotoRemoved(false);
      setShowCoverCropper(false);
      setCoverImageToCrop(null);
      setCoverCrop({ x: 0, y: 0 });
      setCoverZoom(1);
    } catch (err) {
      setError("Failed to crop and save image");
    } finally {
      setIsSavingCoverPic(false);
    }
  };

  // const detectPlatform = (url) => {
  //   if (!url) return "";
  //   const u = url.toLowerCase();
  //   if (u.includes("facebook.com") || u.includes("fb.com")) return "facebook";
  //   if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  //   if (u.includes("instagram.com")) return "instagram";
  //   if (u.includes("linkedin.com")) return "linkedin";
  //   if (u.includes("github.com")) return "github";
  //   if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  //   if (u.includes("tiktok.com")) return "tiktok";
  //   if (u.startsWith("http") && !u.includes("@")) return "website";
  //   return "other";
  // };

  const detectPlatform = (url) => {
    if (!url) return "";
    const u = url.toLowerCase();

    // Major platforms
    if (u.includes("facebook.com") || u.includes("fb.com")) return "facebook";
    if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
    if (u.includes("instagram.com")) return "instagram";
    if (u.includes("linkedin.com")) return "linkedin";
    if (u.includes("github.com")) return "github";
    if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
    if (u.includes("tiktok.com")) return "tiktok";
    if (u.includes("pinterest.com")) return "pinterest";
    if (u.includes("reddit.com")) return "reddit";
    if (u.includes("snapchat.com")) return "snapchat";
    if (u.includes("whatsapp.com")) return "whatsapp";
    if (u.includes("telegram.org") || u.includes("t.me")) return "telegram";
    if (u.includes("discord.com") || u.includes("discord.gg")) return "discord";
    if (u.includes("twitch.tv")) return "twitch";
    if (u.includes("medium.com")) return "medium";
    if (u.includes("quora.com")) return "quora";
    if (u.includes("dev.to")) return "dev";
    if (u.includes("stackoverflow.com")) return "stackoverflow";
    if (u.includes("behance.net")) return "behance";
    if (u.includes("dribbble.com")) return "dribbble";
    if (u.includes("figma.com")) return "figma";
    if (u.includes("producthunt.com")) return "producthunt";
    if (u.includes("spotify.com")) return "spotify";
    if (u.includes("soundcloud.com")) return "soundcloud";
    if (u.includes("vk.com")) return "vk";
    if (u.includes("weixin.com") || u.includes("wechat.com")) return "wechat";
    if (u.includes("line.me")) return "line";
    if (u.includes("signal.org")) return "signal";
    if (u.includes("mastodon.social")) return "mastodon";
    if (u.includes("keybase.io")) return "keybase";

    // Website fallback
    if (u.startsWith("http") && !u.includes("@")) return "website";

    return "other";
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate("/login");
          return;
        }
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName: data.displayName || currentUser.displayName || "",
            bio: data.bio || "",
            location: data.location || "",
            email: data.email || currentUser.email || "",
            occupation: data.occupation || data.role || "",
            company: data.company || "City College Of Calamba",
            phoneNumber: data.phoneNumber || data.phone || "",
            skills: data.skills || "",
          });
          const photoUrl = data.photoURL || data.profilePic || "";
          setCurrentPhotoURL(photoUrl);
          setProfilePicPreview(photoUrl || defaultProfilePic);
          const coverUrl = data.coverPhotoURL || data.coverPhoto || "";
          setCurrentCoverURL(coverUrl);
          setCoverPhotoPreview(coverUrl || defaultCoverPhoto);
          if (data.socialLinks) {
            const linksArray = Object.entries(data.socialLinks)
              .filter(([, url]) => url && url.trim() !== "")
              .map(([, url]) => ({ id: Date.now() + Math.random(), url }));
            setSocialLinks(
              linksArray.length > 0
                ? linksArray
                : [{ id: Date.now(), url: "" }],
            );
          }
        } else {
          setUserData({
            displayName: currentUser.displayName || "",
            bio: "",
            location: "",
            email: currentUser.email || "",
            occupation: "",
            company: "City College Of Calamba",
            phoneNumber: "",
            skills: "",
          });
          const photo = currentUser.photoURL || "";
          setCurrentPhotoURL(photo);
          setProfilePicPreview(photo || defaultProfilePic);
          setCoverPhotoPreview(defaultCoverPhoto);
        }
      } catch (err) {
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (id, value) =>
    setSocialLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, url: value } : link)),
    );

  const addSocialLink = () =>
    setSocialLinks((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), url: "" },
    ]);

  const removeSocialLink = (id) => {
    if (socialLinks.length > 1)
      setSocialLinks((prev) => prev.filter((link) => link.id !== id));
    else setSocialLinks([{ id: Date.now(), url: "" }]);
  };

  const validateUrl = (url) => {
    if (!url || url.trim() === "") return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === "") return true;
    return /^\+63\d{10}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (userData.phoneNumber && !validatePhoneNumber(userData.phoneNumber)) {
      setError("Please enter a valid phone number (+63 followed by 10 digits)");
      return;
    }
    if (socialLinks.some((link) => link.url && !validateUrl(link.url))) {
      setError("Please enter valid URLs for social links");
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      const socialLinksObj = {};
      socialLinks.forEach((link) => {
        if (link.url && link.url.trim() !== "") {
          const platform = detectPlatform(link.url);
          let key = platform;
          let counter = 1;
          while (socialLinksObj[key]) {
            key = `${platform}${counter}`;
            counter++;
          }
          socialLinksObj[key] = link.url;
        }
      });

      const updateData = {
        displayName: userData.displayName || "",
        bio: userData.bio || "",
        location: userData.location || "",
        occupation: userData.occupation || "",
        company: "City College Of Calamba",
        phoneNumber: userData.phoneNumber || "",
        skills: userData.skills || "",
        socialLinks: socialLinksObj,
        updatedAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          ...updateData,
          email: currentUser.email || "",
          createdAt: new Date().toISOString(),
          uid: currentUser.uid,
          photoURL: currentPhotoURL,
          profilePic: currentPhotoURL,
          coverPhotoURL: currentCoverURL,
          coverPhoto: currentCoverURL,
        });
      } else {
        await updateDoc(userDocRef, updateData);
      }

      setUploadProgress(100);
      setSuccess("Profile information saved successfully!");

      // Redirect to themes after save
      if (onSaveComplete) {
        setTimeout(() => {
          onSaveComplete();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div
          className={`w-8 h-8 border-2 ${darkMode ? "border-gray-700 border-t-white" : "border-gray-200 border-t-black"} rounded-full animate-spin`}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Feedback messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-4 p-3 border rounded-lg text-sm ${errorBgClass}`}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-4 p-3 border rounded-lg text-sm ${successBgClass} flex items-center gap-2`}
          >
            <Check size={15} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Card */}
      <div
        className={`${cardBgClass} border ${cardBorderClass} rounded-2xl overflow-hidden mb-4 shadow-sm`}
      >
        {/* Cover photo */}
        <div
          onClick={() => coverPhotoInputRef.current?.click()}
          className="relative h-28 bg-gradient-to-br from-gray-800 to-gray-600 cursor-pointer overflow-hidden group"
        >
          {isSavingCoverPic && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
          )}

          {coverPhotoPreview && coverPhotoPreview !== defaultCoverPhoto && (
            <img
              src={coverPhotoPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}

          {/* Hover overlay - always visible but more prominent on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
            <div
              className={`${cardBgClass} rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium ${textClass} transform transition-all duration-300 group-hover:scale-105 shadow-lg`}
            >
              <Camera size={14} />
              {coverPhotoPreview && coverPhotoPreview !== defaultCoverPhoto
                ? "Change cover"
                : "Add cover photo"}
            </div>
          </div>

          {/* Badge indicator when cover exists
          {coverPhotoPreview && coverPhotoPreview !== defaultCoverPhoto && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
              <Camera size={10} /> Cover set
            </div>
          )} */}

          {/* Empty state indicator */}
          {(!coverPhotoPreview || coverPhotoPreview === defaultCoverPhoto) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-1">
                <Camera size={12} /> Click to add cover photo
              </div>
            </div>
          )}

          <input
            ref={coverPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverFileChange}
            className="hidden"
          />
        </div>

        {/* Profile picture + info */}
        <div className="px-4 pt-3 pb-4 flex items-center gap-3">
          <div
            onClick={() => profilePicInputRef.current?.click()}
            className="relative cursor-pointer flex-shrink-0 group"
          >
            {isSavingProfilePic && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center z-20">
                <Loader2 size={16} className="text-white animate-spin" />
              </div>
            )}
            <img
              src={profilePicPreview}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover bg-gray-200 transition-opacity group-hover:opacity-75"
              style={{
                border: `2px solid ${darkMode ? "#1f2937" : "white"}`,
                boxShadow: darkMode ? "none" : "0 0 0 1.5px #e5e7eb",
              }}
              onError={(e) => {
                e.target.src = defaultProfilePic;
              }}
            />
            {/* Hover ring effect */}
            <div className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-white/50 transition-all" />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${buttonPrimaryClass} rounded-full flex items-center justify-center border-2 ${darkMode ? "border-gray-800" : "border-white"} transition-transform group-hover:scale-110`}
            >
              <Camera
                size={9}
                className={darkMode ? "text-gray-900" : "text-white"}
              />
            </div>
            <input
              ref={profilePicInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileFileChange}
              className="hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold ${textClass} text-sm leading-tight truncate`}
            >
              {userData.displayName || "Your Name"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <img
                src={cccLogo}
                alt="CCC"
                className="w-3.5 h-3.5 flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <p className={`text-xs ${textSubClass} truncate`}>
                {userData.occupation ? `${userData.occupation} · ` : ""}
                {userData.company}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Picture Cropper Modal */}
      <AnimatePresence>
        {showProfileCropper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <div
              className={`w-full max-w-md ${modalBgClass} rounded-2xl overflow-hidden`}
            >
              <div
                className={`flex items-center justify-between px-4 py-3 border-b ${modalBorderClass}`}
              >
                <h3
                  className={`font-semibold ${textClass} text-sm flex items-center gap-2`}
                >
                  <Move size={16} /> Position profile picture
                </h3>
                <button
                  onClick={() => setShowProfileCropper(false)}
                  className={textLightClass}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={`relative h-72 sm:h-80 ${cropperBgClass}`}>
                <Cropper
                  image={profileImageToCrop}
                  crop={profileCrop}
                  zoom={profileZoom}
                  aspect={1}
                  onCropChange={setProfileCrop}
                  onZoomChange={setProfileZoom}
                  onCropComplete={onProfileCropComplete}
                  cropShape="round"
                  showGrid={true}
                />
              </div>
              <div className={`flex gap-3 p-4 border-t ${modalBorderClass}`}>
                <button
                  onClick={() => setShowProfileCropper(false)}
                  className={`flex-1 py-2.5 border ${buttonSecondaryClass} rounded-lg text-sm transition`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileCropSave}
                  disabled={isSavingProfilePic}
                  className={`flex-1 py-2.5 ${buttonPrimaryClass} rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50`}
                >
                  {isSavingProfilePic ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} /> Apply & save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cover Photo Cropper Modal */}
      <AnimatePresence>
        {showCoverCropper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <div
              className={`w-full max-w-2xl ${modalBgClass} rounded-2xl overflow-hidden`}
            >
              <div
                className={`flex items-center justify-between px-4 py-3 border-b ${modalBorderClass}`}
              >
                <h3
                  className={`font-semibold ${textClass} text-sm flex items-center gap-2`}
                >
                  <Move size={16} /> Position cover photo (16:9)
                </h3>
                <button
                  onClick={() => setShowCoverCropper(false)}
                  className={textLightClass}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={`relative h-64 sm:h-80 ${cropperBgClass}`}>
                <Cropper
                  image={coverImageToCrop}
                  crop={coverCrop}
                  zoom={coverZoom}
                  aspect={16 / 9}
                  onCropChange={setCoverCrop}
                  onZoomChange={setCoverZoom}
                  onCropComplete={onCoverCropComplete}
                  showGrid={true}
                />
              </div>
              <div className={`flex gap-3 p-4 border-t ${modalBorderClass}`}>
                <button
                  onClick={() => setShowCoverCropper(false)}
                  className={`flex-1 py-2.5 border ${buttonSecondaryClass} rounded-lg text-sm transition`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCoverCropSave}
                  disabled={isSavingCoverPic}
                  className={`flex-1 py-2.5 ${buttonPrimaryClass} rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50`}
                >
                  {isSavingCoverPic ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} /> Apply & save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div
          className={`${cardBgClass} border ${cardBorderClass} rounded-2xl overflow-hidden shadow-sm`}
        >
          <div
            className={`px-4 py-3 border-b ${dividerClass} ${cardHeaderBgClass}`}
          >
            <h3 className={`text-sm font-semibold ${textSubClass}`}>
              Basic information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <input
              type="text"
              name="displayName"
              value={userData.displayName}
              onChange={handleInputChange}
              placeholder="Full name"
              className={`w-full px-3 py-2.5 border ${inputBorderClass} rounded-lg text-sm ${inputTextClass} ${placeholderClass} focus:outline-none transition bg-transparent`}
            />
            <div>
              <textarea
                name="bio"
                value={userData.bio}
                onChange={handleInputChange}
                rows={3}
                maxLength={200}
                placeholder="Tell us about yourself…"
                className={`w-full px-3 py-2.5 border ${inputBorderClass} rounded-lg text-sm ${inputTextClass} ${placeholderClass} focus:outline-none transition resize-none bg-transparent`}
              />
              <p className={`text-xs ${textLightClass} text-right mt-1`}>
                {userData.bio.length}/200
              </p>
            </div>
            <input
              type="text"
              name="location"
              value={userData.location}
              onChange={handleInputChange}
              placeholder="Google Maps link (e.g., https://maps.app.goo.gl/...)"
              className={`w-full px-3 py-2.5 border ${inputBorderClass} rounded-lg text-sm ${inputTextClass} ${placeholderClass} focus:outline-none transition bg-transparent`}
            />
            {/* Phone with prefix */}
            <div>
              <div
                className={`flex border ${inputBorderClass} rounded-lg overflow-hidden focus-within:border-gray-400 transition`}
              >
                <span
                  className={`px-3 py-2.5 text-sm ${textSubClass} bg-transparent border-r ${dividerClass} whitespace-nowrap`}
                >
                  🇵🇭 +63
                </span>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={userData.phoneNumber.replace(/^\+63/, "")}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d]/g, "");
                    if (value.length > 10) value = value.substring(0, 10);
                    setUserData((prev) => ({
                      ...prev,
                      phoneNumber: value ? `+63${value}` : "",
                    }));
                  }}
                  placeholder="912 345 6789"
                  className={`flex-1 px-3 py-2.5 text-sm ${inputTextClass} ${placeholderClass} focus:outline-none bg-transparent`}
                />
              </div>
              <p className={`text-xs ${textLightClass} mt-1`}>
                Enter 10-digit mobile number
              </p>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div
          className={`${cardBgClass} border ${cardBorderClass} rounded-2xl overflow-hidden shadow-sm`}
        >
          <div
            className={`px-4 py-3 border-b ${dividerClass} ${cardHeaderBgClass}`}
          >
            <h3 className={`text-sm font-semibold ${textSubClass}`}>
              Professional information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              {rolesLoading ? (
                <div
                  className={`w-full px-3 py-2.5 border ${inputBorderClass} rounded-lg text-sm ${textLightClass} flex items-center gap-2 bg-transparent`}
                >
                  <Loader2 size={14} className="animate-spin" /> Loading roles…
                </div>
              ) : (
                <select
                  name="occupation"
                  value={userData.occupation}
                  onChange={handleInputChange}
                  className={`w-full appearance-none px-3 py-2.5 pr-10 border ${inputBorderClass} rounded-lg text-sm ${inputTextClass} focus:outline-none transition bg-transparent cursor-pointer`}
                >
                  <option value="">Select position</option>
                  {positionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {!rolesLoading && (
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={textLightClass}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              )}
            </div>

            {!rolesLoading &&
              userData.occupation &&
              !positionOptions.find((o) => o.value === userData.occupation) && (
                <p
                  className={`text-xs ${badgeClass} rounded-lg px-3 py-2 border`}
                >
                  Your current position "{userData.occupation}" is no longer in
                  the available roles. Please select a new one.
                </p>
              )}

            <textarea
              name="skills"
              value={userData.skills}
              onChange={handleInputChange}
              rows={3}
              placeholder="Skills & expertise (separate with commas)"
              className={`w-full px-3 py-2.5 border ${inputBorderClass} rounded-lg text-sm ${inputTextClass} ${placeholderClass} focus:outline-none transition resize-none bg-transparent`}
            />
          </div>
        </div>

        {/* Social Links */}
        <div
          className={`${cardBgClass} border ${cardBorderClass} rounded-2xl overflow-hidden shadow-sm`}
        >
          <div
            className={`px-4 py-3 border-b ${dividerClass} ${cardHeaderBgClass} flex items-center justify-between`}
          >
            <h3 className={`text-sm font-semibold ${textSubClass}`}>
              Social links
            </h3>
            <button
              type="button"
              onClick={addSocialLink}
              className={`flex items-center gap-1 px-3 py-1.5 ${cardBgClass} border ${cardBorderClass} rounded-lg text-xs ${textSubClass} hover:border-gray-400 transition`}
            >
              <Plus size={12} /> Add link
            </button>
          </div>
          <div className="p-4 space-y-2">
            {socialLinks.map((link) => (
              <div key={link.id} className="flex gap-2">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) =>
                    handleSocialLinkChange(link.id, e.target.value)
                  }
                  placeholder="https://…"
                  className={`flex-1 px-3 py-2.5 border ${inputBorderClass} rounded-lg text-sm ${inputTextClass} ${placeholderClass} focus:outline-none transition bg-transparent`}
                />
                {socialLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSocialLink(link.id)}
                    className={`px-3 py-2.5 border ${darkMode ? "border-red-800 bg-red-900/20 text-red-400 hover:text-red-300" : "border-red-100 bg-red-50 text-red-400 hover:text-red-600"} rounded-lg transition`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* NFC features */}
        <div className="flex flex-wrap justify-center gap-4 py-2">
          {[
            { icon: <Wifi size={13} />, label: "NFC ready" },
            { icon: <Radio size={13} />, label: "Tap to share" },
            { icon: <Smartphone size={13} />, label: "Universal" },
            { icon: <Cpu size={13} />, label: "Real-time" },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 text-xs ${textLightClass}`}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        {/* Save progress */}
        <AnimatePresence>
          {saving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className={`h-1.5 ${progressBarBgClass} rounded-full overflow-hidden`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className={`h-full ${progressBarFillClass} rounded-full`}
                />
              </div>
              <p className={`text-xs ${textLightClass} text-center mt-2`}>
                Saving profile…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className={`flex-1 py-3 border ${buttonSecondaryClass} rounded-xl text-sm font-semibold transition`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`flex-1 py-3 ${buttonPrimaryClass} rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50`}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={15} /> Save profile
              </>
            )}
          </button>
        </div>
      </form>

      <div className={`text-center text-xs ${textLightClass} pb-6`}>
        © 2026 e-CARD · NFC Digital Business Card Platform · City College of
        Calamba
      </div>
    </div>
  );
};

export default UpdateProfile;

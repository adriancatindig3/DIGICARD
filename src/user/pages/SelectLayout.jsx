import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaGlobe,
  FaTiktok,
  FaPinterest,
  FaReddit,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaCheckCircle,
  FaLink,
} from "react-icons/fa";

const FALLBACK_LOGO = "/CCC.png";

// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, visible, darkMode }) => (
  <div
    style={{
      position: "fixed",
      bottom: 88,
      left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.25s ease, transform 0.25s ease",
      zIndex: 9999,
      pointerEvents: "none",
      background: darkMode ? "#f1f5f9" : "#0f172a",
      color: darkMode ? "#0f172a" : "#f1f5f9",
      padding: "0.6rem 1.1rem",
      borderRadius: "2rem",
      fontSize: "0.78rem",
      fontWeight: 600,
      letterSpacing: "0.01em",
      display: "flex",
      alignItems: "center",
      gap: "0.45rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      whiteSpace: "nowrap",
    }}
  >
    <FaCheckCircle style={{ fontSize: "0.75rem", opacity: 0.8 }} />
    {message}
  </div>
);

const SelectLayout = ({ darkMode }) => {
  const [selectedLayout, setSelectedLayout] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef(null);

  // Double-tap tracking (mobile)
  const lastTapRef = useRef(0);

  const [schoolLogoURL, setSchoolLogoURL] = useState(FALLBACK_LOGO);
  const navigate = useNavigate();

  const bgClass = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textSubClass = darkMode ? "text-gray-400" : "text-gray-500";
  const borderClass = darkMode ? "border-gray-700" : "border-gray-100";
  const mobileHeaderBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const dotActiveClass = darkMode ? "bg-white" : "bg-gray-900";
  const dotInactiveClass = darkMode ? "bg-gray-600" : "bg-gray-300";
  const selectedRingClass = darkMode ? "ring-blue-400" : "ring-blue-500";
  const hoverRingClass = darkMode
    ? "hover:ring-gray-500"
    : "hover:ring-gray-400";
  const navButtonClass = darkMode
    ? "bg-black/50 text-white"
    : "bg-black/30 text-white";

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  };

  useEffect(() => {
    const fetchSchoolLogo = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "school"));
        if (snap.exists() && snap.data().logoURL)
          setSchoolLogoURL(snap.data().logoURL);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSchoolLogo();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(currentUser);
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName: data.displayName || currentUser.displayName || "User",
            email: currentUser.email || "",
            photoURL: data.photoURL || currentUser.photoURL || "",
            bio: data.bio || "",
            location: data.location || "",
            phoneNumber: data.phoneNumber || "",
            occupation: data.occupation || "",
            company: "City College of Calamba",
            socialLinks: {
              facebook: data.socialLinks?.facebook || "",
              twitter: data.socialLinks?.twitter || "",
              instagram: data.socialLinks?.instagram || "",
              linkedin: data.socialLinks?.linkedin || "",
              github: data.socialLinks?.github || "",
              ...data.socialLinks,
            },
            selectedLayout: data.selectedLayout || 1,
            coverPhotoURL: data.coverPhotoURL || "",
            skills: data.skills || "",
          });
          setSelectedLayout(data.selectedLayout || 1);
        } else {
          setUserData({
            displayName: currentUser.displayName || "User",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
            bio: "",
            location: "",
            phoneNumber: "",
            occupation: "",
            company: "City College of Calamba",
            socialLinks: {},
            selectedLayout: 1,
            coverPhotoURL: "",
            skills: "",
          });
        }
      } catch (e) {
        console.error(e);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSelectLayout = async (layoutId) => {
    if (!user || loading) return;
    setLoading(true);
    setSelectedLayout(layoutId);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          selectedLayout: layoutId,
          updatedAt: new Date().toISOString(),
        });
      }
      setUserData((prev) => ({ ...prev, selectedLayout: layoutId }));
      showToast(`Layout ${layoutId} applied`);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  // Double-tap handler (mobile overlay)
  const handleMobileDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 320;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      const id = layouts[currentIndex].id;
      if (id !== selectedLayout) handleSelectLayout(id);
      else showToast(`Layout ${id} already selected`);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const getSocialIcon = (platform) => {
    const map = {
      facebook: <FaFacebook />,
      twitter: <FaTwitter />,
      instagram: <FaInstagram />,
      linkedin: <FaLinkedin />,
      github: <FaGithub />,
      youtube: <FaYoutube />,
      website: <FaGlobe />,
      tiktok: <FaTiktok />,
      pinterest: <FaPinterest />,
      reddit: <FaReddit />,
    };
    return map[platform] || <FaLink />;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const SchoolLogo = ({ className = "w-3 h-3", style = {} }) => (
    <img
      src={schoolLogoURL}
      alt="School logo"
      className={`object-contain ${className}`}
      style={style}
      onError={(e) => {
        e.target.src = FALLBACK_LOGO;
      }}
    />
  );

  // ─── LAYOUTS (Layout1 through Layout9 - same as before) ───────────────────
  // ... (keep all Layout1 through Layout9 exactly as they are) ...

  const Layout1 = () => (
    <div
      className="w-full font-['Inter'] text-white"
      style={{
        background: "linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)",
      }}
    >
      <div className="pt-6 pb-4 px-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
            style={{
              background: "#2a3f2a",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-lg font-semibold"
                style={{ background: "#3a5a3a" }}
              >
                {getInitials(userData?.displayName)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-1 truncate">
              {userData?.displayName}
            </h1>
            {userData?.occupation && (
              <p
                className="text-sm font-medium truncate"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {userData.occupation}
              </p>
            )}
            {userData?.company && (
              <div className="flex items-center gap-1 mt-1">
                <SchoolLogo className="w-3 h-3" style={{ opacity: 0.8 }} />
                <span
                  className="text-xs truncate"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {userData.company}
                </span>
              </div>
            )}
          </div>
        </div>
        {userData?.bio && (
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {userData.bio}
          </p>
        )}
        <div
          className="flex justify-around py-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">
              {userData?.skills?.split(",").length || 0}
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Skills
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {
                Object.values(userData?.socialLinks || {}).filter(Boolean)
                  .length
              }
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Links
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-6 space-y-3">
        {userData?.skills && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="text-xs font-bold mb-3 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills.split(",").map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        {(userData?.email || userData?.phoneNumber) && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="text-xs font-bold mb-3 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Contact
            </h3>
            <div className="space-y-2">
              {userData?.email && (
                <a
                  href={`mailto:${userData.email}`}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  <FaEnvelope />
                  <span>{userData.email}</span>
                </a>
              )}
              {userData?.phoneNumber && (
                <a
                  href={`tel:${userData.phoneNumber}`}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  <FaPhone />
                  <span>{userData.phoneNumber}</span>
                </a>
              )}
            </div>
          </div>
        )}
        {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              className="text-xs font-bold mb-3 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Connect
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(userData.socialLinks)
                .filter(([, v]) => v)
                .map(([p, url]) => (
                  <a
                    key={p}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div style={{ color: "rgba(255,255,255,0.7)" }}>
                      {getSocialIcon(p)}
                    </div>
                    <span
                      className="text-[9px] capitalize"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {p}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const Layout2 = () => (
    <div
      className="w-full font-['Inter'] text-white"
      style={{ background: "#0f1623" }}
    >
      <div className="pt-6 pb-4 px-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
            style={{
              background: "#1e2d45",
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-lg font-semibold"
                style={{ background: "#2a3f5f" }}
              >
                {getInitials(userData?.displayName)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-1 truncate">
              {userData?.displayName}
            </h1>
            {userData?.occupation && (
              <p
                className="text-sm font-medium truncate"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {userData.occupation}
              </p>
            )}
            {userData?.company && (
              <div className="flex items-center gap-1 mt-1">
                <SchoolLogo className="w-3 h-3" style={{ opacity: 0.8 }} />
                <span
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {userData.company}
                </span>
              </div>
            )}
          </div>
        </div>
        {userData?.bio && (
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {userData.bio}
          </p>
        )}
        <div
          className="flex justify-around py-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">
              {userData?.skills?.split(",").length || 0}
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Skills
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {
                Object.values(userData?.socialLinks || {}).filter(Boolean)
                  .length
              }
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Links
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-6 space-y-3">
        {userData?.skills && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3
              className="text-xs font-bold mb-3 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills.split(",").map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        {(userData?.email || userData?.phoneNumber) && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3
              className="text-xs font-bold mb-3 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Contact
            </h3>
            <div className="space-y-2">
              {userData?.email && (
                <a
                  href={`mailto:${userData.email}`}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <FaEnvelope />
                  <span>{userData.email}</span>
                </a>
              )}
              {userData?.phoneNumber && (
                <a
                  href={`tel:${userData.phoneNumber}`}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <FaPhone />
                  <span>{userData.phoneNumber}</span>
                </a>
              )}
            </div>
          </div>
        )}
        {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3
              className="text-xs font-bold mb-3 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Connect
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(userData.socialLinks)
                .filter(([, v]) => v)
                .map(([p, url]) => (
                  <a
                    key={p}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div style={{ color: "rgba(255,255,255,0.65)" }}>
                      {getSocialIcon(p)}
                    </div>
                    <span
                      className="text-[9px] capitalize"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      {p}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const Layout3 = () => (
    <div className="w-full bg-white font-['Inter']">
      <div className="pt-6 pb-4 px-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-lg font-semibold">
                {getInitials(userData?.displayName)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1 truncate">
              {userData?.displayName}
            </h1>
            {userData?.occupation && (
              <p className="text-sm font-medium text-gray-600 truncate">
                {userData.occupation}
              </p>
            )}
            {userData?.company && (
              <div className="flex items-center gap-1 mt-1">
                <SchoolLogo className="w-3 h-3" />
                <span className="text-xs text-gray-400">
                  {userData.company}
                </span>
              </div>
            )}
          </div>
        </div>
        {userData?.bio && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {userData.bio}
          </p>
        )}
        <div className="flex justify-around py-3 border-y border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {userData?.skills?.split(",").length || 0}
            </div>
            <div className="text-xs text-gray-400">Skills</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {
                Object.values(userData?.socialLinks || {}).filter(Boolean)
                  .length
              }
            </div>
            <div className="text-xs text-gray-400">Links</div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-6 space-y-3">
        {userData?.skills && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills.split(",").map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200"
                >
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        {(userData?.email || userData?.phoneNumber) && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Contact
            </h3>
            <div className="space-y-2">
              {userData?.email && (
                <a
                  href={`mailto:${userData.email}`}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <FaEnvelope className="text-gray-400" />
                  <span>{userData.email}</span>
                </a>
              )}
              {userData?.phoneNumber && (
                <a
                  href={`tel:${userData.phoneNumber}`}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <FaPhone className="text-gray-400" />
                  <span>{userData.phoneNumber}</span>
                </a>
              )}
            </div>
          </div>
        )}
        {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Connect
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(userData.socialLinks)
                .filter(([, v]) => v)
                .map(([p, url]) => (
                  <a
                    key={p}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-gray-200"
                  >
                    <div className="text-gray-500">{getSocialIcon(p)}</div>
                    <span className="text-[9px] text-gray-400 capitalize">
                      {p}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const Layout4 = () => (
    <div
      className="w-full font-['Inter'] text-white"
      style={{
        background: "linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)",
      }}
    >
      <div className="h-36 relative overflow-hidden">
        {/* Cover photo without green tint */}
        {userData?.coverPhotoURL ? (
          <img
            src={userData.coverPhotoURL}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            style={{ background: "linear-gradient(135deg, #1a2e1a, #0f1f0f)" }}
            className="w-full h-full"
          />
        )}
      </div>
      <div
        className="px-6 py-4 relative"
        style={{ background: "linear-gradient(135deg, #1a2e1a, #0f1f0f)" }}
      >
        <div
          className="w-20 h-20 rounded-2xl overflow-hidden absolute -top-10 left-6 border-4"
          style={{ borderColor: "#0f1f0f", background: "#2a3f2a" }}
        >
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: "#3a5a3a" }}
            >
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <div className="pt-12">
          <h1 className="text-xl font-bold text-white mb-1">
            {userData?.displayName}
          </h1>
          {userData?.occupation && (
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {userData.occupation}
            </p>
          )}
          {userData?.company && (
            <div
              className="flex items-center gap-2 text-xs mb-4"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              <SchoolLogo className="w-4 h-4" style={{ opacity: 0.8 }} />
              <span>{userData.company}</span>
            </div>
          )}
          {userData?.bio && (
            <p
              className="text-sm leading-relaxed mb-4 pb-4"
              style={{
                color: "rgba(255,255,255,0.7)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {userData.bio}
            </p>
          )}
          {userData?.skills && (
            <div
              className="mb-4 pb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <h3
                className="text-xs font-bold mb-2 uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {userData.skills
                  .split(",")
                  .slice(0, 6)
                  .map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {s.trim()}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {(userData?.email || userData?.phoneNumber) && (
            <div
              className="mb-4 pb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <h3
                className="text-xs font-bold mb-2 uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Contact
              </h3>
              <div className="space-y-2">
                {userData?.email && (
                  <a
                    href={`mailto:${userData.email}`}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <FaEnvelope style={{ color: "rgba(255,255,255,0.5)" }} />
                    </div>
                    <span>{userData.email}</span>
                  </a>
                )}
                {userData?.phoneNumber && (
                  <a
                    href={`tel:${userData.phoneNumber}`}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <FaPhone style={{ color: "rgba(255,255,255,0.5)" }} />
                    </div>
                    <span>{userData.phoneNumber}</span>
                  </a>
                )}
              </div>
            </div>
          )}
          {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
            <div>
              <h3
                className="text-xs font-bold mb-2 uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Connect
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(userData.socialLinks)
                  .filter(([, v]) => v)
                  .map(([p, url]) => (
                    <a
                      key={p}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {getSocialIcon(p)}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Layout5 = () => (
    <div className="w-full font-['Inter']" style={{ background: "#0d1b2e" }}>
      <div className="h-36 relative overflow-hidden">
        {/* Cover photo without brightness reduction */}
        {userData?.coverPhotoURL ? (
          <img
            src={userData.coverPhotoURL}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            style={{ background: "linear-gradient(135deg, #0d1b2e, #1a3a5c)" }}
            className="w-full h-full"
          />
        )}
      </div>
      <div className="px-6 py-4 relative" style={{ background: "#0d1b2e" }}>
        <div
          className="w-20 h-20 rounded-2xl overflow-hidden absolute -top-10 left-6"
          style={{
            border: "4px solid #0d1b2e",
            background: "linear-gradient(135deg, #1a3a5c, #0d1b2e)",
          }}
        >
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: "#1a3a5c" }}
            >
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <div className="pt-12">
          <h1 className="text-xl font-bold text-white mb-1">
            {userData?.displayName}
          </h1>
          {userData?.occupation && (
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "#93b4d4" }}
            >
              {userData.occupation}
            </p>
          )}
          {userData?.company && (
            <div
              className="flex items-center gap-2 text-xs mb-4"
              style={{ color: "#5a8ab0" }}
            >
              <SchoolLogo className="w-4 h-4" />
              <span>{userData.company}</span>
            </div>
          )}
          {userData?.bio && (
            <p
              className="text-sm leading-relaxed mb-4 pb-4"
              style={{
                color: "#93b4d4",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {userData.bio}
            </p>
          )}
          {userData?.skills && (
            <div
              className="mb-4 pb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h3
                className="text-xs font-bold mb-2 uppercase tracking-wider"
                style={{ color: "#5a8ab0" }}
              >
                Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {userData.skills
                  .split(",")
                  .slice(0, 6)
                  .map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "#93b4d4",
                      }}
                    >
                      {s.trim()}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {(userData?.email || userData?.phoneNumber) && (
            <div
              className="mb-4 pb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h3
                className="text-xs font-bold mb-2 uppercase tracking-wider"
                style={{ color: "#5a8ab0" }}
              >
                Contact
              </h3>
              <div className="space-y-2">
                {userData?.email && (
                  <a
                    href={`mailto:${userData.email}`}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "#93b4d4" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <FaEnvelope style={{ color: "#5a8ab0" }} />
                    </div>
                    <span>{userData.email}</span>
                  </a>
                )}
                {userData?.phoneNumber && (
                  <a
                    href={`tel:${userData.phoneNumber}`}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "#93b4d4" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <FaPhone style={{ color: "#5a8ab0" }} />
                    </div>
                    <span>{userData.phoneNumber}</span>
                  </a>
                )}
              </div>
            </div>
          )}
          {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
            <div>
              <h3
                className="text-xs font-bold mb-2 uppercase tracking-wider"
                style={{ color: "#5a8ab0" }}
              >
                Connect
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(userData.socialLinks)
                  .filter(([, v]) => v)
                  .map(([p, url]) => (
                    <a
                      key={p}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "#93b4d4",
                      }}
                    >
                      {getSocialIcon(p)}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Layout6 = () => (
    <div className="w-full bg-white font-['Inter']">
      <div
        className="h-36 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1f2937, #111827)" }}
      >
        {userData?.coverPhotoURL && (
          <img
            src={userData.coverPhotoURL}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="px-6 py-4 relative bg-white">
        <div
          className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg absolute -top-10 left-6"
          style={{ background: "linear-gradient(135deg, #374151, #111827)" }}
        >
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xl font-bold">
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <div className="pt-12">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {userData?.displayName}
          </h1>
          {userData?.occupation && (
            <p className="text-sm text-gray-600 mb-1 font-medium">
              {userData.occupation}
            </p>
          )}
          {userData?.company && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <SchoolLogo className="w-4 h-4" />
              <span>{userData.company}</span>
            </div>
          )}
          {userData?.bio && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 pb-4 border-b border-gray-100">
              {userData.bio}
            </p>
          )}
          {userData?.skills && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {userData.skills
                  .split(",")
                  .slice(0, 6)
                  .map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs border border-gray-200"
                    >
                      {s.trim()}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {(userData?.email || userData?.phoneNumber) && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Contact
              </h3>
              <div className="space-y-2">
                {userData?.email && (
                  <a
                    href={`mailto:${userData.email}`}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FaEnvelope className="text-gray-500 text-xs" />
                    </div>
                    <span>{userData.email}</span>
                  </a>
                )}
                {userData?.phoneNumber && (
                  <a
                    href={`tel:${userData.phoneNumber}`}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FaPhone className="text-gray-500 text-xs" />
                    </div>
                    <span>{userData.phoneNumber}</span>
                  </a>
                )}
              </div>
            </div>
          )}
          {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Connect
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(userData.socialLinks)
                  .filter(([, v]) => v)
                  .map(([p, url]) => (
                    <a
                      key={p}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs"
                    >
                      {getSocialIcon(p)}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Layout7 = () => (
    <div
      className="w-full font-['Inter'] text-white"
      style={{ background: "linear-gradient(160deg, #2a3a2a, #1a2a1e)" }}
    >
      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <div
          className="w-24 h-24 rounded-full overflow-hidden border-2 mb-3"
          style={{ borderColor: "rgba(255,255,255,0.3)" }}
        >
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-green-900 text-white text-2xl font-medium">
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <h1 className="text-xl font-medium text-white mb-1">
          {userData?.displayName}
        </h1>
        <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
          {userData?.occupation}
          {userData?.occupation && userData?.company ? " | " : ""}
          {userData?.company}
        </p>

        {/* Bio */}
        {userData?.bio && (
          <p
            className="text-xs text-center mb-4"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {userData.bio}
          </p>
        )}

        <button
          className="w-full py-3 rounded-xl text-sm font-medium mb-4"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "0.5px solid rgba(255,255,255,0.25)",
          }}
        >
          Let's connect
        </button>

        {/* Skills Section */}
        {userData?.skills && (
          <div className="w-full mb-4">
            <h3
              className="text-xs font-bold mb-2 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills
                .split(",")
                .slice(0, 6)
                .map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {s.trim()}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="w-full space-y-2">
          {/* Phone */}
          {userData?.phoneNumber && (
            <a
              href={`tel:${userData.phoneNumber}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <FaPhone />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Call me</div>
                <div className="text-[11px] opacity-60">
                  {userData.phoneNumber}
                </div>
              </div>
              <span className="text-xs opacity-40">↗</span>
            </a>
          )}

          {/* Email */}
          {userData?.email && (
            <a
              href={`mailto:${userData.email}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <FaEnvelope />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Email me</div>
                <div className="text-[11px] opacity-60">{userData.email}</div>
              </div>
              <span className="text-xs opacity-40">↗</span>
            </a>
          )}

          {/* Location */}
          {userData?.location && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <FaMapMarkerAlt />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Location</div>
              </div>
            </div>
          )}
          {/* Social Links */}
          {Object.entries(userData?.socialLinks || {})
            .filter(([, v]) => v)
            .map(([p, url]) => (
              <a
                key={p}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  {getSocialIcon(p)}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium capitalize">
                    Follow me
                  </div>
                  <div className="text-[11px] opacity-60">
                    {url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
                  </div>
                </div>
                <span className="text-xs opacity-40">↗</span>
              </a>
            ))}
        </div>
      </div>
    </div>
  );

  const Layout8 = () => (
    <div
      className="w-full font-['Inter'] text-white"
      style={{ background: "#0f1623" }}
    >
      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <div
          className="w-24 h-24 rounded-full overflow-hidden border-2 mb-3"
          style={{ borderColor: "rgba(255,255,255,0.2)" }}
        >
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-700 text-white text-2xl font-medium">
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <h1 className="text-xl font-medium text-white mb-1">
          {userData?.displayName}
        </h1>
        <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
          {userData?.occupation}
          {userData?.occupation && userData?.company ? " | " : ""}
          {userData?.company}
        </p>

        {/* Bio */}
        {userData?.bio && (
          <p
            className="text-xs text-center mb-4"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {userData.bio}
          </p>
        )}

        <button
          className="w-full py-3 rounded-xl text-sm font-medium mb-4"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.15)",
          }}
        >
          Let's connect
        </button>

        {/* Skills Section */}
        {userData?.skills && (
          <div className="w-full mb-4">
            <h3
              className="text-xs font-bold mb-2 uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills
                .split(",")
                .slice(0, 6)
                .map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {s.trim()}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="w-full space-y-2">
          {/* Phone */}
          {userData?.phoneNumber && (
            <a
              href={`tel:${userData.phoneNumber}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <FaPhone />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Call me</div>
                <div className="text-[11px] opacity-55">
                  {userData.phoneNumber}
                </div>
              </div>
              <span className="text-xs opacity-35">↗</span>
            </a>
          )}

          {/* Email */}
          {userData?.email && (
            <a
              href={`mailto:${userData.email}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <FaEnvelope />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Email me</div>
                <div className="text-[11px] opacity-55">{userData.email}</div>
              </div>
              <span className="text-xs opacity-35">↗</span>
            </a>
          )}

          {/* Location */}
          {userData?.location && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <FaMapMarkerAlt />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">Location</div>
              </div>
            </div>
          )}

          {/* Social Links */}
          {Object.entries(userData?.socialLinks || {})
            .filter(([, v]) => v)
            .map(([p, url]) => (
              <a
                key={p}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  {getSocialIcon(p)}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium capitalize">
                    Follow me
                  </div>
                  <div className="text-[11px] opacity-55">
                    {url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
                  </div>
                </div>
                <span className="text-xs opacity-35">↗</span>
              </a>
            ))}
        </div>
      </div>
    </div>
  );

  const Layout9 = () => (
    <div className="w-full bg-white font-['Inter']">
      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200 mb-3">
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-2xl font-medium">
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <h1 className="text-xl font-medium text-gray-900 mb-1">
          {userData?.displayName}
        </h1>
        <p className="text-xs text-gray-500 mb-2">
          {userData?.occupation}
          {userData?.occupation && userData?.company ? " | " : ""}
          <span className="underline">{userData?.company}</span>
        </p>

        {/* Bio */}
        {userData?.bio && (
          <p className="text-xs text-center text-gray-600 mb-4">
            {userData.bio}
          </p>
        )}

        <button className="w-full py-3 rounded-xl text-sm font-medium mb-4 bg-gray-900 text-white">
          Let's connect
        </button>

        {/* Skills Section */}
        {userData?.skills && (
          <div className="w-full mb-4">
            <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills
                .split(",")
                .slice(0, 6)
                .map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs border border-gray-200"
                  >
                    {s.trim()}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="w-full space-y-2">
          {/* Phone */}
          {userData?.phoneNumber && (
            <a
              href={`tel:${userData.phoneNumber}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline"
              style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-500">
                <FaPhone className="text-white text-xs" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-900">Call me</div>
                <div className="text-[11px] text-gray-500">
                  {userData.phoneNumber}
                </div>
              </div>
              <span className="text-xs text-gray-400">↗</span>
            </a>
          )}

          {/* Email */}
          {userData?.email && (
            <a
              href={`mailto:${userData.email}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline"
              style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500">
                <FaEnvelope className="text-white text-xs" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-900">
                  Email me
                </div>
                <div className="text-[11px] text-gray-500">
                  {userData.email}
                </div>
              </div>
              <span className="text-xs text-gray-400">↗</span>
            </a>
          )}
          {/* Location - Fixed with red background */}
          {userData?.location && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500">
                <FaMapMarkerAlt className="text-white text-xs" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-900">
                  Location
                </div>
              </div>
            </div>
          )}
          {/* Social Links */}
          {Object.entries(userData?.socialLinks || {})
            .filter(([, v]) => v)
            .map(([p, url]) => (
              <a
                key={p}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline"
                style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-600">
                  <span className="text-white text-xs">{getSocialIcon(p)}</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900 capitalize">
                    Follow me
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
                  </div>
                </div>
                <span className="text-xs text-gray-400">↗</span>
              </a>
            ))}
        </div>
      </div>
    </div>
  );

  const layouts = [
    { id: 1, component: <Layout1 /> },
    { id: 2, component: <Layout2 /> },
    { id: 3, component: <Layout3 /> },
    { id: 4, component: <Layout4 /> },
    { id: 5, component: <Layout5 /> },
    { id: 6, component: <Layout6 /> },
    { id: 7, component: <Layout7 /> },
    { id: 8, component: <Layout8 /> },
    { id: 9, component: <Layout9 /> },
  ];

  // ─── TOUCH SWIPE ────────────────────────────────────────────────────────────
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
    setDragOffset(0);
  };

  const onTouchMove = (e) => {
    const current = e.targetTouches[0].clientX;
    setTouchEnd(current);
    if (touchStart !== null) {
      const offset = current - touchStart;
      setDragOffset(Math.max(-120, Math.min(120, offset)));
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setDragOffset(0);
      return;
    }
    const distance = touchStart - touchEnd;
    const goNext =
      distance > minSwipeDistance && currentIndex < layouts.length - 1;
    const goPrev = distance < -minSwipeDistance && currentIndex > 0;

    if (goNext || goPrev) {
      setIsAnimating(true);
      setSlideDirection(goNext ? "left" : "right");
      setDragOffset(goNext ? -window.innerWidth : window.innerWidth);
      setTimeout(() => {
        setCurrentIndex((i) => (goNext ? i + 1 : i - 1));
        setDragOffset(0);
        setIsAnimating(false);
        setSlideDirection(null);
      }, 280);
    } else {
      setDragOffset(0);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const goToIndex = (newIndex) => {
    if (newIndex === currentIndex) return;
    setIsAnimating(true);
    setSlideDirection(newIndex > currentIndex ? "left" : "right");
    setDragOffset(
      newIndex > currentIndex ? -window.innerWidth : window.innerWidth,
    );
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setDragOffset(0);
      setIsAnimating(false);
      setSlideDirection(null);
    }, 280);
  };

  if (!user || !userData) {
    return (
      <div
        className={`min-h-screen ${bgClass} flex items-center justify-center`}
      >
        <div
          className={`w-10 h-10 border-2 ${darkMode ? "border-gray-700 border-t-white" : "border-gray-200 border-t-gray-900"} rounded-full animate-spin`}
        />
      </div>
    );
  }

  const currentLayout = layouts[currentIndex];

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <Toast
        message={toastMessage}
        visible={toastVisible}
        darkMode={darkMode}
      />

      {/* ── MOBILE ── */}
      <div className="md:hidden flex flex-col h-screen">
        <div
          className={`flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0 ${mobileHeaderBgClass}`}
        >
          <div>
            <h2 className={`text-base font-semibold ${textClass}`}>
              Choose a theme
            </h2>
            <p className={`text-xs ${textSubClass} mt-0.5`}>
              Double-tap to select
            </p>
          </div>
          <span className={`text-sm ${textSubClass}`}>
            {currentIndex + 1} / {layouts.length}
          </span>
        </div>

        <div className="flex justify-center gap-1.5 pb-3 flex-shrink-0">
          {layouts.map((_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              className={`rounded-full transition-all ${i === currentIndex ? `w-5 h-2 ${dotActiveClass}` : `w-2 h-2 ${dotInactiveClass}`}`}
            />
          ))}
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 pb-4"
          style={{ minHeight: 0 }}
        >
          <div className="relative rounded-2xl overflow-hidden">
            {selectedLayout === currentLayout.id && (
              <div
                className={`absolute inset-0 ring-2 ${selectedRingClass} rounded-2xl z-10 pointer-events-none`}
              />
            )}

            {selectedLayout === currentLayout.id && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  zIndex: 20,
                  background: darkMode ? "#1d4ed8" : "#2563eb",
                  color: "#fff",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.55rem",
                  borderRadius: "2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  pointerEvents: "none",
                }}
              >
                <FaCheckCircle style={{ fontSize: "0.6rem" }} /> Selected
              </div>
            )}

            <div
              className="w-full rounded-2xl overflow-hidden"
              style={{
                transform: `translateX(${dragOffset}px) scale(${isAnimating ? 0.97 : dragOffset !== 0 ? Math.max(0.94, 1 - Math.abs(dragOffset) / 800) : 1})`,
                transition: isAnimating
                  ? "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease"
                  : dragOffset === 0
                    ? "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)"
                    : "none",
                opacity: isAnimating
                  ? 0
                  : Math.max(0.6, 1 - Math.abs(dragOffset) / 300),
              }}
            >
              {currentLayout.component}
            </div>

            <div
              className="absolute inset-0 z-20"
              style={{ touchAction: "pan-y" }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={(e) => {
                const dx =
                  touchStart !== null && touchEnd !== null
                    ? Math.abs(touchStart - touchEnd)
                    : 0;
                if (dx < 10) handleMobileDoubleTap();
                onTouchEnd();
              }}
            />

            {currentIndex > 0 && (
              <button
                className={`absolute left-2 top-16 z-30 w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-bold ${navButtonClass}`}
                style={{ backdropFilter: "blur(4px)" }}
                onClick={() => goToIndex(currentIndex - 1)}
              >
                ‹
              </button>
            )}
            {currentIndex < layouts.length - 1 && (
              <button
                className={`absolute right-2 top-16 z-30 w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-bold ${navButtonClass}`}
                style={{ backdropFilter: "blur(4px)" }}
                onClick={() => goToIndex(currentIndex + 1)}
              >
                ›
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className={`text-xl font-bold ${textClass}`}>Choose a theme</h2>
          <p className={`text-sm ${textSubClass} mt-1`}>
            Click "Select" on any layout to apply it
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {layouts.map((layout) => {
            const isSelected = selectedLayout === layout.id;
            return (
              <div key={layout.id} className="flex flex-col gap-3">
                <div
                  className={`rounded-2xl transition-all relative overflow-hidden ${
                    isSelected
                      ? `ring-2 ${selectedRingClass} shadow-lg`
                      : `ring-1 ${darkMode ? "ring-gray-700" : "ring-gray-200"} ${hoverRingClass}`
                  }`}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 10,
                        background: darkMode ? "#1d4ed8" : "#2563eb",
                        color: "#fff",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "2rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        pointerEvents: "none",
                      }}
                    >
                      <FaCheckCircle style={{ fontSize: "0.6rem" }} /> Selected
                    </div>
                  )}

                  {loading && selectedLayout === layout.id && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        background: "rgba(0,0,0,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "1rem",
                      }}
                    >
                      <div
                        className={`w-6 h-6 border-2 ${darkMode ? "border-white/40 border-t-white" : "border-gray-400 border-t-gray-900"} rounded-full animate-spin`}
                      />
                    </div>
                  )}

                  <div className="w-full rounded-2xl overflow-hidden pointer-events-none">
                    {layout.component}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectLayout(layout.id)}
                  disabled={loading && selectedLayout === layout.id}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? darkMode
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-default"
                        : "bg-blue-50 text-blue-600 border border-blue-200 cursor-default"
                      : darkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-900 text-white hover:bg-gray-700"
                  } ${loading && selectedLayout === layout.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {loading && selectedLayout === layout.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className={`w-3 h-3 border-2 ${darkMode ? "border-white/30 border-t-white" : "border-gray-400 border-t-gray-900"} rounded-full animate-spin`}
                      />
                      Applying...
                    </span>
                  ) : isSelected ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaCheckCircle size={12} /> Selected
                    </span>
                  ) : (
                    `Select Layout ${layout.id}`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SelectLayout;

// src/user/pages/ViewQr.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import QRCodeLib from "react-qr-code";
const QRCode = QRCodeLib.default || QRCodeLib.QRCode || QRCodeLib;
import { Download, Copy, Check, Wifi, Smartphone } from "lucide-react";
import Color from "colorjs.io";

function ViewQr({ darkMode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState({ name: "", email: "", profileUrl: "" });
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrFloatingBoxRef = useRef(null);

  // hotdog
  const getProfileUrl = (userId) => {
    // Get current origin (https://yourdomain.com)
    const origin = window.location.origin;
    return `${origin}/profile/${userId}`;
  };

  // Function to convert oklch to rgb
  const convertOklchToRgb = (oklchString) => {
    try {
      // Match oklch(0.65 0.15 250) pattern
      const match = oklchString.match(
        /oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/,
      );
      if (match) {
        const l = parseFloat(match[1]);
        const c = parseFloat(match[2]);
        const h = parseFloat(match[3]);

        const color = new Color(`oklch(${l} ${c} ${h})`);
        const rgb = color.to("srgb");

        return `rgb(${Math.round(rgb.coords[0] * 255)}, ${Math.round(rgb.coords[1] * 255)}, ${Math.round(rgb.coords[2] * 255)})`;
      }
    } catch (e) {
      console.warn("Failed to convert oklch color:", oklchString);
    }
    return null;
  };

  // Function to process all styles in the cloned document
  const processStylesForClone = (clonedDoc) => {
    const allElements = clonedDoc.querySelectorAll("*");

    allElements.forEach((el) => {
      const computedStyle = clonedDoc.defaultView.getComputedStyle(el);

      // Check and convert background colors
      const bgColor = computedStyle.backgroundColor;
      if (bgColor && bgColor.includes("oklch")) {
        const rgbColor = convertOklchToRgb(bgColor);
        if (rgbColor) el.style.backgroundColor = rgbColor;
      }

      // Check and convert text colors
      const textColor = computedStyle.color;
      if (textColor && textColor.includes("oklch")) {
        const rgbColor = convertOklchToRgb(textColor);
        if (rgbColor) el.style.color = rgbColor;
      }

      // Check and convert border colors
      const borderColor = computedStyle.borderColor;
      if (borderColor && borderColor.includes("oklch")) {
        const rgbColor = convertOklchToRgb(borderColor);
        if (rgbColor) el.style.borderColor = rgbColor;
      }

      // Check all inline styles
      if (el.style.background && el.style.background.includes("oklch")) {
        const rgbColor = convertOklchToRgb(el.style.background);
        if (rgbColor) el.style.background = rgbColor;
      }

      if (
        el.style.backgroundColor &&
        el.style.backgroundColor.includes("oklch")
      ) {
        const rgbColor = convertOklchToRgb(el.style.backgroundColor);
        if (rgbColor) el.style.backgroundColor = rgbColor;
      }

      if (el.style.color && el.style.color.includes("oklch")) {
        const rgbColor = convertOklchToRgb(el.style.color);
        if (rgbColor) el.style.color = rgbColor;
      }

      // Handle gradients
      if (
        el.style.backgroundImage &&
        el.style.backgroundImage.includes("oklch")
      ) {
        // Replace oklch in gradient
        let gradient = el.style.backgroundImage;
        const oklchMatches = gradient.match(/oklch\([^)]+\)/g);
        if (oklchMatches) {
          oklchMatches.forEach((oklch) => {
            const rgbColor = convertOklchToRgb(oklch);
            if (rgbColor) {
              gradient = gradient.replace(oklch, rgbColor);
            }
          });
          el.style.backgroundImage = gradient;
        }
      }
    });
  };

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
        const data = userDoc.exists() ? userDoc.data() : {};
        setQrData({
          name: data.displayName || currentUser.displayName || "User",
          email: currentUser.email || "",
          profileUrl: getProfileUrl(currentUser.uid),
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setQrData({
          name: currentUser.displayName || "User",
          email: currentUser.email || "",
          profileUrl: getProfileUrl(currentUser.uid),
        });
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrData.profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    if (!qrFloatingBoxRef.current) return;
    setDownloading(true);
    try {
      const element = qrFloatingBoxRef.current;

      // Dynamic import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      // Capture with style processing
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 4,
        logging: false,
        useCORS: true,
        allowTaint: false,
        onclone: (clonedDoc, element) => {
          // Process all oklch colors in the cloned document
          processStylesForClone(clonedDoc);
        },
      });

      // Download
      const link = document.createElement("a");
      link.download = `QR_Code_${qrData.name.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. The QR code square will be saved as PNG.");
    } finally {
      setDownloading(false);
    }
  };

  // Theme-based classes
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textSubClass = darkMode ? "text-gray-400" : "text-gray-500";
  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorderClass = darkMode ? "border-gray-700" : "border-gray-100";
  const inputBgClass = darkMode ? "bg-gray-900" : "bg-gray-50";
  const inputBorderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const inputTextClass = darkMode ? "text-gray-300" : "text-gray-500";
  const infoBgClass = darkMode ? "bg-gray-800" : "bg-gray-50";
  const infoBorderClass = darkMode ? "border-gray-700" : "border-gray-100";
  const iconBgClass = darkMode
    ? "bg-gray-700 border-gray-600"
    : "bg-gray-100 border-gray-200";
  const iconTextClass = darkMode ? "text-gray-400" : "text-gray-500";
  const dividerClass = darkMode ? "bg-gray-800" : "bg-gray-100";
  const dotClass = darkMode ? "bg-gray-600" : "bg-gray-300";
  const copyButtonClass = copied
    ? darkMode
      ? "bg-green-900/20 text-green-400 border-green-800"
      : "bg-green-50 text-green-600 border-green-200"
    : darkMode
      ? "bg-white text-gray-900 hover:opacity-80"
      : "bg-gray-900 text-white hover:opacity-80";
  const downloadButtonClass = darkMode
    ? "bg-white text-gray-900 hover:opacity-80"
    : "bg-gray-900 text-white hover:opacity-80";
  const gradientClass = darkMode
    ? "from-gray-600 via-gray-400 to-gray-600"
    : "from-gray-900 via-gray-500 to-gray-900";
  const footerTextClass = darkMode ? "text-gray-700" : "text-gray-300";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className={`w-10 h-10 border-4 ${darkMode ? "border-gray-700 border-t-white" : "border-gray-200 border-t-gray-900"} rounded-full animate-spin`}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold ${textClass}`}>
          My QR Code
        </h1>
        <p className={`${textSubClass} mt-1 text-sm`}>
          Scan to instantly view your digital card
        </p>
      </div>

      {/* Main QR Card */}
      <div
        className={`${cardBgClass} rounded-2xl border ${cardBorderClass} shadow-sm overflow-hidden`}
      >
        <div className={`h-1 bg-gradient-to-r ${gradientClass}`} />

        <div className="p-6 md:p-10">
          {/* QR Code centered */}
          <div className="flex flex-col items-center mb-8">
            {/* Floating white box - this is what gets downloaded */}
            <div
              ref={qrFloatingBoxRef}
              className="p-5 bg-white rounded-2xl shadow-md border border-gray-100 mb-5"
              style={{ backgroundColor: "#ffffff" }} // Force white background
            >
              <QRCode
                value={qrData.profileUrl}
                size={190}
                level="L"
                bgColor="#ffffff"
                fgColor="#111111"
              />
            </div>

            <div className="text-center mb-5">
              <div className={`text-base font-semibold ${textClass} mb-0.5`}>
                {qrData.name}
              </div>
              <div className={`text-xs ${textSubClass}`}>{qrData.email}</div>
            </div>

            <button
              onClick={handleDownloadQR}
              disabled={downloading}
              className={`flex items-center gap-2 px-6 py-2.5 ${downloadButtonClass} rounded-full text-sm font-medium transition disabled:opacity-50`}
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={15} />
                  Download QR
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className={`flex-1 h-px ${dividerClass}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            <div className={`flex-1 h-px ${dividerClass}`} />
          </div>

          {/* Shareable link */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2.5">
              <Wifi size={12} className={textSubClass} />
              <span
                className={`text-xs font-semibold ${textSubClass} uppercase tracking-widest`}
              >
                Shareable Link
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className={`flex-1 min-w-0 px-3 py-2.5 ${inputBgClass} border ${inputBorderClass} rounded-xl overflow-hidden`}
              >
                <code
                  className={`text-xs ${inputTextClass} font-mono block truncate`}
                >
                  {qrData.profileUrl}
                </code>
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border ${copyButtonClass} sm:w-auto w-full`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Info box */}
          <div
            className={`flex items-start gap-3 p-3.5 ${infoBgClass} border ${infoBorderClass} rounded-xl`}
          >
            <div
              className={`w-8 h-8 rounded-lg ${iconBgClass} flex items-center justify-center flex-shrink-0`}
            >
              <Smartphone size={13} className={iconTextClass} />
            </div>
            <p className={`text-xs ${textSubClass} leading-relaxed`}>
              This QR code links directly to your e-CARD profile. Anyone who
              scans it can view your digital identity card instantly.{" "}
              <span
                className={
                  darkMode
                    ? "font-semibold text-gray-300"
                    : "font-semibold text-gray-700"
                }
              >
                NFC ready
              </span>{" "}
              — tap to share!
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex justify-center gap-5 mt-5 flex-wrap">
            {["Tap to Share", "No App Needed", "Real-time"].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                <span className={`text-xs ${textSubClass}`}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={`text-center text-[10px] ${footerTextClass} mt-6`}>
        © 2026 e-CARD · NFC Digital Business Card Platform · City College of
        Calamba
      </p>
    </div>
  );
}

export default ViewQr;

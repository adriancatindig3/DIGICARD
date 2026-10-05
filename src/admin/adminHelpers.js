import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Loader2,
  Users,
  BarChart2,
  ClipboardList,
  Settings,
  Activity,
} from "lucide-react";
import React from "react";

// ─── Helper Functions ──────────────────────────────────────────────────────
export const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const formatDate = (ts) => {
  if (!ts) return "—";
  try {
    return new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleDateString();
  } catch {
    return "—";
  }
};

export const formatDateTime = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "—";
  }
};

export const timeAgo = (ts) => {
  if (!ts) return "—";
  try {
    const d = new Date(ts.seconds ? ts.seconds * 1000 : ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "—";
  }
};

export const logAdminAction = async (
  adminEmail,
  action,
  targetUser = null,
  details = "",
  extraData = {},
) => {
  try {
    const logEntry = {
      adminEmail,
      action,
      timestamp: serverTimestamp(),
      details,
    };

    if (extraData.adminName) logEntry.adminName = extraData.adminName;
    if (targetUser) {
      logEntry.targetUserId = targetUser.id || "";
      logEntry.targetUserName = targetUser.displayName || "";
      logEntry.targetUserEmail = targetUser.email || "";
    }
    if (extraData.roleName) logEntry.roleName = extraData.roleName;
    if (extraData.roleColor) logEntry.roleColor = extraData.roleColor;
    if (extraData.changes) logEntry.changes = extraData.changes;

    await addDoc(collection(db, "adminLogs"), logEntry);
  } catch (e) {
    console.error("Failed to write admin log:", e);
  }
};

// ─── Theme Configuration - Clean Professional Design ──────────────────────
export const getTheme = (darkMode) => {
  return darkMode
    ? {
        bg: "#0F1117",
        card: "#1A1D24",
        cardBorder: "#2A2D35",
        text: "#E8EDF2",
        textSub: "#9CA3AF",
        textMuted: "#6B7280",
        inputBg: "#252830",
        headerBg: "#1A1D24",
        hoverBg: "#252830",
        accent: "#3B82F6",
        accentHover: "#2563EB",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      }
    : {
        bg: "#F3F4F6",
        card: "#FFFFFF",
        cardBorder: "#E5E7EB",
        text: "#111827",
        textSub: "#4B5563",
        textMuted: "#9CA3AF",
        inputBg: "#F9FAFB",
        headerBg: "#FFFFFF",
        hoverBg: "#F3F4F6",
        accent: "#3B82F6",
        accentHover: "#2563EB",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      };
};

// ─── Constants ──────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
    color: "#F59E0B",
  },
  approved: {
    label: "Approved",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    color: "#10B981",
  },
  rejected: {
    label: "Rejected",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    color: "#EF4444",
  },
};

export const ACTION_LOG_CONFIG = {
  APPROVE: {
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.2)",
    icon: React.createElement(CheckCircle, { size: 11 }),
    text: "Approved",
  },
  REJECT: {
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.2)",
    icon: React.createElement(XCircle, { size: 11 }),
    text: "Rejected",
  },
  DELETE: {
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.2)",
    icon: React.createElement(Trash2, { size: 11 }),
    text: "Deleted",
  },
  UPDATE_LOGO: {
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.2)",
    icon: null,
    text: "Logo Updated",
  },
  UPDATE_SETTINGS: {
    color: "#4299E1",
    bg: "rgba(66, 153, 225, 0.1)",
    border: "rgba(66, 153, 225, 0.2)",
    icon: React.createElement(Settings, { size: 11 }),
    text: "Settings Updated",
  },
  ADD_ROLE: {
    color: "#48BB78",
    bg: "rgba(72, 187, 120, 0.1)",
    border: "rgba(72, 187, 120, 0.2)",
    icon: React.createElement(CheckCircle, { size: 11 }),
    text: "Role Added",
  },
  EDIT_ROLE: {
    color: "#ED8936",
    bg: "rgba(237, 137, 54, 0.1)",
    border: "rgba(237, 137, 54, 0.2)",
    icon: React.createElement(Settings, { size: 11 }),
    text: "Role Edited",
  },
  DELETE_ROLE: {
    color: "#E53E3E",
    bg: "rgba(229, 62, 62, 0.1)",
    border: "rgba(229, 62, 62, 0.2)",
    icon: React.createElement(Trash2, { size: 11 }),
    text: "Role Deleted",
  },
  BULK_IMPORT: {
    color: "#38B2AC",
    bg: "rgba(56, 178, 172, 0.1)",
    border: "rgba(56, 178, 172, 0.2)",
    icon: null,
    text: "Bulk Import",
  },
  EXPORT_DATA: {
    color: "#805AD5",
    bg: "rgba(128, 90, 213, 0.1)",
    border: "rgba(128, 90, 213, 0.2)",
    icon: null,
    text: "Export Data",
  },
  LOGIN: {
    color: "#4299E1",
    bg: "rgba(66, 153, 225, 0.1)",
    border: "rgba(66, 153, 225, 0.2)",
    icon: null,
    text: "Login",
  },
  LOGOUT: {
    color: "#718096",
    bg: "rgba(113, 128, 150, 0.1)",
    border: "rgba(113, 128, 150, 0.2)",
    icon: null,
    text: "Logout",
  },
};

export const TABS = [
  {
    id: "users",
    icon: React.createElement(Users, { size: 16 }),
    label: "Users",
  },
  {
    id: "analytics",
    icon: React.createElement(BarChart2, { size: 16 }),
    label: "Analytics",
  },
  {
    id: "logs",
    icon: React.createElement(ClipboardList, { size: 16 }),
    label: "Activity Logs",
  },
  {
    id: "settings",
    icon: React.createElement(Settings, { size: 16 }),
    label: "Settings",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────
export function FilterPill({ label, active, onClick }) {
  return React.createElement(
    "button",
    {
      onClick: onClick,
      className: `filter-pill ${active ? "active" : ""}`,
      style: {
        padding: "0.5rem 1.25rem",
        borderRadius: "0.5rem",
        fontSize: "0.813rem",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.2s",
        border: active ? "none" : "1px solid #E5E7EB",
        background: active ? "#3B82F6" : "transparent",
        color: active ? "white" : "#4B5563",
      },
    },
    label,
  );
}

export function ActionBtn({ label, onClick, disabled, variant = "primary" }) {
  const variants = {
    approve: { bg: "#10B981", hover: "#059669" },
    reject: { bg: "#EF4444", hover: "#DC2626" },
    delete: { bg: "#EF4444", hover: "#DC2626" },
    primary: { bg: "#3B82F6", hover: "#2563EB" },
  };

  const style = variants[variant] || variants.primary;

  return React.createElement(
    "button",
    {
      onClick: onClick,
      disabled: disabled,
      className: "action-btn",
      style: {
        padding: "0.375rem 1rem",
        borderRadius: "0.5rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        background: style.bg,
        border: "none",
        color: "white",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      },
      onMouseEnter: (e) => {
        if (!disabled) e.currentTarget.style.background = style.hover;
      },
      onMouseLeave: (e) => {
        if (!disabled) e.currentTarget.style.background = style.bg;
      },
    },
    label,
  );
}

// AnalyticsBar component - UPDATED to match UpdateProfile dark mode colors
export function AnalyticsBar({ label, value, max, color, darkMode }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  // Colors matching UpdateProfile.jsx dark mode
  const labelColor = darkMode ? "#9CA3AF" : "#4B5563"; // text-gray-400 / text-gray-500
  const valueColor = color; // dynamic color passed in
  const percentColor = darkMode ? "#6B7280" : "#9CA3AF"; // text-gray-500 / text-gray-400
  const barBgColor = darkMode ? "#374151" : "#F3F4F6"; // bg-gray-700 / bg-gray-100

  return React.createElement("div", { style: { marginBottom: "1rem" } }, [
    React.createElement(
      "div",
      {
        key: "header",
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        },
      },
      [
        React.createElement(
          "span",
          {
            key: "label",
            style: { fontSize: "0.75rem", fontWeight: 500, color: labelColor },
          },
          label,
        ),
        React.createElement(
          "span",
          {
            key: "value",
            style: { fontSize: "0.75rem", fontWeight: 600, color: valueColor },
          },
          value,
          " ",
          React.createElement(
            "span",
            { style: { color: percentColor, fontWeight: 400 } },
            `(${pct}%)`,
          ),
        ),
      ],
    ),
    React.createElement(
      "div",
      {
        key: "bar",
        style: {
          height: 8,
          borderRadius: 4,
          background: barBgColor,
          overflow: "hidden",
        },
      },
      React.createElement("div", {
        style: {
          height: "100%",
          width: `${pct}%`,
          borderRadius: 4,
          background: color,
          transition: "width 0.6s ease",
        },
      }),
    ),
  ]);
}

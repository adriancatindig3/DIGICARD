import { useState } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  FilterPill,
  STATUS_CONFIG,
  getInitials,
  formatDate,
  logAdminAction,
} from "./adminHelpers";
import {
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Link2,
  Copy,
  Check,
} from "lucide-react";

const AdminUsers = ({
  users,
  loading,
  darkMode,
  T,
  onRefresh,
  currentUser,
  dynamicRoles,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [copiedUserId, setCopiedUserId] = useState(null);

  const dm = darkMode;

  // Base URL for profile links - change this to your actual domain
  const BASE_URL = window.location.origin; // or "https://yourdomain.com"

  const roleFilterOptions = [
    { id: "all", label: "All Roles" },
    ...dynamicRoles.map((r) => ({ id: r.value, label: r.label })),
  ];

  const STATUS_FILTERS = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Active" },
    { id: "rejected", label: "Rejected" },
  ];

  const getRoleCfg = (occupation) => {
    if (!occupation)
      return {
        bg: dm ? "rgba(100,116,139,0.15)" : "rgba(100,116,139,0.1)",
        border: "rgba(100,116,139,0.3)",
        color: "#64748b",
      };
    const role = dynamicRoles.find(
      (r) => r.value === occupation.toLowerCase().replace(/\s+/g, "-"),
    );
    if (role) {
      const hex = role.color || "#4299E1";
      return { bg: hex + "22", border: hex + "55", color: hex };
    }
    return {
      bg: dm ? "rgba(96,165,250,0.15)" : "rgba(96,165,250,0.1)",
      border: "rgba(96,165,250,0.35)",
      color: "#60a5fa",
    };
  };

  // Generate profile link for a user
  const getProfileLink = (userId) => {
    return `${BASE_URL}/profile/${userId}`;
  };

  // Copy link to clipboard
  const copyToClipboard = async (text, userId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleApproveUser = async (userId) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        accountStatus: "approved",
        isActive: true,
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.email || "admin",
      });
      await logAdminAction(
        currentUser?.email,
        "APPROVE",
        selectedUser,
        "Account approved",
      );
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
      setShowConfirmModal(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleRejectUser = async (userId) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        accountStatus: "rejected",
        isActive: false,
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser?.email || "admin",
      });
      await logAdminAction(
        currentUser?.email,
        "REJECT",
        selectedUser,
        "Account rejected",
      );
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
      setShowConfirmModal(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        accountStatus: "deleted",
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.email || "admin",
      });
      await logAdminAction(
        currentUser?.email,
        "DELETE",
        selectedUser,
        "Account deleted",
      );
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
      setShowConfirmModal(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const openConfirmModal = (u, action) => {
    setSelectedUser(u);
    setActionType(action);
    setShowConfirmModal(true);
  };
  const handleConfirmAction = () => {
    if (!selectedUser) return;
    if (actionType === "approve") handleApproveUser(selectedUser.id);
    else if (actionType === "reject") handleRejectUser(selectedUser.id);
    else if (actionType === "delete") handleDeleteUser(selectedUser.id);
  };

  const filteredUsers = users.filter((u) => {
    if (u.role === "admin") return false;
    const matchSearch =
      !searchTerm ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole =
      filterRole === "all" ||
      u.occupation?.toLowerCase().replace(/\s+/g, "-") === filterRole;
    const matchStatus =
      filterStatus === "all" || u.accountStatus === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Styles ──
  const card = {
    background: dm ? "#1f2937" : "#ffffff",
    border: `1px solid ${dm ? "#374151" : "#e5e7eb"}`,
    borderRadius: "0.875rem",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.625rem 0.875rem 0.625rem 2.5rem",
    background: dm ? "#111827" : "#f8fafc",
    border: `1px solid ${dm ? "#374151" : "#e2e8f0"}`,
    borderRadius: "0.625rem",
    color: dm ? "#f1f5f9" : "#0f172a",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  };

  const thStyle = {
    padding: "0.75rem 1rem",
    textAlign: "left",
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: dm ? "#64748b" : "#94a3b8",
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${dm ? "#374151" : "#f1f5f9"}`,
    background: dm ? "#111827" : "#fafafa",
  };

  const tdStyle = {
    padding: "0.75rem 1rem",
    borderBottom: `1px solid ${dm ? "#374151" : "#f1f5f9"}`,
    verticalAlign: "middle",
  };

  const actionBtnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.3rem 0.7rem",
    borderRadius: "2rem0.375rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    border: "none",
    transition: "opacity 0.15s, transform 0.1s",
  };

  const approveBtn = {
    ...actionBtnBase,
    background: "#22c55e",
    color: "#ffffff",
    border: "1px solid #16a34a",
    borderRadius: "2rem",
    padding: "0.3rem 0.875rem",
    fontSize: "0.68rem",
    letterSpacing: "0.03em",
  };
  const rejectBtn = {
    ...actionBtnBase,
    background: "#ef4444",
    color: "#ffffff",
    border: "1px solid #dc2626",
    borderRadius: "2rem",
    padding: "0.3rem 0.875rem",
    fontSize: "0.68rem",
    letterSpacing: "0.03em",
  };
  const deleteBtn = {
    ...actionBtnBase,
    background: "#ef4444",
    color: "#ffffff",
    border: "1px solid #dc2626",
    borderRadius: "2rem",
    padding: "0.3rem 0.875rem",
    fontSize: "0.68rem",
    letterSpacing: "0.03em",
  };

  const copyBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.2rem 0.5rem",
    background: dm ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)",
    border: `1px solid ${dm ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)"}`,
    borderRadius: "0.375rem",
    fontSize: "0.6rem",
    fontWeight: 500,
    color: "#3b82f6",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  };

  // Mobile card for each user with profile link
  const MobileUserCard = ({ u }) => {
    const statusCfg = STATUS_CONFIG[u.accountStatus] || STATUS_CONFIG.pending;
    const roleCfg = getRoleCfg(u.occupation);
    const isPending = u.accountStatus === "pending";
    const isExpanded = expandedRow === u.id;
    const profileLink = getProfileLink(u.id);
    const isCopied = copiedUserId === u.id;

    return (
      <div
        style={{
          ...card,
          marginBottom: "0.625rem",
          overflow: "hidden",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* Main row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1rem",
            cursor: "pointer",
          }}
          onClick={() => setExpandedRow(isExpanded ? null : u.id)}
        >
          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              flexShrink: 0,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            }}
          >
            {u.photoURL ? (
              <img
                src={u.photoURL}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ fontSize: "0.8rem", fontWeight: 700, color: "white" }}
              >
                {getInitials(u.displayName)}
              </span>
            )}
          </div>

          {/* Name + role + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: dm ? "#f1f5f9" : "#0f172a",
                  maxWidth: 130,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {u.displayName}
              </span>
              {u.occupation && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "2rem",
                    background: roleCfg.bg,
                    border: `1px solid ${roleCfg.border}`,
                    color: roleCfg.color,
                  }}
                >
                  {u.occupation}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: dm ? "#94a3b8" : "#64748b",
                marginTop: "0.15rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {u.email}
            </div>
          </div>

          {/* Status + chevron */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "0.2rem 0.55rem",
                borderRadius: "2rem",
                background: statusCfg.bg,
                border: `1px solid ${statusCfg.border}`,
                color: statusCfg.color,
              }}
            >
              {statusCfg.label}
            </span>
            {isExpanded ? (
              <ChevronUp size={14} color={dm ? "#64748b" : "#94a3b8"} />
            ) : (
              <ChevronDown size={14} color={dm ? "#64748b" : "#94a3b8"} />
            )}
          </div>
        </div>

        {/* Expanded details - includes profile link and actions */}
        {isExpanded && (
          <div
            style={{
              padding: "0 1rem 0.875rem",
              borderTop: `1px solid ${dm ? "rgba(55,65,81,0.5)" : "#f1f5f9"}`,
              paddingTop: "0.75rem",
            }}
          >
            {/* Profile Link Section */}
            <div
              style={{
                marginBottom: "0.75rem",
                padding: "0.5rem",
                background: dm
                  ? "rgba(59,130,246,0.05)"
                  : "rgba(59,130,246,0.03)",
                borderRadius: "0.5rem",
                border: `1px solid ${dm ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)"}`,
              }}
            >
              <div
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#3b82f6",
                  marginBottom: "0.35rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Link2 size={10} /> NFC CARD LINK
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <code
                  style={{
                    fontSize: "0.65rem",
                    color: dm ? "#94a3b8" : "#475569",
                    background: dm ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
                    padding: "0.25rem 0.4rem",
                    borderRadius: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    fontFamily: "monospace",
                  }}
                >
                  {profileLink}
                </code>
                <button
                  onClick={() => copyToClipboard(profileLink, u.id)}
                  style={{
                    ...copyBtnStyle,
                    background: isCopied
                      ? "#22c55e"
                      : dm
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(59,130,246,0.1)",
                    color: isCopied ? "white" : "#3b82f6",
                    border: isCopied ? "1px solid #22c55e" : undefined,
                  }}
                >
                  {isCopied ? <Check size={10} /> : <Copy size={10} />}
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {isPending && (
                <>
                  <button
                    style={{ ...approveBtn, flex: 1, justifyContent: "center" }}
                    onClick={() => openConfirmModal(u, "approve")}
                    disabled={actionLoading === u.id}
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                  <button
                    style={{ ...rejectBtn, flex: 1, justifyContent: "center" }}
                    onClick={() => openConfirmModal(u, "reject")}
                    disabled={actionLoading === u.id}
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </>
              )}
              {u.accountStatus === "approved" && (
                <button
                  style={{ ...deleteBtn, flex: 1, justifyContent: "center" }}
                  onClick={() => openConfirmModal(u, "delete")}
                  disabled={actionLoading === u.id}
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── Filters ── */}
      <div style={{ ...card, padding: "1rem", marginBottom: "1rem" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: "0.875rem" }}>
          <Search
            size={15}
            color={dm ? "#475569" : "#94a3b8"}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email…"
            style={inputStyle}
          />
        </div>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {roleFilterOptions.map((f) => (
            <FilterPill
              key={f.id}
              label={f.label}
              active={filterRole === f.id}
              onClick={() => setFilterRole(f.id)}
            />
          ))}
          <div
            style={{
              width: 1,
              height: 18,
              background: dm ? "#374151" : "#e2e8f0",
              margin: "0 2px",
            }}
          />
          {STATUS_FILTERS.map((f) => {
            const cfg = STATUS_CONFIG[f.id];
            return (
              <FilterPill
                key={f.id}
                label={f.label}
                active={filterStatus === f.id}
                onClick={() => setFilterStatus(f.id)}
                activeColor={cfg?.color}
                activeBg={cfg?.bg}
                activeBorder={cfg?.border}
              />
            );
          })}
        </div>
      </div>

      {/* ── MOBILE: stacked cards ── */}
      <div className="sm:hidden">
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                border: `2px solid ${dm ? "#374151" : "#e2e8f0"}`,
                borderTopColor: dm ? "#f1f5f9" : "#0f172a",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <span
              style={{ fontSize: "0.8rem", color: dm ? "#64748b" : "#94a3b8" }}
            >
              Loading…
            </span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ ...card, padding: "3rem", textAlign: "center" }}>
            <Users
              size={28}
              color={dm ? "#374151" : "#cbd5e1"}
              style={{ margin: "0 auto 0.75rem" }}
            />
            <p
              style={{ fontSize: "0.82rem", color: dm ? "#64748b" : "#94a3b8" }}
            >
              No users found
            </p>
          </div>
        ) : (
          <>
            {filteredUsers.map((u) => (
              <MobileUserCard key={u.id} u={u} />
            ))}
            <div
              style={{
                textAlign: "center",
                padding: "0.625rem",
                fontSize: "0.65rem",
                letterSpacing: "0.06em",
                color: dm ? "#475569" : "#94a3b8",
                fontWeight: 600,
              }}
            >
              SHOWING {filteredUsers.length} OF {users.length} USERS
            </div>
          </>
        )}
      </div>

      {/* ── DESKTOP: table with Profile Link column ── */}
      <div className="hidden sm:block" style={{ ...card, overflow: "hidden" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: `2px solid ${dm ? "#374151" : "#e2e8f0"}`,
                borderTopColor: dm ? "#f1f5f9" : "#0f172a",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <span
              style={{ fontSize: "0.8rem", color: dm ? "#64748b" : "#94a3b8" }}
            >
              Loading users…
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 850,
              }}
            >
              <thead>
                <tr>
                  {[
                    "User",
                    "Email",
                    "Position",
                    "Status",
                    "Profile Link",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: dm ? "#475569" : "#94a3b8",
                        fontSize: "0.82rem",
                      }}
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const statusCfg =
                      STATUS_CONFIG[u.accountStatus] || STATUS_CONFIG.pending;
                    const roleCfg = getRoleCfg(u.occupation);
                    const isPending = u.accountStatus === "pending";
                    const profileLink = getProfileLink(u.id);
                    const isCopied = copiedUserId === u.id;

                    return (
                      <tr
                        key={u.id}
                        style={{ transition: "background 0.12s" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = dm
                            ? "#374151"
                            : "#f8fafc")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* User */}
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.625rem",
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                flexShrink: 0,
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                              }}
                            >
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    color: "white",
                                  }}
                                >
                                  {getInitials(u.displayName)}
                                </span>
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  color: dm ? "#f1f5f9" : "#0f172a",
                                  maxWidth: 140,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {u.displayName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: dm ? "#94a3b8" : "#64748b",
                            }}
                          >
                            {u.email}
                          </span>
                        </td>

                        {/* Position */}
                        <td style={tdStyle}>
                          {u.occupation ? (
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.22rem 0.625rem",
                                borderRadius: "2rem",
                                background: roleCfg.bg,
                                border: `1px solid ${roleCfg.border}`,
                                color: roleCfg.color,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {u.occupation}
                            </span>
                          ) : (
                            <span
                              style={{
                                color: dm ? "#475569" : "#94a3b8",
                                fontSize: "0.78rem",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "0.22rem 0.625rem",
                              borderRadius: "2rem",
                              background: statusCfg.bg,
                              border: `1px solid ${statusCfg.border}`,
                              color: statusCfg.color,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* NFC Link - New Column */}
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              flexWrap: "nowrap",
                            }}
                          >
                            <code
                              style={{
                                fontSize: "0.65rem",
                                color: dm ? "#94a3b8" : "#475569",
                                background: dm
                                  ? "rgba(0,0,0,0.3)"
                                  : "rgba(0,0,0,0.04)",
                                padding: "0.25rem 0.4rem",
                                borderRadius: "0.25rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "180px",
                                fontFamily: "monospace",
                              }}
                            >
                              {profileLink}
                            </code>
                            <button
                              onClick={() => copyToClipboard(profileLink, u.id)}
                              style={{
                                ...copyBtnStyle,
                                background: isCopied
                                  ? "#22c55e"
                                  : dm
                                    ? "rgba(59,130,246,0.15)"
                                    : "rgba(59,130,246,0.1)",
                                color: isCopied ? "white" : "#3b82f6",
                                border: isCopied
                                  ? "1px solid #22c55e"
                                  : undefined,
                              }}
                              onMouseEnter={(e) => {
                                if (!isCopied) {
                                  e.currentTarget.style.background =
                                    "rgba(59,130,246,0.25)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isCopied) {
                                  e.currentTarget.style.background = dm
                                    ? "rgba(59,130,246,0.15)"
                                    : "rgba(59,130,246,0.1)";
                                }
                              }}
                            >
                              {isCopied ? (
                                <Check size={10} />
                              ) : (
                                <Copy size={10} />
                              )}
                              {isCopied ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.375rem",
                              alignItems: "center",
                              flexWrap: "nowrap",
                            }}
                          >
                            {isPending && (
                              <>
                                <button
                                  style={{
                                    ...approveBtn,
                                    opacity: actionLoading === u.id ? 0.5 : 1,
                                  }}
                                  onClick={() => openConfirmModal(u, "approve")}
                                  disabled={actionLoading === u.id}
                                >
                                  <CheckCircle2 size={11} /> Approve
                                </button>
                                <button
                                  style={{
                                    ...rejectBtn,
                                    opacity: actionLoading === u.id ? 0.5 : 1,
                                  }}
                                  onClick={() => openConfirmModal(u, "reject")}
                                  disabled={actionLoading === u.id}
                                >
                                  <XCircle size={11} /> Reject
                                </button>
                              </>
                            )}
                            {u.accountStatus === "approved" && (
                              <button
                                style={{
                                  ...deleteBtn,
                                  opacity: actionLoading === u.id ? 0.5 : 1,
                                }}
                                onClick={() => openConfirmModal(u, "delete")}
                                disabled={actionLoading === u.id}
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            )}

                            {actionLoading === u.id && (
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  border: `2px solid ${dm ? "#374151" : "#e2e8f0"}`,
                                  borderTopColor: "#60a5fa",
                                  borderRadius: "50%",
                                  animation: "spin 0.7s linear infinite",
                                }}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: `1px solid ${dm ? "#374151" : "#f1f5f9"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: dm ? "#111827" : "#fafafa",
          }}
        >
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              color: dm ? "#475569" : "#94a3b8",
            }}
          >
            {/* SHOWING {filteredUsers.length} OF {users.length} USERSss */}
          </span>
          <div style={{ display: "flex", gap: "1rem" }}>
            {[
              // { label: "Pending", key: "pending", color: "#fbbf24" },
              // { label: "Active", key: "approved", color: "#34d399" },
              // { label: "Rejected", key: "rejected", color: "#f87171" },
            ].map((s) => (
              <div
                key={s.key}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: s.color,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: dm ? "#475569" : "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  {users.filter((u) => u.accountStatus === s.key).length}{" "}
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {showConfirmModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: dm ? "#1f2937" : "#ffffff",
              border: `1px solid ${dm ? "#374151" : "#e2e8f0"}`,
              borderRadius: "1rem",
              padding: "1.75rem",
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "0.75rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  actionType === "approve"
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.12)",
              }}
            >
              {actionType === "approve" ? (
                <CheckCircle2 size={22} color="#22c55e" />
              ) : actionType === "reject" ? (
                <XCircle size={22} color="#f87171" />
              ) : (
                <Trash2 size={22} color="#f87171" />
              )}
            </div>

            <div
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: dm ? "#f1f5f9" : "#0f172a",
                marginBottom: "0.5rem",
              }}
            >
              {actionType === "approve"
                ? "Approve Account"
                : actionType === "reject"
                  ? "Reject Account"
                  : "Delete Account"}
            </div>
            <p
              style={{
                fontSize: "0.82rem",
                color: dm ? "#94a3b8" : "#64748b",
                lineHeight: 1.6,
                margin: "0 0 1.25rem",
              }}
            >
              Are you sure you want to{" "}
              <strong
                style={{
                  color: actionType === "approve" ? "#22c55e" : "#f87171",
                }}
              >
                {actionType}
              </strong>{" "}
              <strong style={{ color: dm ? "#f1f5f9" : "#0f172a" }}>
                {selectedUser.displayName}
              </strong>
              ?{actionType === "delete" && " This action cannot be undone."}
            </p>

            <div style={{ display: "flex", gap: "0.625rem" }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                  setActionType(null);
                }}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  background: dm ? "#111827" : "#f8fafc",
                  border: `1px solid ${dm ? "#374151" : "#e2e8f0"}`,
                  borderRadius: "0.625rem",
                  color: dm ? "#9ca3af" : "#64748b",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading === selectedUser.id}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  background: actionType === "approve" ? "#22c55e" : "#ef4444",
                  border: `1px solid ${actionType === "approve" ? "#16a34a" : "#dc2626"}`,
                  borderRadius: "0.625rem",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor:
                    actionLoading === selectedUser.id
                      ? "not-allowed"
                      : "pointer",
                  fontFamily: "inherit",
                  opacity: actionLoading === selectedUser.id ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                {actionLoading === selectedUser.id ? (
                  <>
                    <div
                      style={{
                        width: 13,
                        height: 13,
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />{" "}
                    Processing…
                  </>
                ) : (
                  `Confirm ${actionType?.charAt(0).toUpperCase()}${actionType?.slice(1)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default AdminUsers;

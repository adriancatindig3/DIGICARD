import { useState, useEffect, useRef } from "react";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { uploadImage } from "../config/cloudinary";
import { logAdminAction, ACTION_LOG_CONFIG } from "./adminHelpers";
import {
  Upload,
  Trash2,
  Plus,
  Edit2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ImageIcon,
  Download,
  Users,
} from "lucide-react";

const AdminSettings = ({ darkMode, T, currentUser }) => {
  const [schoolLogoURL, setSchoolLogoURL] = useState("");
  const [schoolLogoUploading, setSchoolLogoUploading] = useState(false);
  const [schoolLogoError, setSchoolLogoError] = useState("");
  const [schoolLogoSuccess, setSchoolLogoSuccess] = useState("");
  const logoInputRef = useRef(null);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#4299E1");
  const [addingRole, setAddingRole] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [roleSuccess, setRoleSuccess] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleLabel, setEditingRoleLabel] = useState("");
  const [editingRoleColor, setEditingRoleColor] = useState("");
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [downloadingLogs, setDownloadingLogs] = useState(false);
  const [downloadingUsers, setDownloadingUsers] = useState(false);

  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textSubClass = darkMode ? "text-gray-400" : "text-gray-500";
  const textMutedClass = darkMode ? "text-gray-500" : "text-gray-400";
  const inputBgClass = darkMode ? "bg-gray-900" : "bg-white";
  const inputBorderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const hoverBgClass = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const badgeClass = darkMode
    ? "bg-gray-700 text-gray-300"
    : "bg-gray-100 text-gray-600";
  const warningBgClass = darkMode
    ? "bg-yellow-900/10 border-yellow-800/30 text-yellow-500"
    : "bg-yellow-50 border-yellow-200 text-yellow-600";
  const successBgClass = darkMode
    ? "bg-green-900/20 text-green-400"
    : "bg-green-50 text-green-600";
  const errorBgClass = darkMode
    ? "bg-red-900/20 text-red-400"
    : "bg-red-50 text-red-500";
  const roleItemBgClass = darkMode ? "bg-gray-800/50" : "bg-gray-50";
  const addRoleBgStyle = {
    background: darkMode ? "rgba(255,255,255,0.02)" : "#F7FAFC",
  };

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

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "userRoles"), orderBy("createdAt", "asc")),
        );
        setRoles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
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
    } catch (e) {
      setSchoolLogoError("Failed to remove logo.");
    }
  };

  const handleAddRole = async () => {
    const label = newRoleLabel.trim();
    if (!label) {
      setRoleError("Role name cannot be empty.");
      return;
    }
    if (roles.some((r) => r.label.toLowerCase() === label.toLowerCase())) {
      setRoleError("A role with this name already exists.");
      return;
    }
    setAddingRole(true);
    setRoleError("");
    try {
      const docRef = await addDoc(collection(db, "userRoles"), {
        label,
        value: label.toLowerCase().replace(/\s+/g, "-"),
        color: newRoleColor,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || "admin",
      });
      setRoles((prev) => [
        ...prev,
        {
          id: docRef.id,
          label,
          value: label.toLowerCase().replace(/\s+/g, "-"),
          color: newRoleColor,
        },
      ]);
      await logAdminAction(
        currentUser?.email,
        "ADD_ROLE",
        null,
        `Added new role "${label}"`,
        {
          roleName: label,
          roleColor: newRoleColor,
          adminName: currentUser?.displayName,
        },
      );
      setNewRoleLabel("");
      setRoleSuccess("Role added!");
      setTimeout(() => setRoleSuccess(""), 2000);
    } catch (e) {
      setRoleError("Failed to add role: " + e.message);
    } finally {
      setAddingRole(false);
    }
  };

  const handleSaveEdit = async (id) => {
    const label = editingRoleLabel.trim();
    if (!label) {
      setRoleError("Role name cannot be empty.");
      return;
    }
    const originalRole = roles.find((r) => r.id === id);
    const changes = [];
    if (originalRole.label !== label)
      changes.push(`name: "${originalRole.label}" → "${label}"`);
    try {
      await updateDoc(doc(db, "userRoles", id), {
        label,
        value: label.toLowerCase().replace(/\s+/g, "-"),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || "admin",
      });
      setRoles((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, label, value: label.toLowerCase().replace(/\s+/g, "-") }
            : r,
        ),
      );
      await logAdminAction(
        currentUser?.email,
        "EDIT_ROLE",
        null,
        `"${originalRole.label}" to "${label}"`,
        {
          roleName: label,
          changes: changes.join(", "),
          adminName: currentUser?.displayName,
        },
      );
      setEditingRoleId(null);
      setRoleSuccess("Role updated!");
      setTimeout(() => setRoleSuccess(""), 2000);
    } catch (e) {
      setRoleError("Failed to update role.");
    }
  };

  const handleDeleteRole = async (id) => {
    const roleToDelete = roles.find((r) => r.id === id);
    if (!roleToDelete) return;
    setDeletingRoleId(id);
    try {
      await deleteDoc(doc(db, "userRoles", id));
      setRoles((prev) => prev.filter((r) => r.id !== id));
      await logAdminAction(
        currentUser?.email,
        "DELETE_ROLE",
        null,
        `Deleted role "${roleToDelete.label}"`,
        { roleName: roleToDelete.label, adminName: currentUser?.displayName },
      );
      setRoleSuccess("Role deleted.");
      setTimeout(() => setRoleSuccess(""), 2000);
    } catch (e) {
      setRoleError("Failed to delete role.");
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleDownloadLogs = async () => {
    setDownloadingLogs(true);
    try {
      const logsRef = collection(db, "adminLogs");
      const logsQuery = query(logsRef, orderBy("timestamp", "desc"));
      const logsSnap = await getDocs(logsQuery);

      const logsData = logsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestampFormatted: data.timestamp
            ? new Date(
                data.timestamp.seconds
                  ? data.timestamp.seconds * 1000
                  : data.timestamp,
              ).toLocaleString()
            : "N/A",
        };
      });

      if (logsData.length === 0) {
        setRoleError("No logs found to download.");
        setTimeout(() => setRoleError(""), 3000);
        return;
      }

      const htmlContent = generateStyledLogsHTML(logsData);
      const blob = new Blob([htmlContent], {
        type: "application/vnd.ms-excel",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename = `admin_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.xls`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await logAdminAction(
        currentUser?.email,
        "EXPORT_LOGS",
        null,
        `Exported admin logs`,
        { adminName: currentUser?.displayName },
      );
      setRoleSuccess("Logs exported successfully!");
      setTimeout(() => setRoleSuccess(""), 3000);
    } catch (error) {
      console.error("Error downloading logs:", error);
      setRoleError("Failed to download logs: " + error.message);
      setTimeout(() => setRoleError(""), 3000);
    } finally {
      setDownloadingLogs(false);
    }
  };

  const handleDownloadUsers = async () => {
    setDownloadingUsers(true);
    try {
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);

      const usersData = [];

      for (const docSnap of usersSnap.docs) {
        const data = docSnap.data();
        // Skip admin users
        if (data.accountType === "admin") continue;

        usersData.push({
          "User ID": docSnap.id,
          Name: data.displayName || "N/A",
          Email: data.email || "N/A",
          Role: data.occupation || "N/A",
          Company: data.company || "N/A",
          "Phone Number": data.phoneNumber || "N/A",
          Bio: data.bio || "N/A",
          Skills: data.skills || "N/A",
          "Account Status": data.accountStatus || "pending",
          "Account Type": data.accountType || "user",
          "Selected Layout": data.selectedLayout || 1,
          "Created At": data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : "N/A",
          "Last Updated": data.lastUpdated
            ? new Date(data.lastUpdated).toLocaleString()
            : "N/A",
          "Profile Pic": data.photoURL || data.profilePic || "N/A",
        });
      }

      if (usersData.length === 0) {
        setRoleError("No users found to export.");
        setTimeout(() => setRoleError(""), 3000);
        return;
      }

      const htmlContent = generateStyledUsersHTML(usersData);
      const blob = new Blob([htmlContent], {
        type: "application/vnd.ms-excel",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename = `all_users_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.xls`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await logAdminAction(
        currentUser?.email,
        "EXPORT_USERS",
        null,
        `Exported all users data`,
        { adminName: currentUser?.displayName, userCount: usersData.length },
      );
      setRoleSuccess(`Exported ${usersData.length} users successfully!`);
      setTimeout(() => setRoleSuccess(""), 3000);
    } catch (error) {
      console.error("Error downloading users:", error);
      setRoleError("Failed to download users: " + error.message);
      setTimeout(() => setRoleError(""), 3000);
    } finally {
      setDownloadingUsers(false);
    }
  };

  const generateStyledLogsHTML = (logsData) => {
    const getActionText = (action) => {
      const cfg = ACTION_LOG_CONFIG[action];
      return cfg?.text || action;
    };

    const getActionColor = (action) => {
      const cfg = ACTION_LOG_CONFIG[action];
      return cfg?.color || "#A0AEC0";
    };

    const getActionBg = (action) => {
      const cfg = ACTION_LOG_CONFIG[action];
      return cfg?.bg || "#F5F5F5";
    };

    const getActionBorder = (action) => {
      const cfg = ACTION_LOG_CONFIG[action];
      return cfg?.border || "#E0E0E0";
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Admin Logs Export</title>
  <style>
    * { font-family: 'Arial Narrow', 'Arial', sans-serif; font-stretch: condensed; }
    body { padding: 20px; background: white; }
    .container { max-width: 1400px; margin: 0 auto; background: white; }
    .header { background: #1a472a; color: white; padding: 15px 20px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; }
    .header p { margin: 0; opacity: 0.8; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f2f2f2; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #333; border: 1px solid #ddd; }
    td { padding: 10px 12px; font-size: 11px; border: 1px solid #ddd; vertical-align: top; }
    .action-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .admin-email { color: #0066cc; font-weight: 600; }
    .target-name { font-weight: 500; color: #333; }
    .target-email { font-size: 10px; color: #666; margin-top: 2px; }
    .details-text { color: #555; font-size: 10px; }
    .footer { padding: 12px 20px; background: #f2f2f2; margin-top: 20px; font-size: 10px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>e-CARD Admin Activity Logs</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    <table>
      <thead>
        <tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th></tr>
      </thead>
      <tbody>
        ${logsData
          .map(
            (log) => `
          <tr>
            <td style="white-space: nowrap;">${log.timestampFormatted}</td>
            <td><div class="admin-email">${log.adminEmail || "—"}</div></td>
            <td><span class="action-badge" style="background: ${getActionBg(log.action)}; color: ${getActionColor(log.action)}; border: 1px solid ${getActionBorder(log.action)}">${getActionText(log.action)}</span></td>
            <td>${log.targetUserName ? `<div class="target-name">${log.targetUserName}</div>` : ""}${log.targetUserEmail ? `<div class="target-email">${log.targetUserEmail}</div>` : ""}${log.roleName ? `<div class="target-name">Role: <span style="color: ${log.roleColor || "#4299E1"}">${log.roleName}</span></div>` : ""}${!log.targetUserName && !log.targetUserEmail && !log.roleName ? "—" : ""}</td>
            <td><div class="details-text">${log.details || "—"}</div>${log.changes ? `<div class="details-text" style="margin-top: 4px;">${log.changes}</div>` : ""}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
    <div class="footer"><strong>Total Records:</strong> ${logsData.length} &nbsp;|&nbsp;<strong>Export Date:</strong> ${new Date().toLocaleString()} &nbsp;|&nbsp;<strong>System:</strong> e-CARD Admin Dashboard</div>
  </div>
</body>
</html>`;
  };

  const generateStyledUsersHTML = (usersData) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>All Users Export</title>
  <style>
    * { font-family: 'Arial Narrow', 'Arial', sans-serif; font-stretch: condensed; }
    body { padding: 20px; background: white; }
    .container { max-width: 1400px; margin: 0 auto; background: white; }
    .header { background: #1a472a; color: white; padding: 15px 20px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; }
    .header p { margin: 0; opacity: 0.8; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f2f2f2; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #333; border: 1px solid #ddd; white-space: nowrap; }
    td { padding: 10px 12px; font-size: 11px; border: 1px solid #ddd; vertical-align: top; }
    .status-approved { color: #10b981; font-weight: 600; }
    .status-pending { color: #f59e0b; font-weight: 600; }
    .status-rejected { color: #ef4444; font-weight: 600; }
    .footer { padding: 12px 20px; background: #f2f2f2; margin-top: 20px; font-size: 10px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>e-CARD All Users Data</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>Phone Number</th><th>Bio</th><th>Skills</th><th>Account Status</th><th>Account Type</th><th>Selected Layout</th><th>Created At</th><th>Last Updated</th>
        </tr>
      </thead>
      <tbody>
        ${usersData
          .map(
            (user) => `
          <tr>
            <td>${user["User ID"]}</td>
            <td>${user["Name"]}</td>
            <td>${user["Email"]}</td>
            <td>${user["Role"]}</td>
            <td>${user["Company"]}</td>
            <td>${user["Phone Number"]}</td>
            <td>${user["Bio"]}</td>
            <td>${user["Skills"]}</td>
            <td class="status-${user["Account Status"]}">${user["Account Status"]}</td>
            <td>${user["Account Type"]}</td>
            <td>${user["Selected Layout"]}</td>
            <td>${user["Created At"]}</td>
            <td>${user["Last Updated"]}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
    <div class="footer"><strong>Total Users:</strong> ${usersData.length} &nbsp;|&nbsp;<strong>Export Date:</strong> ${new Date().toLocaleString()} &nbsp;|&nbsp;<strong>System:</strong> e-CARD Admin Dashboard</div>
  </div>
</body>
</html>`;
  };

  return (
    <div className="space-y-4">
      {/* ── School Logo ─────────────────────────────────────────────────── */}
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

      {/* ── Export Data Section with 2 options ──────────────────────────────────── */}
      <div
        className={`rounded-xl border ${cardBorderClass} ${cardBgClass} p-6 shadow-sm`}
      >
        <h3
          className={`text-xs font-bold tracking-wider ${textMutedClass} uppercase mb-4`}
        >
          Export Data
        </h3>
        <div className="space-y-4">
          {/* Option 1: Admin Logs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg border ${cardBorderClass} ${darkMode ? 'bg-gray-700/20' : 'bg-gray-50'}">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className={`text-sm font-semibold ${textClass}`}>
                  Admin Activity Logs
                </p>
              </div>
              <p className={`text-xs ${textMutedClass}`}>
                Export all admin actions, user approvals, role changes, and
                system activities.
              </p>
            </div>
            <button
              onClick={handleDownloadLogs}
              disabled={downloadingLogs}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition whitespace-nowrap
                bg-green-600 hover:bg-green-700 text-white
                ${downloadingLogs ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {downloadingLogs ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              {downloadingLogs ? "Exporting..." : "Export Logs to Excel"}
            </button>
          </div>

          {/* Option 2: All Users Data */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg border ${cardBorderClass} ${darkMode ? 'bg-gray-700/20' : 'bg-gray-50'}">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <p className={`text-sm font-semibold ${textClass}`}>
                  All Users Data
                </p>
              </div>
              <p className={`text-xs ${textMutedClass}`}>
                Export complete user database with profiles, roles, contact
                info, and account status.
              </p>
            </div>
            <button
              onClick={handleDownloadUsers}
              disabled={downloadingUsers}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition whitespace-nowrap
                bg-blue-600 hover:bg-blue-700 text-white
                ${downloadingUsers ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {downloadingUsers ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Users size={13} />
              )}
              {downloadingUsers ? "Exporting..." : "Export Users to Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* ── User Roles ──────────────────────────────────────────────────── */}
      <div
        className={`rounded-xl border ${cardBorderClass} ${cardBgClass} p-6 shadow-sm`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h3
              className={`text-xs font-bold tracking-wider ${textMutedClass} uppercase mb-1`}
            >
              User Roles
            </h3>
            <p className={`text-sm ${textSubClass}`}>
              These roles appear in registration and profile editor.
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${badgeClass}`}
          >
            {roles.length} ROLES
          </span>
        </div>

        {roleError && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${errorBgClass} border ${darkMode ? "border-red-800" : "border-red-200"}`}
          >
            <AlertCircle size={14} /> {roleError}
          </div>
        )}
        {roleSuccess && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${successBgClass} border ${darkMode ? "border-green-800" : "border-green-200"}`}
          >
            <CheckCircle size={14} /> {roleSuccess}
          </div>
        )}

        {/* Add role form */}
        <div
          className={`flex flex-col gap-3 mb-5 p-4 rounded-xl border ${cardBorderClass}`}
          style={addRoleBgStyle}
        >
          <input
            value={newRoleLabel}
            onChange={(e) => {
              setNewRoleLabel(e.target.value);
              setRoleError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddRole();
            }}
            placeholder="New role name (e.g. Teacher, Staff...)"
            className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition ${inputBgClass} border ${inputBorderClass} ${textClass}`}
          />
          <button
            onClick={handleAddRole}
            disabled={addingRole || !newRoleLabel.trim()}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition
              ${darkMode ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-700"}
              ${addingRole || !newRoleLabel.trim() ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {addingRole ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}{" "}
            Add Role
          </button>
        </div>

        {rolesLoading ? (
          <div className="py-12 text-center">
            <div
              className={`w-6 h-6 border-2 ${darkMode ? "border-gray-700 border-t-white" : "border-gray-200 border-t-gray-900"} rounded-full animate-spin mx-auto mb-2`}
            />
            <span className={`text-sm ${textMutedClass}`}>
              Loading roles...
            </span>
          </div>
        ) : roles.length === 0 ? (
          <div
            className={`py-8 text-center border border-dashed rounded-xl ${textMutedClass} ${cardBorderClass}`}
          >
            No roles yet. Add your first role above.
          </div>
        ) : (
          <div className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`flex flex-wrap items-center gap-2 p-3 rounded-lg ${roleItemBgClass} border ${cardBorderClass}`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: role.color || "#4299E1" }}
                />
                {editingRoleId === role.id ? (
                  <>
                    <input
                      value={editingRoleLabel}
                      onChange={(e) => setEditingRoleLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(role.id);
                        if (e.key === "Escape") setEditingRoleId(null);
                      }}
                      autoFocus
                      className={`flex-1 min-w-[120px] px-2 py-1.5 rounded-md text-sm focus:outline-none ${inputBgClass} border ${inputBorderClass} ${textClass}`}
                    />
                    <button
                      onClick={() => handleSaveEdit(role.id)}
                      className={`p-1.5 rounded-md transition ${darkMode ? "bg-green-900/20 text-green-400 hover:bg-green-900/30" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => setEditingRoleId(null)}
                      className={`p-1.5 rounded-md transition ${hoverBgClass} ${textMutedClass}`}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 text-sm font-medium ${textClass}`}>
                      {role.label}
                    </span>
                    <span
                      className={`text-xs font-mono ${textMutedClass} hidden sm:inline`}
                    >
                      {role.value}
                    </span>
                    <button
                      onClick={() => {
                        setEditingRoleId(role.id);
                        setEditingRoleLabel(role.label);
                        setEditingRoleColor(role.color || "#4299E1");
                      }}
                      className={`p-1.5 rounded-md transition ${darkMode ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={deletingRoleId === role.id}
                      className={`p-1.5 rounded-md transition
                        ${darkMode ? "bg-red-900/20 text-red-400 hover:bg-red-900/30" : "bg-red-50 text-red-600 hover:bg-red-100"}
                        ${deletingRoleId === role.id ? "opacity-50" : ""}`}
                    >
                      {deletingRoleId === role.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-xs ${warningBgClass} border`}
        >
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Deleting a role does <strong>not</strong> update existing users with
            that role.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

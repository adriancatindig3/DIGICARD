// hooks/useAdminUsers.js
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";

const useAdminUsers = (currentUser) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Real-time listener for users collection
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Query only non-admin users
    const usersQuery = query(
      collection(db, "users"),
      where("role", "!=", "admin"),
      orderBy("createdAt", "desc"),
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          usersData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setUsers(usersData);
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Optional: Manual refresh function (re-initializes listener)
  const refreshUsers = useCallback(() => {
    setLastUpdated(new Date());
    // The onSnapshot will automatically refresh data
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    const stats = {
      total: users.length,
      pending: users.filter((u) => u.accountStatus === "pending").length,
      approved: users.filter((u) => u.accountStatus === "approved").length,
      rejected: users.filter((u) => u.accountStatus === "rejected").length,
      deleted: users.filter((u) => u.accountStatus === "deleted").length,
    };

    // Calculate percentage changes (optional)
    stats.pendingPercentage = stats.total
      ? ((stats.pending / stats.total) * 100).toFixed(1)
      : 0;
    stats.approvedPercentage = stats.total
      ? ((stats.approved / stats.total) * 100).toFixed(1)
      : 0;

    return stats;
  }, [users]);

  // Get users by status
  const getUsersByStatus = useCallback(
    (status) => {
      return users.filter((user) => user.accountStatus === status);
    },
    [users],
  );

  // Get pending users (most urgent)
  const getPendingUsers = useCallback(() => {
    return users.filter((user) => user.accountStatus === "pending");
  }, [users]);

  // Search users function (for component use)
  const searchUsers = useCallback(
    (searchTerm, filterRole = "all", filterStatus = "all") => {
      return users.filter((user) => {
        const matchSearch =
          !searchTerm ||
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchRole =
          filterRole === "all" ||
          user.occupation?.toLowerCase().replace(/\s+/g, "-") === filterRole;

        const matchStatus =
          filterStatus === "all" || user.accountStatus === filterStatus;

        return matchSearch && matchRole && matchStatus;
      });
    },
    [users],
  );

  // Check if there are new pending approvals
  const hasPendingApprovals = useCallback(() => {
    return users.some((user) => user.accountStatus === "pending");
  }, [users]);

  // Get recent users (last 7 days)
  const getRecentUsers = useCallback(
    (days = 7) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return users.filter((user) => {
        if (!user.createdAt) return false;
        const createdAt = user.createdAt.toDate
          ? user.createdAt.toDate()
          : new Date(user.createdAt);
        return createdAt >= cutoffDate;
      });
    },
    [users],
  );

  return {
    // Data
    users,
    loading,
    error,
    lastUpdated,

    // Actions
    refreshUsers,

    // Helper functions
    getStats,
    getUsersByStatus,
    getPendingUsers,
    searchUsers,
    hasPendingApprovals,
    getRecentUsers,
  };
};

export default useAdminUsers;

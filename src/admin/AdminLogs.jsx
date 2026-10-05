import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  endBefore,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { formatDateTime, timeAgo, ACTION_LOG_CONFIG } from "./adminHelpers";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { limitToLast } from "firebase/firestore";

const AdminLogs = ({ darkMode, T }) => {
  const [logs, setLogs] = useState([]);
  const [allLoadedLogs, setAllLoadedLogs] = useState([]); // Store all loaded pages
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Store pagination cursors
  const [pageCursors, setPageCursors] = useState({});
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Filters - now only filter the current page
  const [searchTerm, setSearchTerm] = useState("");
  const [logFilterDate, setLogFilterDate] = useState("");
  const [logFilterAction, setLogFilterAction] = useState("all");

  const ITEMS_PER_PAGE = 10;

  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-200";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textMuted = darkMode ? "text-gray-500" : "text-gray-400";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode ? "bg-gray-900" : "bg-white";
  const inputBorder = darkMode ? "border-gray-700" : "border-gray-200";
  const labelClass = darkMode ? "text-gray-500" : "text-gray-400";
  const thClass = darkMode
    ? "text-gray-500 border-gray-700 bg-gray-900"
    : "text-gray-400 border-gray-200 bg-gray-50";
  const trBorder = darkMode ? "border-gray-700" : "border-gray-100";
  const emailClass = darkMode ? "text-blue-400" : "text-blue-600";
  const spinClass = darkMode
    ? "border-gray-700 border-t-white"
    : "border-gray-200 border-t-gray-900";

  const extendedActionConfig = {
    ...ACTION_LOG_CONFIG,
    EXPORT_LOGS: {
      color: "#10B981",
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.2)",
      icon: "📊",
      text: "Export Logs",
    },
    EXPORT_USERS: {
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.1)",
      border: "rgba(59,130,246,0.2)",
      icon: "👥",
      text: "Export Users",
    },
  };

  // Build query with no filters (just pagination)
  const getBaseQuery = useCallback(() => {
    return query(collection(db, "adminLogs"), orderBy("timestamp", "desc"));
  }, []);

  // Get total count
  const fetchTotalCount = useCallback(async () => {
    try {
      const baseQuery = getBaseQuery();
      const snapshot = await getCountFromServer(baseQuery);
      const count = snapshot.data().count;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      return count;
    } catch (e) {
      console.error("Error fetching count:", e);
      return 0;
    }
  }, [getBaseQuery]);

  // Fetch logs for a specific page
  const fetchPage = useCallback(
    async (pageNum, cursor = null, isPrev = false) => {
      try {
        setLoading(true);
        const baseQuery = getBaseQuery();
        let paginatedQuery;

        if (cursor && isPrev) {
          paginatedQuery = query(
            baseQuery,
            endBefore(cursor),
            limitToLast(ITEMS_PER_PAGE),
          );
        } else if (cursor && !isPrev) {
          paginatedQuery = query(
            baseQuery,
            startAfter(cursor),
            limit(ITEMS_PER_PAGE),
          );
        } else {
          paginatedQuery = query(baseQuery, limit(ITEMS_PER_PAGE));
        }

        const snap = await getDocs(paginatedQuery);
        let logsData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (isPrev) {
          logsData = logsData.reverse();
        }

        // Store the logs for this page
        setAllLoadedLogs((prev) => ({
          ...prev,
          [pageNum]: logsData,
        }));
        setLogs(logsData);

        if (snap.docs.length > 0) {
          setPageCursors((prev) => ({
            ...prev,
            [pageNum]: {
              first: snap.docs[0],
              last: snap.docs[snap.docs.length - 1],
            },
          }));
          setHasNext(snap.docs.length === ITEMS_PER_PAGE);
          setHasPrev(pageNum > 1);
        } else {
          setHasNext(false);
          setHasPrev(pageNum > 1);
        }
      } catch (e) {
        console.error("Error fetching logs:", e);
      } finally {
        setLoading(false);
      }
    },
    [getBaseQuery],
  );

  // Load page
  const loadPage = useCallback(
    async (pageNum, cursor = null, isPrev = false) => {
      // Check if we already have this page loaded
      if (allLoadedLogs[pageNum]) {
        setLogs(allLoadedLogs[pageNum]);
        setCurrentPage(pageNum);
        setHasPrev(pageNum > 1);
        setHasNext(!!pageCursors[pageNum] && pageNum < totalPages);
        return;
      }

      setCurrentPage(pageNum);
      await fetchPage(pageNum, cursor, isPrev);
    },
    [allLoadedLogs, fetchPage, pageCursors, totalPages],
  );

  // Next page
  const nextPage = async () => {
    if (!hasNext) return;
    const nextPageNum = currentPage + 1;
    const currentCursor = pageCursors[currentPage]?.last;
    await loadPage(nextPageNum, currentCursor, false);
  };

  // Previous page
  const prevPage = async () => {
    if (!hasPrev) return;
    const prevPageNum = currentPage - 1;
    const prevCursor = pageCursors[prevPageNum]?.last;
    await loadPage(prevPageNum, prevCursor, false);
  };

  // First page
  const firstPage = async () => {
    if (currentPage === 1) return;
    await loadPage(1);
  };

  // Apply filters to current page only (client-side)
  const getFilteredLogs = useCallback(() => {
    let filtered = [...logs];

    // Apply search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.adminEmail?.toLowerCase().includes(s) ||
          l.targetUserName?.toLowerCase().includes(s) ||
          l.targetUserEmail?.toLowerCase().includes(s) ||
          l.details?.toLowerCase().includes(s),
      );
    }

    // Apply date filter (client-side)
    if (logFilterDate) {
      const filterDate = new Date(logFilterDate);
      const filterDateStr = filterDate.toDateString();
      filtered = filtered.filter((l) => {
        if (!l.timestamp) return false;
        const logDate = l.timestamp.seconds
          ? new Date(l.timestamp.seconds * 1000)
          : new Date(l.timestamp);
        return logDate.toDateString() === filterDateStr;
      });
    }

    // Apply action filter
    if (logFilterAction !== "all") {
      filtered = filtered.filter((l) => l.action === logFilterAction);
    }

    return filtered;
  }, [logs, searchTerm, logFilterDate, logFilterAction]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchPage(1);
      await fetchTotalCount();
    };
    init();
  }, []);

  const filteredLogs = getFilteredLogs();
  const hasFilters = searchTerm || logFilterDate || logFilterAction !== "all";

  return (
    <div className="space-y-4">
      {/* Filters card */}
      <div
        className={`sticky top-0 z-10 ${cardBg} border ${cardBorder} rounded-xl p-4 shadow-sm`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search */}
          <div>
            <label
              className={`text-[0.65rem] ${labelClass} block mb-1.5 font-semibold tracking-wide uppercase`}
            >
              Search
            </label>
            <div className="relative">
              <Search
                size={14}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search admin, user, or details..."
                className={`w-full py-2 pl-9 pr-3 border ${inputBorder} rounded-lg text-sm ${textClass} ${inputBg} focus:outline-none focus:border-gray-400 transition`}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label
              className={`text-[0.65rem] ${labelClass} block mb-1.5 font-semibold tracking-wide uppercase`}
            >
              Filter by Date
            </label>
            <input
              type="date"
              value={logFilterDate}
              onChange={(e) => setLogFilterDate(e.target.value)}
              className={`w-full py-2 px-3 border ${inputBorder} rounded-lg text-sm ${textClass} ${inputBg} cursor-pointer focus:outline-none transition`}
            />
          </div>

          {/* Action */}
          <div>
            <label
              className={`text-[0.65rem] ${labelClass} block mb-1.5 font-semibold tracking-wide uppercase`}
            >
              Filter by Action
            </label>
            <div className="relative">
              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className={`w-full py-2 pl-3 pr-10 border ${inputBorder} rounded-lg text-sm ${textClass} ${inputBg} cursor-pointer focus:outline-none transition appearance-none`}
              >
                <option value="all">All Actions</option>
                <option value="APPROVE">Approved User</option>
                <option value="REJECT">Rejected User</option>
                <option value="DELETE">Deleted User</option>
                <option value="UPDATE_LOGO">Updated Logo</option>
                <option value="ADD_ROLE">Added Role</option>
                <option value="EDIT_ROLE">Edited Role</option>
                <option value="DELETE_ROLE">Deleted Role</option>
                <option value="EXPORT_LOGS">Export Logs</option>
                <option value="EXPORT_USERS">Export Users</option>
              </select>
              <div
                className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${textMuted}`}
              >
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Filter indicator */}
        {hasFilters && (
          <div className="mt-3 flex justify-between items-center">
            <span className={`text-[0.65rem] ${textMuted}`}>
              🔍 Filtering {logs.length} logs on current page
            </span>
            <button
              onClick={() => {
                setSearchTerm("");
                setLogFilterDate("");
                setLogFilterAction("all");
              }}
              className={`text-[0.65rem] px-2 py-1 rounded ${emailClass} hover:underline transition`}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Logs table card */}
      <div
        className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden shadow-sm`}
      >
        <div
          className={`px-5 py-4 border-b ${cardBorder} flex items-center justify-between flex-wrap gap-2`}
        >
          <div>
            <h3 className={`text-sm font-bold ${textClass}`}>
              Admin Activity Logs
            </h3>
          </div>
          {totalCount > 0 && !hasFilters && (
            <span className={`text-[0.7rem] ${textMuted}`}>
              Total: {totalCount.toLocaleString()} logs
            </span>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div
              className={`w-5 h-5 border-2 ${spinClass} rounded-full animate-spin`}
            />
            <span className={`text-sm ${textMuted}`}>Loading logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={`py-16 text-center text-sm ${textMuted}`}>
            No matching logs on this page.
            {hasFilters && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setLogFilterDate("");
                  setLogFilterAction("all");
                }}
                className={`block mx-auto mt-2 text-xs ${emailClass} underline`}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  {["Time", "Admin", "Action", "Target", "Details"].map((h) => (
                    <th
                      key={h}
                      className={`py-3.5 px-5 text-left text-[0.6rem] font-bold tracking-wider uppercase border-b ${thClass}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const cfg = extendedActionConfig[log.action] || {
                    color: "#A0AEC0",
                    bg: "rgba(160,174,192,0.08)",
                    border: "rgba(160,174,192,0.2)",
                    icon: null,
                    text: log.action,
                  };
                  return (
                    <tr key={log.id} className={`border-b ${trBorder}`}>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className={`text-xs font-mono ${textSub}`}>
                          {timeAgo(log.timestamp)}
                        </div>
                        <div className={`text-[0.65rem] ${textMuted} mt-0.5`}>
                          {formatDateTime(log.timestamp)}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className={`text-sm font-semibold ${emailClass}`}>
                          {log.adminEmail || "—"}
                        </div>
                        <div className={`text-[0.65rem] ${textMuted}`}>
                          {log.adminName || ""}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                          style={{
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                          }}
                        >
                          {cfg.icon && <span>{cfg.icon}</span>}
                          {cfg.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {log.targetUserName && (
                          <div className={`text-sm font-medium ${textClass}`}>
                            {log.targetUserName}
                          </div>
                        )}
                        {log.targetUserEmail && (
                          <div className={`text-[0.7rem] ${textSub}`}>
                            {log.targetUserEmail}
                          </div>
                        )}
                        {log.roleName && (
                          <div className={`text-sm font-medium ${textClass}`}>
                            Role:{" "}
                            <span style={{ color: log.roleColor }}>
                              {log.roleName}
                            </span>
                          </div>
                        )}
                        {!log.targetUserName &&
                          !log.targetUserEmail &&
                          !log.roleName && (
                            <span className={`text-[0.75rem] ${textMuted}`}>
                              —
                            </span>
                          )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[0.75rem] ${textMuted}`}>
                          {log.details || "—"}
                        </span>
                        {log.changes && (
                          <div
                            className={`text-[0.65rem] ${textMuted} mt-1 font-mono`}
                          >
                            {log.changes}
                          </div>
                        )}
                        {log.userCount && (
                          <div className={`text-[0.65rem] ${textMuted} mt-1`}>
                            Users: {log.userCount}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div
          className={`py-3 px-5 border-t ${cardBorder} flex justify-between items-center flex-wrap gap-3`}
        >
          <div className={`text-[0.7rem] font-mono ${textMuted}`}>
            Page {currentPage} of {totalPages.toLocaleString() || "?"}
          </div>

          <div className="flex gap-2">
            <button
              onClick={firstPage}
              disabled={currentPage === 1 || loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                currentPage === 1 || loading
                  ? `${textMuted} cursor-not-allowed opacity-50`
                  : `${textClass} hover:bg-gray-100 dark:hover:bg-gray-700 ${cardBg} border ${inputBorder}`
              }`}
            >
              <ChevronLeft size={14} />
              <ChevronLeft size={14} className="-ml-2" />
              First
            </button>

            <button
              onClick={prevPage}
              disabled={!hasPrev || loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                !hasPrev || loading
                  ? `${textMuted} cursor-not-allowed opacity-50`
                  : `${textClass} hover:bg-gray-100 dark:hover:bg-gray-700 ${cardBg} border ${inputBorder}`
              }`}
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${cardBg} border ${inputBorder} ${textClass}`}
            >
              {currentPage}
            </span>

            <button
              onClick={nextPage}
              disabled={!hasNext || loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                !hasNext || loading
                  ? `${textMuted} cursor-not-allowed opacity-50`
                  : `${textClass} hover:bg-gray-100 dark:hover:bg-gray-700 ${cardBg} border ${inputBorder}`
              }`}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;

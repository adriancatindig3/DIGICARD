// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./config/firebase";
import { doc, getDoc } from "firebase/firestore";
import Login from "./user/pages/Login";
import Home from "./user/pages/Home";
import {
  createPendingUser,
  ensureCanonicalAccount,
  ensureDesignatedAdmin,
} from "./user/utils/ensureUserAccount";
import UpdateProfile from "./user/pages/UpdateProfile";
import ViewQr from "./user/pages/ViewQr";
import SelectLayout from "./user/pages/SelectLayout";
import Pending from "./user/status/Pending";
import Rejected from "./user/status/Rejected";
import Deleted from "./user/status/Deleted";
import PublicProfile from "./user/pages/PublicProfile";
import AdminDashboard from "./admin/AdminDashboard";
import {
  isDesignatedAdmin,
  routeStatus,
} from "./admin/adminHelpers";

function RouteSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );
}

// Designated admin email, accountType, or role wins over the pending page.
async function readRouteStatus(user) {
  if (isDesignatedAdmin(user)) {
    try {
      await ensureDesignatedAdmin(user);
    } catch (error) {
      console.error("Error restoring admin account:", error);
    }
    return "admin";
  }

  try {
    const account = await ensureCanonicalAccount(user);
    return routeStatus(account.data);
  } catch (error) {
    console.error("Error resolving account:", error);
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return "missing";
  return routeStatus(userDoc.data());
}

// Protected route that checks if user is approved
const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const next = await readRouteStatus(user);
          setStatus(next === "missing" ? "unauthenticated" : next);
        } catch (error) {
          console.error("Error checking user status:", error);
          setStatus("unauthenticated");
        }
      } else {
        setStatus("unauthenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") return <RouteSpinner />;

  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "pending") return <Navigate to="/pending" replace />;
  if (status === "rejected") return <Navigate to="/rejected" replace />;
  if (status === "deleted") return <Navigate to="/deleted" replace />;

  return children;
};

// Redirects logged-in users away from /login
const PublicRoute = ({ children }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const next = await readRouteStatus(user);

          if (next === "admin") {
            setStatus("admin");
            return;
          }

          if (next === "missing") {
            try {
              await createPendingUser(user);
            } catch (error) {
              console.error("Error creating user account:", error);
            }
            setStatus("pending");
            return;
          }

          setStatus("authenticated");
        } catch (error) {
          console.error("Error checking user status:", error);
          if (isDesignatedAdmin(user)) {
            setStatus("admin");
            return;
          }
          setStatus("authenticated");
        }
      } else {
        setStatus("guest");
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") return <RouteSpinner />;

  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "pending") return <Navigate to="/pending" replace />;
  if (status === "authenticated") return <Navigate to="/home" replace />;
  return children;
};

// Route for pending page
const PendingRoute = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const next = await readRouteStatus(user);

          if (next === "missing") {
            try {
              await createPendingUser(user);
            } catch (error) {
              console.error("Error creating user account:", error);
            }
            setStatus(isDesignatedAdmin(user) ? "admin" : "pending");
            return;
          }

          setStatus(next);
        } catch (error) {
          console.error("Error checking user status:", error);
          setStatus(isDesignatedAdmin(user) ? "admin" : "unauthenticated");
        }
      } else {
        setStatus("unauthenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") return <RouteSpinner />;

  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "approved") return <Navigate to="/home" replace />;
  if (status === "rejected") return <Navigate to="/rejected" replace />;
  if (status === "deleted") return <Navigate to="/deleted" replace />;

  return <Pending />;
};

// Route for rejected page
const RejectedRoute = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const next = await readRouteStatus(user);
          setStatus(next === "missing" ? "unauthenticated" : next);
        } catch (error) {
          console.error("Error checking user status:", error);
          setStatus("unauthenticated");
        }
      } else {
        setStatus("unauthenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") return <RouteSpinner />;

  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "approved") return <Navigate to="/home" replace />;
  if (status === "pending") return <Navigate to="/pending" replace />;
  if (status === "deleted") return <Navigate to="/deleted" replace />;

  return <Rejected />;
};

// Route for deleted page
const DeletedRoute = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const next = await readRouteStatus(user);
          setStatus(next === "missing" ? "unauthenticated" : next);
        } catch (error) {
          console.error("Error checking user status:", error);
          setStatus("unauthenticated");
        }
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("deleted") === "true") {
          setStatus("deleted");
        } else {
          setStatus("unauthenticated");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") return <RouteSpinner />;

  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "approved") return <Navigate to="/home" replace />;
  if (status === "pending") return <Navigate to="/pending" replace />;
  if (status === "rejected") return <Navigate to="/rejected" replace />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  return <Deleted />;
};

const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const next = await readRouteStatus(user);
          setStatus(next === "missing" ? "unauthenticated" : next);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setStatus("unauthenticated");
        }
      } else {
        setStatus("unauthenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") return <RouteSpinner />;

  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "pending") return <Navigate to="/pending" replace />;
  if (status === "rejected") return <Navigate to="/rejected" replace />;
  if (status === "deleted") return <Navigate to="/deleted" replace />;
  if (status !== "admin") return <Navigate to="/home" replace />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES - No authentication required */}
        <Route path="/profile/:userId" element={<PublicProfile />} />

        {/* AUTH ROUTES */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/register" element={<Navigate to="/pending" replace />} />
        <Route path="/pending" element={<PendingRoute />} />
        <Route path="/rejected" element={<RejectedRoute />} />
        <Route path="/deleted" element={<DeletedRoute />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* USER ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/updateprofile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/viewqr"
          element={
            <ProtectedRoute>
              <ViewQr />
            </ProtectedRoute>
          }
        />
        <Route
          path="/selectlayout"
          element={
            <ProtectedRoute>
              <SelectLayout />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

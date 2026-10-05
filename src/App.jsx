// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./config/firebase";
import { doc, getDoc } from "firebase/firestore";
import Login from "./user/pages/Login";
import Register from "./user/pages/Register";
import Home from "./user/pages/Home";
import UpdateProfile from "./user/pages/UpdateProfile";
import ViewQr from "./user/pages/ViewQr";
import SelectLayout from "./user/pages/SelectLayout";
import Pending from "./user/status/Pending";
import Rejected from "./user/status/Rejected";
import Deleted from "./user/status/Deleted";
import AdminDashboard from "./admin/AdminDashboard";
import PublicProfile from "./user/pages/PublicProfile";

// AdminRoute - ONLY logged-in users with accountType 'admin' can access
const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const accountType = userDoc.data()?.accountType;
          if (accountType === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin && !auth.currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;

  return children;
};

// Protected route that checks if user is approved and NOT admin
const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const accountStatus = userDoc.data()?.accountStatus;
            const accountType = userDoc.data()?.accountType;

            if (accountType === "admin") {
              setStatus("admin");
              return;
            }

            if (accountStatus === "approved") {
              setStatus("approved");
            } else if (accountStatus === "rejected") {
              setStatus("rejected");
            } else if (accountStatus === "deleted") {
              setStatus("deleted");
            } else {
              setStatus("pending");
            }
          } else {
            setStatus("unauthenticated");
          }
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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

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
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists() && userDoc.data()?.accountType === "admin") {
            setStatus("admin");
          } else if (!userDoc.exists()) {
            setStatus("registration");
          } else {
            setStatus("authenticated");
          }
        } catch (error) {
          setStatus("authenticated");
        }
      } else {
        setStatus("guest");
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "registration") return <Navigate to="/register" replace />;
  if (status === "authenticated") return <Navigate to="/home" replace />;
  if (status === "admin") return <Navigate to="/admin" replace />;

  return children;
};

// Route for register page
const RegisterRoute = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            setStatus("registration");
          } else {
            const accountStatus = userDoc.data()?.accountStatus;
            const accountType = userDoc.data()?.accountType;

            if (accountType === "admin") {
              setStatus("admin");
              return;
            }

            if (accountStatus === "approved") {
              setStatus("approved");
            } else if (accountStatus === "rejected") {
              setStatus("rejected");
            } else if (accountStatus === "deleted") {
              setStatus("deleted");
            } else {
              setStatus("pending");
            }
          }
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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "approved") return <Navigate to="/home" replace />;
  if (status === "pending") return <Navigate to="/pending" replace />;
  if (status === "rejected") return <Navigate to="/rejected" replace />;
  if (status === "deleted") return <Navigate to="/deleted" replace />;

  return <Register />;
};

// Route for pending page
const PendingRoute = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const accountStatus = userDoc.data()?.accountStatus;
            const accountType = userDoc.data()?.accountType;

            if (accountType === "admin") {
              setStatus("admin");
              return;
            }

            if (accountStatus === "approved") {
              setStatus("approved");
            } else if (accountStatus === "rejected") {
              setStatus("rejected");
            } else if (accountStatus === "deleted") {
              setStatus("deleted");
            } else {
              setStatus("pending");
            }
          } else {
            setStatus("unauthenticated");
          }
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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

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
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const accountStatus = userDoc.data()?.accountStatus;
            const accountType = userDoc.data()?.accountType;

            if (accountType === "admin") {
              setStatus("admin");
              return;
            }

            if (accountStatus === "rejected") {
              setStatus("rejected");
            } else if (accountStatus === "approved") {
              setStatus("approved");
            } else if (accountStatus === "deleted") {
              setStatus("deleted");
            } else {
              setStatus("pending");
            }
          } else {
            setStatus("unauthenticated");
          }
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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

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
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const accountStatus = userDoc.data()?.accountStatus;
            const accountType = userDoc.data()?.accountType;

            if (accountType === "admin") {
              setStatus("admin");
              return;
            }

            if (accountStatus === "deleted") {
              setStatus("deleted");
            } else if (accountStatus === "approved") {
              setStatus("approved");
            } else if (accountStatus === "rejected") {
              setStatus("rejected");
            } else {
              setStatus("pending");
            }
          } else {
            setStatus("unauthenticated");
          }
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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "admin") return <Navigate to="/admin" replace />;
  if (status === "approved") return <Navigate to="/home" replace />;
  if (status === "pending") return <Navigate to="/pending" replace />;
  if (status === "rejected") return <Navigate to="/rejected" replace />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  return <Deleted />;
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
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/pending" element={<PendingRoute />} />
        <Route path="/rejected" element={<RejectedRoute />} />
        <Route path="/deleted" element={<DeletedRoute />} />

        {/* ADMIN ONLY ROUTE - Protected */}
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

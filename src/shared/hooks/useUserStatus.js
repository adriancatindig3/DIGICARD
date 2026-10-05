import { useState, useEffect } from "react";
import { auth, db } from "../../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { isDesignatedAdmin } from "../../admin/adminHelpers";

export const useUserStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (isDesignatedAdmin(currentUser)) {
      navigate("/admin", { replace: true });
      return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);

    // Real-time listener for user status
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (isDesignatedAdmin({ id: doc.id, ...data })) {
            setUserData(data);
            setStatus("approved");
            setLoading(false);
            navigate("/admin", { replace: true });
            return;
          }
          const currentStatus = data.accountStatus || "pending";
          setStatus(currentStatus);
          setUserData(data);
          setLoading(false);

          // Auto-redirect based on status change
          switch (currentStatus) {
            case "approved":
              navigate("/home", { replace: true });
              break;
            case "pending":
              if (window.location.pathname !== "/pending") {
                navigate("/pending", { replace: true });
              }
              break;
            case "rejected":
              if (window.location.pathname !== "/rejected") {
                navigate("/rejected", { replace: true });
              }
              break;
            case "deleted":
              navigate("/login?deleted=true", { replace: true });
              break;
            default:
              navigate("/pending", { replace: true });
          }
        } else {
          // User document doesn't exist
          setLoading(false);
          navigate("/login");
        }
      },
      (error) => {
        console.error("Error listening to user status:", error);
        setLoading(false);
      },
    );

    // Cleanup listener
    return () => unsubscribe();
  }, [navigate]);

  return { status, loading, userData };
};

import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export const useUserRoles = () => {
  const [positionOptions, setPositionOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    // Create query for userRoles collection
    const rolesQuery = query(
      collection(db, "userRoles"),
      orderBy("createdAt", "asc"),
    );

    // Real-time listener
    const unsubscribe = onSnapshot(
      rolesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          // ✅ NO FALLBACKS - Just return empty array
          setPositionOptions([]);
        } else {
          // Map Firestore data to options
          const roles = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              value: data.label,
              label: data.label,
              color: data.color,
            };
          });
          setPositionOptions(roles);
        }
        setRolesLoading(false);
      },
      (error) => {
        console.error("Error loading roles:", error);
        // ✅ NO FALLBACKS - Return empty array on error too
        setPositionOptions([]);
        setRolesLoading(false);
      },
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return { positionOptions, rolesLoading };
};

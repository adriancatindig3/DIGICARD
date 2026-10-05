import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import AccountNotFound from "../status/AccountNotFound";
import { displayCompany } from "../utils/profileHelpers.jsx";
import { foldLegacyCardStyle } from "../utils/cardStyle";
import {
  Layout1,
  Layout2,
  Layout3,
  Layout4,
  Layout5,
  Layout6,
  Layout7,
  Layout8,
  Layout9,
} from "../layouts";

const PublicProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        navigate("/");
        return;
      }
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          setError("User not found");
          setLoading(false);
          return;
        }
        let data = userDoc.data();
        if (data?.aliasOf) {
          const canonicalDoc = await getDoc(doc(db, "users", data.aliasOf));
          if (canonicalDoc.exists() && !canonicalDoc.data()?.aliasOf) {
            data = canonicalDoc.data();
          }
        }

        // Check account status - ONLY show if approved
        const status = data.accountStatus;
        setAccountStatus(status);

        // If not approved, don't load user data
        if (status !== "approved") {
          setLoading(false);
          return;
        }

        const allSocialLinks = {
          facebook: data.socialLinks?.facebook || "",
          twitter: data.socialLinks?.twitter || "",
          instagram: data.socialLinks?.instagram || "",
          linkedin: data.socialLinks?.linkedin || "",
          github: data.socialLinks?.github || "",
          youtube: data.socialLinks?.youtube || "",
          website: data.socialLinks?.website || "",
          ...data.socialLinks,
        };
        const folded = foldLegacyCardStyle(data);
        setUserData({
          displayName: data.displayName || "User",
          email: data.email || "",
          photoURL: data.photoURL || "",
          bio: data.bio || "",
          location: data.location || "",
          phoneNumber: data.phoneNumber || "",
          occupation: data.position || data.occupation || "",
          company: displayCompany(data.company),
          joinDate: data.joinDate || "",
          socialLinks: allSocialLinks,
          selectedLayout: data.selectedLayout || 1,
          cardStyles: folded.cardStyles,
          cardColorStart: "",
          cardColorEnd: "",
          cardGradient: "",
          cardFont: "",
          cardTextColor: "",
          coverPhotoURL: data.coverPhotoURL || "",
          createdAt: data.createdAt || "",
          skills: data.skills || "",
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, navigate]);

  const layoutComponents = {
    1: Layout1,
    2: Layout2,
    3: Layout3,
    4: Layout4,
    5: Layout5,
    6: Layout6,
    7: Layout7,
    8: Layout8,
    9: Layout9,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show AccountNotFound if:
  // 1. There's no error but account status is not approved
  // 2. Or if there's an error (user not found)
  if (error || (accountStatus && accountStatus !== "approved")) {
    return <AccountNotFound />;
  }

  if (!userData) return null;

  const SelectedLayout = layoutComponents[userData.selectedLayout] || Layout1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <SelectedLayout userData={userData} />
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;

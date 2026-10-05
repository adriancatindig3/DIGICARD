import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

// Creates the same pending account the registration step used to write,
// so a new login can follow the existing status-page routing.
export async function createPendingUser(user) {
  const userRef = doc(db, "users", user.uid);

  await setDoc(userRef, {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    occupation: "",
    position: "",
    roleValue: "",
    accountStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bio: "",
    location: "",
    phoneNumber: "",
    company: "",
    skills: "",
    socialLinks: {},
    selectedLayout: 1,
    accountType: "user",
    lastLoginAt: new Date().toISOString(),
    isActive: false,
  });
}

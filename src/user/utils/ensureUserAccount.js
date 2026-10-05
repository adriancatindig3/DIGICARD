import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  PROTECTED_ADMIN_EMAIL,
  isDesignatedAdmin,
} from "../../admin/adminHelpers";

// Creates the same pending account the registration step used to write,
// so a new login can follow the existing status-page routing.
// The designated admin email is never written as a pending user.
export async function createPendingUser(user) {
  if (isDesignatedAdmin(user)) {
    return ensureDesignatedAdmin(user);
  }

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

export function adminAccountFields(user) {
  const now = new Date().toISOString();

  return {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || PROTECTED_ADMIN_EMAIL,
    photoURL: user.photoURL || "",
    occupation: "",
    position: "",
    roleValue: "",
    accountStatus: "approved",
    status: "approved",
    createdAt: now,
    updatedAt: now,
    bio: "",
    location: "",
    phoneNumber: "",
    company: "",
    skills: "",
    socialLinks: {},
    selectedLayout: 1,
    accountType: "admin",
    role: "admin",
    lastLoginAt: now,
    isActive: true,
  };
}

// On every sign-in, force the admin lock fields for this email.
// Merge keeps the rest of an existing profile in place.
export async function ensureDesignatedAdmin(user) {
  if (!isDesignatedAdmin(user)) {
    throw new Error("Refusing to create an admin account for this user.");
  }

  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);
  const now = new Date().toISOString();
  const fields = existing.exists()
    ? {
        email: user.email || existing.data()?.email || PROTECTED_ADMIN_EMAIL,
        accountType: "admin",
        role: "admin",
        accountStatus: "approved",
        status: "approved",
        isActive: true,
        updatedAt: now,
        lastLoginAt: now,
      }
    : adminAccountFields(user);

  await setDoc(userRef, fields, { merge: true });
  return { ...(existing.data() || {}), ...fields };
}

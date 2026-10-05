import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  PROTECTED_ADMIN_EMAIL,
  isDesignatedAdmin,
} from "../../admin/adminHelpers";
import {
  normalizeEmail,
  pickCanonicalAccount,
} from "../../shared/accountIdentity";

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
    email: normalizeEmail(user.email) || user.email || "",
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

export async function findUsersByEmail(email) {
  const normalized = normalizeEmail(email);
  const raw = String(email || "").trim();
  const values = [...new Set([raw, normalized].filter(Boolean))];
  if (values.length === 0) return [];

  const snaps = await Promise.all(
    values.map((value) =>
      getDocs(query(collection(db, "users"), where("email", "==", value))),
    ),
  );
  const byId = new Map();
  snaps.forEach((snap) => {
    snap.docs.forEach((item) => {
      byId.set(item.id, { id: item.id, ...item.data() });
    });
  });
  return [...byId.values()];
}

function aliasFields(user, canonical) {
  const now = new Date().toISOString();
  return {
    uid: user.uid,
    email: normalizeEmail(user.email || canonical.email),
    displayName: user.displayName || canonical.displayName || "",
    photoURL: user.photoURL || "",
    aliasOf: canonical.id,
    accountStatus: canonical.accountStatus || "pending",
    isActive: canonical.isActive === true,
    accountType: "user",
    updatedAt: now,
    lastLoginAt: now,
  };
}

// Returns the one profile for this email. A second device is stored as an
// alias so it cannot show up as another pending account.
export async function ensureCanonicalAccount(user) {
  if (!user?.uid) throw new Error("Sign in before continuing.");
  if (isDesignatedAdmin(user)) {
    const data = await ensureDesignatedAdmin(user);
    return { id: user.uid, data };
  }

  const ownRef = doc(db, "users", user.uid);
  const ownSnap = await getDoc(ownRef);
  const own = ownSnap.exists() ? { id: ownSnap.id, ...ownSnap.data() } : null;
  const now = new Date().toISOString();

  if (own?.aliasOf && own.aliasOf !== user.uid) {
    const canonicalSnap = await getDoc(doc(db, "users", own.aliasOf));
    if (canonicalSnap.exists() && !canonicalSnap.data()?.aliasOf) {
      const data = canonicalSnap.data();
      await setDoc(
        ownRef,
        aliasFields(user, { id: canonicalSnap.id, ...data }),
        { merge: true },
      );
      await setDoc(canonicalSnap.ref, { lastLoginAt: now }, { merge: true });
      return { id: canonicalSnap.id, data: { ...data, lastLoginAt: now } };
    }
  }

  let matches = [];
  try {
    matches = await findUsersByEmail(user.email || own?.email);
  } catch (error) {
    console.error("Could not look up the existing account:", error);
  }
  if (own && !matches.some((item) => item.id === own.id)) matches.push(own);

  const candidates = matches.filter(
    (item) =>
      item &&
      !item.aliasOf &&
      item.accountType !== "admin" &&
      item.role !== "admin" &&
      !isDesignatedAdmin(item),
  );
  const canonical = pickCanonicalAccount(candidates, user.uid);

  if (!canonical) {
    await createPendingUser(user);
    const created = await getDoc(ownRef);
    return { id: user.uid, data: created.data() || {} };
  }

  if (canonical.id === user.uid) {
    const email = normalizeEmail(user.email || canonical.email);
    await setDoc(
      ownRef,
      { lastLoginAt: now, ...(email ? { email } : {}) },
      { merge: true },
    );
    return { id: canonical.id, data: { ...canonical, lastLoginAt: now } };
  }

  await setDoc(ownRef, aliasFields(user, canonical), { merge: true });
  await setDoc(doc(db, "users", canonical.id), { lastLoginAt: now }, { merge: true });
  return { id: canonical.id, data: { ...canonical, lastLoginAt: now } };
}

export async function canonicalUserRef(user) {
  const account = await ensureCanonicalAccount(user);
  return doc(db, "users", account.id);
}

export function subscribeCanonicalAccount(user, onNext, onError) {
  let unsubscribe = () => {};
  let cancelled = false;

  ensureCanonicalAccount(user)
    .then((account) => {
      if (cancelled) return;
      unsubscribe = onSnapshot(doc(db, "users", account.id), onNext, onError);
    })
    .catch((error) => {
      if (!cancelled && onError) onError(error);
    });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}

// Writes the same status onto every profile that shares this email, and
// points the extras at the one account admin is looking at.
export async function applyAccountStatus(userId, email, fields, extraIds = []) {
  const ids = new Set([userId, ...extraIds.filter(Boolean)]);
  try {
    const matches = await findUsersByEmail(email);
    matches.forEach((match) => {
      if (match.accountType === "admin" || match.role === "admin") return;
      if (isDesignatedAdmin(match)) return;
      ids.add(match.id);
    });
  } catch (error) {
    console.error("Could not find matching accounts:", error);
  }

  await Promise.all(
    [...ids].map(async (id) => {
      try {
        await updateDoc(doc(db, "users", id), {
          ...fields,
          ...(id === userId ? { aliasOf: deleteField() } : { aliasOf: userId }),
        });
      } catch (error) {
        console.error("Could not update linked account:", id, error);
      }
    }),
  );
}

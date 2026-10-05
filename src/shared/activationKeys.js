import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { logAdminAction } from "../admin/adminHelpers";
import {
  formatActivationKey,
  generateActivationKey,
  isWellFormedActivationKey,
  normalizeActivationKey,
} from "./activationKeyFormat";

const COLLECTION = "activationKeys";

export function activationKeyRef(code) {
  return doc(db, COLLECTION, normalizeActivationKey(code));
}

export function listenActivationKeys(onKeys, onError) {
  const keysQuery = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    keysQuery,
    (snap) => {
      onKeys(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError,
  );
}

export async function createActivationKeys(count, admin) {
  const total = Math.min(100, Math.max(1, Math.floor(Number(count)) || 1));
  const created = [];
  const seen = new Set();

  while (created.length < total) {
    const formatted = generateActivationKey();
    const code = normalizeActivationKey(formatted);
    if (seen.has(code)) continue;
    const existing = await getDoc(doc(db, COLLECTION, code));
    if (existing.exists()) continue;
    seen.add(code);
    created.push(formatted);
  }

  const batch = writeBatch(db);
  const createdAt = new Date().toISOString();
  for (const formatted of created) {
    const code = normalizeActivationKey(formatted);
    batch.set(doc(db, COLLECTION, code), {
      code: formatted,
      status: "available",
      createdAt,
      createdBy: admin?.email || "admin",
      usedAt: null,
      usedBy: null,
      usedByEmail: null,
    });
  }

  await batch.commit();
  await logAdminAction(
    admin?.email,
    "GENERATE_KEYS",
    null,
    `Generated ${created.length} activation key${created.length === 1 ? "" : "s"}`,
    { adminName: admin?.displayName },
  );
  return created;
}

export async function revokeActivationKey(code, admin) {
  const ref = activationKeyRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Key not found.");
    if (snap.data().status === "used") {
      throw new Error("A used key stays on record.");
    }
    tx.delete(ref);
  });
  await logAdminAction(
    admin?.email,
    "REVOKE_KEY",
    null,
    `Revoked ${formatActivationKey(code)}`,
    { adminName: admin?.displayName },
  );
}

export async function redeemActivationKey(user, rawKey) {
  if (!user?.uid) throw new Error("Sign in before using an activation key.");
  const code = normalizeActivationKey(rawKey);
  if (!isWellFormedActivationKey(code)) {
    throw new Error("This activation key is not valid.");
  }

  const keyRef = activationKeyRef(code);
  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (tx) => {
    const keySnap = await tx.get(keyRef);
    if (!keySnap.exists()) throw new Error("This activation key is not valid.");
    const key = keySnap.data();
    if (key.status === "used") {
      throw new Error("This activation key has already been used.");
    }
    if (key.status !== "available") {
      throw new Error("This activation key is no longer valid.");
    }

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error("Account not found.");
    const status = userSnap.data().accountStatus;
    if (status === "approved") {
      throw new Error("This account is already active.");
    }
    if (status !== "pending") {
      throw new Error("This account cannot be activated with a key.");
    }

    const now = new Date().toISOString();
    tx.update(keyRef, {
      status: "used",
      usedAt: now,
      usedBy: user.uid,
      usedByEmail: user.email || "",
    });
    tx.update(userRef, {
      accountStatus: "approved",
      status: "approved",
      isActive: true,
      approvedAt: now,
      approvedBy: "activation-key",
      activationKey: formatActivationKey(code),
      updatedAt: now,
    });
  });

  await logAdminAction(
    user.email,
    "ACTIVATE",
    { id: user.uid, email: user.email, displayName: user.displayName },
    `Activated with ${formatActivationKey(code)}`,
  );
}

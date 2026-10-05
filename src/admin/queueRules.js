export const PROTECTED_ADMIN_ID = "GMKlUNCjV7XOCfIDhbMgZ1jrywH3";
export const PROTECTED_ADMIN_EMAIL = "adriancatindig3@gmail.com";

const PROTECTED_ADMIN_IDS = new Set([
  PROTECTED_ADMIN_ID,
  "GcYpHG3jgNUM28R1YNZMECGvHg83",
]);

const STATUS_RANK = {
  pending: 0,
  rejected: 1,
  approved: 2,
  deleted: 3,
};

export function isAdminAccount(account) {
  if (!account) return false;
  return account.accountType === "admin" || account.role === "admin";
}

// Email is the permanent match. A later Google sign-in can use a new uid.
export function isDesignatedAdmin(account) {
  if (!account) return false;
  const email = String(account.email || "").toLowerCase();
  const id = account.id || account.uid || "";
  return email === PROTECTED_ADMIN_EMAIL || PROTECTED_ADMIN_IDS.has(id);
}

export function adminLockFields() {
  return {
    accountType: "admin",
    role: "admin",
    accountStatus: "approved",
    status: "approved",
    isActive: true,
  };
}

// Refuse delete, reject, demote, or deactivate for the designated admin.
export function refusedAccountChange(account, changes = {}) {
  const designated =
    isDesignatedAdmin(account) ||
    isDesignatedAdmin({
      email: changes.email,
      id: accountId(account),
      uid: account?.uid,
    });
  if (!designated) return "";

  if (changes.delete === true) {
    return "This admin account cannot be deleted.";
  }
  if (changes.accountType != null && changes.accountType !== "admin") {
    return "This admin account cannot be demoted.";
  }
  if (changes.role != null && changes.role !== "admin") {
    return "This admin account cannot be demoted.";
  }
  const nextStatus = changes.accountStatus ?? changes.status;
  if (nextStatus != null && nextStatus !== "approved") {
    return "This admin account cannot be rejected or deactivated.";
  }
  if (changes.isActive === false) {
    return "This admin account cannot be deactivated.";
  }
  return "";
}

export function accountId(account) {
  return account?.id || account?.uid || "";
}

// Hidden from the queue, and refused by approve / reject / delete.
export function isProtectedQueueAccount(account, signedInAdminId) {
  const id = accountId(account);
  const email = String(account?.email || "").toLowerCase();

  if (!id) return true;
  if (signedInAdminId && id === signedInAdminId) return true;
  if (PROTECTED_ADMIN_IDS.has(id)) return true;
  if (email === PROTECTED_ADMIN_EMAIL) return true;
  if (isAdminAccount(account)) return true;
  return false;
}

export function visibleQueueAccounts(accounts, signedInAdminId) {
  return (accounts || []).filter(
    (account) => !isProtectedQueueAccount(account, signedInAdminId),
  );
}

export function canReviewAccount(account, signedInAdminId) {
  return !isProtectedQueueAccount(account, signedInAdminId);
}

export function routeStatus(account) {
  if (isDesignatedAdmin(account) || isAdminAccount(account)) return "admin";

  const status = account?.accountStatus || account?.status;
  if (
    status === "approved" ||
    status === "rejected" ||
    status === "deleted"
  ) {
    return status;
  }

  return "pending";
}

export function routePath(account) {
  const status = routeStatus(account);
  if (status === "admin") return "/admin";
  if (status === "approved") return "/home";
  if (status === "rejected") return "/rejected";
  if (status === "deleted") return "/deleted";
  return "/pending";
}

function createdMillis(account) {
  const value = account?.createdAt;
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortQueueAccounts(accounts) {
  return [...(accounts || [])].sort((a, b) => {
    const rankA = STATUS_RANK[a.accountStatus] ?? 4;
    const rankB = STATUS_RANK[b.accountStatus] ?? 4;
    if (rankA !== rankB) return rankA - rankB;
    return createdMillis(b) - createdMillis(a);
  });
}

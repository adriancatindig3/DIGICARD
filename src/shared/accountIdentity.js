// One person can sign in on a phone and a laptop and receive two Firebase
// ids. Those ids share an email and must stay one account.

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createdAtKey(account) {
  const value = account?.createdAt;
  if (!value) return "9999";
  if (typeof value === "string") return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch {
      return "9999";
    }
  }
  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }
  return "9999";
}

function profileScore(account) {
  const fields = [
    "occupation",
    "position",
    "bio",
    "phoneNumber",
    "company",
    "coverPhoto",
    "coverPhotoURL",
    "skills",
    "location",
  ];
  return fields.reduce((score, key) => score + (account?.[key] ? 1 : 0), 0);
}

const STATUS_RANK = {
  approved: 0,
  rejected: 1,
  deleted: 2,
  pending: 3,
};

// Prefer an approved account, then the profile that already has details,
// then the oldest sign-in. The current device wins only a tie.
export function pickCanonicalAccount(accounts, preferredUid = "") {
  const real = (accounts || []).filter((account) => account && !account.aliasOf);
  if (real.length === 0) return null;

  return [...real].sort((left, right) => {
    const statusDelta =
      (STATUS_RANK[left.accountStatus] ?? 1) -
      (STATUS_RANK[right.accountStatus] ?? 1);
    if (statusDelta !== 0) return statusDelta;

    const scoreDelta = profileScore(right) - profileScore(left);
    if (scoreDelta !== 0) return scoreDelta;

    const leftTime = createdAtKey(left);
    const rightTime = createdAtKey(right);
    if (leftTime !== rightTime) return leftTime < rightTime ? -1 : 1;

    if (preferredUid) {
      if (left.id === preferredUid) return -1;
      if (right.id === preferredUid) return 1;
    }
    return String(left.id).localeCompare(String(right.id));
  })[0];
}

// Hide alias rows and collapse the same email into the one account to keep.
export function collapseAccountsByEmail(accounts) {
  const groups = new Map();
  for (const account of accounts || []) {
    if (!account) continue;
    const key = normalizeEmail(account.email) || `id:${account.id}`;
    const group = groups.get(key);
    if (group) group.push(account);
    else groups.set(key, [account]);
  }

  const collapsed = [];
  for (const group of groups.values()) {
    const canonical = pickCanonicalAccount(group) || group[0];
    if (!canonical) continue;
    collapsed.push({
      ...canonical,
      siblingIds: group
        .map((item) => item.id)
        .filter((id) => id && id !== canonical.id),
    });
  }
  return collapsed;
}

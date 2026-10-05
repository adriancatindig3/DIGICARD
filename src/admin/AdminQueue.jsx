import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import {
  PROTECTED_ADMIN_ID,
  canReviewAccount,
  refusedAccountChange,
  sortQueueAccounts,
  visibleQueueAccounts,
} from "./queueRules";

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  deleted: "Deleted",
};

const STATUS_CLASS = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-rose-50 text-rose-700 border-rose-100",
  deleted: "bg-gray-100 text-gray-500 border-gray-200",
};

function displayName(account) {
  return account.displayName || account.email || "Unnamed account";
}

function QueueSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );
}

function AdminQueue() {
  const navigate = useNavigate();
  const [signedInId, setSignedInId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSignedInId(user?.uid || "");
      if (!user) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!signedInId) return undefined;

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const rows = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }));
        setAccounts(
          sortQueueAccounts(visibleQueueAccounts(rows, signedInId)),
        );
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Error loading review queue:", err);
        setError("Could not load accounts.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [signedInId]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const applyAction = async (account, action) => {
    const currentId = auth.currentUser?.uid || "";
    if (!canReviewAccount(account, currentId)) {
      throw new Error("This account cannot be changed from the review queue.");
    }

    const targetId = account.id;
    if (
      !targetId ||
      targetId === currentId ||
      targetId === PROTECTED_ADMIN_ID ||
      targetId === auth.currentUser?.uid
    ) {
      throw new Error("This account cannot be changed from the review queue.");
    }

    const targetRef = doc(db, "users", targetId);
    const fresh = await getDoc(targetRef);
    const freshAccount = fresh.exists()
      ? { id: fresh.id, ...fresh.data() }
      : null;

    if (!canReviewAccount(freshAccount, auth.currentUser?.uid || "")) {
      throw new Error("This account cannot be changed from the review queue.");
    }

    const now = new Date().toISOString();
    const actor = auth.currentUser?.email || "admin";
    const changes =
      action === "approve"
        ? {
            accountStatus: "approved",
            status: "approved",
            isActive: true,
            approvedAt: now,
            approvedBy: actor,
            updatedAt: now,
          }
        : action === "reject"
          ? {
              accountStatus: "rejected",
              status: "rejected",
              isActive: false,
              rejectedAt: now,
              rejectedBy: actor,
              updatedAt: now,
            }
          : {
              delete: true,
              accountStatus: "deleted",
              status: "deleted",
              isActive: false,
              deletedAt: now,
              deletedBy: actor,
              updatedAt: now,
            };

    const refused = refusedAccountChange(freshAccount, changes);
    if (refused) throw new Error(refused);

    const write = { ...changes };
    delete write.delete;
    await updateDoc(targetRef, write);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { account, action } = pendingAction;
    setActionId(account.id);
    setError("");

    try {
      await applyAction(account, action);
      setPendingAction(null);
    } catch (err) {
      console.error("Queue action failed:", err);
      setError(err.message || "Could not update that account.");
    } finally {
      setActionId("");
    }
  };

  if (loading) return <QueueSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review queue</h1>
            <p className="text-sm text-gray-500 mt-1">
              Other accounts only. Approving, rejecting, or deleting a row
              leaves this admin sign-in in place.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white transition"
          >
            Sign out
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
            No other accounts to review.
          </div>
        ) : (
          <ul className="space-y-3">
            {accounts.map((account) => {
              const status = account.accountStatus || "pending";
              const busy = actionId === account.id;
              return (
                <li
                  key={account.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {displayName(account)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CLASS[status] || STATUS_CLASS.pending}`}
                        >
                          {STATUS_LABEL[status] || status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {account.email || "No email"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPendingAction({ account, action: "approve" })}
                        className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPendingAction({ account, action: "reject" })}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPendingAction({ account, action: "delete" })}
                        className="px-3 py-2 rounded-xl border border-rose-200 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {pendingAction.action === "approve"
                ? "Approve this account?"
                : pendingAction.action === "reject"
                  ? "Reject this account?"
                  : "Delete this account?"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {displayName(pendingAction.account)} stays the only account this
              action updates. It will not delete your admin profile or sign
              you out.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={Boolean(actionId)}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQueue;

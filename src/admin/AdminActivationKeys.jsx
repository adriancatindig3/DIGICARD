import { useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Trash2 } from "lucide-react";
import {
  createActivationKeys,
  listenActivationKeys,
  revokeActivationKey,
} from "../shared/activationKeys";
import { formatActivationKey } from "../shared/activationKeyFormat";

const AdminActivationKeys = ({ darkMode, currentUser }) => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [freshKeys, setFreshKeys] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [revoking, setRevoking] = useState("");

  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  const text = darkMode ? "text-white" : "text-gray-900";
  const muted = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode ? "bg-gray-900" : "bg-white";

  useEffect(() => {
    const unsubscribe = listenActivationKeys(
      (next) => {
        setKeys(next);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Could not load activation keys.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const copyText = async (value, id) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch (err) {
      console.error(err);
      setError("Could not copy that key.");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const created = await createActivationKeys(count, currentUser);
      setFreshKeys(created);
    } catch (err) {
      setError(err.message || "Could not generate keys.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (code) => {
    setRevoking(code);
    setError("");
    try {
      await revokeActivationKey(code, currentUser);
    } catch (err) {
      setError(err.message || "Could not revoke that key.");
    } finally {
      setRevoking("");
    }
  };

  const available = keys.filter((key) => key.status === "available");

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border ${border} ${cardBg} p-6 shadow-sm`}>
        <h3
          className={`text-xs font-bold tracking-wider uppercase mb-1 ${muted}`}
        >
          Activation keys
        </h3>
        <p className={`text-sm ${muted} mb-4`}>
          Each key works once. A pending account that enters it is approved.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className={`text-xs font-medium ${muted}`} htmlFor="key-count">
            How many
          </label>
          <input
            id="key-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className={`w-24 px-3 py-2 rounded-lg text-sm border ${border} ${inputBg} ${text}`}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition ${
              darkMode
                ? "bg-white text-gray-900 hover:bg-gray-200"
                : "bg-gray-900 text-white hover:bg-gray-700"
            } ${generating ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {generating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <KeyRound size={13} />
            )}
            Generate keys
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        {freshKeys.length > 0 && (
          <div className={`mt-4 rounded-xl border ${border} p-3`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>
                Just generated
              </p>
              <button
                type="button"
                onClick={() => copyText(freshKeys.join("\n"), "fresh")}
                className={`text-xs font-medium ${muted} hover:underline`}
              >
                {copied === "fresh" ? "Copied" : "Copy list"}
              </button>
            </div>
            <ul className="space-y-1">
              {freshKeys.map((key) => (
                <li
                  key={key}
                  className={`font-mono text-sm tracking-wide ${text}`}
                >
                  {key}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={`rounded-xl border ${border} ${cardBg} p-6 shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-xs font-bold tracking-wider uppercase ${muted}`}
          >
            {available.length} available
          </h3>
          {available.length > 0 && (
            <button
              type="button"
              onClick={() =>
                copyText(
                  available.map((key) => formatActivationKey(key.code || key.id)).join("\n"),
                  "available",
                )
              }
              className={`text-xs font-medium ${muted} hover:underline`}
            >
              {copied === "available" ? "Copied" : "Copy unused"}
            </button>
          )}
        </div>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 size={18} className={`animate-spin ${muted}`} />
          </div>
        ) : keys.length === 0 ? (
          <p className={`text-sm ${muted}`}>No keys yet.</p>
        ) : (
          <ul className="space-y-2">
            {keys.map((key) => {
              const label = formatActivationKey(key.code || key.id);
              const used = key.status === "used";
              const revoked = key.status === "revoked";
              return (
                <li
                  key={key.id}
                  className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border ${border}`}
                >
                  <span className={`font-mono text-sm tracking-wide flex-1 ${text}`}>
                    {label}
                  </span>
                  <span
                    className={`text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      used
                        ? "bg-gray-100 text-gray-500"
                        : revoked
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-700"
                    }`}
                  >
                    {used ? "Used" : revoked ? "Revoked" : "Available"}
                  </span>
                  {used && (
                    <span className={`text-xs ${muted}`}>
                      {key.usedByEmail || "Redeemed"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => copyText(label, key.id)}
                    className={`p-1.5 rounded-md ${muted}`}
                    title="Copy key"
                  >
                    <Copy size={13} />
                    <span className="sr-only">
                      {copied === key.id ? "Copied" : "Copy"}
                    </span>
                  </button>
                  {!used && !revoked && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(key.id)}
                      disabled={revoking === key.id}
                      className="p-1.5 rounded-md text-red-500 disabled:opacity-40"
                      title="Revoke key"
                    >
                      {revoking === key.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminActivationKeys;

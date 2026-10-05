import { FaEnvelope } from "react-icons/fa";

const ConnectButton = ({ onClick, dark = true }) => (
  <button
    onClick={onClick}
    className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
      dark
        ? "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white"
        : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
    }`}
  >
    <span className="flex items-center justify-center gap-2">
      <FaEnvelope className="w-4 h-4" />
      Let's connect
    </span>
  </button>
);

export default ConnectButton;

import { useState, useEffect, useRef } from "react";
import { FaEnvelope, FaCheckCircle, FaTimes } from "react-icons/fa";

const FloatingConnectForm = ({
  showConnectForm,
  setShowConnectForm,
  userData,
  connectName,
  setConnectName,
  connectEmail,
  setConnectEmail,
  connectCompany,
  setConnectCompany,
  connectPhone,
  setConnectPhone,
  message,
  setMessage,
  handleConnectSubmit,
  isSending,
  sendSuccess,
  sendError,
  darkMode = true,
}) => {
  const nameInputRef = useRef(null);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (showConnectForm && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showConnectForm]);

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    let digits = value.replace(/\D/g, "");
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }
    setConnectPhone(digits);
    if (digits.length > 0 && digits.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (connectPhone.length > 0 && connectPhone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
    }
  };

  const isFormValid = () => {
    if (connectPhone.length > 0 && connectPhone.length !== 10) {
      return false;
    }
    return true;
  };

  if (!showConnectForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl animate-slideUp overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Connect with {userData?.displayName?.split(" ")[0] || "User"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Fill out the form below to send a message
              </p>
            </div>
            <button
              onClick={() => setShowConnectForm(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all -mt-1 -mr-1"
              type="button"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {sendSuccess ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <FaCheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900">
              Request Sent!
            </h3>
            <p className="text-sm text-gray-600">
              Your connection request has been sent successfully.
            </p>
          </div>
        ) : (
          <div className="px-6 py-5">
            {sendError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-600">{sendError}</p>
              </div>
            )}

            <form onSubmit={handleConnectSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={connectName}
                  onChange={(e) => setConnectName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-all bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={connectEmail}
                  onChange={(e) => setConnectEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-all bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  Company Name{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={connectCompany}
                  onChange={(e) => setConnectCompany(e.target.value)}
                  placeholder="Your company"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-all bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  Phone Number{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-3 py-2 text-sm rounded-l-lg bg-gray-100 text-gray-600 border border-r-0 border-gray-200 whitespace-nowrap">
                    +63
                  </span>
                  <input
                    type="tel"
                    value={connectPhone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    placeholder="9123456789"
                    className={`w-full px-3 py-2 text-sm rounded-r-lg outline-none transition-all bg-gray-50 text-gray-900 placeholder-gray-400 border ${
                      phoneError
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    } focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Enter 10 digits (e.g., 9123456789)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`What would you like to say to ${userData?.displayName?.split(" ")[0] || "them"}?`}
                  required
                  rows="3"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-all resize-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || !!phoneError || !isFormValid()}
                className="w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaEnvelope className="w-3.5 h-3.5" />
                    Send Connection Request
                  </span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingConnectForm;

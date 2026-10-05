import { FaEnvelope, FaPhone } from "react-icons/fa";
import ConnectButton from "../components/ConnectButton";
import SchoolLogo from "../components/SchoolLogo";
import { getSocialIcon, getInitials } from "../utils/profileHelpers.jsx";
const Layout1 = ({ userData, schoolLogo, onConnect }) => (
  <div
    className="w-full font-['Inter'] text-white"
    style={{
      background: "linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)",
    }}
  >
    <div className="pt-6 pb-4 px-4">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
          style={{
            background: "#2a3f2a",
            border: "2px solid rgba(255,255,255,0.2)",
          }}
        >
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-lg font-semibold"
              style={{ background: "#3a5a3a" }}
            >
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white mb-1 truncate">
            {userData?.displayName}
          </h1>
          {userData?.occupation && (
            <p
              className="text-sm font-medium truncate"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {userData.occupation}
            </p>
          )}
          {userData?.company && (
            <div className="flex items-center gap-1 mt-1">
              <SchoolLogo
                schoolLogo={schoolLogo}
                className="w-3 h-3"
                style={{ opacity: 0.8 }}
              />
              <span
                className="text-xs truncate"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {userData.company}
              </span>
            </div>
          )}
        </div>
      </div>
      {userData?.bio && (
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {userData.bio}
        </p>
      )}
      <div
        className="flex justify-around py-3"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="text-center">
          <div className="text-lg font-bold">
            {userData?.skills?.split(",").length || 0}
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Skills
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">
            {Object.values(userData?.socialLinks || {}).filter(Boolean).length}
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Links
          </div>
        </div>
      </div>
    </div>
    <div className="px-4 pb-6 space-y-3">
      {userData?.skills && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h3
            className="text-xs font-bold mb-3 uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {userData.skills.split(",").map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {s.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
      {(userData?.email || userData?.phoneNumber) && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h3
            className="text-xs font-bold mb-3 uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Contact
          </h3>
          <div className="space-y-2">
            {userData?.email && (
              <a
                href={`mailto:${userData.email}`}
                className="flex items-center gap-3 text-sm"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                <FaEnvelope />
                <span>{userData.email}</span>
              </a>
            )}
            {userData?.phoneNumber && (
              <a
                href={`tel:${userData.phoneNumber}`}
                className="flex items-center gap-3 text-sm"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                <FaPhone />
                <span>{userData.phoneNumber}</span>
              </a>
            )}
          </div>
        </div>
      )}
      {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h3
            className="text-xs font-bold mb-3 uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Connect
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(userData.socialLinks)
              .filter(([, v]) => v)
              .map(([p, url]) => (
                <a
                  key={p}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div style={{ color: "rgba(255,255,255,0.7)" }}>
                    {getSocialIcon(p)}
                  </div>
                  <span
                    className="text-[9px] capitalize"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {p}
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}
      <ConnectButton onClick={onConnect} dark={true} />
    </div>
  </div>
);

export default Layout1;

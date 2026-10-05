import { FaEnvelope, FaPhone } from "react-icons/fa";
import ConnectButton from "../components/ConnectButton";
import CoverBanner from "../components/CoverBanner";
import { getSocialIcon, getInitials } from "../utils/profileHelpers.jsx";

const Layout5 = ({ userData, onConnect }) => (
  <div className="w-full font-['Inter']" style={{ background: "#0d1b2e" }}>
    <CoverBanner src={userData?.coverPhotoURL}>
      <div
        style={{ background: "linear-gradient(135deg, #0d1b2e, #1a3a5c)" }}
        className="h-full w-full"
      />
    </CoverBanner>
    <div className="px-6 py-4 relative" style={{ background: "#0d1b2e" }}>
      <div
        className="w-20 h-20 rounded-2xl overflow-hidden absolute -top-10 left-6"
        style={{
          border: "4px solid #0d1b2e",
          background: "linear-gradient(135deg, #1a3a5c, #0d1b2e)",
        }}
      >
        {userData?.photoURL ? (
          <img src={userData.photoURL} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
            style={{ background: "#1a3a5c" }}
          >
            {getInitials(userData?.displayName)}
          </div>
        )}
      </div>
      <div className="pt-12">
        <h1 className="text-xl font-bold text-white mb-1">
          {userData?.displayName}
        </h1>
        {userData?.occupation && (
          <p className="text-sm font-medium mb-1" style={{ color: "#93b4d4" }}>
            {userData.occupation}
          </p>
        )}
        {userData?.company && (
          <p className="text-xs mb-4" style={{ color: "#5a8ab0" }}>
            {userData.company}
          </p>
        )}
        {userData?.bio && (
          <p
            className="text-sm leading-relaxed mb-4 pb-4"
            style={{
              color: "#93b4d4",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {userData.bio}
          </p>
        )}
        {userData?.skills && (
          <div
            className="mb-4 pb-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h3
              className="text-xs font-bold mb-2 uppercase tracking-wider"
              style={{ color: "#5a8ab0" }}
            >
              Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills
                .split(",")
                .slice(0, 6)
                .map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "#93b4d4",
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
            className="mb-4 pb-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h3
              className="text-xs font-bold mb-2 uppercase tracking-wider"
              style={{ color: "#5a8ab0" }}
            >
              Contact
            </h3>
            <div className="space-y-2">
              {userData?.email && (
                <a
                  href={`mailto:${userData.email}`}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "#93b4d4" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <FaEnvelope style={{ color: "#5a8ab0" }} />
                  </div>
                  <span>{userData.email}</span>
                </a>
              )}
              {userData?.phoneNumber && (
                <a
                  href={`tel:${userData.phoneNumber}`}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "#93b4d4" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <FaPhone style={{ color: "#5a8ab0" }} />
                  </div>
                  <span>{userData.phoneNumber}</span>
                </a>
              )}
            </div>
          </div>
        )}
        {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
          <div>
            <h3
              className="text-xs font-bold mb-2 uppercase tracking-wider"
              style={{ color: "#5a8ab0" }}
            >
              Connect
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(userData.socialLinks)
                .filter(([, v]) => v)
                .map(([p, url]) => (
                  <a
                    key={p}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "#93b4d4",
                    }}
                  >
                    {getSocialIcon(p)}
                  </a>
                ))}
            </div>
          </div>
        )}
        <ConnectButton onClick={onConnect} dark={true} />
      </div>
    </div>
  </div>
);

export default Layout5;

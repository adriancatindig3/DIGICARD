import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import ConnectButton from "../components/ConnectButton";
import { getSocialIcon, getInitials } from "../utils/profileHelpers.jsx";

const Layout7 = ({ userData, onConnect }) => (
  <div
    className="w-full font-['Inter'] text-white"
    style={{ background: "linear-gradient(160deg, #2a3a2a, #1a2a1e)" }}
  >
    <div className="flex flex-col items-center pt-8 pb-4 px-4">
      <div
        className="w-24 h-24 rounded-full overflow-hidden border-2 mb-3"
        style={{ borderColor: "rgba(255,255,255,0.3)" }}
      >
        {userData?.photoURL ? (
          <img src={userData.photoURL} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-green-900 text-white text-2xl font-medium">
            {getInitials(userData?.displayName)}
          </div>
        )}
      </div>
      <h1 className="text-xl font-medium text-white mb-1">
        {userData?.displayName}
      </h1>
      <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
        {userData?.occupation}
        {userData?.occupation && userData?.company ? " | " : ""}
        {userData?.company}
      </p>

      {userData?.bio && (
        <p
          className="text-xs text-center mb-4"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {userData.bio}
        </p>
      )}

      <ConnectButton onClick={onConnect} dark={true} />

      {userData?.skills && (
        <div className="w-full mb-4 mt-4">
          <h3
            className="text-xs font-bold mb-2 uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.5)" }}
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
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {s.trim()}
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="w-full space-y-2">
        {userData?.phoneNumber && (
          <a
            href={`tel:${userData.phoneNumber}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <FaPhone />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Call me</div>
              <div className="text-[11px] opacity-60">
                {userData.phoneNumber}
              </div>
            </div>
            <span className="text-xs opacity-40">↗</span>
          </a>
        )}
        {userData?.email && (
          <a
            href={`mailto:${userData.email}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <FaEnvelope />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Email me</div>
              <div className="text-[11px] opacity-60">{userData.email}</div>
            </div>
            <span className="text-xs opacity-40">↗</span>
          </a>
        )}
        {userData?.location && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(userData.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <FaMapMarkerAlt />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">View Location</div>
            </div>
            <span className="text-xs opacity-40">↗</span>
          </a>
        )}
        {Object.entries(userData?.socialLinks || {})
          .filter(([, v]) => v)
          .map(([p, url]) => (
            <a
              key={p}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white no-underline"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                {getSocialIcon(p)}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium capitalize">Follow me</div>
                <div className="text-[11px] opacity-60">
                  {url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
                </div>
              </div>
              <span className="text-xs opacity-40">↗</span>
            </a>
          ))}
      </div>
    </div>
  </div>
);

export default Layout7;

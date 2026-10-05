import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import ConnectButton from "../components/ConnectButton";
import { getSocialIcon, getInitials } from "../utils/profileHelpers.jsx";

const Layout9 = ({ userData, onConnect }) => (
  <div className="w-full bg-white font-['Inter']">
    <div className="flex flex-col items-center pt-8 pb-4 px-4">
      <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200 mb-3">
        {userData?.photoURL ? (
          <img src={userData.photoURL} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-2xl font-medium">
            {getInitials(userData?.displayName)}
          </div>
        )}
      </div>
      <h1 className="text-xl font-medium text-gray-900 mb-1">
        {userData?.displayName}
      </h1>
      <p className="text-xs text-gray-500 mb-2">
        {userData?.occupation}
        {userData?.occupation && userData?.company ? " | " : ""}
        <span className="underline">{userData?.company}</span>
      </p>

      {userData?.bio && (
        <p className="text-xs text-center text-gray-600 mb-4">{userData.bio}</p>
      )}

      <ConnectButton onClick={onConnect} dark={false} />

      {userData?.skills && (
        <div className="w-full mb-4 mt-4">
          <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Expertise
          </h3>
          <div className="flex flex-wrap gap-2">
            {userData.skills
              .split(",")
              .slice(0, 6)
              .map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs border border-gray-200"
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline"
            style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-500">
              <FaPhone className="text-white text-xs" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900">Call me</div>
              <div className="text-[11px] text-gray-500">
                {userData.phoneNumber}
              </div>
            </div>
            <span className="text-xs text-gray-400">↗</span>
          </a>
        )}
        {userData?.email && (
          <a
            href={`mailto:${userData.email}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline"
            style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500">
              <FaEnvelope className="text-white text-xs" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900">Email me</div>
              <div className="text-[11px] text-gray-500">{userData.email}</div>
            </div>
            <span className="text-xs text-gray-400">↗</span>
          </a>
        )}
        {userData?.location && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(userData.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline"
            style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500">
              <FaMapMarkerAlt className="text-white text-xs" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900">
                View Location
              </div>
            </div>
            <span className="text-xs text-gray-400">↗</span>
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline"
              style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-600">
                <span className="text-white text-xs">{getSocialIcon(p)}</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-900 capitalize">
                  Follow me
                </div>
                <div className="text-[11px] text-gray-500">
                  {url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
                </div>
              </div>
              <span className="text-xs text-gray-400">↗</span>
            </a>
          ))}
      </div>
    </div>
  </div>
);

export default Layout9;

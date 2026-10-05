import { FaEnvelope, FaPhone } from "react-icons/fa";
import ConnectButton from "../components/ConnectButton";
import SchoolLogo from "../components/SchoolLogo";
import { getSocialIcon, getInitials } from "../utils/profileHelpers.jsx";

const Layout3 = ({ userData, schoolLogo, onConnect }) => (
  <div className="w-full bg-white font-['Inter']">
    <div className="pt-6 pb-4 px-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-lg font-semibold">
              {getInitials(userData?.displayName)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 mb-1 truncate">
            {userData?.displayName}
          </h1>
          {userData?.occupation && (
            <p className="text-sm font-medium text-gray-600 truncate">
              {userData.occupation}
            </p>
          )}
          {userData?.company && (
            <div className="flex items-center gap-1 mt-1">
              <SchoolLogo schoolLogo={schoolLogo} className="w-3 h-3" />
              <span className="text-xs text-gray-400">{userData.company}</span>
            </div>
          )}
        </div>
      </div>
      {userData?.bio && (
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {userData.bio}
        </p>
      )}
      <div className="flex justify-around py-3 border-y border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {userData?.skills?.split(",").length || 0}
          </div>
          <div className="text-xs text-gray-400">Skills</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {Object.values(userData?.socialLinks || {}).filter(Boolean).length}
          </div>
          <div className="text-xs text-gray-400">Links</div>
        </div>
      </div>
    </div>
    <div className="px-4 pb-6 space-y-3">
      {userData?.skills && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {userData.skills.split(",").map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200"
              >
                {s.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
      {(userData?.email || userData?.phoneNumber) && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Contact
          </h3>
          <div className="space-y-2">
            {userData?.email && (
              <a
                href={`mailto:${userData.email}`}
                className="flex items-center gap-3 text-sm text-gray-700"
              >
                <FaEnvelope className="text-gray-400" />
                <span>{userData.email}</span>
              </a>
            )}
            {userData?.phoneNumber && (
              <a
                href={`tel:${userData.phoneNumber}`}
                className="flex items-center gap-3 text-sm text-gray-700"
              >
                <FaPhone className="text-gray-400" />
                <span>{userData.phoneNumber}</span>
              </a>
            )}
          </div>
        </div>
      )}
      {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
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
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-gray-200"
                >
                  <div className="text-gray-500">{getSocialIcon(p)}</div>
                  <span className="text-[9px] text-gray-400 capitalize">
                    {p}
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}
      <ConnectButton onClick={onConnect} dark={false} />
    </div>
  </div>
);

export default Layout3;

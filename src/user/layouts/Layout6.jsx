import { FaEnvelope, FaPhone } from "react-icons/fa";
import ConnectButton from "../components/ConnectButton";
import SchoolLogo from "../components/SchoolLogo";
import { getSocialIcon, getInitials } from "../utils/profileHelpers.jsx";

const Layout6 = ({ userData, schoolLogo, onConnect }) => (
  <div className="w-full bg-white font-['Inter']">
    <div
      className="h-36 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1f2937, #111827)" }}
    >
      {userData?.coverPhotoURL && (
        <img
          src={userData.coverPhotoURL}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
    </div>
    <div className="px-6 py-4 relative bg-white">
      <div
        className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg absolute -top-10 left-6"
        style={{ background: "linear-gradient(135deg, #374151, #111827)" }}
      >
        {userData?.photoURL ? (
          <img src={userData.photoURL} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xl font-bold">
            {getInitials(userData?.displayName)}
          </div>
        )}
      </div>
      <div className="pt-12">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {userData?.displayName}
        </h1>
        {userData?.occupation && (
          <p className="text-sm text-gray-600 mb-1 font-medium">
            {userData.occupation}
          </p>
        )}
        {userData?.company && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <SchoolLogo schoolLogo={schoolLogo} className="w-4 h-4" />
            <span>{userData.company}</span>
          </div>
        )}
        {userData?.bio && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4 pb-4 border-b border-gray-100">
            {userData.bio}
          </p>
        )}
        {userData?.skills && (
          <div className="mb-4 pb-4 border-b border-gray-100">
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
                    className="px-2 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs border border-gray-200"
                  >
                    {s.trim()}
                  </span>
                ))}
            </div>
          </div>
        )}
        {(userData?.email || userData?.phoneNumber) && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Contact
            </h3>
            <div className="space-y-2">
              {userData?.email && (
                <a
                  href={`mailto:${userData.email}`}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FaEnvelope className="text-gray-500 text-xs" />
                  </div>
                  <span>{userData.email}</span>
                </a>
              )}
              {userData?.phoneNumber && (
                <a
                  href={`tel:${userData.phoneNumber}`}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FaPhone className="text-gray-500 text-xs" />
                  </div>
                  <span>{userData.phoneNumber}</span>
                </a>
              )}
            </div>
          </div>
        )}
        {Object.entries(userData?.socialLinks || {}).some(([, v]) => v) && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
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
                    className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs"
                  >
                    {getSocialIcon(p)}
                  </a>
                ))}
            </div>
          </div>
        )}
        <ConnectButton onClick={onConnect} dark={false} />
      </div>
    </div>
  </div>
);

export default Layout6;

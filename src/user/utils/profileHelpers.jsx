import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaGlobe,
  FaTiktok,
  FaPinterest,
  FaReddit,
  FaSnapchat,
  FaWhatsapp,
  FaTelegram,
  FaDiscord,
  FaTwitch,
  FaMedium,
  FaQuora,
  FaDev,
  FaStackOverflow,
  FaBehance,
  FaDribbble,
  FaFigma,
  FaProductHunt,
  FaSpotify,
  FaSoundcloud,
  FaMediumM,
  FaVk,
  FaWeixin,
  FaLine,
  FaSignal,
  FaMastodon,
  FaKeybase,
  FaLink,
} from "react-icons/fa";

export const getSocialIcon = (platform) => {
  const icons = {
    facebook: <FaFacebook className="w-3 h-3" />,
    twitter: <FaTwitter className="w-3 h-3" />,
    instagram: <FaInstagram className="w-3 h-3" />,
    linkedin: <FaLinkedin className="w-3 h-3" />,
    github: <FaGithub className="w-3 h-3" />,
    youtube: <FaYoutube className="w-3 h-3" />,
    website: <FaGlobe className="w-3 h-3" />,
    tiktok: <FaTiktok className="w-3 h-3" />,
    pinterest: <FaPinterest className="w-3 h-3" />,
    reddit: <FaReddit className="w-3 h-3" />,
  };
  return icons[platform] || <FaLink className="w-3 h-3" />;
};

export const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

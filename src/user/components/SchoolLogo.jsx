const SchoolLogo = ({ schoolLogo, className = "w-3 h-3", style = {} }) => (
  <img
    src={schoolLogo}
    alt="School logo"
    className={`object-contain ${className}`}
    style={style}
    onError={(e) => {
      e.target.src = "/CCC.png";
    }}
  />
);

export default SchoolLogo;

interface CompanyLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  color?: string;
  siteName?: string;
}

export const CompanyLogo = ({ size = 40, className = "", showText = false, color = "currentColor", siteName = "Nature.co" }: CompanyLogoProps) => (
  <div className={`flex flex-col items-center ${className}`}>
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-500"
    >
      {/* Leaf Body - More stylized */}
      <path 
        d="M50 5C50 5 10 35 10 70C10 90 30 100 50 100C70 100 90 90 90 70C90 35 50 5 50 5Z" 
        fill={color === "currentColor" ? "#0A1A0A" : color} 
        stroke={color === "currentColor" ? "#1B3A1B" : "rgba(255,255,255,0.1)"} 
        strokeWidth="2"
      />
      {/* Vein / N Shape */}
      <path 
        d="M35 80V40L65 80V40" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="opacity-80"
      />
      {/* Glowing Core */}
      <circle cx="50" cy="60" r="5" fill={color === "currentColor" ? "#10B981" : color} className="animate-pulse" />
    </svg>
    {showText && (
      <span className="mt-2 text-xs font-black tracking-widest uppercase opacity-80" style={{ color }}>
        {siteName}
      </span>
    )}
  </div>
);

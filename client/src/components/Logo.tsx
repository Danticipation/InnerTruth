import logoPath from "../../assets/Chakrai-Logo-no-bg-8-28_1762163859231.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeMap = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function Logo({
  className = "",
  showText = true,
  size = "md",
  text = "InnerTruth",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoPath}
        alt={`${text} logo`}
        className={`${sizeMap[size]} object-contain`}
      />
      {showText && <span className="text-xl font-semibold">{text}</span>}
    </div>
  );
}

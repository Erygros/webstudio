type IconName =
  | "arrow-up-right"
  | "arrow-right"
  | "arrow-left"
  | "check"
  | "plus"
  | "close"
  | "menu";

const paths: Record<IconName, string> = {
  "arrow-up-right": "M7 17 17 7M7 7h10v10",
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  "arrow-left": "M19 12H5m6-6-6 6 6 6",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M18 6 6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
};

// Rein dekorative Vektor-Icons: keine Abhängigkeit von Emoji- oder Systemfonts.
// Der umgebende Link/Button stellt immer den zugänglichen Namen bereit.
export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`ui-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}

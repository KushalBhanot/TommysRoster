// Tommy's face: the small helper's avatar, drawn as an inline SVG so it stays
// sharp at any size. It uses the same family as the site's mark (public/roster-mark.png):
// a cardinal shape with a rounded gold bar, like the gold row in the mark, worn
// here as a visor. Kept geometric so it still reads at 24 to 32px.

type TommyAvatarProps = {
  /** Width and height in pixels. */
  size?: number;
};

export function TommyAvatar({ size = 32 }: TommyAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {/* Head */}
      <circle cx="16" cy="16" r="16" fill="#990000" />
      {/* Gold visor, rounded like the bars in the mark */}
      <rect x="6" y="7.5" width="20" height="4.5" rx="2.25" fill="#FFCC00" />
      {/* Eyes */}
      <circle cx="11.5" cy="17.5" r="2.4" fill="#FFFFFF" />
      <circle cx="20.5" cy="17.5" r="2.4" fill="#FFFFFF" />
      {/* Smile */}
      <path
        d="M11.5 22.5 Q16 26 20.5 22.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

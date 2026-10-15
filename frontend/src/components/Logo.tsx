export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M24 3C15.7 3 9 9.7 9 18c0 4.9 2.3 8.6 5 11.9L24 45l10-15.1c2.7-3.3 5-7 5-11.9C39 9.7 32.3 3 24 3z"
        fill="#FFC107"
        stroke="#0F0F0F"
        strokeWidth="2.5"
      />
      <circle cx="24" cy="18" r="6" fill="#0F0F0F" />
    </svg>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="logo" style={{ color: light ? '#fff' : undefined }}>
      <LogoMark />
      MORIZO
    </span>
  )
}

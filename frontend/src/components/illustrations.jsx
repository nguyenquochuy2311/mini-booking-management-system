// Self-contained SVG illustrations for empty states. Decorative (aria-hidden).

export function EmptyScheduleArt() {
  return (
    <svg width="140" height="112" viewBox="0 0 140 112" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="es-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="22" y="20" width="96" height="78" rx="12" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <rect x="22" y="20" width="96" height="20" rx="12" fill="url(#es-g)" opacity="0.16" />
      <circle cx="40" cy="16" r="4" fill="url(#es-g)" />
      <circle cx="100" cy="16" r="4" fill="url(#es-g)" />
      <rect x="40" y="16" width="2" height="10" rx="1" fill="var(--border-strong)" />
      <rect x="98" y="16" width="2" height="10" rx="1" fill="var(--border-strong)" />
      <rect x="34" y="50" width="32" height="8" rx="4" fill="var(--border)" />
      <rect x="34" y="66" width="50" height="8" rx="4" fill="var(--border)" />
      <rect x="34" y="82" width="24" height="8" rx="4" fill="var(--border)" />
      <circle cx="104" cy="80" r="18" fill="url(#es-g)" />
      <path d="M104 73v14M97 80h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function ChooseRoomArt() {
  return (
    <svg width="140" height="112" viewBox="0 0 140 112" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cr-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="30" y="40" width="80" height="52" rx="10" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <rect x="38" y="30" width="80" height="52" rx="10" fill="var(--surface)" stroke="var(--border-strong)" />
      <rect x="46" y="20" width="80" height="52" rx="10" fill="var(--surface)" stroke="url(#cr-g)" strokeWidth="2" />
      <rect x="54" y="30" width="26" height="26" rx="7" fill="url(#cr-g)" opacity="0.18" />
      <path d="M61 43h12M67 37v12" stroke="url(#cr-g)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="88" y="32" width="30" height="7" rx="3.5" fill="var(--border)" />
      <rect x="88" y="46" width="20" height="7" rx="3.5" fill="var(--border)" />
    </svg>
  )
}

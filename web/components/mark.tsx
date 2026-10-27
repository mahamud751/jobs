export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#14241e" />
      <circle cx="16" cy="16" r="7.2" fill="none" stroke="#e2a322" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="1.7" fill="#e2a322" />
      <path d="M16 8.8v3.2M16 20v3.2M8.8 16h3.2M20 16h3.2" stroke="#e2a322" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ name, photo, size = "h-12 w-12" }: { name: string; photo?: string | null; size?: string }) {
  const letter = name.trim().slice(0, 1) || "?";
  const hues = ["#0f6e56", "#1d4e89", "#8a5a12", "#7a3e3e", "#245c4a"];
  const hue = hues[name.length % hues.length];
  if (photo) {
    return <img src={photo} alt="" className={`${size} rounded-full object-cover`} />;
  }
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full text-sm font-bold text-white`} style={{ background: hue }}>
      {letter}
    </span>
  );
}

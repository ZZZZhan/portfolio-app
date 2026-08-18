export default function StatusBar() {
  return (
    <div className="flex h-[62px] items-center justify-between px-6 shrink-0">
      <span className="text-base font-semibold font-mono text-[#1A1C1E]">
        9:41
      </span>
      <div className="flex items-center gap-1">
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="8" width="3" height="4" rx="1" fill="#1A1C1E" />
          <rect x="4.5" y="5" width="3" height="7" rx="1" fill="#1A1C1E" />
          <rect x="9" y="2" width="3" height="10" rx="1" fill="#1A1C1E" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#1A1C1E" />
        </svg>
        {/* Wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 3.5C5.5 3.5 3.5 5 3.5 5L1 2.5C1 2.5 4 0 8 0s7 2.5 7 2.5L12.5 5s-2-1.5-4.5-1.5z" fill="#1A1C1E" />
          <circle cx="8" cy="9" r="2" fill="#1A1C1E" />
        </svg>
        {/* Battery */}
        <div className="flex items-center gap-0.5 ml-1">
          <div className="w-[22px] h-[11px] rounded-[3px] border border-[#1A1C1E] p-[1px]">
            <div className="w-full h-full rounded-[1px] bg-[#1A1C1E]" />
          </div>
          <div className="w-[1.5px] h-[4px] rounded-r bg-[#1A1C1E]" />
        </div>
      </div>
    </div>
  );
}

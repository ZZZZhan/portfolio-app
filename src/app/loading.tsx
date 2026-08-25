export default function Loading() {
  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        <div className="h-8 w-32 rounded bg-[var(--color-track)] animate-pulse" />
        <div className="h-28 rounded-[20px] bg-[var(--color-track)] animate-pulse" />
        <div className="h-20 rounded-[16px] bg-[var(--color-track)] animate-pulse" />
        <div className="flex flex-col gap-3">
          <div className="h-24 rounded-[16px] bg-[var(--color-track)] animate-pulse" />
          <div className="h-24 rounded-[16px] bg-[var(--color-track)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

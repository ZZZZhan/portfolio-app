'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4">
        <p className="text-[15px] font-medium text-[var(--color-text-primary)]">出错了</p>
        <p className="text-[13px] text-[var(--color-text-muted)] text-center break-all">
          {error.message || '未知错误'}
        </p>
        <button
          onClick={() => reset()}
          className="h-[44px] px-6 rounded-[12px] bg-[var(--color-primary)] text-white text-[14px] font-medium"
        >
          重试
        </button>
      </div>
    </div>
  );
}

'use client';

/**
 * 危险操作二次确认弹层（底部抽屉），样式与 ThresholdSheet 一致。
 *
 * 用于不可撤销的操作 —— 文案必须写清代价（会连带删掉什么），
 * 主按钮用红色，默认焦点不放在它上面。
 */
export default function ConfirmSheet({
  title,
  description,
  confirmLabel,
  confirming = false,
  error = null,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  /** 请求进行中：禁用两个按钮，避免重复提交 */
  confirming?: boolean;
  /** 失败原因，null 表示无错误 */
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 遮罩 */}
      <button
        type="button"
        aria-label="取消"
        onClick={onCancel}
        className="absolute inset-0 bg-black/30"
      />

      {/* 面板 */}
      <div className="relative rounded-t-[20px] bg-white px-5 pt-5 pb-7 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">
            {title}
          </h3>
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            {description}
          </span>
        </div>

        {error && (
          <span className="text-[12px] text-[var(--color-red)]">
            操作失败：{error}
          </span>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 h-[48px] rounded-[14px] border border-[var(--color-border)] text-[15px] font-medium text-[var(--color-text-primary)] disabled:opacity-40"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 h-[48px] rounded-[14px] bg-[var(--color-red)] text-white text-[15px] font-semibold disabled:opacity-40"
          >
            {confirming ? '处理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

/** 常用偏离阈值快捷值 % */
const PRESETS = [3, 5, 8, 10];

/**
 * 修改单个持仓再平衡偏离阈值的底部弹层。
 *
 * 语义与新建组合页一致：当前配比偏离目标超过 ±阈值 时提醒再平衡。
 */
export default function ThresholdSheet({
  assetName,
  value,
  onClose,
  onSave,
}: {
  assetName: string;
  /** 当前阈值 %（后端 Decimal 序列化为字符串，调用方转好数字传进来） */
  value: number;
  onClose: () => void;
  onSave: (threshold: number) => void;
}) {
  const [input, setInput] = useState(String(value));

  const parsed = parseFloat(input);
  const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 遮罩 */}
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      {/* 面板 */}
      <div className="relative rounded-t-[20px] bg-white px-5 pt-5 pb-7 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">
            修改偏离阈值
          </h3>
          <span className="text-[12px] text-[var(--color-text-muted)]">
            {assetName} · 当前配比偏离目标超过 ±阈值 时提醒再平衡
          </span>
        </div>

        {/* 快捷值 */}
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setInput(String(p))}
              className={`flex-1 h-[38px] rounded-[10px] border text-[14px] font-medium transition-colors ${
                parsed === p
                  ? "bg-[var(--color-primary-blue-bg)] border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "bg-white border-[var(--color-border)] text-[var(--color-text-primary)]"
              }`}
            >
              ±{p}%
            </button>
          ))}
        </div>

        {/* 自定义输入 */}
        <div className="rounded-[14px] bg-white px-4 h-[52px] flex items-center border border-[var(--color-border)]">
          <span className="text-[14px] text-[var(--color-text-muted)]">
            偏离阈值 ±
          </span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
            aria-label={`${assetName} 再平衡偏离阈值`}
          />
          <span className="text-[13px] text-[var(--color-text-muted)] ml-1">%</span>
        </div>

        {/* TODO: 后端暂无更新持仓阈值的接口，接好 PATCH /portfolio/:id/holdings/:holdingId 后删掉这行提示 */}
        <span className="text-[12px] text-[var(--color-amber)]">
          后端接口未接入，修改暂不生效
        </span>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[48px] rounded-[14px] border border-[var(--color-border)] text-[15px] font-medium text-[var(--color-text-primary)]"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave(parsed)}
            className="flex-1 h-[48px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary disabled:opacity-40 disabled:shadow-none"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

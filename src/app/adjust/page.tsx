"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, MinusIcon, PlusIcon, CheckIcon } from "@/components/Icons";
import { adjustHoldings, portfolioDetail } from "@/lib/mockData";

export default function AdjustPage() {
  const [adjustments, setAdjustments] = useState(
    adjustHoldings.map(() => ({ reduce: "", add: "" }))
  );

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-3 gap-2.5 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/rebalance" className="flex items-center gap-3">
            <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">返回</span>
          </Link>
          <button className="text-[14px] font-semibold text-[var(--color-primary)]">保存</button>
        </div>

        {/* Portfolio info */}
        <div className="rounded-[14px] bg-white px-3.5 h-12 flex items-center gap-3 border border-[var(--color-border)]">
          <div className="w-5 h-5 rounded-[4px] bg-[var(--color-primary)] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold">W</span>
          </div>
          <span className="text-[14px] font-medium text-[var(--color-text-primary)]">{portfolioDetail.name}</span>
          <span className="text-[12px] font-mono text-[var(--color-text-muted)]">{portfolioDetail.marketValue}</span>
        </div>

        {/* Completion */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[var(--color-text-secondary)]">建仓完成度</span>
          <span className="text-[13px] font-mono font-bold text-[var(--color-primary)]">{portfolioDetail.completion}%</span>
        </div>
        <div className="w-full h-1.5 rounded-[3px] bg-[var(--color-track)]">
          <div className="h-full rounded-[3px] bg-[var(--color-primary)]" style={{ width: `${portfolioDetail.completion}%` }} />
        </div>

        {/* List header */}
        <div className="flex items-center justify-between mt-1">
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">调整持仓明细</h3>
          <span className="text-[11px] text-[var(--color-text-muted)]">橙色为偏离项</span>
        </div>

        {/* Holdings rows */}
        {adjustHoldings.map((h, i) => {
          const isDev = h.isDeviated;
          const devColor = h.deviation.startsWith("+") ? "text-[var(--color-red)]" : "text-[var(--color-green)]";
          return (
            <div
              key={i}
              className={`rounded-[14px] px-3.5 py-3.5 flex flex-col gap-2.5 border ${
                isDev ? "bg-[#FFFAF0] border-[var(--color-amber)] border-opacity-40" : "bg-white border-[var(--color-border)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">{h.name}</span>
                <span className={`text-[12px] font-medium ${devColor}`}>{h.deviation}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                <span>当前 {h.currentRatio}%</span>
                <span>→</span>
                <span>目标 {h.targetRatio}%</span>
                <span className="ml-auto text-[12px] font-mono text-[var(--color-text-primary)]">{h.marketValue}</span>
              </div>

              {/* Operation area */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <button className="w-8 h-8 rounded-[10px] bg-[#F0EFEC] flex items-center justify-center">
                    <MinusIcon size={16} className="text-[var(--color-red)]" />
                  </button>
                  <input
                    type="text"
                    placeholder="减仓金额"
                    value={adjustments[i].reduce}
                    onChange={(e) => {
                      const next = [...adjustments];
                      next[i].reduce = e.target.value;
                      setAdjustments(next);
                    }}
                    className="w-20 h-8 rounded-[8px] bg-[#F7F6F3] px-2 text-[12px] outline-none text-center text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="w-8 h-8 rounded-[10px] bg-[var(--color-primary-blue-bg)] flex items-center justify-center">
                    <PlusIcon size={16} className="text-[var(--color-primary)]" />
                  </button>
                  <input
                    type="text"
                    placeholder="加仓金额"
                    value={adjustments[i].add}
                    onChange={(e) => {
                      const next = [...adjustments];
                      next[i].add = e.target.value;
                      setAdjustments(next);
                    }}
                    className="w-20 h-8 rounded-[8px] bg-[#F7F6F3] px-2 text-[12px] outline-none text-center text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
              </div>

              {/* Adjusted ratio preview */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--color-text-secondary)]">调整后占比</span>
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-mono font-medium text-[var(--color-text-primary)]">{h.adjustedRatio}%</span>
                  {h.adjustedRatio === h.targetRatio && (
                    <div className="w-4 h-4 rounded-full bg-[var(--color-green)] flex items-center justify-center">
                      <CheckIcon size={8} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary card */}
        <div className="rounded-[14px] bg-[var(--color-primary-blue-bg)] px-3.5 py-3.5 flex flex-col gap-2.5 border border-[var(--color-primary)] border-opacity-20">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--color-text-secondary)]">总调整金额</span>
            <span className="text-[15px] font-mono font-bold text-[var(--color-primary)]">¥56,753</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--color-text-secondary)]">调整后总市值</span>
            <span className="text-[13px] font-mono text-[var(--color-text-primary)]">¥612,419</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[var(--color-green)] flex items-center justify-center">
              <CheckIcon size={8} className="text-white" />
            </div>
            <span className="text-[12px] text-[var(--color-green)]">配置合规</span>
          </div>
        </div>

        {/* Confirm button */}
        <Link href="/" className="w-full">
          <button className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center">
            确认调整持仓
          </button>
        </Link>
      </div>
    </div>
  );
}

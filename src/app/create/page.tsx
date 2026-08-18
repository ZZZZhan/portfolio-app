"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/Icons";

const riskOptions = [
  { label: "保守型", desc: "以固收为主，追求稳定收益" },
  { label: "稳健型", desc: "均衡配置，适度追求增长" },
  { label: "进取型", desc: "偏重权益，追求高回报" },
];

const assetTypes = [
  { label: "沪深300ETF", defaultRatio: 35 },
  { label: "标普500ETF", defaultRatio: 25 },
  { label: "科技100ETF", defaultRatio: 20 },
  { label: "债券基金", defaultRatio: 20 },
];

export default function CreatePortfolioPage() {
  const [name, setName] = useState("");
  const [risk, setRisk] = useState(1);
  const [ratios, setRatios] = useState(assetTypes.map((a) => a.defaultRatio));
  const total = ratios.reduce((s, v) => s + v, 0);
  const totalColor = total === 100 ? "text-[var(--color-green)]" : "text-[var(--color-red)]";

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">返回</span>
          </Link>
          <Link href="/" className="text-[14px] font-semibold text-[var(--color-primary)]">完成</Link>
        </div>

        <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">创建自定义组合</h1>

        {/* Portfolio name */}
        <div className="rounded-[14px] bg-white px-4 h-[52px] flex items-center border border-[var(--color-border)]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="组合名称"
            className="flex-1 text-[15px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        {/* Risk preference */}
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-[var(--color-text-primary)]">风险偏好</span>
          {riskOptions.map((r, i) => (
            <button
              key={i}
              onClick={() => setRisk(i)}
              className={`flex items-center gap-3 px-4 h-[56px] rounded-[14px] border transition-colors ${
                risk === i
                  ? "bg-[var(--color-primary-blue-bg)] border-[var(--color-primary)] border-opacity-30"
                  : "bg-white border-[var(--color-border)]"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${risk === i ? "border-[var(--color-primary)]" : "border-[var(--color-text-muted)]"}`}>
                {risk === i && <div className="w-full h-full rounded-full bg-[var(--color-primary)] scale-50" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{r.label}</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">{r.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Asset allocation */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">目标配比</span>
            <span className={`text-[15px] font-bold font-mono ${totalColor}`}>{total}%</span>
          </div>
          {assetTypes.map((a, i) => (
            <div key={i} className="rounded-[12px] bg-white px-4 h-[52px] flex items-center justify-between border border-[var(--color-border)]">
              <span className="text-[14px] text-[var(--color-text-primary)]">{a.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ratios[i]}
                  onChange={(e) => {
                    const next = [...ratios];
                    next[i] = parseInt(e.target.value) || 0;
                    setRatios(next);
                  }}
                  className="w-12 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
                />
                <span className="text-[14px] text-[var(--color-text-muted)]">%</span>
              </div>
            </div>
          ))}
          {/* Progress bar */}
          <div className="relative w-full h-1.5 rounded-full bg-[var(--color-track)]">
            <div
              className={`h-full rounded-full ${total === 100 ? "bg-[var(--color-green)]" : "bg-[var(--color-amber)]"}`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          {total === 100 ? (
            <span className="text-[12px] text-[var(--color-green)]">配比合规 ✓</span>
          ) : (
            <span className="text-[12px] text-[var(--color-amber)]">需调整至100%（当前 {total}%）</span>
          )}
        </div>

        {/* Create button */}
        <button
          disabled={total !== 100 || !name.trim()}
          className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center disabled:opacity-40 disabled:shadow-none"
        >
          创建组合
        </button>
      </div>
    </div>
  );
}

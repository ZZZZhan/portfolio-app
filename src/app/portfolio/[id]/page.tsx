"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { ChevronLeftIcon, AlertIcon } from "@/components/Icons";
import { getLatestSnapshot } from "@/lib/api";
import { toPortfolioDetail } from "@/lib/format";
import type { SnapshotView } from "@/lib/api";

export default function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [snap, setSnap] = useState<SnapshotView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestSnapshot(Number(id))
      .then(setSnap)
      .finally(() => setLoading(false));
  }, [id]);

  const detail = snap ? toPortfolioDetail(snap) : null;

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-[14px] overflow-y-auto">
        {/* Nav bar */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">返回</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">加载中...</div>
        ) : !detail ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">暂无快照数据</div>
        ) : (
          <>
            {/* Portfolio header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">{detail.name || `组合 #${id}`}</h1>
              <div className="flex items-center gap-4">
                <span className="text-[13px] text-[var(--color-text-secondary)]">今日 <span className="text-[var(--color-red)] font-medium">{detail.todayChange ?? "--"}</span></span>
                <span className="text-[13px] text-[var(--color-text-secondary)]">市值 <span className="font-mono font-bold text-[var(--color-text-primary)]">{detail.marketValue}</span></span>
              </div>
            </div>

            {/* Completion ring */}
            <div className="rounded-[16px] bg-white px-4 py-4 flex items-center gap-4 border border-[var(--color-border)] shadow-card">
              <div className="relative w-[88px] h-[88px] shrink-0 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="38" stroke="var(--color-track)" strokeWidth="8" fill="none" />
                  <circle
                    cx="44" cy="44" r="38"
                    stroke="var(--color-primary)" strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 38 * (detail.completion / 100)} ${2 * Math.PI * 38}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-[20px] font-bold text-[var(--color-primary)] font-mono">{detail.completion}%</span>
                  <span className="text-[9px] text-[var(--color-text-muted)]">完成度</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">总成本</span>
                  <span className="text-[13px] font-mono font-medium text-[var(--color-text-primary)]">{detail.totalCost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">累计盈亏</span>
                  <span className="text-[13px] font-mono font-bold text-[var(--color-red)]">{detail.totalProfit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">收益率</span>
                  <span className="text-[13px] font-mono font-bold text-[var(--color-red)]">{detail.totalProfitRate}</span>
                </div>
              </div>
            </div>

            {/* Rebalance alert banner */}
            {detail.rebalanceNeeded && (
              <Link href="/rebalance" className="flex items-center gap-2 px-4 h-11 rounded-[12px] bg-[var(--color-amber-bg)]">
                <AlertIcon size={18} className="text-[var(--color-amber)]" />
                <span className="text-[13px] font-medium text-[#B5703A] flex-1">持仓偏离目标配比，建议再平衡</span>
                <ChevronLeftIcon size={16} className="text-[var(--color-amber)] rotate-180" />
              </Link>
            )}

            {/* Holdings */}
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">持仓明细</h2>
              <span className="text-[12px] text-[var(--color-text-muted)]">当前 / 目标</span>
            </div>

            {detail.holdings.map((h, i) => (
              <div key={i} className="rounded-[14px] bg-white px-4 py-3.5 flex flex-col gap-2 border border-[var(--color-border)] shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{h.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{h.current}%</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">/ {h.target}%</span>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="relative w-full h-1.5 rounded-full bg-[var(--color-track)]">
                  <div
                    className="absolute h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${h.current}%` }}
                  />
                  <div
                    className="absolute top-[-2px] w-[5px] h-[5px] rounded-full bg-[var(--color-amber)]"
                    style={{ left: `${h.target}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-mono font-bold text-[var(--color-text-primary)]">{h.value}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[12px] font-mono text-[var(--color-red)]">{h.profit}</span>
                    <span className="text-[10px] font-mono text-[var(--color-red)]">{h.profitRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
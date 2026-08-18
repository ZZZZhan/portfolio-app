"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { ChevronLeftIcon, PlusIcon } from "@/components/Icons";
import { useHomeData } from "@/lib/api";
import { toPortfolioCard } from "@/lib/format";

export default function PortfolioListPage() {
  const { data, isLoading } = useHomeData();

  const portfolios = data?.portfolios ?? [];
  const snapshots = data?.snapshots ?? [];
  const cards = portfolios.map((p, i) => toPortfolioCard(p, snapshots[i]));
  const loading = isLoading;

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
          </Link>
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-3.5 h-[34px] rounded-[17px] bg-[var(--color-primary)] shadow-primary-sm"
          >
            <PlusIcon size={16} className="text-white" />
            <span className="text-[13px] font-semibold text-white">新建组合</span>
          </Link>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">我的组合</h1>
          <span className="text-[13px] text-[var(--color-text-secondary)]">{loading ? "..." : `${cards.length} 个组合`}</span>
        </div>

        {/* Portfolio list */}
        <div className="flex flex-col gap-[14px]">
          {loading ? (
            <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">加载中...</div>
          ) : cards.length === 0 ? (
            <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">还没有组合</div>
          ) : (
            cards.map((p) => (
              <Link
                key={p.id}
                href={`/portfolio/${p.id}`}
                className="rounded-[16px] bg-white px-4 py-4 flex flex-col gap-2.5 border border-[var(--color-border)] shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-[var(--color-text-primary)]">{p.name}</span>
                  {p.todayChange ? (
                    <span className="text-[12px] font-medium text-[var(--color-red)]">今日 {p.todayChange}</span>
                  ) : p.hasAlert ? (
                    <div className="px-2.5 h-[22px] rounded-[11px] bg-[var(--color-amber-bg)] flex items-center">
                      <span className="text-[10px] text-[var(--color-amber)] font-medium">偏离风险</span>
                    </div>
                  ) : null}
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[var(--color-track)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${p.completion}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--color-text-secondary)]">建仓完成度 {p.completion}%</span>
                  <span className="text-[13px] font-bold text-[var(--color-text-primary)] font-mono">{p.marketValue}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
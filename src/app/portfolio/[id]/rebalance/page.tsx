"use client";

import { use } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { ChevronLeftIcon, AlertIcon } from "@/components/Icons";
import { usePortfolioDetail, useLatestSnapshot } from "@/lib/api";
import { toRebalanceAlerts } from "@/lib/format";

export default function RebalancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const portfolioId = Number(id);

  const { data: portfolio, isLoading: loadingPortfolio } =
    usePortfolioDetail(portfolioId);
  const { data: snap, isLoading: loadingSnap } =
    useLatestSnapshot(portfolioId);

  const loading = loadingPortfolio || loadingSnap;
  const alerts =
    portfolio && snap ? toRebalanceAlerts(snap, portfolio.holdings) : [];

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-[14px] overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href={`/portfolio/${portfolioId}`} className="flex items-center gap-3">
            <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">返回</span>
          </Link>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">再平衡提醒</h1>
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            {loading ? "..." : `${alerts.length}项偏离目标配比`}
          </span>
        </div>

        {/* Alert banner */}
        <div className="rounded-[14px] bg-[var(--color-amber-bg)] px-4 h-12 flex items-center gap-2.5">
          <AlertIcon size={20} className="text-[var(--color-amber)]" />
          <span className="text-[13px] font-medium text-[#B5703A] flex-1">
            以下持仓偏离目标配置，建议调整
          </span>
        </div>

        {/* Alert list */}
        {loading ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">加载中...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">
            所有持仓均在阈值内
          </div>
        ) : (
          alerts.map((item) => {
            const isOver = item.status === "overweight";
            const bgColor = isOver ? "#FFE5E5" : "#E5F7EE";
            const textColor = isOver
              ? "text-[var(--color-red)]"
              : "text-[var(--color-green)]";

            // 补 assetType（从持仓骨架按 symbol 查）
            const assetType =
              portfolio?.holdings.find(
                (h) => h.asset.symbol === item.symbol,
              )?.asset.type ?? "";

            // 跳录入交易：超配→减仓，低配→加仓
            const tradeQs = new URLSearchParams({
              holdingId: String(item.holdingId),
              name: item.name,
              symbol: item.symbol,
              assetType,
            }).toString();
            const tradeHref = `/portfolio/${portfolioId}/add-trade?${tradeQs}`;

            return (
              <div
                key={item.holdingId}
                className="rounded-[14px] bg-white px-4 py-4 flex flex-col gap-3 border border-[var(--color-border)] shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
                    {item.name}
                  </span>
                  <div
                    className="px-2.5 h-[22px] rounded-full flex items-center"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className={`text-[11px] font-medium ${textColor}`}>
                      {isOver ? "超配" : "低配"} {item.deviation}
                    </span>
                  </div>
                </div>

                {/* Bar comparison */}
                <div className="flex items-center gap-3">
                  {/* Current */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      当前 {item.current}%
                    </span>
                    <div className="w-full h-2 rounded-full bg-[var(--color-track)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(item.current, 100)}%`,
                          backgroundColor: isOver
                            ? "var(--color-red)"
                            : "var(--color-text-muted)",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                    vs
                  </span>
                  {/* Target */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      目标 {item.target}%
                    </span>
                    <div className="w-full h-2 rounded-full bg-[var(--color-track)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${Math.min(item.target, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 调整入口：超配→减仓，低配→加仓 */}
                <Link
                  href={`${tradeHref}&direction=${isOver ? "SELL" : "BUY"}`}
                  className={`w-full h-[40px] rounded-[10px] text-white text-[14px] font-semibold flex items-center justify-center ${
                    isOver
                      ? "bg-[var(--color-green)]"
                      : "bg-[var(--color-red)]"
                  }`}
                >
                  {isOver ? "去减仓" : "去加仓"}
                </Link>
              </div>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
}

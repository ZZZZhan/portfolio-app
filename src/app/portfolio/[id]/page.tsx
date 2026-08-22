"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SwipeActions, { type SwipeAction } from "@/components/SwipeActions";
import ThresholdSheet from "@/components/ThresholdSheet";
import {
  ChevronLeftIcon,
  AlertIcon,
  PlusIcon,
  MinusIcon,
  ScaleIcon,
} from "@/components/Icons";
import {
  usePortfolioDetail,
  useLatestSnapshot,
  usePortfolioTrades,
  useUpdateHoldingThreshold,
  type HoldingDetail,
} from "@/lib/api";
import {
  toPortfolioDetail,
  fmtMoney,
  fmtSignedMoney,
  fmtPct,
} from "@/lib/format";

export default function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const portfolioId = Number(id);
  const router = useRouter();

  // 左滑：同一时刻只展开一行
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);
  // 正在编辑阈值的持仓（null 表示弹层关闭）
  const [thresholdTarget, setThresholdTarget] = useState<HoldingDetail | null>(
    null,
  );
  const updateThreshold = useUpdateHoldingThreshold(portfolioId);

  // 持仓骨架（建组合时已定，必有数据）—— 不依赖快照
  const { data: portfolio, isLoading: loadingPortfolio } =
    usePortfolioDetail(portfolioId);
  // 快照（市值盈亏叠加，可能为空）
  const { data: snap } = useLatestSnapshot(portfolioId);
  const { data: trades } = usePortfolioTrades(portfolioId);

  // 快照转视图（含市值/配比/盈亏）
  const detail = snap ? toPortfolioDetail(snap) : null;

  // 快照里按 symbol 索引持仓级数据，便于和骨架合并
  const snapBySymbol = new Map(
    (snap?.holdings ?? []).map((h) => [h.symbol, h]),
  );

  if (loadingPortfolio) {
    return (
      <div className="phone-frame">
        <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">
            加载中...
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="phone-frame">
        <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">
            组合不存在
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

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

        {/* Portfolio header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">{portfolio.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              今日 <span className="text-[var(--color-red)] font-medium">{detail?.todayChange ?? "--"}</span>
            </span>
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              市值 <span className="font-mono font-bold text-[var(--color-text-primary)]">{detail?.marketValue ?? "¥0"}</span>
            </span>
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
                strokeDasharray={`${2 * Math.PI * 38 * ((detail?.completion ?? 0) / 100)} ${2 * Math.PI * 38}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-[20px] font-bold text-[var(--color-primary)] font-mono">{detail?.completion ?? 0}%</span>
              <span className="text-[9px] text-[var(--color-text-muted)]">完成度</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-secondary)]">总成本</span>
              <span className="text-[13px] font-mono font-medium text-[var(--color-text-primary)]">{detail?.totalCost ?? fmtMoney(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-secondary)]">累计盈亏</span>
              <span className="text-[13px] font-mono font-bold text-[var(--color-red)]">{detail?.totalProfit ?? fmtSignedMoney(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-secondary)]">收益率</span>
              <span className="text-[13px] font-mono font-bold text-[var(--color-red)]">{detail?.totalProfitRate ?? fmtPct(0)}</span>
            </div>
          </div>
        </div>

        {/* Rebalance alert banner */}
        {detail?.rebalanceNeeded && (
          <Link href={`/portfolio/${portfolioId}/rebalance`} className="flex items-center gap-2 px-4 h-11 rounded-[12px] bg-[var(--color-amber-bg)]">
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
        <span className="text-[11px] text-[var(--color-text-muted)] -mt-2">
          左滑持仓可加仓 / 减仓 / 改阈值
        </span>

        {portfolio.holdings.map((h) => {
          const sh = snapBySymbol.get(h.asset.symbol);
          const current = sh ? Math.round(sh.currentRatio * 100) : 0;
          const target = h.targetRatio;
          const value = sh ? fmtMoney(sh.marketValue) : "¥0";
          const profit = sh ? fmtSignedMoney(sh.unrealizedPnl + sh.realizedPnl) : "--";
          const profitRate = sh && sh.holdingCost > 0
            ? fmtPct((sh.unrealizedPnl + sh.realizedPnl) / sh.holdingCost)
            : "--";

          // 加仓/减仓链接：带 holdingId + 标的信息
          const tradeQs = new URLSearchParams({
            holdingId: String(h.id),
            name: h.asset.name,
            symbol: h.asset.symbol,
            assetType: h.asset.type,
          }).toString();
          const tradeHref = `/portfolio/${portfolioId}/add-trade?${tradeQs}`;

          const actions: SwipeAction[] = [
            {
              key: "buy",
              label: "加仓",
              bg: "var(--color-red)",
              icon: <PlusIcon size={18} />,
              onSelect: () => router.push(`${tradeHref}&direction=BUY`),
            },
            {
              key: "sell",
              label: "减仓",
              bg: "var(--color-green)",
              icon: <MinusIcon size={18} />,
              onSelect: () => router.push(`${tradeHref}&direction=SELL`),
            },
            {
              key: "threshold",
              label: "改阈值",
              bg: "var(--color-amber)",
              icon: <ScaleIcon size={18} />,
              onSelect: () => setThresholdTarget(h),
            },
          ];

          return (
            <SwipeActions
              key={h.id}
              actions={actions}
              open={openSwipeId === h.id}
              onOpenChange={(next) => setOpenSwipeId(next ? h.id : null)}
              // 圆角与边框由 SwipeActions 外层统一承担：内容卡若自带圆角，
              // 展开时右侧圆角会和操作区之间漏出底色缺口。
              className="border border-[var(--color-border)]"
            >
              <div className="bg-white px-4 py-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{h.asset.name}</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{h.asset.symbol} · {h.asset.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{current}%</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">/ {target}%</span>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="relative w-full h-1.5 rounded-full bg-[var(--color-track)]">
                  <div
                    className="absolute h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${Math.min(current, 100)}%` }}
                  />
                  <div
                    className="absolute top-[-2px] w-[5px] h-[5px] rounded-full bg-[var(--color-amber)]"
                    style={{ left: `${Math.min(target, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-mono font-bold text-[var(--color-text-primary)]">{value}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[12px] font-mono text-[var(--color-red)]">{profit}</span>
                    <span className="text-[10px] font-mono text-[var(--color-red)]">{profitRate}</span>
                  </div>
                </div>
              </div>
            </SwipeActions>
          );
        })}

        {/* 交易记录 */}
        {trades && trades.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">交易记录</h2>
            {trades.map((t) => (
              <div
                key={t.id}
                className="rounded-[12px] bg-white px-4 py-3 flex items-center justify-between border border-[var(--color-border)]"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                    {t.direction === "BUY" ? "买入" : "卖出"} · {t.holding.asset.name}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {t.holding.asset.symbol} · {t.type === "EXCHANGE" ? "场内" : "场外"} · ¥{t.amount}
                  </span>
                </div>
                {t.status === "PENDING" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-amber-bg)] text-[var(--color-amber)]">
                    份额待确认
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-primary-blue-bg)] text-[var(--color-primary)]">
                    已确认
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />

      {thresholdTarget && (
        <ThresholdSheet
          assetName={thresholdTarget.asset.name}
          value={Number(thresholdTarget.rebalanceThreshold)}
          saving={updateThreshold.isPending}
          error={updateThreshold.error?.message ?? null}
          onClose={() => {
            updateThreshold.reset(); // 清掉上次的错误，下次开弹层是干净的
            setThresholdTarget(null);
          }}
          onSave={(threshold) =>
            updateThreshold.mutate(
              {
                holdingId: thresholdTarget.id,
                rebalanceThreshold: threshold,
              },
              { onSuccess: () => setThresholdTarget(null) },
            )
          }
        />
      )}
    </div>
  );
}

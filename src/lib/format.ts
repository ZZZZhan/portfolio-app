// 格式化层：后端数字 → 前端展示字符串（匹配原 mockData 形状）
import type { HoldingView, SnapshotView, PortfolioView } from "./api";

// ¥1,284,650
export function fmtMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

// +¥3,280 / -¥3,280
export function fmtSignedMoney(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

// +2.74% / -2.74%  (输入是小数 0.0274)
export function fmtPct(ratio: number): string {
  const pct = ratio * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

// +1.9% / null（今日涨跌，M2 暂用 profitRate 占位）
export function fmtTodayChange(ratio?: number): string | null {
  if (ratio == null || ratio === 0) return null;
  return fmtPct(ratio);
}

// ===== 视图模型（给页面用的对象，形状贴合原 mockData）=====

/** 首页 portfolio 列表项 */
export function toPortfolioCard(
  p: PortfolioView,
  snap: SnapshotView | null,
) {
  return {
    id: String(p.id),
    name: p.name,
    todayChange: fmtTodayChange(snap?.profitRate),
    completion: snap ? Math.round(snap.completion * 100) : 0,
    marketValue: snap ? fmtMoney(snap.totalMarketValue) : "¥0",
    hasAlert: snap
      ? snap.holdings.some((h) => Math.abs(h.deviation) * 100 > 5)
      : false,
  };
}

/** 首页总览 */
export function toHomeOverview(snapshots: (SnapshotView | null)[]) {
  const totalAssets = snapshots.reduce(
    (s, x) => s + (x?.totalMarketValue ?? 0),
    0,
  );
  const totalPnl = snapshots.reduce((s, x) => s + (x?.totalPnl ?? 0), 0);
  const totalCost = snapshots.reduce(
    (s, x) => s + (x?.totalCost ?? 0),
    0,
  );
  const rate = totalCost > 0 ? totalPnl / totalCost : 0;
  return {
    totalAssets: fmtMoney(totalAssets),
    todayProfit: fmtSignedMoney(0), // M2 暂无今日收益（需昨日快照）
    todayProfitRate: "+0.00%",
    todayReturn: fmtPct(0),
    cumulativeProfit: fmtSignedMoney(totalPnl),
    cumulativeRate: fmtPct(rate),
    updated: true,
  };
}

/** 组合详情页 */
export function toPortfolioDetail(snap: SnapshotView) {
  return {
    name: "", // 由页面填
    completion: Math.round(snap.completion * 100),
    todayChange: fmtTodayChange(snap.profitRate),
    marketValue: fmtMoney(snap.totalMarketValue),
    totalCost: fmtMoney(snap.totalCost),
    totalProfit: fmtSignedMoney(snap.totalPnl),
    totalProfitRate: fmtPct(snap.profitRate),
    holdings: snap.holdings.map((h) => ({
      name: h.name,
      current: Math.round(h.currentRatio * 100),
      target: Math.round(h.targetRatio * 100),
      value: fmtMoney(h.marketValue),
      profit: fmtSignedMoney(h.unrealizedPnl + h.realizedPnl),
      profitRate: fmtPct(
        h.holdingCost > 0
          ? (h.unrealizedPnl + h.realizedPnl) / h.holdingCost
          : 0,
      ),
    })),
    rebalanceNeeded: snap.holdings.some(
      (h) => Math.abs(h.deviation) * 100 > 5,
    ),
  };
}

/** 再平衡提醒页 */
export function toRebalanceAlerts(snap: SnapshotView) {
  return snap.holdings
    .filter((h) => Math.abs(h.deviation) * 100 > 5)
    .map((h) => ({
      name: h.name,
      current: Math.round(h.currentRatio * 100),
      target: Math.round(h.targetRatio * 100),
      deviation: fmtPct(h.deviation),
      status: h.deviation > 0 ? "overweight" : "underweight",
    }));
}
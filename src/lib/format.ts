// 格式化层：后端数字 → 前端展示字符串
import type {
  SnapshotView,
  PortfolioView,
  HoldingDetail,
} from "./api";

/** 再平衡提醒阈值 %（与 PortfolioForm.DEFAULT_REBALANCE_THRESHOLD 及后端兜底保持一致） */
export const REBALANCE_ALERT_THRESHOLD = 5;

// ¥1,284,650
export function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return "¥0";
  const sign = n < 0 ? "-" : "";
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

// +¥3,280 / -¥3,280
export function fmtSignedMoney(n: number): string {
  if (!Number.isFinite(n)) return "¥0";
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

// +2.74% / -2.74%  (输入是小数 0.0274)
export function fmtPct(ratio: number): string {
  if (!Number.isFinite(ratio)) return "0.00%";
  const pct = ratio * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

// +1.9% / null（今日涨跌，M2 暂用 profitRate 占位）
export function fmtTodayChange(ratio?: number): string | null {
  if (ratio == null || !Number.isFinite(ratio) || ratio === 0) return null;
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
      ? snap.holdings.some((h) => Math.abs(h.deviation) * 100 > REBALANCE_ALERT_THRESHOLD)
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
  // 今日收益 = 各组合 今日市值 − 昨日市值 的合计；
  // 今日收益率 = 今日收益 / 昨日总市值（昨日市值 = 今日市值 − 今日收益）
  const todayPnl = snapshots.reduce(
    (s, x) => s + (x?.todayProfit ?? 0),
    0,
  );
  const yesterdayAssets = totalAssets - todayPnl;
  const todayRate = yesterdayAssets > 0 ? todayPnl / yesterdayAssets : 0;
  return {
    totalAssets: fmtMoney(totalAssets),
    todayProfit: fmtSignedMoney(todayPnl),
    todayProfitRate: fmtPct(todayRate),
    todayReturn: fmtPct(todayRate),
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
      (h) => Math.abs(h.deviation) * 100 > REBALANCE_ALERT_THRESHOLD,
    ),
  };
}

/** 再平衡提醒项（含 holdingId，供跳转录入交易） */
export interface RebalanceAlert {
  holdingId: number;
  symbol: string;
  name: string;
  current: number; // 百分比整数
  target: number; // 百分比整数
  deviation: string; // 格式化后的偏离度
  status: "overweight" | "underweight";
}

/** 再平衡提醒页：合并快照（偏离度） + 持仓骨架（holdingId） */
export function toRebalanceAlerts(
  snap: SnapshotView,
  holdings: HoldingDetail[],
): RebalanceAlert[] {
  // 按 symbol 索引持仓骨架，拿 holdingId
  const holdingBySymbol = new Map(holdings.map((h) => [h.asset.symbol, h]));
  return snap.holdings
    .filter((h) => Math.abs(h.deviation) * 100 > REBALANCE_ALERT_THRESHOLD)
    .map((h) => {
      const skeleton = holdingBySymbol.get(h.symbol);
      return {
        holdingId: skeleton?.id ?? 0,
        symbol: h.symbol,
        name: h.name,
        current: Math.round(h.currentRatio * 100),
        target: Math.round(h.targetRatio * 100),
        deviation: fmtPct(h.deviation),
        status: h.deviation > 0 ? ("overweight" as const) : ("underweight" as const),
      };
    })
    .filter((a) => a.holdingId !== 0); // 找不到骨架的丢弃（数据不一致）
}
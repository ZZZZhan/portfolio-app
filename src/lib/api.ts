// 前端 API 层：调用 portfolio-server 后端
const API_BASE = "/api"; // Next rewrites 代理到 NestJS (localhost:3001)

// 临时写死 userId（M3 接 better-auth 后从 session 取）
const USER_ID = 1;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${path}`);
  return res.json() as Promise<T>;
}

// ===== 后端返回类型 =====

export interface HoldingView {
  symbol: string;
  name: string;
  currentShares: number;
  avgCost: number;
  holdingCost: number;
  marketValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  currentRatio: number; // 小数
  targetRatio: number; // 小数
  deviation: number; // 小数
}

export interface SnapshotView {
  portfolioId: number;
  date?: string;
  totalMarketValue: number;
  totalCost: number;
  totalPnl: number;
  profitRate: number; // 小数
  todayProfit?: number;
  todayProfitRate?: number;
  completion: number; // 小数
  holdings: HoldingView[];
}

export interface PortfolioView {
  id: number;
  userId: number;
  name: string;
  targetTotalAmount: string;
  createdAt: string;
}

// ===== API 方法 =====

/** 用户的所有组合 */
export function getPortfolios(userId = USER_ID) {
  return fetchJson<PortfolioView[]>(`/portfolio?userId=${userId}`);
}

/** 读某组合最新快照（不触发计算） */
export function getLatestSnapshot(portfolioId: number) {
  return fetchJson<SnapshotView | null>(`/portfolio/${portfolioId}/snapshot`);
}

/** 触发某组合计算快照并返回结果 */
export function runSnapshot(portfolioId: number) {
  return fetchJson<SnapshotView>(`/portfolio/${portfolioId}/snapshot`, {
    method: "POST",
  });
}

/** 首页：组合列表 + 各组合最新快照（聚合） */
export async function getHomeData(userId = USER_ID) {
  const portfolios = await getPortfolios(userId);
  const snapshots = await Promise.all(
    portfolios.map((p) => getLatestSnapshot(p.id).catch(() => null)),
  );
  return { portfolios, snapshots };
}
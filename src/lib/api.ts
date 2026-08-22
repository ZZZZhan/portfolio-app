// 前端 API 层：调用 portfolio-server 后端
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const API_BASE = '/api'; // Next rewrites 代理到 NestJS (localhost:3001)

/** 后端统一响应体（由 TransformInterceptor 包装） */
interface UnifiedResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

let redirectingToLogin = false;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: 'no-store',
    credentials: 'include', // 携带 better-auth 会话 cookie
  });
  // 未登录/会话失效：后端全局 AuthGuard 返回 401，统一跳登录页
  if (res.status === 401 && typeof window !== 'undefined') {
    if (!redirectingToLogin) {
      redirectingToLogin = true;
      window.location.href = '/login';
    }
    throw new Error(`401 unauthorized @ ${path}`);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${path}`);
  const body = (await res.json()) as UnifiedResponse<T>;
  // 业务错误码非 0 也视为失败（后续可扩展）
  if (body.code !== 0) {
    throw new Error(body.message || `code ${body.code} @ ${path}`);
  }
  return body.data as T;
}

// ===== 后端返回类型 =====

/** 资产类型（对齐 Prisma enum AssetType） */
export type AssetType = 'ETF' | 'STOCK' | 'FUND';

/** 资产搜索结果项（对应后端 GET /portfolio/assets/search） */
export interface AssetSearchResult {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string;
}

/** 新建组合时单条持仓输入（提交 symbol，后端按 symbol upsert Asset） */
export interface HoldingInput {
  symbol: string;
  name: string;
  assetType: AssetType;
  targetRatio: number;
  exchange: string;
  rebalanceThreshold?: number;
}

export interface CreatePortfolioPayload {
  name: string;
  targetTotalAmount: number;
  holdings: HoldingInput[];
}

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
  userId: string; // better-auth user.id 为 string
  name: string;
  targetTotalAmount: string;
  createdAt: string;
}

/** 组合详情（含持仓+标的，对应后端 GET /portfolio/:id） */
export interface PortfolioDetailView extends PortfolioView {
  holdings: HoldingDetail[];
}

/** 持仓行（含标的，组合详情的骨架） */
export interface HoldingDetail {
  id: number;
  portfolioId: number;
  assetId: number;
  targetRatio: number; // 百分比整数，如 30
  rebalanceThreshold: string;
  asset: {
    id: number;
    symbol: string;
    name: string;
    type: AssetType; // Prisma Asset.type
  };
}

// ===== 交易相关类型 =====

export type TradeType = 'EXCHANGE' | 'OTC';
export type TradeDirection = 'BUY' | 'SELL';
export type TradeStatus = 'COMPLETED' | 'PENDING';

/** 交易列表项（含持仓+标的，对应后端 GET /portfolio/:id/trades） */
export interface TradeView {
  id: number;
  holdingId: number;
  type: TradeType;
  direction: TradeDirection;
  amount: string; // Decimal 序列化为字符串
  shares: string | null;
  price: string | null;
  status: TradeStatus;
  tradedAt: string;
  holding: {
    id: number;
    targetRatio: number;
    asset: {
      symbol: string;
      name: string;
      type: AssetType; // Prisma Asset.type
    };
  };
}

/** 录入交易入参（标的由 holdingId 路径指定，不传 symbol） */
export interface RecordTradePayload {
  direction: TradeDirection;
  type: TradeType;
  amount?: number; // 场外必填
  navPrice?: number; // 场外可选：填了表示补录历史，净值已知
  shares?: number; // 场内必填
  price?: number; // 场内必填
}

// ===== API 方法 =====

/** 资产搜索：按代码/名称/拼音查标的 */
export function searchAssets(keyword: string) {
  return fetchJson<AssetSearchResult[]>(
    `/portfolio/assets/search?keyword=${encodeURIComponent(keyword)}`,
  );
}

/** 新建组合（userId 由后端从 session 取，前端不传） */
export function createPortfolio(payload: CreatePortfolioPayload) {
  return fetchJson<{ message: string }>(`/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** 用户的所有组合（userId 由后端从 session 取） */
export function getPortfolios() {
  return fetchJson<PortfolioView[]>(`/portfolio`);
}

/** 组合详情（含持仓+标的，骨架数据，不从快照读） */
export function getPortfolioDetail(portfolioId: number) {
  return fetchJson<PortfolioDetailView>(`/portfolio/${portfolioId}`);
}

/** 读某组合最新快照（不触发计算） */
export function getLatestSnapshot(portfolioId: number) {
  return fetchJson<SnapshotView | null>(`/portfolio/${portfolioId}/snapshot`);
}

/** 触发某组合计算快照并返回结果 */
export function runSnapshot(portfolioId: number) {
  return fetchJson<SnapshotView>(`/portfolio/${portfolioId}/snapshot`, {
    method: 'POST',
  });
}

/** 查某组合下的交易列表（userId 由后端从 session 取） */
export function getPortfolioTrades(portfolioId: number) {
  return fetchJson<TradeView[]>(`/portfolio/${portfolioId}/trades`);
}

/** 录入交易（按已有持仓 recording，标的已定；userId 由后端从 session 取） */
export function recordTrade(
  portfolioId: number,
  holdingId: number,
  payload: RecordTradePayload,
) {
  return fetchJson<{
    trade: { id: number; status: TradeStatus };
    snapshot: SnapshotView | null;
  }>(`/portfolio/${portfolioId}/holdings/${holdingId}/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** 改单条持仓的偏离阈值（userId 由后端从 session 取） */
export function updateHoldingThreshold(
  portfolioId: number,
  holdingId: number,
  rebalanceThreshold: number,
) {
  return fetchJson<HoldingDetail>(
    `/portfolio/${portfolioId}/holdings/${holdingId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rebalanceThreshold }),
    },
  );
}

/** 首页：组合列表 + 各组合最新快照（聚合） */
export async function getHomeData() {
  const portfolios = await getPortfolios();
  const snapshots = await Promise.all(
    portfolios.map((p) => getLatestSnapshot(p.id).catch(() => null)),
  );
  return { portfolios, snapshots };
}

// ===== React Query hooks =====

/** 资产搜索（带 debounce）：返回 { data, isFetching }，空 keyword 不请求 */
export function useAssetSearch(keyword: string, debounceMs = 300) {
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [keyword, debounceMs]);

  return useQuery({
    queryKey: ['assetSearch', debounced],
    queryFn: () => searchAssets(debounced),
    enabled: debounced.length > 0,
    staleTime: 60 * 1000, // 同词 60s 内不重复打网
  });
}

/** 用户的所有组合 */
export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: () => getPortfolios(),
  });
}

/** 某组合最新快照 */
export function useLatestSnapshot(portfolioId: number | null) {
  return useQuery({
    queryKey: ['snapshot', portfolioId],
    queryFn: () => getLatestSnapshot(portfolioId as number),
    enabled: portfolioId != null,
  });
}

/** 组合详情（持仓骨架） */
export function usePortfolioDetail(portfolioId: number | null) {
  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => getPortfolioDetail(portfolioId as number),
    enabled: portfolioId != null,
  });
}

/** 某组合的交易列表 */
export function usePortfolioTrades(portfolioId: number | null) {
  return useQuery({
    queryKey: ['trades', portfolioId],
    queryFn: () => getPortfolioTrades(portfolioId as number),
    enabled: portfolioId != null,
  });
}

/** 录入交易：成功后失效该组合的快照+交易列表缓存 */
export function useRecordTrade(portfolioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      holdingId,
      payload,
    }: {
      holdingId: number;
      payload: RecordTradePayload;
    }) => recordTrade(portfolioId, holdingId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['snapshot', portfolioId] });
      void qc.invalidateQueries({ queryKey: ['trades', portfolioId] });
      void qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

/**
 * 改持仓偏离阈值：只失效组合详情缓存。
 *
 * 不用动 ['snapshot']——阈值不进快照，后端提醒时才实时读 Holding.rebalanceThreshold。
 */
export function useUpdateHoldingThreshold(portfolioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      holdingId,
      rebalanceThreshold,
    }: {
      holdingId: number;
      rebalanceThreshold: number;
    }) => updateHoldingThreshold(portfolioId, holdingId, rebalanceThreshold),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
    },
  });
}

/** 首页数据：组合列表 + 各组合快照 */
export function useHomeData() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => getHomeData(),
  });
}

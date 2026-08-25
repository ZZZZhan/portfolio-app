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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: 'no-store',
      credentials: 'include', // 携带 better-auth 会话 cookie
      signal: init?.signal ?? controller.signal,
      headers: {
        ...(init?.body != null ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    });
    // 未登录/会话失效：后端全局 AuthGuard 返回 401，统一跳登录页
    if (res.status === 401 && typeof window !== 'undefined') {
      if (!redirectingToLogin) {
        redirectingToLogin = true;
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
        // 2s 后重置，允许后续 401 再次触发跳转（避免 SPA 内一次性锁死）
        setTimeout(() => {
          redirectingToLogin = false;
        }, 2000);
      }
      throw new Error(`401 unauthorized @ ${path}`);
    }
    if (!res.ok) {
      // 优先透传后端 body.message，而非仅 statusText
      let backendMsg: string | null = null;
      try {
        const errBody = (await res.clone().json()) as Partial<UnifiedResponse<unknown>>;
        if (typeof errBody?.message === 'string' && errBody.message) backendMsg = errBody.message;
      } catch {}
      throw new Error(backendMsg ?? `${res.status} ${res.statusText} @ ${path}`);
    }
    const body = (await res.json()) as UnifiedResponse<T>;
    // 业务错误码非 0 也视为失败
    if (body.code !== 0) {
      throw new Error(body.message || `code ${body.code} @ ${path}`);
    }
    return body.data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(`请求超时 @ ${path}`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
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
    // 后端 include: { asset: true } 一直有返回，编辑组合回填时必须带上 ——
    // 少了它提交回去会丢交易所，行情源前缀（sh/sz/of）就拼错了
    exchange: string;
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

/** 全量修改组合（名称 / 金额 / 持仓，含增删标的；userId 由后端从 session 取） */
export function updatePortfolio(
  portfolioId: number,
  payload: Partial<CreatePortfolioPayload>,
) {
  return fetchJson<{ message: string }>(`/portfolio/${portfolioId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** 删除组合。后端级联删掉其持仓、交易记录与历史快照，不可恢复 */
export function deletePortfolio(portfolioId: number) {
  return fetchJson<{ message: string }>(`/portfolio/${portfolioId}`, {
    method: 'DELETE',
  });
}

/** 首页：组合列表 + 各组合最新快照（聚合） */
export async function getHomeData() {
  const portfolios = await getPortfolios();
  const snapshots = await Promise.all(
    portfolios.map((p) =>
      getLatestSnapshot(p.id).catch((e) => {
        // 401 已全局跳转，不吞；其他错误才置空并在控制台提示
        if (e instanceof Error && e.message.includes('401 unauthorized')) throw e;
        console.warn(`getLatestSnapshot failed for portfolio ${p.id}`, e);
        return null;
      }),
    ),
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
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401 unauthorized')) return false;
      return failureCount < 2;
    },
  });
}

/** 用户的所有组合 */
export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: () => getPortfolios(),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401 unauthorized')) return false;
      return failureCount < 2;
    },
  });
}

/** 某组合最新快照 */
export function useLatestSnapshot(portfolioId: number | null) {
  return useQuery({
    queryKey: ['snapshot', portfolioId],
    queryFn: () => getLatestSnapshot(portfolioId as number),
    enabled: portfolioId != null && Number.isFinite(portfolioId),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401 unauthorized')) return false;
      return failureCount < 2;
    },
  });
}

/** 组合详情（持仓骨架） */
export function usePortfolioDetail(portfolioId: number | null) {
  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => getPortfolioDetail(portfolioId as number),
    enabled: portfolioId != null && Number.isFinite(portfolioId),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401 unauthorized')) return false;
      return failureCount < 2;
    },
  });
}

/** 某组合的交易列表 */
export function usePortfolioTrades(portfolioId: number | null) {
  return useQuery({
    queryKey: ['trades', portfolioId],
    queryFn: () => getPortfolioTrades(portfolioId as number),
    enabled: portfolioId != null && Number.isFinite(portfolioId),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401 unauthorized')) return false;
      return failureCount < 2;
    },
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

/** 改组合：持仓配比变了，快照里的偏离度也要跟着重算，故连快照/交易缓存一起失效 */
export function useUpdatePortfolio(portfolioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreatePortfolioPayload>) =>
      updatePortfolio(portfolioId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
      void qc.invalidateQueries({ queryKey: ['snapshot', portfolioId] });
      void qc.invalidateQueries({ queryKey: ['trades', portfolioId] });
      void qc.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

/** 删组合：连同其快照/交易缓存一起清掉，首页与列表重新拉 */
export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (portfolioId: number) => deletePortfolio(portfolioId),
    onSuccess: (_data, portfolioId) => {
      qc.removeQueries({ queryKey: ['portfolio', portfolioId] });
      qc.removeQueries({ queryKey: ['snapshot', portfolioId] });
      qc.removeQueries({ queryKey: ['trades', portfolioId] });
      void qc.invalidateQueries({ queryKey: ['home'] });
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

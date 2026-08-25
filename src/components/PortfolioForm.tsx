'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { REBALANCE_ALERT_THRESHOLD } from '@/lib/format';
import {
  useAssetSearch,
  type AssetSearchResult,
  type HoldingInput,
} from '@/lib/api';

/** 选中的持仓行 = 搜索结果 + 配比 + 再平衡阈值 */
export interface HoldingRow extends AssetSearchResult {
  targetRatio: number;
  rebalanceThreshold: number;
}

/** 表单初值。新建页传空，编辑页从组合详情回填 */
export interface PortfolioFormInitial {
  name: string;
  targetTotalAmount: string;
  holdings: HoldingRow[];
}
/** 偏离阈值默认值 %（单源于 format.REBALANCE_ALERT_THRESHOLD，与后端兜底保持一致） */
export const DEFAULT_REBALANCE_THRESHOLD = REBALANCE_ALERT_THRESHOLD;

/**
 * 组合表单 —— 新建页与编辑页共用。
 *
 * 两边的字段、校验（配比之和必须 100）、标的搜索完全一致，
 * 差别只在按钮文案和提交动作，所以整体抽出而不是各写一份。
 */
export default function PortfolioForm({
  initial,
  submitLabel,
  submittingLabel,
  errorPrefix,
  tradeCountBySymbol,
  onSubmit,
}: {
  initial: PortfolioFormInitial;
  submitLabel: string;
  submittingLabel: string;
  errorPrefix: string;
  /**
   * 各标的已有的交易笔数（编辑页传入）。
   * 移除有交易的标的会级联删掉那些交易，提交前要让用户看到笔数。
   */
  tradeCountBySymbol?: Record<string, number>;
  onSubmit: (payload: {
    name: string;
    targetTotalAmount: number;
    holdings: HoldingInput[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [targetTotalAmount, setTargetTotalAmount] = useState(
    initial.targetTotalAmount,
  );
  const [holdings, setHoldings] = useState<HoldingRow[]>(initial.holdings);

  // 编辑页 initial 异步到达（portfolio 详情回填），需同步到本地表单
  const prevInitialRef = useRef(initial);
  useEffect(() => {
    const prev = prevInitialRef.current;
    const wasEmpty = prev.holdings.length === 0 && prev.name === '' && prev.targetTotalAmount === '';
    const nowHasData = initial.holdings.length > 0 || initial.name !== '';
    if (wasEmpty && nowHasData) {
      setName(initial.name);
      setTargetTotalAmount(initial.targetTotalAmount);
      setHoldings(initial.holdings);
    }
    prevInitialRef.current = initial;
  }, [initial]);

  // 搜索输入 + 候选下拉
  const [keyword, setKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const search = useAssetSearch(keyword);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 待确认移除的标的（有交易记录时才走确认）
  const [pendingRemove, setPendingRemove] = useState<HoldingRow | null>(null);

  const total = holdings.reduce((s, h) => s + h.targetRatio, 0);
  const isTotalValid = Math.abs(total - 100) < 0.01;
  const totalColor =
    isTotalValid ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]';

  const canSubmit =
    isTotalValid &&
    name.trim().length > 0 &&
    Number(targetTotalAmount) > 0 &&
    holdings.length > 0 &&
    !submitting;
  function addHolding(item: AssetSearchResult) {
    // 去重：同 symbol 不重复加
    if (holdings.some((h) => h.symbol === item.symbol)) {
      setKeyword('');
      setShowDropdown(false);
      return;
    }
    setHoldings((prev) => [
      ...prev,
      // 新增标的配比留空（0），由用户自行输入；阈值给默认值
      {
        ...item,
        targetRatio: 0,
        rebalanceThreshold: DEFAULT_REBALANCE_THRESHOLD,
      },
    ]);
    setKeyword('');
    setShowDropdown(false);
  }

  /** 点 × ：有交易记录的先确认，没有的直接移除 */
  function requestRemove(h: HoldingRow) {
    if ((tradeCountBySymbol?.[h.symbol] ?? 0) > 0) {
      setPendingRemove(h);
      return;
    }
    removeHolding(h.symbol);
  }

  function removeHolding(symbol: string) {
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
    setPendingRemove(null);
  }

  function updateRatio(symbol: string, ratio: number) {
    const clamped = Math.max(0, Math.min(100, ratio));
    setHoldings((prev) =>
      prev.map((h) =>
        h.symbol === symbol ? { ...h, targetRatio: clamped } : h,
      ),
    );
  }

  function updateThreshold(symbol: string, threshold: number) {
    const clamped = Math.max(0, Math.min(100, threshold));
    setHoldings((prev) =>
      prev.map((h) =>
        h.symbol === symbol ? { ...h, rebalanceThreshold: clamped } : h,
      ),
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: HoldingInput[] = holdings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        assetType: h.assetType,
        exchange: h.exchange,
        targetRatio: h.targetRatio,
        rebalanceThreshold: h.rebalanceThreshold,
      }));
      await onSubmit({
        name: name.trim(),
        targetTotalAmount: Number(targetTotalAmount),
        holdings: payload,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const candidates = useMemo(() => search.data ?? [], [search.data]);

  return (
    <>
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

      {/* Target total amount */}
      <div className="rounded-[14px] bg-white px-4 h-[52px] flex items-center border border-[var(--color-border)]">
        <input
          type="number"
          min="0"
          value={targetTotalAmount}
          onChange={(e) => setTargetTotalAmount(e.target.value)}
          placeholder="目标总投入金额（元）"
          className="flex-1 text-[15px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
        />
        <span className="text-[14px] text-[var(--color-text-muted)] ml-2">
          元
        </span>
      </div>

      {/* Asset allocation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
            目标配比
          </span>
          <span className={`text-[15px] font-bold font-mono ${totalColor}`}>
            {total}%
          </span>
        </div>

        {/* 搜索输入框 */}
        <div className="relative">
          <label htmlFor="asset-search" className="sr-only">搜索标的</label>
          <input
            id="asset-search"
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={(e) => {
              // 若焦点移入下拉按钮，不关闭；否则关闭
              const next = e.relatedTarget as HTMLElement | null;
              if (next?.closest('[data-asset-option]')) return;
              setShowDropdown(false);
            }}
            placeholder="搜索标的代码或名称（如 510300 / 茅台）"
            autoComplete="off"
            aria-controls="asset-search-list"
            aria-haspopup="listbox"
            className="w-full rounded-[12px] bg-white px-4 h-[52px] text-[15px] outline-none border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          {showDropdown && keyword.trim().length > 0 && (
            <div id="asset-search-list" role="listbox" className="absolute z-10 mt-1 w-full rounded-[12px] bg-white border border-[var(--color-border)] shadow-lg overflow-hidden max-h-[240px] overflow-y-auto">
              {search.isFetching ? (
                <div className="px-4 py-3 text-[13px] text-[var(--color-text-muted)]">
                  搜索中…
                </div>
              ) : candidates.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-[var(--color-text-muted)]">
                  未找到标的
                </div>
              ) : (
                candidates.map((c) => (
                  <button
                    key={`${c.symbol}-${c.assetType}`}
                    data-asset-option
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addHolding(c);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-primary-blue-bg)] text-left border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                        {c.name}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {c.symbol}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-track)] text-[var(--color-text-muted)]">
                      {c.assetType}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 已选持仓列表 */}
        {holdings.map((h) => (
          <div
            key={h.symbol}
            className="rounded-[12px] bg-white px-4 py-3 flex flex-col gap-2 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                  {h.name}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {h.symbol} · {h.assetType}
                  {tradeCountBySymbol?.[h.symbol]
                    ? ` · ${tradeCountBySymbol[h.symbol]} 笔交易`
                    : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center rounded-[8px] bg-[var(--color-track)] px-2 h-[32px]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={h.targetRatio}
                    onChange={(e) =>
                      updateRatio(h.symbol, parseFloat(e.target.value) || 0)
                    }
                    className="w-14 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
                    aria-label={`${h.name} 目标配比`}
                  />
                  <span className="text-[13px] text-[var(--color-text-muted)] ml-0.5">
                    %
                  </span>
                </div>
                <button
                  onClick={() => requestRemove(h)}
                  className="ml-1 w-6 h-6 flex items-center justify-center rounded-full text-[16px] leading-none text-[var(--color-text-muted)] hover:text-[var(--color-red)] hover:bg-[var(--color-primary-blue-bg)]"
                  aria-label={`移除 ${h.name}`}
                >
                  ×
                </button>
              </div>
            </div>

            {/* 偏离阈值：超过则提醒再平衡（右侧留出删除按钮宽度以与配比框对齐） */}
            <div className="flex items-center justify-between pr-[32px]">
              <span className="text-[12px] text-[var(--color-text-muted)]">
                偏离阈值 ±
              </span>
              <div className="flex items-center rounded-[8px] bg-[var(--color-track)] px-2 h-[32px] shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={h.rebalanceThreshold}
                  onChange={(e) =>
                    updateThreshold(h.symbol, parseFloat(e.target.value) || 0)
                  }
                  className="w-14 text-right text-[15px] font-mono font-bold text-[var(--color-text-primary)] outline-none bg-transparent"
                  aria-label={`${h.name} 再平衡偏离阈值`}
                />
                <span className="text-[13px] text-[var(--color-text-muted)] ml-0.5">
                  %
                </span>
              </div>
            </div>
          </div>
        ))}

        {holdings.length === 0 ? (
          <div className="rounded-[12px] bg-white px-4 py-6 flex items-center justify-center border border-dashed border-[var(--color-border)]">
            <span className="text-[13px] text-[var(--color-text-muted)]">
              上方搜索并添加标的
            </span>
          </div>
        ) : null}
        {/* Progress bar */}
        <div className="relative w-full h-1.5 rounded-full bg-[var(--color-track)]" role="progressbar" aria-valuenow={Math.min(total, 100)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`h-full rounded-full ${isTotalValid ? 'bg-[var(--color-green)]' : 'bg-[var(--color-amber)]'}`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
        {isTotalValid ? (
          <span className="text-[12px] text-[var(--color-green)]" role="status" aria-live="polite">
            配比合规 ✓
          </span>
        ) : (
          <span className="text-[12px] text-[var(--color-amber)]" role="alert">
            需调整至100%（当前 {total.toFixed(1)}%）
          </span>
        )}
      </div>

      {error && (
        <span role="alert" aria-live="assertive" className="text-[12px] text-[var(--color-red)]">
          {errorPrefix}：{error}
        </span>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center disabled:opacity-40 disabled:shadow-none"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>

      {/* 移除有交易记录的标的：先说清代价再动手 */}
      {pendingRemove && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="取消移除"
            onClick={() => setPendingRemove(null)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="relative rounded-t-[20px] bg-white px-5 pt-5 pb-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">
                移除 {pendingRemove.name}？
              </h3>
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                该标的下有 {tradeCountBySymbol?.[pendingRemove.symbol]} 笔交易记录。
                保存后这些交易会一并删除，该标的的历史收益将不再可查，且无法恢复。
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingRemove(null)}
                className="flex-1 h-[48px] rounded-[14px] border border-[var(--color-border)] text-[15px] font-medium text-[var(--color-text-primary)]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => removeHolding(pendingRemove.symbol)}
                className="flex-1 h-[48px] rounded-[14px] bg-[var(--color-red)] text-white text-[15px] font-semibold"
              >
                仍要移除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

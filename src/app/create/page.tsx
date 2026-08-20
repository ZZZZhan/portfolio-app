'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/Icons';
import {
  useAssetSearch,
  createPortfolio,
  type AssetSearchResult,
  type HoldingInput,
} from '@/lib/api';

/** 选中的持仓行 = 搜索结果 + 配比 */
interface HoldingRow extends AssetSearchResult {
  targetRatio: number;
}

export default function CreatePortfolioPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [targetTotalAmount, setTargetTotalAmount] = useState('');
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);

  // 搜索输入 + 候选下拉
  const [keyword, setKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const search = useAssetSearch(keyword);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = holdings.reduce((s, h) => s + h.targetRatio, 0);
  const totalColor =
    total === 100 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]';

  const canSubmit =
    total === 100 &&
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
      // 新增标的配比留空（0），由用户自行输入
      { ...item, targetRatio: 0 },
    ]);
    setKeyword('');
    setShowDropdown(false);
  }

  function removeHolding(symbol: string) {
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
  }

  function updateRatio(symbol: string, ratio: number) {
    const clamped = Math.max(0, Math.min(100, ratio));
    setHoldings((prev) =>
      prev.map((h) =>
        h.symbol === symbol ? { ...h, targetRatio: clamped } : h,
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
      }));
      await createPortfolio({
        name: name.trim(),
        targetTotalAmount: Number(targetTotalAmount),
        holdings: payload,
      });
      router.push('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const candidates = useMemo(() => search.data ?? [], [search.data]);

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ChevronLeftIcon
              size={20}
              className="text-[var(--color-text-primary)]"
            />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
              返回
            </span>
          </Link>
          <span className="text-[14px] font-semibold text-[var(--color-text-muted)]">
            完成
          </span>
        </div>

        <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">
          创建自定义组合
        </h1>

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
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="搜索标的代码或名称（如 510300 / 茅台）"
              className="w-full rounded-[12px] bg-white px-4 h-[52px] text-[15px] outline-none border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            {showDropdown && keyword.trim().length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-[12px] bg-white border border-[var(--color-border)] shadow-lg overflow-hidden max-h-[240px] overflow-y-auto">
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
              className="rounded-[12px] bg-white px-4 py-3 flex items-center justify-between gap-3 border border-[var(--color-border)]"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                  {h.name}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {h.symbol} · {h.assetType}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center rounded-[8px] bg-[var(--color-track)] px-2 h-[32px]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={h.targetRatio}
                    onChange={(e) =>
                      updateRatio(h.symbol, parseInt(e.target.value) || 0)
                    }
                    className="w-14 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
                    aria-label={`${h.name} 目标配比`}
                  />
                  <span className="text-[13px] text-[var(--color-text-muted)] ml-0.5">
                    %
                  </span>
                </div>
                <button
                  onClick={() => removeHolding(h.symbol)}
                  className="ml-1 w-6 h-6 flex items-center justify-center rounded-full text-[16px] leading-none text-[var(--color-text-muted)] hover:text-[var(--color-red)] hover:bg-[var(--color-primary-blue-bg)]"
                  aria-label={`移除 ${h.name}`}
                >
                  ×
                </button>
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
          <div className="relative w-full h-1.5 rounded-full bg-[var(--color-track)]">
            <div
              className={`h-full rounded-full ${total === 100 ? 'bg-[var(--color-green)]' : 'bg-[var(--color-amber)]'}`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          {total === 100 ? (
            <span className="text-[12px] text-[var(--color-green)]">
              配比合规 ✓
            </span>
          ) : (
            <span className="text-[12px] text-[var(--color-amber)]">
              需调整至100%（当前 {total}%）
            </span>
          )}
        </div>

        {error && (
          <span className="text-[12px] text-[var(--color-red)]">
            创建失败：{error}
          </span>
        )}

        {/* Create button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? '创建中…' : '创建组合'}
        </button>
      </div>
    </div>
  );
}

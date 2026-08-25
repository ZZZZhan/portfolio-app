'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/Icons';
import PortfolioForm, {
  type HoldingRow,
} from '@/components/PortfolioForm';
import {
  usePortfolioDetail,
  usePortfolioTrades,
  useUpdatePortfolio,
} from '@/lib/api';

export default function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const portfolioId = Number(id);
  const isValidId = Number.isFinite(portfolioId) && portfolioId > 0;
  const router = useRouter();

  const { data: portfolio, isLoading } = usePortfolioDetail(isValidId ? portfolioId : null);
  // 交易笔数只用于「移除标的会连带删掉 N 笔交易」的提示，拿不到不阻塞编辑
  const { data: trades } = usePortfolioTrades(isValidId ? portfolioId : null);
  const updatePortfolio = useUpdatePortfolio(portfolioId);
  const initial = useMemo(() => {
    if (!portfolio) return null;
    return {
      name: portfolio.name,
      targetTotalAmount: String(portfolio.targetTotalAmount),
      holdings: portfolio.holdings.map<HoldingRow>((h) => ({
        symbol: h.asset.symbol,
        name: h.asset.name,
        assetType: h.asset.type,
        exchange: h.asset.exchange,
        targetRatio: h.targetRatio,
        rebalanceThreshold: Number(h.rebalanceThreshold),
      })),
    };
  }, [portfolio]);

  /** { symbol: 交易笔数 } */
  const tradeCountBySymbol = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trades ?? []) {
      const symbol = t.holding.asset.symbol;
      counts[symbol] = (counts[symbol] ?? 0) + 1;
    }
    return counts;
  }, [trades]);

  if (!isValidId) {
    return (
      <div className="phone-frame">
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-3">
          <p className="text-[14px] text-[var(--color-text-muted)]">无效的组合 ID</p>
          <Link href="/" className="text-[14px] text-[var(--color-primary)]">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link
            href={`/portfolio/${portfolioId}`}
            className="flex items-center gap-3"
          >
            <ChevronLeftIcon
              size={20}
              className="text-[var(--color-text-primary)]"
            />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
              返回
            </span>
          </Link>
        </div>

        <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">
          编辑组合
        </h1>

        {isLoading || !initial ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">
            加载中...
          </div>
        ) : (
          <PortfolioForm
            initial={initial}
            submitLabel="保存修改"
            submittingLabel="保存中…"
            errorPrefix="保存失败"
            tradeCountBySymbol={tradeCountBySymbol}
            onSubmit={async (payload) => {
              await updatePortfolio.mutateAsync(payload);
              router.push(`/portfolio/${portfolioId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}

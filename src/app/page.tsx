'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { BellIcon, PlusIcon } from '@/components/Icons';
import { useHomeData } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { toHomeOverview, toPortfolioCard } from '@/lib/format';

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data, isLoading, isError, error } = useHomeData();

  // 客户端兜底：proxy/middleware 漏掉时，未登录也跳登录（避免白屏闪烁）
  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login');
    }
  }, [session, isPending, router]);

  // 会话校验中或已判定未登录（即将跳转），先不渲染业务数据
  if (isPending || !session) {
    return (
      <div className="phone-frame">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[13px] text-[var(--color-text-muted)]">加载中...</span>
        </div>
      </div>
    );
  }

  // 后端 401 也会通过 api.ts 跳登录，这里额外处理避免展示错误态
  if (isError && error instanceof Error && error.message.includes('401 unauthorized')) {
    return (
      <div className="phone-frame">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[13px] text-[var(--color-text-muted)]">跳转登录中...</span>
        </div>
      </div>
    );
  }
  const portfolios = data?.portfolios ?? [];
  const snapshots = data?.snapshots ?? [];
  const loading = isLoading;

  const overview = toHomeOverview(snapshots);
  const cards = portfolios.map((p, i) => toPortfolioCard(p, snapshots[i]));

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-[14px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">
              投资组合总览
            </h1>
          </div>
          {(() => {
            const alertIdx = cards.findIndex((c) => c.hasAlert);
            const href =
              alertIdx >= 0
                ? `/portfolio/${portfolios[alertIdx].id}/rebalance`
                : `/portfolio`;
            return (
              <Link
                href={href}
                className="relative w-11 h-11 rounded-[14px] bg-white border border-[var(--color-border)] flex items-center justify-center"
              >
                <BellIcon
                  size={20}
                  className="text-[var(--color-text-primary)]"
                />
                {alertIdx >= 0 && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[var(--color-red)]" />
                )}
              </Link>
            );
          })()}
        </div>

        {/* Total Asset Card */}
        <div className="gradient-primary rounded-[20px] px-5 py-5 flex flex-col gap-3 shadow-primary-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#C9D4F0]">总资产 (元)</span>
            <div className="px-2.5 h-6 rounded-full bg-white/20 flex items-center gap-1">
              <span className="text-[10px] text-white/90 font-medium">
                📈 盘后更新
              </span>
            </div>
          </div>
          <span className="text-[32px] font-bold text-white font-mono">
            {loading ? '¥...' : overview.totalAssets}
          </span>
          <div className="flex gap-7">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#C9D4F0]">今日收益</span>
              <span className="text-[14px] font-bold text-white font-mono">
                {overview.todayProfit}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#C9D4F0]">累计收益</span>
              <span className="text-[14px] font-bold text-white font-mono">
                {overview.cumulativeProfit}
              </span>
            </div>
          </div>
        </div>

        {/* Today Profit Card */}
        <div className="rounded-[16px] bg-white px-4 py-4 flex flex-col gap-3 border border-[var(--color-border)] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              今日收益（盘后更新）
            </span>
            <div className="px-2.5 h-[22px] rounded-[11px] bg-[#E9F7EE] flex items-center">
              <span className="text-[10px] text-[var(--color-green)] font-medium">
                已更新
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[22px] font-bold text-[var(--color-red)] font-mono">
                {overview.todayProfit}
              </span>
            </div>
            <span className="text-[15px] font-bold text-[var(--color-red)] font-mono">
              {overview.todayReturn}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              持仓收益率
            </span>
            <span className="text-[14px] font-bold text-[var(--color-red)] font-mono">
              {overview.cumulativeRate}
            </span>
          </div>
        </div>

        {/* Portfolio List Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
            我的组合
          </h2>
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-3.5 h-[34px] rounded-[17px] bg-[var(--color-primary)] shadow-primary-sm"
          >
            <PlusIcon size={16} className="text-white" />
            <span className="text-[13px] font-semibold text-white">
              新建组合
            </span>
          </Link>
        </div>

        {/* Portfolio Cards */}
        {loading ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">
            加载中...
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">
            还没有组合，去新建一个吧
          </div>
        ) : (
          cards.map((p) => (
            <Link
              key={p.id}
              href={`/portfolio/${p.id}`}
              className="rounded-[16px] bg-white px-4 py-4 flex flex-col gap-2.5 border border-[var(--color-border)] shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[var(--color-text-primary)]">
                  {p.name}
                </span>
                {p.todayChange ? (
                  <span className="text-[12px] font-medium text-[var(--color-red)]">
                    今日 {p.todayChange}
                  </span>
                ) : p.hasAlert ? (
                  <div className="px-2.5 h-[22px] rounded-[11px] bg-[var(--color-amber-bg)] flex items-center">
                    <span className="text-[10px] text-[var(--color-amber)] font-medium">
                      偏离风险
                    </span>
                  </div>
                ) : null}
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[var(--color-track)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{ width: `${p.completion}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--color-text-secondary)]">
                  建仓完成度 {p.completion}%
                </span>
                <span className="text-[13px] font-bold text-[var(--color-text-primary)] font-mono">
                  {p.marketValue}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SwipeActions, { type SwipeAction } from "@/components/SwipeActions";
import ConfirmSheet from "@/components/ConfirmSheet";
import {
  ChevronLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/Icons";
import { useHomeData, usePortfolioTrades, useDeletePortfolio } from "@/lib/api";
import { toPortfolioCard } from "@/lib/format";

export default function PortfolioListPage() {
  const router = useRouter();
  const { data, isLoading } = useHomeData();

  // 左滑：同一时刻只展开一行
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);
  // 待删除的组合（null 表示确认弹层关闭）
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const deletePortfolio = useDeletePortfolio();
  // 删除弹层里要告知会连带删掉多少笔交易，弹层打开时才拉
  const { data: targetTrades } = usePortfolioTrades(deleteTarget?.id ?? null);

  const portfolios = data?.portfolios ?? [];
  const snapshots = data?.snapshots ?? [];
  const cards = portfolios.map((p, i) => toPortfolioCard(p, snapshots[i]));
  const loading = isLoading;

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
          </Link>
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-3.5 h-[34px] rounded-[17px] bg-[var(--color-primary)] shadow-primary-sm"
          >
            <PlusIcon size={16} className="text-white" />
            <span className="text-[13px] font-semibold text-white">新建组合</span>
          </Link>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">我的组合</h1>
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            {loading ? "..." : `${cards.length} 个组合 · 左滑可编辑 / 删除`}
          </span>
        </div>

        {/* Portfolio list */}
        <div className="flex flex-col gap-[14px]">
          {loading ? (
            <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">加载中...</div>
          ) : cards.length === 0 ? (
            <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">还没有组合</div>
          ) : (
            cards.map((p) => {
              const id = Number(p.id);
              const actions: SwipeAction[] = [
                {
                  key: "edit",
                  label: "编辑",
                  bg: "var(--color-primary)",
                  icon: <PencilIcon size={18} />,
                  onSelect: () => router.push(`/portfolio/${id}/edit`),
                },
                {
                  key: "delete",
                  label: "删除",
                  bg: "var(--color-red)",
                  icon: <TrashIcon size={18} />,
                  onSelect: () => setDeleteTarget({ id, name: p.name }),
                },
              ];

              return (
                <SwipeActions
                  key={p.id}
                  actions={actions}
                  open={openSwipeId === id}
                  onOpenChange={(next) => setOpenSwipeId(next ? id : null)}
                  // 圆角与边框交给 SwipeActions 外层：内容卡若自带圆角，
                  // 展开时右侧圆角会和操作区之间漏出底色缺口
                  className="border border-[var(--color-border)]"
                >
                  <Link
                    href={`/portfolio/${p.id}`}
                    className="bg-white px-4 py-4 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-[var(--color-text-primary)]">{p.name}</span>
                      {p.todayChange ? (
                        <span className="text-[12px] font-medium text-[var(--color-red)]">今日 {p.todayChange}</span>
                      ) : p.hasAlert ? (
                        <div className="px-2.5 h-[22px] rounded-[11px] bg-[var(--color-amber-bg)] flex items-center">
                          <span className="text-[10px] text-[var(--color-amber)] font-medium">偏离风险</span>
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
                      <span className="text-[12px] text-[var(--color-text-secondary)]">建仓完成度 {p.completion}%</span>
                      <span className="text-[13px] font-bold text-[var(--color-text-primary)] font-mono">{p.marketValue}</span>
                    </div>
                  </Link>
                </SwipeActions>
              );
            })
          )}
        </div>
      </div>
      <BottomNav />

      {deleteTarget && (
        <ConfirmSheet
          title={`删除「${deleteTarget.name}」？`}
          description={
            `该组合的持仓配置` +
            (targetTrades?.length ? `、${targetTrades.length} 笔交易记录` : "") +
            `和全部历史快照都会一并删除，无法恢复。`
          }
          confirmLabel="删除组合"
          confirming={deletePortfolio.isPending}
          error={deletePortfolio.error?.message ?? null}
          onCancel={() => {
            deletePortfolio.reset(); // 清掉上次的错误，下次开弹层是干净的
            setDeleteTarget(null);
          }}
          onConfirm={() =>
            deletePortfolio.mutate(deleteTarget.id, {
              onSuccess: () => {
                setOpenSwipeId(null);
                setDeleteTarget(null);
              },
            })
          }
        />
      )}
    </div>
  );
}

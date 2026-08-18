"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { AlertIcon } from "@/components/Icons";
import { getLatestSnapshot } from "@/lib/api";
import { toRebalanceAlerts } from "@/lib/format";
import type { SnapshotView } from "@/lib/api";

export default function RebalancePage() {
  const [alerts, setAlerts] = useState<ReturnType<typeof toRebalanceAlerts>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // M2 暂用组合 1 的快照演示
    getLatestSnapshot(1)
      .then((snap) => setSnap(snap ? toRebalanceAlerts(snap) : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-[14px] overflow-y-auto">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">再平衡提醒</h1>
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            {loading ? "..." : `${alerts.length}项偏离`}
          </span>
        </div>

        {/* Alert banner */}
        <div className="rounded-[14px] bg-[var(--color-amber-bg)] px-4 h-12 flex items-center gap-2.5">
          <AlertIcon size={20} className="text-[var(--color-amber)]" />
          <span className="text-[13px] font-medium text-[#B5703A] flex-1">
            以下持仓偏离目标配置，建议再平衡
          </span>
        </div>

        {/* Alert list */}
        {loading ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">加载中...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-[13px] text-[var(--color-text-muted)] py-8">所有持仓均在阈值内</div>
        ) : (
          alerts.map((item, i) => {
            const isOver = item.status === "overweight";
            const bgColor = isOver ? "#FFE5E5" : "#E5F7EE";
            const textColor = isOver ? "text-[var(--color-red)]" : "text-[var(--color-green)]";

            return (
              <div key={i} className="rounded-[14px] bg-white px-4 py-4 flex flex-col gap-3 border border-[var(--color-border)] shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{item.name}</span>
                  <div className="px-2.5 h-[22px] rounded-full flex items-center" style={{ backgroundColor: bgColor }}>
                    <span className={`text-[11px] font-medium ${textColor}`}>
                      {isOver ? "超配" : "低配"} {item.deviation}
                    </span>
                  </div>
                </div>

                {/* Bar comparison */}
                <div className="flex items-center gap-3">
                  {/* Current */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-[var(--color-text-muted)]">当前 {item.current}%</span>
                    <div className="w-full h-2 rounded-full bg-[var(--color-track)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.current}%`,
                          backgroundColor: isOver ? "var(--color-red)" : "var(--color-text-muted)",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">vs</span>
                  {/* Target */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-[var(--color-text-muted)]">目标 {item.target}%</span>
                    <div className="w-full h-2 rounded-full bg-[var(--color-track)]">
                      <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${item.target}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* One-click rebalance button */}
        <Link href="/adjust" className="w-full">
          <button className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center">
            一键再平衡
          </button>
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
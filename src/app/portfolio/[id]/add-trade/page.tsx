"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon } from "@/components/Icons";
import {
  useRecordTrade,
  type TradeType,
  type TradeDirection,
  type RecordTradePayload,
} from "@/lib/api";

const tradeTypes: { value: TradeType; label: string; hint: string }[] = [
  { value: "EXCHANGE", label: "场内", hint: "ETF/股票，份额+单价" },
  { value: "OTC", label: "场外", hint: "基金，按金额申购" },
];

const directions: { value: TradeDirection; label: string }[] = [
  { value: "BUY", label: "买入" },
  { value: "SELL", label: "卖出" },
];

export default function AddTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const portfolioId = Number(id);
  const isValidId = Number.isFinite(portfolioId) && portfolioId > 0;
  const sp = useSearchParams();

  // holdingId 可能缺失（直接访问 add-trade），显式校验而非 Number(null) === 0 的隐式
  const holdingIdRaw = sp.get("holdingId");
  const holdingId = holdingIdRaw != null && holdingIdRaw !== '' ? Number(holdingIdRaw) : null;
  const holdingIdValid = holdingId != null && Number.isFinite(holdingId) && holdingId > 0;
  const assetName = sp.get("name") ?? "";
  const assetSymbol = sp.get("symbol") ?? "";
  const assetType = sp.get("assetType") ?? "";

  const recordTrade = useRecordTrade(portfolioId);
  const [type, setType] = useState<TradeType>(
    assetType === "FUND" ? "OTC" : "EXCHANGE",
  );
  const [direction, setDirection] = useState<TradeDirection>(
    sp.get("direction") === "SELL" ? "SELL" : "BUY",
  );
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [navPrice, setNavPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isExchange = type === "EXCHANGE";
  const exchangeAmount =
    isExchange && shares && price
      ? (Number(shares) * Number(price)).toFixed(2)
      : "";
  // 场外补录历史：填了净值就能折算份额
  const otcShares =
    !isExchange && amount && navPrice
  const canSubmit =
    isValidId &&
    holdingIdValid &&
    !recordTrade.isPending &&
    (isExchange
      ? Number(shares) > 0 && Number(price) > 0
      : Number(amount) > 0);

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    const payload: RecordTradePayload = {
      direction,
      type,
      ...(isExchange
        ? { shares: Number(shares), price: Number(price) }
        : {
            amount: Number(amount),
            // 填了净值表示补录历史，未填表示今天申购（后端按 PENDING 处理）
            ...(navPrice ? { navPrice: Number(navPrice) } : {}),
          }),
    };
    try {
      await recordTrade.mutateAsync({ holdingId: holdingId as number, payload });
      router.push(`/portfolio/${portfolioId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

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

  if (!holdingIdValid) {
    return (
      <div className="phone-frame">
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-3">
          <p className="text-[14px] text-[var(--color-text-muted)]">缺少持仓信息，请从组合详情页进入</p>
          <Link href={`/portfolio/${portfolioId}`} className="text-[14px] text-[var(--color-primary)]">返回组合</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href={`/portfolio/${portfolioId}`} className="flex items-center gap-3">
            <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">返回</span>
          </Link>
        </div>

        <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">录入交易</h1>

        {/* 标的（只读，由路径传入） */}
        <div className="rounded-[12px] bg-white px-4 py-3 flex items-center justify-between border border-[var(--color-primary)] border-opacity-30">
          <div className="flex flex-col">
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{assetName}</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">{assetSymbol} · {assetType}</span>
          </div>
        </div>

        {/* 交易类型 */}
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-[var(--color-text-primary)]">交易类型</span>
          <div className="flex gap-2">
            {tradeTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex-1 flex flex-col items-start px-4 py-3 rounded-[12px] border transition-colors ${
                  type === t.value
                    ? "bg-[var(--color-primary-blue-bg)] border-[var(--color-primary)] border-opacity-30"
                    : "bg-white border-[var(--color-border)]"
                }`}
              >
                <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{t.label}</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 买卖方向 */}
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-[var(--color-text-primary)]">方向</span>
          <div className="flex gap-2">
            {directions.map((d) => (
              <button
                key={d.value}
                onClick={() => setDirection(d.value)}
                className={`flex-1 px-4 h-[44px] rounded-[12px] border text-[14px] font-medium transition-colors ${
                  direction === d.value
                    ? d.value === "BUY"
                      ? "bg-[var(--color-red)] text-white border-[var(--color-red)]"
                      : "bg-[var(--color-green)] text-white border-[var(--color-green)]"
                    : "bg-white text-[var(--color-text-primary)] border-[var(--color-border)]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 交易字段 */}
        {isExchange ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-[14px] bg-white px-4 h-[52px] flex items-center border border-[var(--color-border)]">
              <span className="text-[14px] text-[var(--color-text-muted)] w-16">份额</span>
              <input
                type="number"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="如 1000"
                className="flex-1 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
              />
              <span className="text-[13px] text-[var(--color-text-muted)] ml-2">份</span>
            </div>
            <div className="rounded-[14px] bg-white px-4 h-[52px] flex items-center border border-[var(--color-border)]">
              <span className="text-[14px] text-[var(--color-text-muted)] w-16">单价</span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="如 4.5"
                className="flex-1 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
              />
              <span className="text-[13px] text-[var(--color-text-muted)] ml-2">元</span>
            </div>
            {exchangeAmount && (
              <span className="text-[12px] text-[var(--color-text-secondary)] self-end">
                成交金额 ≈ ¥{exchangeAmount}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-[14px] bg-white px-4 h-[52px] flex items-center border border-[var(--color-border)]">
              <span className="text-[14px] text-[var(--color-text-muted)] w-16">金额</span>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="如 10000"
                className="flex-1 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
              />
              <span className="text-[13px] text-[var(--color-text-muted)] ml-2">元</span>
            </div>
            <div className="rounded-[14px] bg-white px-4 h-[52px] flex items-center border border-[var(--color-border)]">
              <span className="text-[14px] text-[var(--color-text-muted)] w-16">净值</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={navPrice}
                onChange={(e) => setNavPrice(e.target.value)}
                placeholder="可选，补录历史时填"
                className="flex-1 text-right text-[15px] font-mono font-bold text-[var(--color-primary)] outline-none bg-transparent"
              />
              <span className="text-[13px] text-[var(--color-text-muted)] ml-2">元</span>
            </div>
            {otcShares ? (
              <span className="text-[12px] text-[var(--color-green)] self-end">
                折算份额 ≈ {otcShares} 份（已知净值，录完即确认）
              </span>
            ) : (
              <span className="text-[12px] text-[var(--color-amber)] self-end">
                未填净值则按今天申购处理，收盘后净值公布时自动确认份额
              </span>
            )}
          </div>
        )}

        {error && (
          <span className="text-[12px] text-[var(--color-red)]">录入失败：{error}</span>
        )}

        {/* 提交 */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center disabled:opacity-40 disabled:shadow-none"
        >
          {recordTrade.isPending ? "录入中…" : "确认录入"}
        </button>
      </div>
    </div>
  );
}

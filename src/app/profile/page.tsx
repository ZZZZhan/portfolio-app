"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { ChevronRightIcon, InfoIcon } from "@/components/Icons";
import { useSession, signOut, updateUser } from "@/lib/auth-client";
import { useHomeData } from "@/lib/api";
import { toHomeOverview } from "@/lib/format";

const iconMap: Record<string, typeof InfoIcon> = {
  info: InfoIcon,
};

// 设置项（静态功能入口，与登录态无关）
const settings = [{ icon: "info", label: "关于我们", value: "v0.1" }];

export default function ProfilePage() {
  const { data: session, isPending, refetch } = useSession();
  const { data: home } = useHomeData();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  // SendKey 编辑态（session 异步加载，本地 draft + 是否已交互）
  const [sendkeyDraft, setSendkeyDraft] = useState("");
  const [sendkeyTouched, setSendkeyTouched] = useState(false);
  const [savingSendkey, setSavingSendkey] = useState(false);

  const user = session?.user;
  const name = user?.name ?? "用户";
  const email = user?.email ?? "";
  const avatarChar = name.charAt(0).toUpperCase();

  const overview = toHomeOverview(home?.snapshots ?? []);

  async function handleSaveSendkey() {
    if (savingSendkey) return;
    setSavingSendkey(true);
    const { error } = await updateUser({ sendkey: sendkeyDraft.trim() });
    setSavingSendkey(false);
    if (error) return;
    // 保存成功后本地已为最新值，不再被 session 异步覆盖
    setSendkeyTouched(true);
    await refetch();
  }
  // session 就绪且用户尚未编辑时，用服务端值填充输入框
  useEffect(() => {
    if (sendkeyTouched || isPending) return;
    if (user?.sendkey !== undefined && sendkeyDraft === "") {
      setSendkeyDraft(user.sendkey ?? "");
    }
  }, [user?.sendkey, sendkeyTouched, isPending, sendkeyDraft]);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    // signOut 会清除会话 cookie；回到登录页
    router.replace("/login");
  }

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-[14px] overflow-y-auto">
        {/* User card */}
        <div className="rounded-[16px] bg-white px-5 py-5 flex items-center gap-4 border border-[var(--color-border)] shadow-card">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
            <span className="text-white text-[20px] font-bold">{avatarChar}</span>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[16px] font-medium text-[var(--color-text-primary)]">
              {isPending ? "加载中..." : name}
            </span>
            <span className="text-[13px] text-[var(--color-text-muted)]">{email}</span>
          </div>
          <ChevronRightIcon size={20} className="text-[var(--color-text-muted)]" />
        </div>

        {/* Asset stats card */}
        <div className="rounded-[16px] bg-[var(--color-primary)] px-4 py-4 flex shadow-primary-lg">
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[12px] text-[#C9D4F0]">总资产</span>
            <span className="text-[20px] font-bold text-white font-mono">
              {home ? overview.totalAssets : "¥..."}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[12px] text-[#C9D4F0]">累计收益</span>
            <span className="text-[20px] font-bold text-white font-mono">
              {home ? overview.cumulativeProfit : "¥..."}
            </span>
            <span className="text-[11px] text-white/70 font-mono">
              {home ? overview.cumulativeRate : ""}
            </span>
          </div>
        </div>

        {/* Settings list：静态功能项（行情更新等已随产品调整移除） */}
        <div className="rounded-[16px] bg-white border border-[var(--color-border)] shadow-card overflow-hidden">
          {settings.map((s, i) => {
            const Icon = iconMap[s.icon] || InfoIcon;
            return (
              <div key={i}>
                <div className="flex items-center justify-between px-4 h-[54px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--color-primary-blue-bg)] flex items-center justify-center">
                      <Icon size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="text-[14px] text-[var(--color-text-primary)]">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[var(--color-text-muted)]">{s.value}</span>
                    <ChevronRightIcon size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                </div>
                {i < settings.length - 1 && (
                  <div className="ml-[52px] h-px bg-[var(--color-border-light)]" />
                )}
              </div>
            );
          })}
        </div>

        {/* 微信推送提醒（Server酱 SendKey）*/}
        <div className="rounded-[16px] bg-white border border-[var(--color-border)] shadow-card overflow-hidden p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[var(--color-primary-blue-bg)] flex items-center justify-center">
              <InfoIcon size={16} className="text-[var(--color-primary)]" />
            </div>
            <span className="text-[14px] text-[var(--color-text-primary)]">微信推送提醒</span>
            <span className="text-[11px] text-[var(--color-text-muted)] ml-auto">
              {user?.sendkey ? "已开启" : "未开启"}
            </span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            填 Server酱 SendKey 后，再平衡提醒会推送到你的微信
          </p>
          <input
            type="text"
            value={sendkeyDraft}
            onChange={(e) => {
              setSendkeyDraft(e.target.value);
              setSendkeyTouched(true);
            }}
            placeholder="SCT 开头的 SendKey"
            className="w-full h-[44px] rounded-[10px] border border-[var(--color-border)] px-3 text-[13px] text-[var(--color-text-primary)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)]"
          />
          <button
            type="button"
            onClick={handleSaveSendkey}
            disabled={savingSendkey}
            className="w-full h-[44px] rounded-[10px] bg-[var(--color-primary)] text-white text-[14px] font-semibold disabled:opacity-60"
          >
            {savingSendkey ? "保存中..." : "保存"}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full h-[50px] rounded-[14px] bg-white border border-[var(--color-border)] text-[15px] font-semibold text-[var(--color-red)] flex items-center justify-center shadow-card disabled:opacity-60"
        >
          {loggingOut ? "退出中..." : "退出登录"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

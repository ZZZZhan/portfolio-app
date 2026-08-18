import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { ChevronRightIcon, ShieldIcon, ScaleIcon, ClockIcon, InfoIcon } from "@/components/Icons";
import { portfolioData, profileData } from "@/lib/mockData";

const iconMap: Record<string, typeof ShieldIcon> = {
  shield: ShieldIcon,
  scale: ScaleIcon,
  clock: ClockIcon,
  info: InfoIcon,
};

export default function ProfilePage() {
  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-[14px] overflow-y-auto">
        {/* User card */}
        <div className="rounded-[16px] bg-white px-5 py-5 flex items-center gap-4 border border-[var(--color-border)] shadow-card">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
            <span className="text-white text-[20px] font-bold">明</span>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[16px] font-medium text-[var(--color-text-primary)]">{profileData.name}</span>
            <span className="text-[13px] text-[var(--color-text-muted)]">{profileData.email}</span>
          </div>
          <ChevronRightIcon size={20} className="text-[var(--color-text-muted)]" />
        </div>

        {/* Asset stats card */}
        <div className="rounded-[16px] bg-[var(--color-primary)] px-4 py-4 flex shadow-primary-lg">
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[12px] text-[#C9D4F0]">总资产</span>
            <span className="text-[20px] font-bold text-white font-mono">{profileData.totalAssets}</span>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[12px] text-[#C9D4F0]">累计收益</span>
            <span className="text-[20px] font-bold text-white font-mono">{profileData.cumulativeProfit}</span>
            <span className="text-[11px] text-white/70 font-mono">{profileData.cumulativeRate}</span>
          </div>
        </div>

        {/* Settings list */}
        <div className="rounded-[16px] bg-white border border-[var(--color-border)] shadow-card overflow-hidden">
          {profileData.settings.map((s, i) => {
            const Icon = iconMap[s.icon] || ShieldIcon;
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
                {i < profileData.settings.length - 1 && (
                  <div className="ml-[52px] h-px bg-[var(--color-border-light)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

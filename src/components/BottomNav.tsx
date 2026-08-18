"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PortfolioIcon, MeIcon } from "./Icons";

const tabs = [
  { href: "/", label: "总览", icon: HomeIcon },
  { href: "/portfolio", label: "组合", icon: PortfolioIcon },
  { href: "/profile", label: "我的", icon: MeIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center px-[21px] pt-3 pb-[21px] shrink-0 bg-[var(--color-bg)]">
      <div className="flex w-full max-w-[348px] h-[62px] items-center justify-center rounded-full bg-white border border-[var(--color-border)] shadow-nav">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 h-[54px] rounded-[26px] transition-colors ${
                active ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-muted)]"
              }`}
            >
              <Icon size={active ? 18 : 24} className={active ? "" : ""} />
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

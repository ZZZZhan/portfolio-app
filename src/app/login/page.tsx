"use client";

import { useState } from "react";
import Link from "next/link";
import { MailIcon, LockIcon, EyeIcon } from "@/components/Icons";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-10 gap-7">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-[18px] bg-[var(--color-primary)] flex items-center justify-center shadow-primary">
            <span className="text-white font-bold text-[30px] font-mono">W</span>
          </div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)]">WorkBuddy 投管</h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">智能投资组合管理</p>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-[14px]">
          {/* Email input */}
          <div className="w-full h-[50px] flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white border border-[var(--color-border)]">
            <div className="text-[var(--color-text-muted)] shrink-0">
              <MailIcon size={18} />
            </div>
            <input
              type="email"
              placeholder="邮箱"
              className="flex-1 text-[14px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          {/* Password input */}
          <div className="w-full h-[50px] flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white border border-[var(--color-border)]">
            <div className="text-[var(--color-text-muted)] shrink-0">
              <LockIcon size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="密码"
              className="flex-1 text-[14px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[var(--color-text-muted)] shrink-0"
            >
              <EyeIcon size={18} />
            </button>
          </div>

          {/* Login button */}
          <Link href="/" className="w-full">
            <button className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center">
              登录
            </button>
          </Link>
        </div>

        {/* Other actions */}
        <div className="flex items-center gap-5">
          <button className="text-[13px] font-medium text-[var(--color-primary)]">忘记密码？</button>
          <div className="w-1 h-1 rounded-full bg-[#D0D0CD]" />
          <Link href="/register" className="text-[13px] font-medium text-[var(--color-primary)]">
            注册账号
          </Link>
        </div>
      </div>
    </div>
  );
}

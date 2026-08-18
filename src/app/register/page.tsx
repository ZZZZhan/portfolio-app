"use client";

import { useState } from "react";
import Link from "next/link";
import { MailIcon, LockIcon, EyeIcon, UserIcon, CheckIcon } from "@/components/Icons";

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [agreed, setAgreed] = useState(true);

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-10 gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">创建账号</h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">开始您的智能投资之旅</p>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-3">
          {/* Nickname */}
          <div className="w-full h-12 flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white border border-[var(--color-border)]">
            <div className="text-[var(--color-text-muted)] shrink-0">
              <UserIcon size={18} />
            </div>
            <input
              type="text"
              placeholder="昵称"
              className="flex-1 text-[14px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          {/* Email */}
          <div className="w-full h-12 flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white border border-[var(--color-border)]">
            <div className="text-[var(--color-text-muted)] shrink-0">
              <MailIcon size={18} />
            </div>
            <input
              type="email"
              placeholder="邮箱"
              className="flex-1 text-[14px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          {/* Password */}
          <div className="w-full h-12 flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white border border-[var(--color-border)]">
            <div className="text-[var(--color-text-muted)] shrink-0">
              <LockIcon size={18} />
            </div>
            <input
              type={showPwd ? "text" : "password"}
              placeholder="设置密码（6-20位）"
              className="flex-1 text-[14px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="text-[var(--color-text-muted)] shrink-0"
            >
              <EyeIcon size={18} />
            </button>
          </div>

          {/* Confirm Password */}
          <div className="w-full h-12 flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white border border-[var(--color-border)]">
            <div className="text-[var(--color-text-muted)] shrink-0">
              <LockIcon size={18} />
            </div>
            <input
              type={showConfirmPwd ? "text" : "password"}
              placeholder="确认密码"
              className="flex-1 text-[14px] outline-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              className="text-[var(--color-text-muted)] shrink-0"
            >
              <EyeIcon size={18} />
            </button>
          </div>
        </div>

        {/* Agreement */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 transition-colors ${
              agreed ? "bg-[var(--color-primary)]" : "bg-white border border-[var(--color-border)]"
            }`}
          >
            {agreed && <CheckIcon size={10} className="text-white" />}
          </button>
          <span className="text-[12px] text-[#6B7280]">
            同意<a className="text-[var(--color-primary)]">《用户协议》</a>及<a className="text-[var(--color-primary)]">《隐私政策》</a>
          </span>
        </div>

        {/* Register button */}
        <Link href="/" className="w-full">
          <button className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center">
            注册
          </button>
        </Link>

        {/* Go to login */}
        <Link href="/login" className="text-[13px] font-medium text-[var(--color-primary)]">
          已有账号？去登录
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailIcon, LockIcon, EyeIcon } from "@/components/Icons";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "登录失败");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-10 gap-7">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-[18px] bg-[var(--color-primary)] flex items-center justify-center shadow-primary">
            <span className="text-white font-bold text-[30px] font-mono">I</span>
          </div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)]">InvestBuddy</h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">智能投资组合管理</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[14px]">
          {/* Email input */}
          <div className="w-full h-[50px] flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white border border-[var(--color-border)]">
            <div className="text-[var(--color-text-muted)] shrink-0">
              <MailIcon size={18} />
            </div>
            <input
              type="email"
              required
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {error && (
            <p className="text-[12px] text-[var(--color-red)]">{error}</p>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] rounded-[14px] bg-[var(--color-primary)] text-white text-[15px] font-semibold shadow-primary flex items-center justify-center disabled:opacity-60"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

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

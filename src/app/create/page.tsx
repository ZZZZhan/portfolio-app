'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/Icons';
import PortfolioForm from '@/components/PortfolioForm';
import { createPortfolio } from '@/lib/api';

export default function CreatePortfolioPage() {
  const router = useRouter();

  return (
    <div className="phone-frame">
      <div className="flex-1 flex flex-col px-5 pt-5 pb-6 gap-4 overflow-y-auto">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ChevronLeftIcon
              size={20}
              className="text-[var(--color-text-primary)]"
            />
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
              返回
            </span>
          </Link>
          <span className="text-[14px] font-semibold text-[var(--color-text-muted)]">
            完成
          </span>
        </div>

        <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">
          创建自定义组合
        </h1>

        <PortfolioForm
          initial={{ name: '', targetTotalAmount: '', holdings: [] }}
          submitLabel="创建组合"
          submittingLabel="创建中…"
          errorPrefix="创建失败"
          onSubmit={async (payload) => {
            await createPortfolio(payload);
            router.push('/');
          }}
        />
      </div>
    </div>
  );
}

import Image from 'next/image';
import LoadingSpinner from '@/components/loading-spinner';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-10 bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-700 dark:text-slate-200 z-[999]">
      <Image src="/logo.svg" alt="logo" width={300} height={76.77} className="dark:invert" />
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={50} />
        <p className="text-sm tracking-wide opacity-70">Loading framework & data…</p>
      </div>
    </div>
  );
}

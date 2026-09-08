import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#e9e6e4] bg-white text-[#74716f]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-5 pb-28 pt-9 md:flex-row md:items-center md:justify-between md:px-8 md:py-10 lg:px-10">
        <div className="flex items-start gap-5 md:gap-7">
          <Link href="/" aria-label="듀잇 홈" className="mt-0.5 flex shrink-0 items-center gap-1 text-xl font-bold tracking-tight text-[#242323] no-underline">
            <Image src="/app-icon-transparent.png" alt="" width={30} height={30} />듀잇
          </Link>
          <div className="text-[11px] leading-6 sm:text-xs">
            <p>성장을 포기하지 않는 당신을 응원합니다.</p>
            <p>듀잇은 주최자가 아니며 참가·환불은 주최 측 정책을 따릅니다.</p>
            <p className="mt-1">직업정보제공사업 신고번호: J1205020260001 (서울북부 제2026-1호)</p>
          </div>
        </div>
        <nav aria-label="서비스 안내" className="flex flex-wrap gap-x-5 gap-y-3 text-xs">
          <Link href="https://status.dutyit.net/" className="no-underline transition hover:text-brand">서비스 상태</Link>
          <Link href="/submit-event" className="no-underline transition hover:text-brand" prefetch={false}>행사 제보하기</Link>
          <a href="mailto:contact@dutyit.net" className="no-underline transition hover:text-brand">문의하기</a>
        </nav>
      </div>
    </footer>
  );
}

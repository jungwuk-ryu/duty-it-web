import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    return (<footer className="border-t border-line bg-surface text-muted">
        <div className="mx-auto max-w-[1440px] px-5 py-10 pb-32 sm:px-8 md:py-12 lg:px-11">
            <div className="flex flex-col justify-between gap-9 md:flex-row md:items-start">
                <div className="max-w-md">
                    <Link href="/" className="inline-flex items-center gap-2" aria-label="듀잇 홈으로 이동">
                        <Image src="/app-icon.png" alt="" width={24} height={24} className="size-6 rounded-[7px]" />
                        <span className="font-extrabold tracking-[-0.05em] text-brand">듀잇 · DuIt</span>
                    </Link>
                    <p className="mt-4 text-sm leading-6">성장을 포기하지 않는 당신의 다음 기회를 듀잇이 응원해요.</p>
                    <p className="mt-1 text-sm leading-6">듀잇은 주최자가 아니며, 참가와 환불은 주최 측 정책을 따라요.</p>
                    <p className="mt-3 text-xs leading-5 text-muted/80">
                        <span className="font-semibold text-ink/80">직업정보제공사업 신고번호</span>: J1205020260001 <span>(서울북부 제2026-1호)</span>
                    </p>
                </div>

                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                    <li>
                        <Link href="https://status.dutyit.net/" className="transition hover:text-brand">
                            상태
                        </Link>
                    </li>
                    <li>
                        <Link href="/submit-event" className="transition hover:text-brand" prefetch={false}>
                            행사 제보
                        </Link>
                    </li>
                    <li>
                        <Link href="mailto:contact@dutyit.net" className="transition hover:text-brand">
                            문의하기
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    </footer>);
};

import Link from "next/link";

export default function Footer() {
    return (<footer className="w-full border-t border-gray-200 bg-white text-gray-600">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-32 md:py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="text-sm leading-6">
                    <p><span className="font-semibold text-brand">듀잇</span>이 성장을 포기하지 않는 당신을 응원합니다.</p>
                    <p>듀잇은 주최자가 아니며, 참가/환불은 주최 측 정책을 따릅니다.</p>
                </div>

                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <li>
                        <Link href="https://status.dutyit.net/" className="hover:text-brand transition">
                            상태
                        </Link>
                    </li>
                    <li>
                        <Link href="/submit-event" className="hover:text-brand transition" prefetch={false}>
                            행사 제보하기
                        </Link>
                    </li>
                    <li>
                        <Link href="mailto:contact@dutyit.net" className="hover:text-brand transition">
                            문의하기
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
                <dl className="flex flex-col gap-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm md:flex-row md:items-center md:gap-3">
                    <dt className="font-semibold text-gray-800">직업정보제공사업 신고번호</dt>
                    <dd className="font-medium text-brand">J1205020260001 <span className="text-gray-500">(서울북부 제2026-1호)</span></dd>
                </dl>
            </div>
        </div>
    </footer>);
};

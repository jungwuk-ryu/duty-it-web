import Link from "next/link";

export default function Footer() {
    return (<footer className="w-full border-t border-gray-200 bg-white text-gray-600">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-10">
            <span className="text-sm">
                <p><span className="font-semibold text-brand">듀잇</span>이 성장을 포기하지 않는 당신을 응원합니다.</p>
                <p>듀잇은 주최자가 아니며, 참가/환불은 주최 측 정책을 따릅니다.</p>
            </span>

            <ul className="flex gap-4 text-sm">
                <li>
                    <Link href="https://status.dutyit.net/" className="hover:text-brand transition">
                        상태
                    </Link>
                </li>
                <li>
                    <Link href="/submit-event" className="hover:text-brand transition">
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
    </footer>);
};
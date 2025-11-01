import Link from "next/link";

export default function Footer() {
    return (<footer className="w-full border-t border-gray-200 bg-white text-gray-600">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-10">
            <p className="text-sm">
                © {new Date().getFullYear()} <span className="font-semibold text-brand">듀잇</span>. All rights reserved.
            </p>

            <ul className="flex gap-4 text-sm">
                <li>
                    <Link href="/submit-event" className="hover:text-brand transition">
                        행사 제보하기
                    </Link>
                </li>
                <li>
                    <Link href="mailto:vojougae35@gmail.com" className="hover:text-brand transition">
                        문의하기
                    </Link>
                </li>
            </ul>
        </div>
    </footer>);
};
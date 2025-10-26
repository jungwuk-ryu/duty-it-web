import Link from "next/link";
import PrimaryButton from "./ui/PrimaryButton";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full bg-[#FFFFFF00] backdrop-blur-2xl shadow-md z-50">
            <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
                <div className="text-xl text-brand font-bold">
                    <Link href="/">듀잇 - DuIt!</Link>
                </div>
                <ul className="flex items-center gap-6 text-gray-700">
                    <li><Link href="/events">행사 목록</Link></li>
                    <li><Link href="#download"><PrimaryButton>앱 다운로드</PrimaryButton></Link></li>
                </ul>
            </nav>
        </header>
    );
}
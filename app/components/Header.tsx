"use client";

import Link from "next/link";
import PrimaryButton from "./ui/PrimaryButton";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full bg-[#FFFFFF00] backdrop-blur-2xl shadow-md z-50 drop-shadow-[0_4px_3px_rgba(0,0,0,0.1)]">
            <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
                <h1 className="text-xl text-brand font-bold">
                    <Link href="/">듀잇 - DuIt!</Link>
                </h1>
                <ul className="flex items-center gap-6 text-gray-700">
                    <li><Link href="/events">행사 목록</Link></li>
                    <li><Link href="#download"><PrimaryButton>앱 다운로드</PrimaryButton></Link></li>
                </ul>
            </nav>
        </header>
    );
}
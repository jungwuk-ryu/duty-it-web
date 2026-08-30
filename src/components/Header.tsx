"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/events", label: "행사 목록" },
    { href: "/submit-event", label: "행사 제보" },
] as const;

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-surface/88 backdrop-blur-xl">
            <nav className="mx-auto flex h-[73px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-11">
                <Link href="/" className="group flex items-center gap-2.5" aria-label="듀잇 홈으로 이동">
                    <Image
                        src="/app-icon.png"
                        alt=""
                        width={30}
                        height={30}
                        className="size-[30px] rounded-[9px] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
                    />
                    <span className="text-[18px] font-extrabold tracking-[-0.06em] text-brand">듀잇 · DuIt</span>
                </Link>
                <ul className="flex items-center gap-6 text-[14px] font-semibold tracking-[-0.03em] sm:gap-9">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href === "/events" && pathname.startsWith("/visitEvent"));

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    prefetch={item.href === "/submit-event" ? false : undefined}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`relative py-7 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${isActive ? "text-brand" : "text-ink hover:text-brand"}`}
                                >
                                    {item.label}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-brand transition-transform ${isActive ? "scale-x-100" : "scale-x-0"}`}
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </header>
    );
}

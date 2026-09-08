"use client";

import { Button, buttonVariants } from "@/src/components/ui/button";
import { MenuToggleIcon } from "@/src/components/ui/menu-toggle-icon";
import { useScroll } from "@/src/components/ui/use-scroll";
import { cn } from "@/src/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AccountMenu from "../AccountMenu";

const links = [
    { label: "행사 목록", href: "/events" },
    { label: "채용 공고", href: "/jobs" },
    { label: "북마크", href: "/bookmarks" },
] as const;

export function Header() {
    const [open, setOpen] = useState(false);
    const scrolled = useScroll(24);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const desktop = window.matchMedia("(min-width: 768px)");
        const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setOpen(false);
            menuButtonRef.current?.focus();
        };
        desktop.addEventListener("change", closeOnDesktop);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            desktop.removeEventListener("change", closeOnDesktop);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    const closeMenu = () => setOpen(false);

    return (
        <header
            className={cn(
                "sticky top-0 z-50 mx-auto w-full border border-transparent bg-white/90 backdrop-blur-md transition-[width,max-width,top,border-radius,background-color,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:max-w-[calc(100%-0px)] md:rounded-none",
                scrolled && !open && "top-3 w-[calc(100%-1.5rem)] rounded-2xl border border-white/80 bg-white/80 shadow-xl shadow-slate-950/[0.08] backdrop-blur-xl md:top-4 md:w-[calc(100%-2rem)] md:max-w-5xl md:rounded-3xl",
                open && "border-gray-200/80 bg-white/90",
            )}
        >
            <nav className="relative z-10 mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-5 transition-[padding] duration-500 md:h-20 md:px-8 lg:px-10" aria-label="주요 메뉴">
                <Link href="/" className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-[#242323]" onClick={closeMenu}>
                    <Image src="/app-icon-transparent.png" alt="" width={36} height={36} className="size-9" priority />
                    듀잇
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className={buttonVariants({ variant: "ghost", className: "text-gray-700" })}>
                            {link.label}
                        </Link>
                    ))}
                    <AccountMenu />
                    <Link href="/#download" className={buttonVariants({ className: "ml-3 h-10 rounded-xl bg-brand px-5 text-white hover:bg-brand/90" })}>
                        앱 다운로드
                    </Link>
                </div>

                <Button
                    ref={menuButtonRef}
                    type="button"
                    size="icon"
                    variant="outline"
                    className="border-gray-300 bg-white text-gray-800 md:hidden"
                    aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
                    aria-expanded={open}
                    aria-controls="mobile-navigation"
                    onClick={() => setOpen((current) => !current)}
                >
                    <MenuToggleIcon open={open} className="size-5" strokeWidth={2} aria-hidden="true" />
                </Button>
            </nav>

            <div
                id="mobile-navigation"
                className={cn("absolute inset-x-0 top-16 z-0 h-[calc(100dvh-4rem)] overflow-y-auto border-y border-gray-200 bg-white md:hidden", open ? "block" : "hidden")}
                style={{ backgroundColor: "#FFFFFF" }}
            >
                <div className="flex h-full flex-col justify-between gap-8 p-4">
                    <div className="grid gap-2">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={buttonVariants({ variant: "ghost", className: "h-12 justify-start text-base text-gray-800" })}
                                onClick={closeMenu}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <AccountMenu onNavigate={closeMenu} />
                    </div>
                    <Link
                        href="/#download"
                        className={buttonVariants({ className: "h-12 w-full bg-brand text-base text-white hover:bg-brand/90" })}
                        onClick={closeMenu}
                    >
                        앱 다운로드
                    </Link>
                </div>
            </div>
        </header>
    );
}

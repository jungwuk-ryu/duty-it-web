"use client";

import { Button, buttonVariants } from "@/src/components/ui/button";
import { AnimatedThemeToggle } from "@/src/components/ui/animated-theme-toggle";
import { MenuToggleIcon } from "@/src/components/ui/menu-toggle-icon";
import { useScroll } from "@/src/components/ui/use-scroll";
import { cn } from "@/src/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
    { label: "행사 목록", href: "/events" },
    { label: "채용 공고", href: "/jobs" },
    { label: "로그인", href: "/login" },
] as const;

export function Header() {
    const [open, setOpen] = useState(false);
    const scrolled = useScroll(24);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const closeMenu = () => setOpen(false);

    return (
        <header
            className={cn(
                "sticky top-0 z-50 mx-auto w-full border-b border-transparent bg-background/90 backdrop-blur-md transition-[width,max-width,top,border-radius,background-color,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:max-w-[calc(100%-0px)] md:rounded-none",
                scrolled && !open && "top-3 w-[calc(100%-1.5rem)] rounded-2xl border border-border/80 bg-background/80 shadow-xl shadow-slate-950/[0.08] backdrop-blur-xl md:top-4 md:w-full md:max-w-5xl md:rounded-3xl",
                open && "border-border/80 bg-background/90",
            )}
        >
            <nav className={cn("relative z-10 flex h-16 w-full items-center justify-between px-5 transition-all md:px-8 lg:px-10", scrolled && "lg:px-8")} aria-label="주요 메뉴">
                <Link href="/" className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-brand" onClick={closeMenu}>
                    <Image src="/app-icon-transparent.png" alt="" width={36} height={36} className="size-9" priority />
                    듀잇
                </Link>

                <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-1 md:flex">
                        {links.map((link) => (
                            <Link key={link.href} href={link.href} className={buttonVariants({ variant: "ghost" })}>
                                {link.label}
                            </Link>
                        ))}
                        <Link href="/#download" className={buttonVariants({ className: "ml-2" })}>
                            앱 다운로드
                        </Link>
                    </div>

                    <AnimatedThemeToggle />
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-10 md:hidden"
                        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
                        aria-expanded={open}
                        onClick={() => setOpen((current) => !current)}
                    >
                        <MenuToggleIcon open={open} className="size-5" strokeWidth={2} aria-hidden="true" />
                    </Button>
                </div>
            </nav>

            <div
                className={cn("absolute inset-x-0 top-16 z-0 h-[calc(100dvh-4rem)] overflow-y-auto border-y border-border bg-background md:hidden", open ? "block" : "hidden")}
            >
                <div className="flex h-full flex-col justify-between gap-8 p-4">
                    <div className="grid gap-2">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={buttonVariants({ variant: "ghost", className: "h-12 justify-start text-base text-foreground" })}
                                onClick={closeMenu}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <Link
                        href="/#download"
                        className={buttonVariants({ className: "h-12 w-full bg-primary text-base text-white hover:bg-primary/90" })}
                        onClick={closeMenu}
                    >
                        앱 다운로드
                    </Link>
                </div>
            </div>
        </header>
    );
}

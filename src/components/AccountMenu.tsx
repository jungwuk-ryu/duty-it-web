"use client";
import { forwardRef, lazy, Suspense, type ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { checkSession, useAuth } from "@/src/lib/auth/client";
import { cn } from "@/src/lib/utils";

// Only signed-in visitors need the dropdown, so its code stays out of every other first load.
const SignedInAccountMenu = lazy(() => import("./SignedInAccountMenu"));

type AccountButtonProps = ComponentPropsWithoutRef<typeof Button> & { nickname: string };
export const AccountButton = forwardRef<HTMLButtonElement, AccountButtonProps>(function AccountButton({ nickname, className, ...props }, ref) {
    return <Button ref={ref} variant="ghost" className={cn("gap-2", className)} aria-label="내 계정 메뉴" {...props}>
        <UserRound size={16} data-icon="inline-start" aria-hidden />
        <span className="max-w-32 truncate">{nickname || "내 계정"}</span>
    </Button>;
});

export default function AccountMenu({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
    const { status, user } = useAuth();
    if (status === "error") return <Button variant="ghost" className={className} onClick={() => void checkSession()}>로그인 다시 확인</Button>;
    if (!user) return <Button variant="ghost" className={className} asChild><Link href="/login" onClick={onNavigate}>로그인</Link></Button>;
    return <Suspense fallback={<div className="relative"><AccountButton nickname={user.nickname} className={className} disabled /></div>}>
        <SignedInAccountMenu nickname={user.nickname} onNavigate={onNavigate} className={className} />
    </Suspense>;
}

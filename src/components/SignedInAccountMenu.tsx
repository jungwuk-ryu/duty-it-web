"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell, Bookmark, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { signOutSession } from "@/src/lib/auth/client";
import { AccountButton } from "./AccountMenu";

export default function SignedInAccountMenu({ nickname, onNavigate, className }: { nickname: string; onNavigate?: () => void; className?: string }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function logout() {
        if (pending) return;
        setPending(true); setError(null);
        try { await signOutSession(); onNavigate?.(); }
        catch { setError("로그아웃하지 못했어요. 다시 시도해 주세요."); }
        finally { setPending(false); }
    }

    return <div className="relative">
        <DropdownMenu>
            <DropdownMenuTrigger asChild><AccountButton nickname={nickname} className={className} disabled={pending} /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>로그인되어 있어요</DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild><Link href="/bookmarks" onClick={onNavigate}><Bookmark size={16} aria-hidden />내 북마크</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/notifications" onClick={onNavigate}><Bell size={16} aria-hidden />내 알림과 행사 구독</Link></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem disabled={pending} onSelect={() => void logout()}><LogOut size={16} aria-hidden />로그아웃</DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
        {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>;
}

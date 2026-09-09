"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, LogOut, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { checkSession, signOutSession, useAuth } from "@/src/lib/auth/client";

export default function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
    const { status, user } = useAuth();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    if (status === "loading") return <span className="px-4 text-sm text-muted-foreground" role="status">로그인 확인 중</span>;
    if (status === "error") return <Button variant="ghost" onClick={() => void checkSession()}>로그인 다시 확인</Button>;
    if (!user) return <Button variant="ghost" asChild><Link href="/login" onClick={onNavigate}>로그인</Link></Button>;

    async function logout() {
        if (pending) return;
        setPending(true); setError(null);
        try { await signOutSession(); onNavigate?.(); }
        catch { setError("로그아웃하지 못했어요. 다시 시도해 주세요."); }
        finally { setPending(false); }
    }

    return <div className="relative">
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="gap-2" disabled={pending} aria-label="내 계정 메뉴">
                <UserRound size={16} data-icon="inline-start" aria-hidden />
                <span className="max-w-32 truncate">{user.nickname || "내 계정"}</span>
            </Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>로그인되어 있어요</DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild><Link href="/bookmarks" onClick={onNavigate}><Bookmark size={16} aria-hidden />내 북마크</Link></DropdownMenuItem>
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

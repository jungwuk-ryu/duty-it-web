"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, UserX } from "lucide-react";
import { checkSession, useAuth, withdrawAccount } from "@/src/lib/auth/client";
import { OPERATOR_EMAIL, PRIVACY_POLICY_PATH } from "@/src/lib/legal";
import { Button } from "./ui/button";

const REDIRECT_DELAY = 3_000;
// Signing out remounts account-bound UI, so the result must outlive this component instance.
let withdrawn = false;

export default function WithdrawAccountForm() {
    const auth = useAuth();
    const router = useRouter();
    const confirmId = useId();
    const [confirmed, setConfirmed] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(() => withdrawn);

    useEffect(() => {
        if (!done) return;
        withdrawn = false;
        const timer = window.setTimeout(() => router.replace("/"), REDIRECT_DELAY);
        return () => window.clearTimeout(timer);
    }, [done, router]);

    async function withdraw() {
        if (pending || !confirmed) return;
        setPending(true); setError(null);
        try {
            await withdrawAccount(() => { withdrawn = true; });
            setDone(true);
        } catch (caught) {
            setError(caught instanceof Error && caught.name === "SessionRequestError" ? caught.message : "회원 탈퇴를 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        } finally { setPending(false); }
    }

    return <div className="mx-auto min-h-[65vh] max-w-xl break-keep px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-danger-surface text-destructive"><UserX size={24} aria-hidden /></span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">회원 탈퇴</h1>
        </div>
        {done ? <div role="status" className="rounded-2xl border border-border bg-background p-6">
            <p className="font-bold text-foreground">탈퇴가 완료되었어요.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">그동안 듀잇을 이용해 주셔서 감사합니다. 잠시 후 홈으로 이동해요.</p>
            <Button asChild variant="outline" className="mt-5"><Link href="/" replace>홈으로 가기</Link></Button>
        </div> : auth.user ? <section aria-labelledby={`${confirmId}-title`} className="rounded-2xl border border-border bg-background p-6">
            <h2 id={`${confirmId}-title`} className="font-bold text-foreground">탈퇴하기 전에 확인해 주세요</h2>
            <p className="mt-3 leading-7 text-foreground">탈퇴하면 회원 정보, 북마크, 알림 설정과 구독이 삭제되며 복구할 수 없어요. 로그인 인증 계정도 함께 삭제돼요.</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                <li>앱과 웹은 같은 계정을 사용하므로 앱에서도 함께 탈퇴돼요.</li>
                <li>같은 Google·Apple 계정으로 다시 로그인하면 새 회원으로 가입돼요.</li>
                <li>삭제하는 정보와 보관 기간은 <Link href={PRIVACY_POLICY_PATH} className="font-semibold text-brand underline underline-offset-4">개인정보 처리방침</Link>에서 확인할 수 있어요.</li>
            </ul>
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-input px-4 py-3 text-sm leading-6 text-foreground">
                <input type="checkbox" checked={confirmed} disabled={pending} onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1 size-4 shrink-0 accent-[var(--duit-destructive)]" />
                <span>위 내용을 확인했으며, 회원 탈퇴에 동의합니다.</span>
            </label>
            <Button variant="destructive" className="mt-5 h-11 w-full" disabled={!confirmed || pending} aria-busy={pending} onClick={() => void withdraw()}>
                {pending && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
                {pending ? "탈퇴 처리 중" : "회원 탈퇴하기"}
            </Button>
            {error && <p role="alert" className="mt-3 text-sm leading-6 text-destructive">{error} 문제가 계속되면 <a href={`mailto:${OPERATOR_EMAIL}`} className="underline underline-offset-4">{OPERATOR_EMAIL}</a>으로 알려 주세요.</p>}
        </section> : auth.status === "error" ? <div role="alert" className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-background p-6">
            <p>{auth.message}</p>
            <Button variant="outline" onClick={() => void checkSession()}>다시 시도</Button>
        </div> : <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-background p-6">
            <p className="leading-7 text-foreground">회원 탈퇴는 로그인한 뒤 할 수 있어요.</p>
            <Button asChild><Link href={`/login?next=${encodeURIComponent("/account/withdraw")}`}>로그인하기</Link></Button>
        </div>}
    </div>;
}

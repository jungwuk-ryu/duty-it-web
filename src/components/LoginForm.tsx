"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { inMemoryPersistence, setPersistence, signInWithPopup, signOut } from "firebase/auth";
import { safeReturnTo, signInSession, useAuth } from "@/src/lib/auth/client";

import { Button } from "@/src/components/ui/button";
import {
    appleAuthProvider,
    firebaseAuth,
    googleAuthProvider,
} from "@/src/lib/firebase/client";
import { cn } from "@/src/lib/utils";

type Provider = "google" | "apple";

type AuthState =
    | { kind: "idle" }
    | { kind: "loading"; provider: Provider }
    | { kind: "success"; nickname: string; isNewUser: boolean }
    | { kind: "error"; message: string };

const BACKGROUND_DOTS = [
    [5, 13, "brand"], [10, 31, "slate"], [7, 63, "brand"], [13, 78, "slate"], [18, 20, "slate"],
    [20, 48, "brand"], [24, 87, "slate"], [29, 10, "brand"], [31, 35, "slate"], [34, 70, "brand"],
    [38, 92, "slate"], [43, 18, "brand"], [48, 6, "slate"], [52, 84, "brand"], [57, 27, "slate"],
    [61, 57, "brand"], [65, 12, "slate"], [68, 75, "brand"], [73, 40, "slate"], [77, 90, "brand"],
    [82, 23, "brand"], [86, 56, "slate"], [91, 14, "brand"], [94, 44, "slate"], [97, 76, "brand"],
] as const;

export default function LoginForm() {
    const [authState, setAuthState] = useState<AuthState>({ kind: "idle" });
    const isLoading = authState.kind === "loading";
    const session = useAuth();

    async function handleSignIn(provider: Provider) {
        if (isLoading) return;

        setAuthState({ kind: "loading", provider });

        try {
            await setPersistence(firebaseAuth, inMemoryPersistence);
            const credential = await signInWithPopup(
                firebaseAuth,
                provider === "google" ? googleAuthProvider : appleAuthProvider,
            );
            const body = await signInSession(credential.user.refreshToken);

            setAuthState({
                kind: "success",
                nickname: body.user.nickname?.trim() ?? "",
                isNewUser: body.isNewUser,
            });
        } catch (error) {
            setAuthState({ kind: "error", message: getLoginErrorMessage(error) });
        } finally {
            await signOut(firebaseAuth).catch(() => undefined);
        }
    }

    return (
        <div className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-white">
            <LoginBackdrop />
            <section className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[30rem] items-center px-5 py-16 sm:px-8 sm:py-24">
                <div className="w-full -translate-y-4 sm:-translate-y-7">
                    <div className="mx-auto flex max-w-[25rem] flex-col items-center text-center">
                        <Image
                            src="/app-icon-transparent.png"
                            alt="듀잇"
                            width={64}
                            height={64}
                            className="mb-7 size-14 object-contain sm:size-16"
                            priority
                        />

                        {authState.kind === "success" || session.user ? (
                            <LoginSuccess nickname={authState.kind === "success" ? authState.nickname : session.user?.nickname ?? ""} isNewUser={authState.kind === "success" && authState.isNewUser} />
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-[2.25rem]">
                                    듀잇에 로그인하세요
                                </h1>
                                <p className="mt-3 text-[15px] leading-6 text-slate-500 sm:text-base">
                                    관심 있는 간호 행사와 채용 소식을 놓치지 마세요.
                                </p>

                                <div className="mt-9 flex w-full flex-col gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 w-full rounded-xl border-gray-300 bg-white text-[15px] font-semibold text-slate-900 shadow-sm shadow-slate-900/5 hover:bg-slate-50"
                                        disabled={isLoading}
                                        onClick={() => void handleSignIn("google")}
                                    >
                                        {isLoading && authState.provider === "google" ? (
                                            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                                        ) : (
                                            <GoogleMark className="size-5" aria-hidden />
                                        )}
                                        Google로 계속하기
                                    </Button>
                                    <Button
                                        type="button"
                                        className="h-12 w-full rounded-xl bg-black text-[15px] font-semibold text-white shadow-sm shadow-black/15 hover:bg-black/85"
                                        disabled={isLoading}
                                        onClick={() => void handleSignIn("apple")}
                                    >
                                        {isLoading && authState.provider === "apple" ? (
                                            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                                        ) : (
                                            <AppleMark className="size-5" aria-hidden />
                                        )}
                                        Apple로 계속하기
                                    </Button>
                                </div>

                                {authState.kind === "error" && (
                                    <p className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm leading-6 text-red-700" role="alert">
                                        {authState.message}
                                    </p>
                                )}

                                <Link
                                    href="/"
                                    className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                                >
                                    <ArrowLeft className="size-4" aria-hidden />
                                    홈으로 돌아가기
                                </Link>
                                <p className="mt-7 text-xs leading-5 text-slate-400">
                                    계속하면 듀잇의 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function LoginSuccess({ nickname, isNewUser }: { nickname: string; isNewUser: boolean }) {
    const greeting = nickname ? `${nickname}님, ${isNewUser ? "환영해요" : "다시 만나 반가워요"}` : "로그인이 완료되었어요";

    return (
        <div className="flex w-full flex-col items-center">
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-[2.25rem]">{greeting}</h1>
            <p className="mt-3 text-[15px] leading-6 text-slate-500 sm:text-base">
                듀잇에서 나에게 맞는 행사와 채용 정보를 찾아보세요.
            </p>
            <Button asChild className="mt-9 h-12 w-full rounded-xl px-6 text-[15px] font-semibold">
                <Link href={typeof window === "undefined" ? "/events" : safeReturnTo(new URLSearchParams(window.location.search).get("next"))}>계속 둘러보기</Link>
            </Button>
            <Link href="/bookmarks" className="mt-4 text-sm font-semibold text-brand">내 북마크 보기</Link>
        </div>
    );
}

function LoginBackdrop() {
    return (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
            {BACKGROUND_DOTS.map(([top, left, tone], index) => (
                <span
                    key={`${top}-${left}`}
                    className={cn(
                        "absolute rounded-full",
                        tone === "brand" ? "size-1 bg-brand/30" : "size-0.5 bg-slate-300/70",
                        index % 3 === 0 && "hidden sm:block",
                    )}
                    style={{ top: `${top}%`, left: `${left}%` }}
                />
            ))}
        </div>
    );
}

function GoogleMark(props: ComponentProps<"svg">) {
    return (
        <svg viewBox="0 0 24 24" {...props}>
            <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.7 2.9-4.2 2.9-7.29Z" />
            <path fill="#34A853" d="M12 21.72c2.63 0 4.84-.87 6.45-2.36l-3.15-2.52c-.87.59-1.98.94-3.3.94-2.54 0-4.7-1.72-5.47-4.02H3.28v2.6A9.74 9.74 0 0 0 12 21.72Z" />
            <path fill="#FBBC05" d="M6.53 13.76a5.85 5.85 0 0 1 0-3.52v-2.6H3.28a9.73 9.73 0 0 0 0 8.72l3.25-2.6Z" />
            <path fill="#EA4335" d="M12 6.22c1.43 0 2.7.49 3.7 1.44l2.78-2.78C16.83 3.35 14.63 2.28 12 2.28a9.74 9.74 0 0 0-8.72 5.36l3.25 2.6C7.3 7.94 9.46 6.22 12 6.22Z" />
        </svg>
    );
}

function AppleMark(props: ComponentProps<"svg">) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M16.7 12.8c0-2.16 1.77-3.2 1.85-3.25a3.97 3.97 0 0 0-3.12-1.69c-1.34-.14-2.63.8-3.31.8-.69 0-1.73-.79-2.85-.77A4.15 4.15 0 0 0 5.78 10c-1.51 2.61-.39 6.45 1.08 8.6.74 1.05 1.6 2.22 2.73 2.18 1.1-.05 1.5-.7 2.83-.7 1.28 0 1.66.7 2.84.68 1.18-.02 1.92-1.06 2.63-2.12a8.54 8.54 0 0 0 1.21-2.47 3.73 3.73 0 0 1-2.4-3.37ZM14.55 6.46A3.86 3.86 0 0 0 15.43 3.7a4 4 0 0 0-2.58 1.34 3.66 3.66 0 0 0-.9 2.66 3.3 3.3 0 0 0 2.6-1.24Z" />
        </svg>
    );
}

function getLoginErrorMessage(error: unknown): string {
    if (error instanceof Error && error.name === "SessionRequestError") return error.message;
    if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
        if (error.code === "auth/popup-closed-by-user") {
            return "로그인 창이 닫혔어요. 다시 선택해 주세요.";
        }
        if (error.code === "auth/popup-blocked") {
            return "로그인 창을 열 수 없습니다. 브라우저의 팝업 차단을 해제해 주세요.";
        }
        if (error.code === "auth/operation-not-allowed" || error.code === "auth/unauthorized-domain") {
            return "현재 로그인 설정을 확인해 주세요. 문제가 계속되면 듀잇에 문의해 주세요.";
        }
    }

    return "로그인을 완료하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
}

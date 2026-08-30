"use client";

export default function EventsError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="paper-glow min-h-[calc(100vh-73px)] px-5 py-20 sm:px-8">
            <div className="mx-auto max-w-xl rounded-[18px] border border-line bg-surface px-6 py-12 text-center shadow-[0_16px_38px_rgba(65,45,31,0.04)]">
                <p className="text-sm font-bold text-brand">행사 목록</p>
                <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.055em] text-ink">행사 정보를 불러오지 못했어요</h1>
                <p className="mt-3 text-muted">잠시 후 다시 불러와 봐요.</p>
                <button
                    className="mt-7 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-deep"
                    onClick={reset}
                    type="button"
                >
                    다시 불러오기
                </button>
            </div>
        </div>
    );
}

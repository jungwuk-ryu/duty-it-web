"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="paper-glow flex min-h-[calc(100vh-73px)] items-center px-5 py-20 sm:px-8">
            <section className="mx-auto max-w-xl rounded-[18px] border border-line bg-surface px-6 py-12 text-center shadow-[0_16px_38px_rgba(65,45,31,0.04)]">
                <p className="text-sm font-bold text-brand">듀잇</p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.065em] text-ink">잠시 연결이 매끄럽지 않아요</h1>
                <p className="mt-4 text-[16px] leading-7 text-muted">잠시 후 다시 시도하면 계속 이어갈 수 있어요.</p>
                <button
                    className="mt-8 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-deep"
                    onClick={reset}
                    type="button"
                >
                    다시 시도하기
                </button>
            </section>
        </div>
    );
}

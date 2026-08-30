import Link from "next/link";

export default function NotFound() {
    return (
        <div className="paper-glow flex min-h-[calc(100vh-73px)] items-center px-5 py-20 sm:px-8">
            <section className="mx-auto max-w-xl rounded-[18px] border border-line bg-surface px-6 py-12 text-center shadow-[0_16px_38px_rgba(65,45,31,0.04)]">
                <p className="text-sm font-bold text-brand">듀잇</p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.065em] text-ink">찾는 페이지가 없어요</h1>
                <p className="mt-4 text-[16px] leading-7 text-muted">주소를 다시 확인하거나, 행사 목록에서 새로운 기회를 찾아봐요.</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-line bg-white px-5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">홈으로 돌아가기</Link>
                    <Link href="/events" className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-deep">행사 목록 보기</Link>
                </div>
            </section>
        </div>
    );
}

"use client";

export default function EventsError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="rounded-lg border border-red-100 bg-white px-6 py-12 text-center shadow-sm">
                <p className="text-sm font-semibold text-brand">행사 목록</p>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">행사 정보를 불러오지 못했어요</h1>
                <p className="mt-3 text-gray-600">잠시 후 다시 시도해주세요.</p>
                <button
                    className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90"
                    onClick={reset}
                    type="button"
                >
                    다시 불러오기
                </button>
            </div>
        </div>
    );
}

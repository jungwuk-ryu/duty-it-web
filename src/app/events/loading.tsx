export default function EventsLoading() {
    return (
        <div className="paper-glow min-h-[calc(100vh-73px)]">
            <div className="mx-auto max-w-[1440px] px-5 py-11 sm:px-8 sm:py-14 lg:px-11 lg:py-16">
                <div className="mb-9 max-w-xl animate-pulse">
                    <div className="h-12 w-48 rounded-lg bg-ink/8" />
                    <div className="mt-4 h-5 w-full max-w-md rounded-lg bg-ink/6" />
                </div>
                <div className="mb-8 animate-pulse rounded-[18px] border border-line bg-surface p-5">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
                        <div className="h-[52px] rounded-xl bg-ink/5" />
                        <div className="h-[52px] rounded-xl bg-ink/5" />
                        <div className="h-[52px] rounded-xl bg-ink/5" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="h-9 w-24 rounded-lg bg-ink/5" />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="animate-pulse overflow-hidden rounded-[15px] border border-line bg-surface">
                            <div className="aspect-[1.78/1] bg-ink/8" />
                            <div className="p-5">
                                <div className="h-4 w-20 rounded bg-ink/7" />
                                <div className="mt-4 h-6 rounded bg-ink/8" />
                                <div className="mt-3 h-4 w-3/4 rounded bg-ink/6" />
                                <div className="mt-3 h-4 w-2/3 rounded bg-ink/6" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

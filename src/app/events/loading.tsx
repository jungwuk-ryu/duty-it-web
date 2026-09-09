export default function EventsLoading() {
    return (
        <div className="container mx-auto px-4 mb-5 py-10">
            <div className="mb-8 text-center">
                <div className="mx-auto h-4 w-28 rounded-full bg-border" />
                <div className="mx-auto mt-4 h-9 w-40 rounded-lg bg-border" />
                <div className="mx-auto mt-4 h-5 w-72 max-w-full rounded-lg bg-border" />
            </div>
            <div className="mb-8 h-48 rounded-lg border border-border bg-background p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                    <div className="h-16 rounded-lg bg-muted" />
                    <div className="h-16 rounded-lg bg-muted" />
                    <div className="h-16 rounded-lg bg-muted" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="h-9 w-24 rounded-full bg-muted" />
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="rounded-lg bg-background p-5 shadow-sm">
                        <div className="aspect-[2/1] rounded-lg bg-border" />
                        <div className="mt-4 h-6 w-28 rounded-full bg-border" />
                        <div className="mt-4 h-6 rounded-lg bg-border" />
                        <div className="mt-3 h-4 w-3/4 rounded-lg bg-muted" />
                        <div className="mt-3 h-4 w-2/3 rounded-lg bg-muted" />
                    </div>
                ))}
            </div>
        </div>
    );
}

type Props = {
    count?: number;
};

export default function EventListScaffold({ count = 12 }: Props) {
    return (
        <div aria-busy="true" aria-live="polite">
            <p className="sr-only">행사 목록을 불러오는 중입니다.</p>
            <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-52 rounded-full bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
                {Array.from({ length: count }, (_, index) => (
                    <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_22px_rgba(15,23,42,0.10)]">
                        <div className="aspect-[4/3] bg-slate-200" />
                        <div className="space-y-4 p-5">
                            <div className="h-8 w-28 rounded-full bg-slate-100" />
                            <div className="h-5 w-3/4 rounded-full bg-slate-100" />
                            <div className="border-t border-slate-100 pt-4">
                                <div className="h-4 w-full rounded-full bg-slate-100" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

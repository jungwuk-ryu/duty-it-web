import { EventType, EventTypeLabel } from "@/src/lib/schemas/event-type";

export default function CategoryTag({category} : CategoryTagProps) {
    return (
        <span className="rounded-lg bg-brand/8 px-2.5 py-1 text-xs font-bold tracking-[-0.035em] text-brand">
            {EventTypeLabel[category]}
        </span>
    );
}

type CategoryTagProps = {
    category: EventType
}

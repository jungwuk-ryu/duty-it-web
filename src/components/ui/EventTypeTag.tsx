import { EventType, EventTypeLabel } from "@/src/lib/schemas/event-type";

export default function CategoryTag({category} : CategoryTagProps) {
    const color: string = CATEGORY_STYLE[category];

    return (
        <span className={`text-sm font-semibold ${color} px-3 py-1 rounded-full `}>
            {EventTypeLabel[category]}
        </span>
    );
}

const CATEGORY_STYLE = {
    CONFERENCE: "bg-orange-100 text-orange-800",
    SEMINAR: "bg-yellow-100 text-yellow-800",
    WORKSHOP: "bg-green-100 text-green-800",
    WEBINAR: "bg-indigo-100 text-indigo-800",
    CONTEST: "bg-rose-100 text-rose-800",
    CONTINUING_EDUCATION: "bg-blue-100 text-blue-800",
    EDUCATION: "bg-emerald-100 text-emerald-800",
    ETC: "bg-gray-100 text-gray-800",
  } satisfies Record<EventType, string>;

type CategoryTagProps = {
    category: EventType
}
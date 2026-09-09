import { EventTypeLabel } from "@/src/lib/event-labels";
import type { EventType } from "@/src/lib/schemas/event-type";
import { cn } from "@/src/lib/utils";

export default function CategoryTag({category} : CategoryTagProps) {
    const color: string = CATEGORY_STYLE[category];

    return (
        <span className={cn("inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold", color)}>
            {EventTypeLabel[category]}
        </span>
    );
}

const CATEGORY_STYLE = {
    CONFERENCE: "bg-category-conference/10 text-category-conference",
    SEMINAR: "bg-category-seminar/10 text-category-seminar",
    WORKSHOP: "bg-category-workshop/10 text-category-workshop",
    WEBINAR: "bg-category-webinar/10 text-category-webinar",
    CONTEST: "bg-category-contest/10 text-category-contest",
    CONTINUING_EDUCATION: "bg-category-continuing/10 text-category-continuing",
    EDUCATION: "bg-category-education/10 text-category-education",
    VOLUNTEER: "bg-category-volunteer/10 text-category-volunteer",
    TRAINING: "bg-category-training/10 text-category-training",
    SUPPORTERS: "bg-category-supporters/10 text-category-supporters",
    ETC: "bg-muted text-foreground",
  } satisfies Record<EventType, string>;

type CategoryTagProps = {
    category: EventType
}

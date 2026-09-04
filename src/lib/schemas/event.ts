import { z } from "zod";
import { HostSchema } from "./host";
import { EventTypeSchema } from "./event-type";
import { isHttpUrl } from "../url";
import { EventStatusGroupSchema, EventStatusSchema } from "./event-status";

const LOCAL_DATE_TIME_WITHOUT_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

const KstDateTimeSchema = z.preprocess((value) => {
    if (typeof value !== "string") return value;
    return LOCAL_DATE_TIME_WITHOUT_OFFSET.test(value) ? new Date(`${value}+09:00`) : value;
}, z.coerce.date());

export const EventSchema = z.object({
    "id": z.number(),
    "title": z.string(),
    "startAt": KstDateTimeSchema,
    "endAt": KstDateTimeSchema.nullable(),
    "recruitmentStartAt": KstDateTimeSchema.nullable(),
    "recruitmentEndAt": KstDateTimeSchema.nullable(),
    "uri": z.url().refine(isHttpUrl, {
        message: "Event URI must use http or https.",
    }),
    "thumbnail": z.string().nullable(),
    "eventType": EventTypeSchema,
    "eventStatus": EventStatusSchema,
    "eventStatusGroup": EventStatusGroupSchema,
    "host": HostSchema,
    "viewCount": z.number(),
    "isBookmarked": z.boolean(),
});
export type Event = z.infer<typeof EventSchema>;

export const EventListSchema = z.array(EventSchema);

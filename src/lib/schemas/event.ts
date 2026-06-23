import { z } from "zod";
import { HostSchema } from "./host";
import { EventTypeSchema } from "./event-type";
import { isHttpUrl } from "../url";

export const EventSchema = z.object({
    "id": z.number(),
    "title": z.string(),
    "startAt": z.coerce.date(),
    "endAt": z.coerce.date().nullable(),
    "recruitmentStartAt": z.coerce.date().nullable(),
    "recruitmentEndAt": z.coerce.date().nullable(),
    "uri": z.url().refine(isHttpUrl, {
        message: "Event URI must use http or https.",
    }),
    "thumbnail": z.string().nullable(),
    "eventType": EventTypeSchema,
    "host": HostSchema,
});
export type Event = z.infer<typeof EventSchema>;

export const EventListSchema = z.array(EventSchema);

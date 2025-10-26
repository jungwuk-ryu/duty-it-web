import { z } from "zod";
import { EventListSchema } from "./event";
import { PageInfoSchema } from "./page-info";

export const EventsResponseSchema = z.object({
    content: EventListSchema,
    pageInfo: PageInfoSchema,
});

export type EventResponse = z.infer<typeof EventsResponseSchema>;
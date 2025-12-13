import { z } from "zod";


export const PageInfoSchema = z.object({
    "hasNext": z.boolean(),
    "nextCursor": z.string().nullable(),
    "pageSize": z.number(),
});

export type PageInfo = z.infer<typeof PageInfoSchema>;

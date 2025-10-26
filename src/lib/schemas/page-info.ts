import { z } from "zod";


export const PageInfoSchema = z.object({
    "pageNumber": z.number(),
    "pageSize": z.number(),
    "totalPages": z.number(),
    "totalElements": z.number(),
});

export type PageInfo = z.infer<typeof PageInfoSchema>;

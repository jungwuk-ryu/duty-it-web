import { z } from "zod";

export const HostSchema = z.object({
    "id": z.number(),
    "name": z.string(),
    "thumbnail": z.string().nullable(),
});
export type Host = z.infer<typeof HostSchema>;
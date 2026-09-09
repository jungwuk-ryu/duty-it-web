import { z } from "zod";
export const BookmarkKindSchema = z.enum(["events", "jobs"]);
export type BookmarkKind = z.infer<typeof BookmarkKindSchema>;
export const BookmarkToggleSchema = z.object({ isBookmarked: z.boolean() });
export const BookmarkIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

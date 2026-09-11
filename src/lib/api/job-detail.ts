import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchJobPosting, JobPostingsFetchError } from "./jobs";
import { normalizeViewEventId } from "./viewGuard";

export const fetchJobDetail = cache(async (value: string) => {
  const id = normalizeViewEventId(value);
  if (!id) notFound();
  try {
    return await fetchJobPosting(Number(id));
  } catch (error) {
    if (error instanceof JobPostingsFetchError && error.status === 404) notFound();
    throw error;
  }
});

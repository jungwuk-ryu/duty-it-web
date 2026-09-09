import "server-only";

import { cache } from "react";
import { fetchEvents } from "@/src/lib/api/events";
import { fetchJobPostings } from "@/src/lib/api/jobs";
import { EventTypeLabel } from "@/src/lib/event-labels";

export type HomeEventPreview = {
  id: number;
  title: string;
  thumbnail: string | null;
  eventType: string;
  hostName: string;
  date: string;
};

export type HomeJobPreview = {
  id: number;
  companyName: string;
  title: string;
  detail: string;
};

export type HomePreviewData = {
  events: HomeEventPreview[];
  jobs: HomeJobPreview[];
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getHomePreviewData = cache(async (): Promise<HomePreviewData> => {
  const [eventsResult, jobsResult] = await Promise.allSettled([
    fetchEvents({ field: "CREATED_AT", size: 3, statusGroup: "ACTIVE" }),
    fetchJobPostings({ size: 3 }),
  ]);

  const events = eventsResult.status === "fulfilled"
    ? eventsResult.value.content.map((event) => ({
      id: event.id,
      title: event.title,
      thumbnail: event.thumbnail,
      eventType: EventTypeLabel[event.eventType],
      hostName: event.host.name,
      date: dateFormatter.format(event.startAt),
    }))
    : [];

  const jobs = jobsResult.status === "fulfilled"
    ? jobsResult.value.content.map((job) => ({
      id: job.id,
      companyName: job.company.corpNm || "채용 기업",
      title: job.wantedTitle || job.jobsNm || "간호 채용 공고",
      detail: [job.workRegion, job.empTpNm].filter(Boolean).join(" · ") || "채용 정보 확인",
    }))
    : [];

  return { events, jobs };
});
